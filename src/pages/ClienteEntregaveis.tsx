import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import {
  ClientChrome,
  PageIntro,
  ContextPill,
  DeliverableCard,
  FilterBar,
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
  const [toastError, setToastError] = useState(false)
  const [catFilter, setCatFilter] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [busyKind, setBusyKind] = useState<'open' | 'download' | null>(null)

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

  const flash = (msg: string, isError = false) => {
    setToastMsg(msg)
    setToastError(isError)
    setTimeout(() => setToastMsg(''), 2800)
  }

  const handleOpen = async (del: Deliverable) => {
    setBusyId(del.id)
    setBusyKind('open')
    try {
      const blob = await fetchBlob(del)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
      flash(`Abrindo “${del.titulo}”`)
    } catch {
      flash('Erro ao abrir arquivo', true)
    } finally {
      setBusyId(null)
      setBusyKind(null)
    }
  }

  const handleDownload = async (del: Deliverable) => {
    setBusyId(del.id)
    setBusyKind('download')
    try {
      const blob = await fetchBlob(del)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = del.titulo
      a.click()
      URL.revokeObjectURL(url)
      flash(`Download de “${del.titulo}” iniciado`)
    } catch {
      flash('Erro ao baixar arquivo', true)
    } finally {
      setBusyId(null)
      setBusyKind(null)
    }
  }

  const filterItems = useMemo(() => {
    return CAT_ORDER.map((cat) => ({
      id: cat,
      label: CATEGORY_LABELS[cat] || cat,
      count: deliverables.filter((d) => d.categoria === cat).length,
    })).filter((i) => i.count > 0)
  }, [deliverables])

  const visible = catFilter
    ? deliverables.filter((d) => d.categoria === catFilter)
    : [...deliverables].sort(
        (a, b) => CAT_ORDER.indexOf(a.categoria) - CAT_ORDER.indexOf(b.categoria),
      )

  const initial = (pessoaNome || slug || 'C').charAt(0).toUpperCase()
  const allApproved = deliverables.length > 0 && deliverables.every((d) => d.status === 'aprovado')

  return (
    <ClientChrome active="entregaveis">
      <div className="page-shell">
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
              <span className={`pill ${allApproved ? 'pill-status-aprovado' : 'pill-status-em_validacao'}`}>
                <span className="pill-dot" />
                {allApproved ? 'Entregue' : `${deliverables.length} arquivos`}
              </span>
            ) : undefined
          }
          description="Relatórios e materiais macro do contrato. Abra para visualizar no navegador ou baixe o arquivo original."
        />

        {loading ? (
          <div className="cards-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card">
                <Skeleton className="h-[9.5rem] w-full rounded-none" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-9 w-full" />
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
          <>
            {filterItems.length > 1 && (
              <FilterBar items={filterItems} value={catFilter} onChange={setCatFilter} />
            )}

            <div className="cards-grid">
              {visible.map((d, idx) => (
                <DeliverableCard
                  key={d.id}
                  badge={mimeBadge(d.mime_type, d.titulo)}
                  stage={String(idx + 1)}
                  stageLabel={CATEGORY_LABELS[d.categoria] || d.categoria}
                  status={d.status}
                  statusPrefix={`v${d.versao}`}
                  title={d.titulo}
                  description={d.descricao}
                  meta={`Relatório · ${formatBytes(d.tamanho_bytes)} · ${formatDate(d.created_at)}`}
                  onOpen={() => handleOpen(d)}
                  onDownload={() => handleDownload(d)}
                  busy={busyId === d.id ? busyKind : null}
                  stagger={idx + 1}
                />
              ))}
            </div>

            {visible.length === 0 && (
              <div className="mt-6">
                <EmptyState
                  icon="🔍"
                  title="Nenhum item nesta categoria"
                  description="Tente outro filtro para ver os entregáveis."
                />
              </div>
            )}
          </>
        )}

        {toastMsg && (
          <div className={`toast ${toastError ? 'toast-error' : 'toast-success'}`}>{toastMsg}</div>
        )}
      </div>
    </ClientChrome>
  )
}
