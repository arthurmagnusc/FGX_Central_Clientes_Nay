import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import AdminLayout from './AdminLayout'
import { Loading, ErrorMessage } from '../../components/Shared'
import type { Cycle, Piece, Comment, Adjustment } from '../../types'

export default function AdminAjustes() {
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [pieces, setPieces] = useState<Piece[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [selectedCycle, setSelectedCycle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ajustando, setAjustando] = useState<{ commentId: string; pieceId: string } | null>(null)
  const [form, setForm] = useState({ tipo: 'pontual', descricao: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.getAdminCycles().then(setCycles).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [])

  const loadComments = async (cycleId: string) => {
    setSelectedCycle(cycleId)
    setLoading(true)
    try {
      const p = await api.getAdminPieces(cycleId)
      setPieces(p)
      const c = await api.getCommentsByCycle(cycleId)
      setComments(c)
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const handleCreateAdjustment = async () => {
    if (!ajustando) return
    setSaving(true)
    try {
      await api.createAdjustment({
        comment_id: ajustando.commentId,
        piece_id: ajustando.pieceId,
        ...form,
      })
      setAjustando(null)
      setForm({ tipo: 'pontual', descricao: '' })
    } catch (err: any) { setError(err.message) }
    setSaving(false)
  }

  const getPieceName = (id: string) => pieces.find(p => p.id === id)?.tema || '-'

  return (
    <AdminLayout>
      <h2 className="font-titillium font-bold text-2xl text-ink mb-6">Ajustes</h2>
      {error && <ErrorMessage message={error} />}

      <div className="mb-4">
        <select className="input-field max-w-xs" value={selectedCycle} onChange={e => loadComments(e.target.value)}>
          <option value="">Selecione um ciclo...</option>
          {cycles.map(c => <option key={c.id} value={c.id}>{c.mes_referencia} — Vol. {c.volume}</option>)}
        </select>
      </div>

      {loading && selectedCycle ? <Loading /> :
       <div className="space-y-3">
         {comments.map(c => (
           <div key={c.id} className="card p-4 flex flex-col sm:flex-row justify-between gap-3">
             <div>
               <div className="flex items-center gap-2 mb-1">
                 <span className="font-semibold text-sm text-ink">{c.autor_nome}</span>
                 <span className="text-xs text-ink-3">{getPieceName(c.piece_id)}</span>
               </div>
               {c.trecho && <p className="text-xs text-ink-3 italic">Trecho: &ldquo;{c.trecho}&rdquo;</p>}
               <p className="text-sm text-ink">{c.texto}</p>
             </div>
             <button className="btn-secondary text-sm shrink-0" onClick={() => setAjustando({ commentId: c.id, pieceId: c.piece_id })}>
               Registrar ajuste
             </button>
           </div>
         ))}
         {comments.length === 0 && selectedCycle && <p className="text-ink-3 text-sm">Nenhum comentário.</p>}
       </div>}

      {ajustando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md bg-white">
            <h3 className="font-titillium font-semibold text-lg mb-4">Registrar ajuste</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-ink-2 mb-1">Tipo</label>
                <select className="input-field" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
                  <option value="pontual">Pontual</option>
                  <option value="estrutural">Estrutural</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-2 mb-1">Descrição</label>
                <textarea className="input-field" rows={3} value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
              </div>
              <div className="flex gap-3">
                <button className="btn-primary" onClick={handleCreateAdjustment} disabled={saving}>Salvar</button>
                <button className="btn-secondary" onClick={() => setAjustando(null)}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
