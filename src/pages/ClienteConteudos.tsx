import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { ClientShell } from '../components/ClientShell'
import { FORMAT_LABELS } from '../lib/utils'
import type { Cycle } from '../types'

const STATUS_CLASS: Record<string, string> = {
  pendente: 'pendente',
  em_revisao: 'em_revisao',
  ajustada: 'ajustada',
  aprovada: 'aprovada',
}

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  em_revisao: 'Em revisão',
  ajustada: 'Ajustada',
  aprovada: 'Aprovada',
}

export default function ClienteConteudos() {
  const { slug } = useParams<{ slug: string }>()
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [cycle, setCycle] = useState<Cycle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [channelFilter, setChannelFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    api
      .getClientCycles()
      .then(async (data) => {
        setCycles(data)
        if (data.length > 0) {
          const full = await api.getClientCycle(data[0].id)
          setCycle(full)
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const selectCycle = async (id: string) => {
    setLoading(true)
    try {
      setCycle(await api.getClientCycle(id))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const pieces = cycle?.pieces || []
  const filtered = channelFilter ? pieces.filter((p) => p.channel_id === channelFilter) : pieces
  const approved = pieces.filter((p) => p.status === 'aprovada').length
  const revisao = pieces.filter((p) => p.status === 'em_revisao' || p.status === 'ajustada').length
  const pendente = pieces.filter((p) => p.status === 'pendente').length
  const channels = [...new Set(pieces.map((p) => p.channel_id))]
  const channelNames: Record<string, string> = {}
  pieces.forEach((p) => {
    if (p.channel) channelNames[p.channel_id] = p.channel.nome
  })

  const pendingCount = pieces.filter((p) => p.status !== 'aprovada').length

  return (
    <ClientShell counts={{ conteudos: pendingCount || undefined }}>
      {loading ? (
        <p style={{ color: 'var(--ink-3)' }}>Carregando ciclo…</p>
      ) : error ? (
        <p style={{ color: 'var(--fgx-red)' }}>{error}</p>
      ) : cycles.length === 0 ? (
        <p style={{ color: 'var(--ink-3)' }}>Nenhum ciclo publicado ainda.</p>
      ) : (
        <>
          <div className="cycle-head">
            <div className="cycle-top">
              <div>
                <div className="eyebrow" style={{ marginBottom: 8 }}>
                  Ciclo de {cycle?.mes_referencia}
                </div>
                <span className="tag">Ciclo publicado</span>
                <h2>Volume {cycle?.volume} — {cycle?.mes_referencia}</h2>
              </div>
              <div className="cycle-sel">
                <label htmlFor="ciclo">Ciclo</label>
                <select id="ciclo" value={cycle?.id || ''} onChange={(e) => selectCycle(e.target.value)}>
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.mes_referencia} — Vol. {c.volume}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="stats">
              <div className="stat">
                <div className="n">{pieces.length}</div>
                <div className="l">Peças</div>
              </div>
              <div className="stat">
                <div className="n" style={{ color: 'var(--fgx-green)' }}>{approved}</div>
                <div className="l">Aprovadas</div>
              </div>
              <div className="stat">
                <div className="n" style={{ color: 'var(--fgx-orange)' }}>{revisao}</div>
                <div className="l">Em revisão</div>
              </div>
              <div className="stat">
                <div className="n">{pendente}</div>
                <div className="l">Pendentes</div>
              </div>
            </div>
            <div className="bar">
              {pieces.map((p) => (
                <div
                  key={p.id}
                  style={{
                    flex: 1,
                    background:
                      p.status === 'aprovada'
                        ? 'var(--fgx-green)'
                        : p.status === 'ajustada' || p.status === 'em_revisao'
                          ? 'var(--fgx-orange)'
                          : 'var(--line)',
                  }}
                  title={`${p.tema}: ${p.status}`}
                />
              ))}
            </div>
            <div className="bar-legend">
              <span><i style={{ background: 'var(--fgx-green)' }} /> Aprovada</span>
              <span><i style={{ background: 'var(--fgx-orange)' }} /> Em revisão</span>
              <span><i style={{ background: 'var(--line)' }} /> Pendente</span>
            </div>
          </div>

          {channels.length > 1 && (
            <div className="chips">
              <button type="button" className={!channelFilter ? 'on' : ''} onClick={() => setChannelFilter('')}>
                Todos
              </button>
              {channels.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  className={channelFilter === ch ? 'on' : ''}
                  onClick={() => setChannelFilter(ch === channelFilter ? '' : ch)}
                >
                  {channelNames[ch] || ch}
                </button>
              ))}
            </div>
          )}

          <div className="grid">
            {filtered.map((p, idx) => (
              <Link
                key={p.id}
                to={`/c/${slug}/conteudos/${cycle!.id}/peca/${p.id}`}
                className="card piece-card"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="card-cat">
                  Peça {idx + 1}
                  <span className={`pill ${STATUS_CLASS[p.status] || 'pendente'}`}>
                    {STATUS_LABEL[p.status] || p.status}
                  </span>
                </div>
                <h3>{p.tema}</h3>
                <p className="desc">
                  {[p.channel?.nome, FORMAT_LABELS[p.formato], p.area_direito].filter(Boolean).join(' · ')}
                </p>
                <div className="card-foot">
                  {p.comments && p.comments.length > 0 && (
                    <span>{p.comments.length} comentário{p.comments.length > 1 ? 's' : ''}</span>
                  )}
                  <span style={{ marginLeft: 'auto', color: 'var(--fgx-red)', fontWeight: 600 }}>Abrir peça →</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </ClientShell>
  )
}
