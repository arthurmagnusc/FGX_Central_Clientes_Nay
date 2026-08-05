import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import AdminLayout from './AdminLayout'
import { Loading, ErrorMessage } from '../../components/Shared'
import { formatDateTime } from '../../lib/utils'
import type { Cycle, Comment } from '../../types'

export default function AdminComentarios() {
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [selectedCycle, setSelectedCycle] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getAdminCycles().then(setCycles).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [])

  const loadComments = (cycleId: string) => {
    setSelectedCycle(cycleId)
    setLoading(true)
    api.getCommentsByCycle(cycleId).then(setComments).catch(e => setError(e.message)).finally(() => setLoading(false))
  }

  return (
    <AdminLayout>
      <h2 className="font-titillium font-bold text-2xl text-ink mb-6">Comentários por ciclo</h2>
      {error && <ErrorMessage message={error} />}

      <div className="mb-4">
        <select className="input-field max-w-xs" value={selectedCycle} onChange={e => loadComments(e.target.value)}>
          <option value="">Selecione um ciclo...</option>
          {cycles.map(c => <option key={c.id} value={c.id}>{c.mes_referencia} — Vol. {c.volume}</option>)}
        </select>
      </div>

      {loading && selectedCycle ? <Loading /> :
       comments.length === 0 && selectedCycle ? <p className="text-ink-3 text-sm">Nenhum comentário.</p> :
       <div className="space-y-3">
         {comments.map(c => (
           <div key={c.id} className="card p-4">
             <div className="flex items-center gap-3 mb-2">
               <span className="font-semibold text-ink text-sm">{c.autor_nome}</span>
               <span className="pill pill-status-em_revisao text-xs">{c.autor_tipo}</span>
               <span className="text-xs text-ink-3">{formatDateTime(c.created_at)}</span>
             </div>
             {c.trecho && <p className="text-xs text-ink-3 italic mb-1">Trecho: &ldquo;{c.trecho}&rdquo;</p>}
             <p className="text-sm text-ink">{c.texto}</p>
           </div>
         ))}
       </div>}
    </AdminLayout>
  )
}
