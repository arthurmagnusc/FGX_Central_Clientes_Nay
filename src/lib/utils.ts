import { StatusPill } from '../components/Shared'

export const DELIVERABLE_CATEGORIES = [
  { value: 'diagnostico', label: 'Diagnóstico' },
  { value: 'planejamento', label: 'Planejamento' },
  { value: 'apresentacao', label: 'Apresentações' },
  { value: 'proposta', label: 'Propostas' },
  { value: 'politica', label: 'Políticas' },
  { value: 'material_institucional', label: 'Materiais institucionais revisados' },
  { value: 'relatorio_resultado', label: 'Relatórios de resultado' },
]

export const CATEGORY_LABELS = Object.fromEntries(DELIVERABLE_CATEGORIES.map(c => [c.value, c.label]))

export const FORMAT_LABELS: Record<string, string> = {
  carrossel: 'Carrossel', artigo: 'Artigo', analise_tecnica: 'Análise Técnica',
  texto_email: 'E-mail', roteiro_video: 'Roteiro de Vídeo',
}

export function statusLabel(s: string): string {
  const m: Record<string, string> = {
    pendente: 'Pendente', em_revisao: 'Em revisão', ajustada: 'Ajustada', aprovada: 'Aprovada',
    em_producao: 'Em produção', em_validacao: 'Em validação', aprovado: 'Aprovado',
    rascunho: 'Rascunho', publicado: 'Publicado', encerrado: 'Encerrado',
  }
  return m[s] || s
}

export function formatDate(d: string): string {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(d: string): string {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export { StatusPill }
