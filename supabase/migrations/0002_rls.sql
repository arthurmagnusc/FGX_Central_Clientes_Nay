-- =====================================================================
-- Isolamento entre clientes — Row Level Security
--
-- Este arquivo é a razão de o projeto usar Supabase em vez de manter tudo
-- em Functions: o isolamento passa a ser garantido pelo banco, e não por
-- cada endpoint lembrar de filtrar. Se uma consulta esquecer o filtro, o
-- Postgres devolve zero linhas em vez de vazar dados de outro escritório.
--
-- O JWT emitido pela Edge Function `entrar` carrega:
--   cliente_id   uuid   (nulo no token de admin)
--   pessoa_nome  text
--   is_admin     bool
-- =====================================================================

-- ---------------------------------------------------- funções de contexto
create or replace function app_cliente_id() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'cliente_id', '')::uuid
$$;

create or replace function app_pessoa_nome() returns text
language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'pessoa_nome', '')
$$;

create or replace function app_is_admin() returns boolean
language sql stable as $$
  select coalesce((current_setting('request.jwt.claims', true)::jsonb ->> 'is_admin')::boolean, false)
$$;

-- ATENÇÃO — estas duas funções PRECISAM ser SECURITY DEFINER.
--
-- Elas consultam `peca`, e são usadas dentro da política de select da própria
-- `peca`. Sem SECURITY DEFINER, a consulta interna dispara a política de novo,
-- que chama a função de novo: recursão infinita, e o Postgres derruba a query
-- com "stack depth limit exceeded". SECURITY DEFINER faz a função rodar como
-- dona da tabela, para quem o RLS não se aplica — o corte de visibilidade
-- continua sendo feito aqui dentro, comparando com app_cliente_id().
--
-- O search_path fica fixado para que ninguém consiga apontar `peca` para outro
-- schema e enganar a função.

create or replace function cliente_da_peca(p_peca_id uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select c.cliente_id from peca p join ciclo c on c.id = p.ciclo_id where p.id = p_peca_id
$$;

-- Uma peça só é visível ao cliente quando o ciclo dela está publicado.
create or replace function peca_visivel_ao_cliente(p_peca_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from peca p join ciclo c on c.id = p.ciclo_id
    where p.id = p_peca_id
      and c.cliente_id = app_cliente_id()
      and c.status in ('publicado', 'encerrado')
  )
$$;

revoke execute on function cliente_da_peca(uuid), peca_visivel_ao_cliente(uuid) from public;
grant execute on function cliente_da_peca(uuid), peca_visivel_ao_cliente(uuid) to authenticated, anon;

-- ------------------------------------------------------------- ligar RLS
alter table cliente            enable row level security;
alter table admin_user         enable row level security;
alter table sessao             enable row level security;
alter table canal              enable row level security;
alter table cliente_canal      enable row level security;
alter table editoria           enable row level security;
alter table pilar              enable row level security;
alter table entregavel         enable row level security;
alter table relatorio          enable row level security;
alter table ciclo              enable row level security;
alter table peca               enable row level security;
alter table peca_bloco         enable row level security;
alter table peca_raciocinio    enable row level security;
alter table trilha_producao    enable row level security;
alter table fonte              enable row level security;
alter table comentario         enable row level security;
alter table aprovacao          enable row level security;
alter table ajuste             enable row level security;
alter table documento_aditivo  enable row level security;

-- ------------------------------------------------------- admin faz tudo
do $$
declare t text;
begin
  foreach t in array array[
    'cliente','admin_user','sessao','canal','cliente_canal','editoria','pilar','entregavel',
    'relatorio','ciclo','peca','peca_bloco','peca_raciocinio','trilha_producao','fonte',
    'comentario','aprovacao','ajuste','documento_aditivo'
  ] loop
    execute format(
      'create policy admin_tudo on %I for all using (app_is_admin()) with check (app_is_admin())', t);
  end loop;
end $$;

-- --------------------------------------------------- leitura pelo cliente
create policy cliente_le_si on cliente for select
  using (id = app_cliente_id());

create policy cliente_le_canais on canal for select
  using (true);

create policy cliente_le_seus_canais on cliente_canal for select
  using (cliente_id = app_cliente_id());

create policy cliente_le_editorias on editoria for select
  using (cliente_id = app_cliente_id());

create policy cliente_le_pilares on pilar for select
  using (cliente_id = app_cliente_id());

-- Entregável só aparece depois de publicado.
create policy cliente_le_entregaveis on entregavel for select
  using (cliente_id = app_cliente_id() and publicado_em is not null);

create policy cliente_le_relatorios on relatorio for select
  using (cliente_id = app_cliente_id() and publicado);

-- Ciclo em rascunho é invisível para o cliente.
create policy cliente_le_ciclos on ciclo for select
  using (cliente_id = app_cliente_id() and status in ('publicado','encerrado'));

create policy cliente_le_pecas on peca for select
  using (peca_visivel_ao_cliente(id));

create policy cliente_le_blocos on peca_bloco for select
  using (peca_visivel_ao_cliente(peca_id));

create policy cliente_le_raciocinios on peca_raciocinio for select
  using (peca_visivel_ao_cliente(peca_id));

create policy cliente_le_trilha on trilha_producao for select
  using (peca_visivel_ao_cliente(peca_id));

create policy cliente_le_fontes on fonte for select
  using (peca_visivel_ao_cliente(peca_id));

create policy cliente_le_comentarios on comentario for select
  using (peca_visivel_ao_cliente(peca_id));

create policy cliente_le_aprovacoes on aprovacao for select
  using (peca_visivel_ao_cliente(peca_id));

create policy cliente_le_ajustes on ajuste for select
  using (peca_visivel_ao_cliente(peca_id));

-- --------------------------------------------------- escrita pelo cliente
-- O cliente só escreve duas coisas: comentário e aprovação. E o nome do
-- autor tem que bater com o da sessão — não dá para comentar como outra
-- pessoa alterando o corpo da requisição.
create policy cliente_comenta on comentario for insert
  with check (
    peca_visivel_ao_cliente(peca_id)
    and autor_tipo = 'cliente'
    and autor_nome = app_pessoa_nome()
    and (peca_bloco_id is null
         or exists (select 1 from peca_bloco b where b.id = peca_bloco_id and b.peca_id = comentario.peca_id))
  );

create policy cliente_aprova on aprovacao for insert
  with check (
    peca_visivel_ao_cliente(peca_id)
    and autor_nome = app_pessoa_nome()
  );

-- O cliente muda o status da peça apenas entre os valores permitidos, e
-- só na peça dele. Não pode editar conteúdo, tema, nem qualquer outro campo.
create policy cliente_muda_status on peca for update
  using (peca_visivel_ao_cliente(id))
  with check (peca_visivel_ao_cliente(id) and status in ('aprovada','em_revisao'));

-- Ninguém além do admin lê sessões, hashes de senha de admin ou aditivos.
create policy ninguem_le_admin_user on admin_user for select using (false);
create policy cliente_le_sua_sessao on sessao for select
  using (cliente_id = app_cliente_id());
