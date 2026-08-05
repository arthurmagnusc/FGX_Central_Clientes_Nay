export type ClientStatus = 'ativo' | 'inativo'
export type CycleStatus = 'rascunho' | 'publicado' | 'encerrado'
export type PieceStatus = 'pendente' | 'em_revisao' | 'ajustada' | 'aprovada'
export type DeliverableStatus = 'em_producao' | 'em_validacao' | 'aprovado'
export type ChannelSlug = 'redes_sociais' | 'blog' | 'newsletter' | 'video'
export type PieceFormat = 'carrossel' | 'artigo' | 'analise_tecnica' | 'texto_email' | 'roteiro_video'
export type AdjustmentType = 'pontual' | 'estrutural'
export type AdjustmentEvalStatus = 'pendente' | 'em_avaliacao' | 'concluido'
export type DeliverableCategory = 'diagnostico' | 'planejamento' | 'apresentacao' | 'proposta' | 'politica' | 'material_institucional' | 'relatorio_resultado'

export interface Client {
  id: string
  nome: string
  slug: string
  senha_hash: string | null
  tom_voz: string | null
  areas_chave: string | null
  regra_base_ref: string | null
  ativo: boolean
  created_at: string
}

export interface AdminUser {
  id: string
  nome_usuario: string
  senha_hash: string
  senha_inicial: boolean
  created_at: string
}

export interface Session {
  id: string
  token: string
  client_id: string | null
  admin_id: string | null
  pessoa_nome: string | null
  expira_em: string
  created_at: string
}

export interface Channel {
  id: string
  slug: ChannelSlug
  nome: string
  limite_caracteres_padrao: number
}

export interface ClientChannel {
  id: string
  client_id: string
  channel_id: string
  channel?: Channel
}

export interface Cycle {
  id: string
  client_id: string
  mes_referencia: string
  volume: number
  status: CycleStatus
  is_demo: boolean
  created_at: string
  pieces?: Piece[]
}

export interface Deliverable {
  id: string
  client_id: string
  categoria: DeliverableCategory
  titulo: string
  descricao: string | null
  versao: string
  storage_path: string
  mime_type: string
  tamanho_bytes: number
  status: DeliverableStatus
  created_at: string
}

export interface Piece {
  id: string
  cycle_id: string
  tema: string
  area_direito: string
  channel_id: string
  channel?: Channel
  formato: PieceFormat
  status: PieceStatus
  limite_caracteres_override: number | null
  ordem: number
  created_at: string
  contents?: PieceContent[]
  comments?: Comment[]
  approvals?: Approval[]
  reasonings?: PieceReasoning[]
  trail?: ProductionTrail[]
  sources?: Source[]
}

export interface PieceContent {
  id: string
  piece_id: string
  ordem: number
  titulo_bloco: string | null
  conteudo: string
  created_at: string
}

export interface PieceReasoning {
  id: string
  piece_id: string
  titulo: string
  descricao: string
  ordem: number
  created_at: string
}

export interface Comment {
  id: string
  piece_id: string
  piece_content_id: string | null
  autor_nome: string
  autor_tipo: 'cliente' | 'editor'
  texto: string
  trecho: string | null
  created_at: string
}

export interface Approval {
  id: string
  piece_id: string
  tipo: 'aprovou' | 'solicitou_ajuste'
  autor_nome: string
  created_at: string
}

export interface Adjustment {
  id: string
  comment_id: string
  piece_id: string
  tipo: AdjustmentType
  descricao: string
  status_avaliacao: AdjustmentEvalStatus
  additive_doc_id: string | null
  created_at: string
}

export interface ProductionTrail {
  id: string
  piece_id: string
  etapa: string
  descricao: string | null
  ordem: number
  created_at: string
}

export interface Source {
  id: string
  piece_id: string
  titulo: string
  url: string
  descricao: string | null
  ordem: number
  created_at: string
}

export interface AdditiveDoc {
  id: string
  client_id: string
  titulo: string
  conteudo: string
  created_at: string
}

export interface AdjustmentDispatch {
  id: string
  adjustment_id: string
  destino: string
  payload: string
  resultado: string | null
  created_at: string
}
