-- Migration 001: Base schema
-- Portal do Cliente FGX

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE client_status AS ENUM ('ativo', 'inativo');
CREATE TYPE cycle_status AS ENUM ('rascunho', 'publicado', 'encerrado');
CREATE TYPE piece_status AS ENUM ('pendente', 'em_revisao', 'ajustada', 'aprovada');
CREATE TYPE deliverable_status AS ENUM ('em_producao', 'em_validacao', 'aprovado');
CREATE TYPE channel_slug AS ENUM ('redes_sociais', 'blog', 'newsletter', 'video');
CREATE TYPE piece_format AS ENUM ('carrossel', 'artigo', 'analise_tecnica', 'texto_email', 'roteiro_video');
CREATE TYPE approval_type AS ENUM ('aprovou', 'solicitou_ajuste');
CREATE TYPE adjustment_type AS ENUM ('pontual', 'estrutural');
CREATE TYPE adjustment_eval_status AS ENUM ('pendente', 'em_avaliacao', 'concluido');
CREATE TYPE deliverable_category AS ENUM ('diagnostico', 'planejamento', 'apresentacao', 'proposta', 'politica', 'material_institucional', 'relatorio_resultado');
CREATE TYPE comment_author_type AS ENUM ('cliente', 'editor');

-- Tables
CREATE TABLE client (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  senha_hash TEXT,
  tom_voz TEXT,
  areas_chave TEXT,
  regra_base_ref TEXT,
  ativo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE admin_user (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_usuario TEXT NOT NULL,
  senha_hash TEXT NOT NULL,
  senha_inicial BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE session (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES client(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admin_user(id) ON DELETE CASCADE,
  pessoa_nome TEXT,
  expira_em TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE channel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug channel_slug NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  limite_caracteres_padrao INTEGER NOT NULL DEFAULT 2200
);

CREATE TABLE client_channel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channel(id) ON DELETE CASCADE,
  UNIQUE(client_id, channel_id)
);

CREATE TABLE cycle (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  mes_referencia TEXT NOT NULL,
  volume INTEGER NOT NULL DEFAULT 1,
  status cycle_status NOT NULL DEFAULT 'rascunho',
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE deliverable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  categoria deliverable_category NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  versao TEXT NOT NULL DEFAULT '1.0',
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  tamanho_bytes BIGINT NOT NULL DEFAULT 0,
  status deliverable_status NOT NULL DEFAULT 'em_producao',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE piece (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID NOT NULL REFERENCES cycle(id) ON DELETE CASCADE,
  tema TEXT NOT NULL,
  area_direito TEXT NOT NULL DEFAULT 'Geral',
  channel_id UUID NOT NULL REFERENCES channel(id),
  formato piece_format NOT NULL,
  status piece_status NOT NULL DEFAULT 'pendente',
  limite_caracteres_override INTEGER,
  ordem INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE piece_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  piece_id UUID NOT NULL REFERENCES piece(id) ON DELETE CASCADE,
  titulo_bloco TEXT,
  conteudo TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE piece_reasoning (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  piece_id UUID NOT NULL REFERENCES piece(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  ordem INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE comment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  piece_id UUID NOT NULL REFERENCES piece(id) ON DELETE CASCADE,
  piece_content_id UUID REFERENCES piece_content(id) ON DELETE SET NULL,
  autor_nome TEXT NOT NULL,
  autor_tipo comment_author_type NOT NULL DEFAULT 'cliente',
  texto TEXT NOT NULL,
  trecho TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE approval (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  piece_id UUID NOT NULL REFERENCES piece(id) ON DELETE CASCADE,
  tipo approval_type NOT NULL,
  autor_nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE adjustment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES comment(id) ON DELETE CASCADE,
  piece_id UUID NOT NULL REFERENCES piece(id) ON DELETE CASCADE,
  tipo adjustment_type NOT NULL DEFAULT 'pontual',
  descricao TEXT NOT NULL DEFAULT '',
  status_avaliacao adjustment_eval_status NOT NULL DEFAULT 'pendente',
  additive_doc_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE production_trail (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  piece_id UUID NOT NULL REFERENCES piece(id) ON DELETE CASCADE,
  etapa TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE source (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  piece_id UUID NOT NULL REFERENCES piece(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  url TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE additive_doc (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE adjustment_dispatch (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  adjustment_id UUID NOT NULL REFERENCES adjustment(id) ON DELETE CASCADE,
  destino TEXT NOT NULL,
  payload TEXT NOT NULL,
  resultado TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_session_token ON session(token);
CREATE INDEX idx_session_client_id ON session(client_id);
CREATE INDEX idx_session_admin_id ON session(admin_id);
CREATE INDEX idx_client_slug ON client(slug);
CREATE INDEX idx_cycle_client_id ON cycle(client_id);
CREATE INDEX idx_piece_cycle_id ON piece(cycle_id);
CREATE INDEX idx_piece_content_piece_id ON piece_content(piece_id);
CREATE INDEX idx_comment_piece_id ON comment(piece_id);
CREATE INDEX idx_approval_piece_id ON approval(piece_id);
CREATE INDEX idx_deliverable_client_id ON deliverable(client_id);
CREATE INDEX idx_client_channel_client_id ON client_channel(client_id);
CREATE INDEX idx_additive_doc_client_id ON additive_doc(client_id);
CREATE INDEX idx_adjustment_piece_id ON adjustment(piece_id);

-- RLS Policies (applied when using Supabase)
-- ALTER TABLE client ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cycle ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE piece ENABLE ROW LEVEL SECURITY;
-- etc.
