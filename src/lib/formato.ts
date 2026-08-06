import type { Formato, Peca, StatusPeca, CategoriaEntregavel } from "./tipos";

export const NOME_FORMATO: Record<Formato, string> = {
  carrossel: "Carrossel", artigo: "Artigo", analise_tecnica: "Análise técnica",
  texto_email: "Texto de e-mail", roteiro_video: "Roteiro de vídeo",
};

export const NOME_STATUS: Record<StatusPeca, string> = {
  pendente: "Pendente", em_revisao: "Em revisão", ajustada: "Ajustada", aprovada: "Aprovada",
};

export const COR_STATUS: Record<StatusPeca, string> = {
  pendente: "#C9C3BF", em_revisao: "#356FA9", ajustada: "#E77938", aprovada: "#527F3E",
};

export const NOME_CATEGORIA: Record<CategoriaEntregavel, string> = {
  diagnostico: "Diagnóstico", planejamento: "Planejamento", apresentacao: "Apresentações",
  proposta: "Propostas", politica: "Políticas",
  material_institucional: "Materiais institucionais revisados",
  relatorio_resultado: "Relatórios de resultado",
};

export const ORDEM_CATEGORIAS: CategoriaEntregavel[] = [
  "diagnostico", "planejamento", "apresentacao", "proposta",
  "politica", "material_institucional", "relatorio_resultado",
];

// Padrão de carrossel da Síntese: 100 a 230 caracteres por slide.
export const LIMITE_SLIDE = 230;

/** O rótulo do bloco muda com o formato: slide, cena ou trecho. */
export function rotuloBloco(peca: Peca, indice: number, total: number, titulo?: string | null) {
  if (peca.formato === "carrossel") return `Slide ${indice + 1} de ${total}`;
  if (peca.formato === "roteiro_video") return `Cena ${indice + 1} de ${total}`;
  return titulo || `Trecho ${indice + 1}`;
}

export function rotuloBotaoComentar(formato: Formato) {
  if (formato === "carrossel") return "Comentar neste slide";
  if (formato === "roteiro_video") return "Comentar nesta cena";
  return "Comentar neste trecho";
}

export function dataBr(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function dataHoraBr(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function mesBr(mesRef: string) {
  const [ano, mes] = mesRef.split("-");
  const nomes = ["janeiro","fevereiro","março","abril","maio","junho",
                 "julho","agosto","setembro","outubro","novembro","dezembro"];
  return `${nomes[Number(mes) - 1]} de ${ano}`;
}

export function tamanhoArquivo(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

export function numeroBr(n: number) { return n.toLocaleString("pt-BR"); }
