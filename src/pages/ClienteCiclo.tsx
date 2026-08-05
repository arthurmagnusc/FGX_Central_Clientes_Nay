import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import {
  ClientChrome,
  PageIntro,
  ContextPill,
  PieceCard,
  StatusPill,
  FilterBar,
  ErrorMessage,
  Skeleton,
  EmptyState,
} from '../components/Shared'
import { FORMAT_LABELS } from '../lib/utils'
import type { Cycle } from '../types'

export default function ClienteCiclo() {
  const { slug } = useParams<{ slug: string }>()
  const { pessoaNome } = useAuth()
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [cycle, setCycle] = useState<Cycle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [channelFilter, setChannelFilter] = useState('')

  const loadCycles = () => {
    setLoading(true)
    api
      .getClientCycles()
      .then((data) => {
        setCycles(data)
        if (data.length > 0) selectCycle(data[0].id)
        else setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }
  useEffect(loadCycles, [])

  const selectCycle = (id: string) => {
    setLoading(true)
    api
      .getClientCycle(id)
      .then(setCycle)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  const pieces = cycle?.pieces || []
  const filteredPieces = channelFilter ? pieces.filter((p) => p.channel_id === channelFilter) : pieces
  const approved = pieces.filter((p) => p.status === 'aprovada').length
  const progressPct = pieces.length > 0 ? Math.round((approved / pieces.length) * 100) : 0

  const channels = [...new Set(pieces.map((p) => p.channel_id))]
  const channelNames: Record<string, string> = {}
  pieces.forEach((p) => {
    if (p.channel) channelNames[p.channel_id] = p.channel.nome
  })

  const filterItems = channels.map((ch) => ({
    id: ch,
    label: channelNames[ch] || ch,
    count: pieces.filter((p) => p.channel_id === ch).length,
  }))

  const initial = (pessoaNome || slug || 'C').charAt(0).toUpperCase()

  return (
    <ClientChrome active="ciclo">
      <div className="page-shell">
        <PageIntro
          eyebrow={
            <ContextPill letter={initial} label={`${pessoaNome || 'Cliente'} · Ciclo editorial`} />
          }
          title="Peças do ciclo"
          status={cycle ? <StatusPill status={cycle.status} /> : undefined}
          description="Valide o texto das peças do mês. Comentários são por bloco — a arte fica fora deste portal."
        />

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-28 w-full rounded-xl" />
            <div className="cards-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card">
                  <Skeleton className="h-[8.75rem] w-full rounded-none" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadCycles} />
        ) : cycles.length === 0 ? (
          <EmptyState
            icon="📰"
            title="Nenhum ciclo publicado"
            description="Quando a equipe FGX publicar um ciclo editorial, ele aparecerá aqui."
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <label className="text-sm font-semibold text-ink-2 font-montserrat" htmlFor="ciclo-select">
                Ciclo
              </label>
              <select
                id="ciclo-select"
                className="input-field max-w-xs"
                value={cycle?.id || ''}
                onChange={(e) => selectCycle(e.target.value)}
              >
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.mes_referencia} — Vol. {c.volume}
                  </option>
                ))}
              </select>
            </div>

            {cycle && (
              <>
                <div className="card p-6 mb-8 overflow-visible animate-fade-up">
                  <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                    <div>
                      <h2 className="font-titillium font-bold text-xl text-ink">
                        Volume {cycle.volume} — {cycle.mes_referencia}
                      </h2>
                      <p className="text-ink-3 text-sm mt-1 font-montserrat">
                        {pieces.length} peças · {approved} aprovadas
                      </p>
                    </div>
                    <div className="text-3xl font-black font-titillium text-fgx-red tabular-nums">
                      {progressPct}%
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-fgx-gray rounded-full overflow-hidden">
                    <div
                      className="h-full bg-fgx-green rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex gap-1.5 mt-3">
                    {pieces.map((p) => (
                      <div
                        key={p.id}
                        className={`flex-1 h-1.5 rounded-full transition-colors ${
                          p.status === 'aprovada'
                            ? 'bg-fgx-green'
                            : p.status === 'ajustada'
                              ? 'bg-fgx-orange'
                              : 'bg-line'
                        }`}
                        title={`${p.tema}: ${p.status}`}
                      />
                    ))}
                  </div>
                </div>

                {filterItems.length > 1 && (
                  <FilterBar
                    items={filterItems}
                    value={channelFilter}
                    onChange={setChannelFilter}
                    allLabel="Todos os canais"
                  />
                )}

                <div className="cards-grid">
                  {filteredPieces.map((p, idx) => (
                    <PieceCard
                      key={p.id}
                      to={`/c/${slug}/ciclo/${cycle.id}/peca/${p.id}`}
                      index={idx + 1}
                      formatLabel={FORMAT_LABELS[p.formato] || p.formato}
                      theme={p.tema}
                      channel={p.channel?.nome}
                      area={p.area_direito}
                      status={p.status}
                      commentCount={p.comments?.length}
                      stagger={idx + 1}
                    />
                  ))}
                </div>

                {filteredPieces.length === 0 && pieces.length > 0 && (
                  <div className="mt-6">
                    <EmptyState
                      icon="🔍"
                      title="Nenhuma peça neste canal"
                      description="Tente outro filtro de canal."
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </ClientChrome>
  )
}
