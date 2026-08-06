-- =====================================================================
-- Permissões de coluna, storage e views de leitura
--
-- RLS filtra LINHAS, não colunas. Sem o revoke abaixo, um cliente que lê a
-- própria linha em `cliente` receberia junto o bcrypt da própria senha.
-- Não é catastrófico, mas é hash de credencial trafegando à toa.
-- =====================================================================

-- Cuidado com a ordem: no Postgres, revogar UMA COLUNA não tem efeito enquanto
-- o papel tiver SELECT na tabela inteira — e o Supabase concede exatamente
-- isso a `authenticated` por padrão. Então é preciso revogar o select da
-- tabela e devolver, coluna a coluna, só o que pode ser lido.
revoke select on cliente from authenticated, anon;
grant select (id, nome, slug, tom_de_voz, areas_chave, regra_base_ref, ativo, criado_em)
  on cliente to authenticated;

-- A tabela de administradores não é legível por ninguém pelo PostgREST.
-- A verificação de senha acontece dentro da Edge Function, com service role.
revoke all on admin_user from authenticated, anon;

-- Idem para o registro de sessão: o cliente não precisa listar sessões.
revoke select (revogada) on sessao from anon;

-- Leitura do próprio cadastro, sem o hash.
create or replace view meu_cliente
with (security_invoker = true) as
  select id, nome, slug, tom_de_voz, areas_chave, regra_base_ref, ativo, criado_em
  from cliente;

-- Peça com editoria, pilar e canal já resolvidos — evita três joins no front.
create or replace view peca_completa
with (security_invoker = true) as
  select
    p.id, p.ciclo_id, p.tema, p.area_direito, p.formato, p.funil, p.status,
    p.ordem, p.limite_caracteres, p.gancho_texto, p.gancho_tipo, p.gancho_url, p.gancho_data,
    p.criado_em, p.atualizado_em,
    c.codigo  as canal_codigo,
    c.nome    as canal_nome,
    coalesce(p.limite_caracteres, c.limite_caracteres_padrao) as limite_efetivo,
    e.nome    as editoria_nome,
    pi.nome   as pilar_nome,
    ci.cliente_id,
    ci.mes_referencia,
    (select count(*) from comentario cm where cm.peca_id = p.id)        as total_comentarios,
    (select count(*) from peca_bloco b where b.peca_id = p.id)          as total_blocos
  from peca p
  join ciclo ci    on ci.id = p.ciclo_id
  join canal c     on c.codigo = p.canal_codigo
  left join editoria e  on e.id = p.editoria_id
  left join pilar pi    on pi.id = p.pilar_id;

-- ------------------------------------------------------------- storage
-- Bucket privado. Nada aqui tem URL pública: o download passa pela Edge
-- Function `baixar-entregavel`, que confere a sessão e devolve uma URL
-- assinada de curta duração.
insert into storage.buckets (id, name, public)
values ('entregaveis', 'entregaveis', false)
on conflict (id) do nothing;

-- Nenhuma policy de leitura direta para authenticated/anon: o acesso ao
-- objeto acontece exclusivamente via service role dentro da Edge Function.
create policy admin_gerencia_arquivos on storage.objects for all
  to authenticated
  using (bucket_id = 'entregaveis' and app_is_admin())
  with check (bucket_id = 'entregaveis' and app_is_admin());
