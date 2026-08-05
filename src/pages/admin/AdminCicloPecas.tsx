import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import AdminLayout from './AdminLayout'
import { Loading, ErrorMessage } from '../../components/Shared'
import { StatusPill, FORMAT_LABELS } from '../../lib/utils'
import type { Piece, Cycle, Channel } from '../../types'

export default function AdminCicloPecas() {
  const { cycleId } = useParams<{ cycleId: string }>()
  const navigate = useNavigate()
  const [cycle, setCycle] = useState<Cycle | null>(null)
  const [pieces, setPieces] = useState<Piece[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([api.getAdminPieces(cycleId!), api.getAdminCycles()])
      .then(([p, cycles]) => {
        setPieces(p)
        setCycle(cycles.find((c: Cycle) => c.id === cycleId) || null)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [cycleId])

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-titillium font-bold text-2xl text-ink">Peças do ciclo</h2>
          {cycle && <p className="text-ink-3 text-sm mt-1">{cycle.mes_referencia} — Vol. {cycle.volume} <StatusPill status={cycle.status} /></p>}
        </div>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={() => navigate(`/admin/ciclos/${cycleId}/pecas/nova`)}>Nova peça</button>
        </div>
      </div>
      {error && <ErrorMessage message={error} />}
      {loading ? <Loading /> :
       <div className="grid gap-4">
         {pieces.map(p => (
           <div key={p.id} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
             <div>
               <Link to={`/admin/ciclos/${cycleId}/pecas/${p.id}`} className="font-montserrat font-semibold text-ink hover:text-fgx-red">{p.tema}</Link>
               <div className="flex flex-wrap gap-2 mt-1 text-xs text-ink-3">
                 <span>{p.channel?.nome}</span><span>|</span>
                 <span>{p.area_direito}</span><span>|</span>
                 <span>{FORMAT_LABELS[p.formato]}</span>
                 <span>| Ordem: {p.ordem}</span>
               </div>
             </div>
             <StatusPill status={p.status} />
           </div>
         ))}
         {pieces.length === 0 && <p className="text-ink-3 text-sm">Nenhuma peça neste ciclo.</p>}
       </div>}
    </AdminLayout>
  )
}
