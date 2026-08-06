-- =====================================================================
-- Portal do Cliente FGX — schema
-- Banco: Postgres (Supabase)
-- Todo o vocabulário em português, para bater com o domínio do negócio.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- enums
create type formato_peca      as enum ('carrossel','artigo','analise_tecnica','texto_email','roteiro_video');
create type funil_peca        as enum ('topo','meio','fundo');
create type status_peca       as enum ('pendente','em_revisao','ajustada','aprovada');
create type status_ciclo      as enum ('rascunho','publicado','encerrado');
create type status_entregavel as enum ('em_producao','em_validacao','aprovado');
create type categoria_entregavel as enum
  ('diagnostico','planejamento','apresentacao','proposta','politica','material_institucional','relatorio_resultado');
create type tipo_autor        as enum ('cliente','editor');
create type tipo_ajuste       as enum ('pontual','estrutural');
create type status_ajuste     as enum ('pendente','avaliado','aplicado');
create type acao_aprovacao    as enum ('aprovou','solicitou_ajuste');
create type tipo_gancho       as enum ('jornalistico','analitico');

-- ------------------------------------------------------------- clientes
create table cliente (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  slug           text not null unique,
  senha_hash     text,                       -- null = acesso ainda não configurado
  tom_de_voz     text,
  areas_chave    text,
  regra_base_ref text,
  ativo          boolean not null default false,
  criado_em      timestamptz not null default now()
);
comment on column cliente.senha_hash is
  'bcrypt. Nulo enquanto o admin não define a senha — nesse estado /c/:slug recusa a entrada.';

create table admin_user (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  senha_hash text not null,
  senha_inicial_trocada boolean not null default false,
  criado_em  timestamptz not null default now()
);

-- Registro de sessão. O token que trafega é um JWT assinado; esta tabela
-- existe para revogação e rastreabilidade, não para lookup a cada request.
create table sessao (
  id           uuid primary key default gen_random_uuid(),
  cliente_id   uuid references cliente(id) on delete cascade,
  admin_id     uuid references admin_user(id) on delete cascade,
  pessoa_nome  text,
  revogada     boolean not null default false,
  expira_em    timestamptz not null,
  criado_em    timestamptz not null default now(),
  constraint sessao_tem_dono check (num_nonnulls(cliente_id, admin_id) = 1)
);
create index on sessao (cliente_id);
create index on sessao (expira_em);

-- --------------------------------------------------------------- canais
create table canal (
  codigo                  text primary key,
  nome                    text not null,
  limite_caracteres_padrao int,
  ordem                   int not null default 0
);
comment on column canal.limite_caracteres_padrao is
  'Propriedade do canal, não da peça. Nulo = sem limite definido. Nunca corta texto: só sinaliza.';

create table cliente_canal (
  cliente_id    uuid not null references cliente(id) on delete cascade,
  canal_codigo  text not null references canal(codigo) on delete restrict,
  primary key (cliente_id, canal_codigo)
);

-- Editorias e pilares são por cliente: cada escritório tem a sua lista.
create table editoria (
  id         uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references cliente(id) on delete cascade,
  nome       text not null,
  ordem      int not null default 0,
  unique (cliente_id, nome)
);

create table pilar (
  id         uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references cliente(id) on delete cascade,
  nome       text not null,
  ordem      int not null default 0,
  unique (cliente_id, nome)
);

-- ---------------------------------------------------------- entregáveis
create table entregavel (
  id            uuid primary key default gen_random_uuid(),
  cliente_id    uuid not null references cliente(id) on delete cascade,
  categoria     categoria_entregavel not null,
  titulo        text not null,
  descricao     text,
  storage_path  text not null,
  nome_arquivo  text not null,
  mime_type     text,
  tamanho_bytes bigint,
  versao        int not null default 1,
  status        status_entregavel not null default 'em_producao',
  publicado_em  timestamptz,
  criado_em     timestamptz not null default now()
);
create index on entregavel (cliente_id, categoria);
comment on column entregavel.storage_path is
  'Caminho no bucket privado. Nunca exposto ao navegador: o download passa por Edge Function.';

-- ------------------------------------------------------------ relatórios
create table relatorio (
  id             uuid primary key default gen_random_uuid(),
  cliente_id     uuid not null references cliente(id) on delete cascade,
  titulo         text not null,
  periodo_inicio date,
  periodo_fim    date,
  emitido_em     date,
  resumo         text,
  kpis           jsonb not null default '[]'::jsonb,
  secoes         text[] not null default '{}',
  storage_path   text,
  publicado      boolean not null default false,
  criado_em      timestamptz not null default now()
);
create index on relatorio (cliente_id, emitido_em desc);
comment on column relatorio.kpis is
  'Array de {valor, rotulo} — os números que aparecem na frente do cartão de relatório.';

-- ----------------------------------------------------------- ciclo/peça
create table ciclo (
  id             uuid primary key default gen_random_uuid(),
  cliente_id     uuid not null references cliente(id) on delete cascade,
  mes_referencia text not null,               -- 'AAAA-MM'
  status         status_ciclo not null default 'rascunho',
  publicado_em   timestamptz,
  criado_em      timestamptz not null default now(),
  unique (cliente_id, mes_referencia)
);
create index on ciclo (cliente_id, mes_referencia desc);

create table peca (
  id                uuid primary key default gen_random_uuid(),
  ciclo_id          uuid not null references ciclo(id) on delete cascade,
  tema              text not null,
  area_direito      text,
  canal_codigo      text not null references canal(codigo),
  formato           formato_peca not null,
  editoria_id       uuid references editoria(id) on delete set null,
  pilar_id          uuid references pilar(id) on delete set null,
  funil             funil_peca,
  status            status_peca not null default 'pendente',
  limite_caracteres int,                       -- sobrescreve o padrão do canal; excepcional
  ordem             int not null default 0,
  -- gancho / ancoragem
  gancho_texto      text,
  gancho_tipo       tipo_gancho,
  gancho_url        text,
  gancho_data       date,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);
create index on peca (ciclo_id, ordem);
comment on column peca.gancho_texto is
  'O fato, norma ou movimento que ancora a peça. gancho_tipo classifica em jornalística ou analítica.';

-- Um bloco é a unidade de comentário: slide no carrossel, cena no roteiro,
-- trecho no artigo. O conteúdo é TEXT e é exibido na íntegra, sempre.
create table peca_bloco (
  id        uuid primary key default gen_random_uuid(),
  peca_id   uuid not null references peca(id) on delete cascade,
  ordem     int not null,
  titulo    text,
  conteudo  text not null,
  unique (peca_id, ordem) deferrable initially deferred
);
create index on peca_bloco (peca_id, ordem);

create table peca_raciocinio (
  id      uuid primary key default gen_random_uuid(),
  peca_id uuid not null references peca(id) on delete cascade,
  ordem   int not null,
  titulo  text not null,
  texto   text not null
);
create index on peca_raciocinio (peca_id, ordem);

create table trilha_producao (
  id        uuid primary key default gen_random_uuid(),
  peca_id   uuid not null references peca(id) on delete cascade,
  ordem     int not null,
  passo     text not null,
  descricao text
);
create index on trilha_producao (peca_id, ordem);

create table fonte (
  id               uuid primary key default gen_random_uuid(),
  peca_id          uuid not null references peca(id) on delete cascade,
  ordem            int not null default 0,
  titulo           text not null,
  url              text,
  tipo             text,
  data_publicacao  date
);
create index on fonte (peca_id, ordem);

-- ------------------------------------------------- comentários e ajustes
create table comentario (
  id            uuid primary key default gen_random_uuid(),
  peca_id       uuid not null references peca(id) on delete cascade,
  peca_bloco_id uuid references peca_bloco(id) on delete set null,
  autor_nome    text not null,
  autor_tipo    tipo_autor not null,
  sessao_id     uuid references sessao(id) on delete set null,
  texto         text not null,
  tratado       boolean not null default false,
  criado_em     timestamptz not null default now()
);
create index on comentario (peca_id, criado_em);
create index on comentario (tratado) where tratado = false;
comment on column comentario.autor_nome is
  'Vem do nome informado na entrada, gravado na sessão. Não é campo do formulário de comentário.';

create table aprovacao (
  id         uuid primary key default gen_random_uuid(),
  peca_id    uuid not null references peca(id) on delete cascade,
  autor_nome text not null,
  sessao_id  uuid references sessao(id) on delete set null,
  acao       acao_aprovacao not null,
  criado_em  timestamptz not null default now()
);
create index on aprovacao (peca_id, criado_em desc);

create table ajuste (
  id               uuid primary key default gen_random_uuid(),
  peca_id          uuid not null references peca(id) on delete cascade,
  comentario_id    uuid references comentario(id) on delete set null,
  descricao        text not null,
  tipo             tipo_ajuste not null,
  status_avaliacao status_ajuste not null default 'pendente',
  enviado_em       timestamptz,
  enviado_destino  text,
  enviado_resultado text,
  criado_em        timestamptz not null default now()
);
create index on ajuste (peca_id);

create table documento_aditivo (
  id         uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references cliente(id) on delete cascade,
  ajuste_id  uuid references ajuste(id) on delete set null,
  titulo     text not null,
  conteudo   text not null,
  criado_em  timestamptz not null default now()
);
create index on documento_aditivo (cliente_id, criado_em desc);

-- ------------------------------------------------------------- triggers
create or replace function toca_atualizado_em() returns trigger
language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end $$;

create trigger peca_atualizado_em before update on peca
  for each row execute function toca_atualizado_em();
