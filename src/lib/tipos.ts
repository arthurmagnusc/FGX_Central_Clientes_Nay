export type Formato = "carrossel" | "artigo" | "analise_tecnica" | "texto_email" | "roteiro_video";
export type Funil = "topo" | "meio" | "fundo";
export type StatusPeca = "pendente" | "em_revisao" | "ajustada" | "aprovada";
export type StatusCiclo = "rascunho" | "publicado" | "encerrado";
export type StatusEntregavel = "em_producao" | "em_validacao" | "aprovado";
export type CategoriaEntregavel =
  | "diagnostico" | "planejamento" | "apresentacao" | "proposta"
  | "politica" | "material_institucional" | "relatorio_resultado";
export type TipoAutor = "cliente" | "editor";
export type TipoAjuste = "pontual" | "estrutural";
export type TipoGancho = "jornalistico" | "analitico";

export interface Cliente {
  id: string; nome: string; slug: string;
  tom_de_voz: string | null; areas_chave: string | null; regra_base_ref: string | null;
}

export interface Canal { codigo: string; nome: string; limite_caracteres_padrao: number | null }

export interface Bloco { id: string; peca_id: string; ordem: number; titulo: string | null; conteudo: string }

export interface Comentario {
  id: string; peca_id: string; peca_bloco_id: string | null;
  autor_nome: string; autor_tipo: TipoAutor; texto: string; tratado: boolean; criado_em: string;
}

export interface Aprovacao { id: string; peca_id: string; autor_nome: string; acao: "aprovou" | "solicitou_ajuste"; criado_em: string }

export interface Raciocinio { id: string; ordem: number; titulo: string; texto: string }
export interface EtapaTrilha { id: string; ordem: number; passo: string; descricao: string | null }
export interface Fonte { id: string; ordem: number; titulo: string; url: string | null; tipo: string | null; data_publicacao: string | null }
export interface Ajuste {
  id: string; peca_id: string; comentario_id: string | null;
  descricao: string; tipo: TipoAjuste; status_avaliacao: "pendente" | "avaliado" | "aplicado";
  enviado_em: string | null; enviado_resultado: string | null;
}

export interface Peca {
  id: string; ciclo_id: string; cliente_id: string;
  tema: string; area_direito: string | null;
  canal_codigo: string; canal_nome: string; limite_efetivo: number | null;
  formato: Formato; funil: Funil | null; status: StatusPeca; ordem: number;
  editoria_nome: string | null; pilar_nome: string | null;
  gancho_texto: string | null; gancho_tipo: TipoGancho | null; gancho_url: string | null; gancho_data: string | null;
  mes_referencia: string; total_comentarios: number; total_blocos: number;
}

export interface Ciclo { id: string; cliente_id: string; mes_referencia: string; status: StatusCiclo; publicado_em: string | null }

export interface Entregavel {
  id: string; cliente_id: string; categoria: CategoriaEntregavel;
  titulo: string; descricao: string | null; nome_arquivo: string; mime_type: string | null;
  tamanho_bytes: number | null; versao: number; status: StatusEntregavel; publicado_em: string | null;
}

export interface Relatorio {
  id: string; titulo: string; periodo_inicio: string | null; periodo_fim: string | null;
  emitido_em: string | null; resumo: string | null;
  kpis: { valor: string; rotulo: string }[]; secoes: string[]; storage_path: string | null;
}

export interface SessaoAtiva {
  token: string;
  pessoa_nome: string;
  expira_em: string;
  cliente?: { id: string; nome: string; slug: string };
  admin?: { id: string; nome: string };
  is_admin: boolean;
  /** Só vem no login de admin. Enquanto false, o painel exibe aviso permanente. */
  senha_inicial_trocada?: boolean;
}
