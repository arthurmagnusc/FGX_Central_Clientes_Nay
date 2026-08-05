import { describe, it, expect } from 'vitest'

describe('Utilitarios', () => {
  it('formatDate dd/mm/aaaa', async () => {
    const { formatDate } = await import('../../src/lib/utils')
    const result = formatDate('2026-06-15T12:00:00Z')
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })

  it('formatBytes exibe valores corretos', async () => {
    const { formatBytes } = await import('../../src/lib/utils')
    expect(formatBytes(500)).toBe('500 B')
    expect(formatBytes(2048)).toMatch(/KB/)
    expect(formatBytes(2097152)).toMatch(/MB/)
  })

  it('FORMAT_LABELS mapeia formatos', async () => {
    const { FORMAT_LABELS } = await import('../../src/lib/utils')
    expect(FORMAT_LABELS.carrossel).toBe('Carrossel')
    expect(FORMAT_LABELS.analise_tecnica).toBe('Análise Técnica')
    expect(FORMAT_LABELS.roteiro_video).toBe('Roteiro de Vídeo')
  })

  it('CATEGORY_LABELS cobre todas as categorias', async () => {
    const { CATEGORY_LABELS } = await import('../../src/lib/utils')
    const cats = ['diagnostico', 'planejamento', 'apresentacao', 'proposta', 'politica', 'material_institucional', 'relatorio_resultado']
    cats.forEach(cat => {
      expect(CATEGORY_LABELS[cat]).toBeTruthy()
    })
  })

  it('statusLabel retorna rótulos corretos', async () => {
    const { statusLabel } = await import('../../src/lib/utils')
    expect(statusLabel('aprovada')).toBe('Aprovada')
    expect(statusLabel('pendente')).toBe('Pendente')
  })
})
