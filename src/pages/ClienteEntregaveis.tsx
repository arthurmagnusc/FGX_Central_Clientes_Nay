import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import {
  ClientChrome,
  PageIntro,
  ContextPill,
  DeliverableCard,
  ErrorMessage,
  Skeleton,
  EmptyState,
  mimeBadge,
} from '../components/Shared'
import { CATEGORY_LABELS, formatDate, formatBytes } from '../lib/utils'
import type { Deliverable } from '../types'

const CAT_ORDER = [
  'diagnostico',
  'planejamento',
  'apresentacao',
  'proposta',
  'politica',
  'material_institucional',
  'relatorio_resultado',
]

export default function ClienteEntregaveis() {
  const { slug } = useParams<{ slug: string }>()
  const { pessoaNome } = useAuth()
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toastMsg, setToastMsg] = useState('')

  const load = () => {
    setLoading(true)
    api
      .getClientDeliverables()
      .then(setDeliverables)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const fetchBlob = async (del: Deliverable) => {
    const res = await fetch(`/api/cliente/deliverables/${del.id}/download`, { credentials: 'include' })
    if (!res.ok) throw new Error('Erro ao obter arquivo')
    return res.blob()
  }

  const handleOpen = async (del: Deliverable) => {
    try {
      const blob = await fetchBlob(del)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
      setToastMsg(`Abrindo "${del.titulo}"`)
      setTimeout(() => setToastMsg(''), 2500)
    } catch {
      setToastMsg('Erro ao abrir arquivo')
      setTimeout(() => setToastMsg(''), 3000)
    }
  }

  const handleDownload = async (del: Deliverable) => {
    try {
      const blob = await fetchBlob(del)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = del.titulo
      a.click()
      URL.revokeObjectURL(url)
      setToastMsg(`Download de "${del.titulo}" iniciado`)
      setTimeout(() => setToastMsg(''), 3000)
    } catch {
      setToastMsg('Erro ao baixar arquivo')
      setTimeout(() => setToastMsg(''), 3000)
    }
  }

  const grouped: Record<string, Deliverable[]> = {}
  deliverables.forEach((d) => {
    if (!grouped[d.categoria]) grouped[d.categoria] = []
    grouped[d.categoria].push(d)
  })

  const initial = (pessoaNome || slug || 'C').charAt(0).toUpperCase()

  return (
    <ClientChrome active="entregaveis">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <PageIntro
          eyebrow={
            <ContextPill
              letter={initial}
              label={`${pessoaNome || 'Cliente'} · Entregáveis do contrato`}
            />
          }
          title="Biblioteca de entregáveis"
          status={
            deliverables.length > 0 ? (
              <span className="pill pill-status-aprovado">
                <span className="pill-dot" />
                {deliverables.length} arquivos
              </span>
            ) : undefined
          }
          description="Relatórios e materiais macro do contrato. Abra para visualizar ou baixe o arquivo original."
        />

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card">
                <Skeleton className="h-40 w-full rounded-none" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorMessage message={error} onRetry={load} />
        ) : deliverables.length === 0 ? (
          <EmptyState
            icon="📦"
            title="Nenhum entregável disponível"
            description="Os entregáveis aparecerão aqui quando forem publicados pela equipe FGX."
          />
        ) : (
          CAT_ORDER.map((cat) => {
            const items = grouped[cat]
            if (!items || items.length === 0) return null
            return (
              <section key={cat} className="mb-12">
                <h2 className="font-titillium font-semibold text-lg text-ink mb-5">
                  {CATEGORY_LABELS[cat]}
                  <span className="text-sm text-ink-3 font-montserrat ml-2 font-normal">({items.length})</span>
                </h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((d, idx) => (
                    <DeliverableCard
                      key={d.id}
                      badge={mimeBadge(d.mime_type, d.titulo)}
                      stage={d.versao || String(idx + 1)}
                      stageLabel={CATEGORY_LABELS[cat] || cat}
                      status={d.status}
                      statusPrefix={`v${d.versao}`}
                      title={d.titulo}
                      description={d.descricao}
                      meta={`Relatório · ${formatBytes(d.tamanho_bytes)} · ${formatDate(d.created_at)}`}
                      onOpen={() => handleOpen(d)}
                      onDownload={() => handleDownload(d)}
                    />
                  ))}
                </div>
              </section>
            )
          })
        )}

        {toastMsg && <div className="toast toast-success">{toastMsg}</div>}
      </div>
    </ClientChrome>
  )
}
