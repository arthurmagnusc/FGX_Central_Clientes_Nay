import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import { Header, Loading, ErrorMessage } from '../components/Shared'
import { StatusPill, FORMAT_LABELS, formatDate } from '../lib/utils'
import type { Cycle, Piece } from '../types'

export default function ClienteCiclo() {
  const { slug } = useParams<{ slug: string }>()
  const { pessoaNome, clientRename, logout } = useAuth()
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [cycle, setCycle] = useState<Cycle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showRename, setShowRename] = useState(false)
  const [newName, setNewName] = useState('')

  const load = () => {
    setLoading(true)
    api.getClientCycles().then(data => {
      setCycles(data)
      if (data.length > 0) {
        api.getClientCycle(data[0].id).then(setCycle).catch(e => setError(e.message))
      }
    }).catch(e => setError(e.message)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const selectCycle = (id: string) => {
    setLoading(true)
    api.getClientCycle(id).then(setCycle).catch(e => setError(e.message)).finally(() => setLoading(false))
  }

  const progressPct = cycle?.pieces?.length
    ? Math.round((cycle.pieces.filter(p => p.status === 'aprovada').length / cycle.pieces.length) * 100)
    : 0

  return (
    <div className="min-h-screen bg-fgx-gray">
      <Header>
        <span className="text-sm opacity-90 font-montserrat">Olá, {pessoaNome}</span>
        {!showRename ? (
          <button className="text-xs underline opacity-80 hover:opacity-100" onClick={() => { setShowRename(true); setNewName(pessoaNome || '') }}>
            Não sou eu
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input value={newName} onChange={e => setNewName(e.target.value)} className="input-field text-sm py-1 w-28 text-ink" />
            <button className="text-xs bg-white text-fgx-red px-2 py-1 rounded font-semibold" onClick={() => { clientRename(newName.trim()); setShowRename(false) }}>OK</button>
            <button className="text-xs underline" onClick={() => setShowRename(false)}>Cancelar</button>
          </div>
        )}
        <Link to={`/c/${slug}/entregaveis`} className="text-sm underline opacity-80 hover:opacity-100 font-montserrat">Entregáveis</Link>
        <button className="text-sm underline opacity-80 hover:opacity-100" onClick={logout}>Sair</button>
      </Header>

      <div className="max-w-5xl mx-auto p-6">
        <h2 className="font-titillium font-bold text-2xl text-ink mb-6">Ciclo Editorial</h2>
        {loading ? <Loading /> :
         error ? <ErrorMessage message={error} onRetry={load} /> :
         <div>
           {cycles.length > 0 && (
             <div className="mb-6">
               <label className="block text-sm font-medium text-ink-2 mb-1">Selecionar ciclo</label>
               <select className="input-field max-w-xs" value={cycle?.id || ''} onChange={e => selectCycle(e.target.value)}>
                 {cycles.map(c => (
                   <option key={c.id} value={c.id}>{c.mes_referencia} — Vol. {c.volume} ({c.status})</option>
                 ))}
               </select>
             </div>
           )}

           {cycle && (
             <>
               <div className="card p-5 mb-6">
                 <div className="flex flex-wrap items-center justify-between gap-3">
                   <div>
                     <h3 className="font-titillium font-bold text-xl text-ink">Volume {cycle.volume}</h3>
                     <p className="text-ink-3 text-sm mt-1">Referência: {cycle.mes_referencia}</p>
                   </div>
                   <StatusPill status={cycle.status} />
                 </div>
                 <div className="mt-4">
                   <div className="flex justify-between text-sm text-ink-3 mb-1 font-montserrat">
                     <span>Progresso de aprovação</span>
                     <span>{progressPct}%</span>
                   </div>
                   <div className="w-full h-3 bg-fgx-gray rounded-full overflow-hidden">
                     <div className="h-full bg-fgx-green rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
                   </div>
                 </div>
               </div>

               <div className="grid gap-4">
                 {cycle.pieces?.map(p => (
                   <Link key={p.id} to={`/c/${slug}/ciclo/${cycle.id}/peca/${p.id}`}
                     className="card p-5 block hover:shadow-md transition-shadow">
                     <div className="flex flex-wrap items-start justify-between gap-3">
                       <div>
                         <h4 className="font-montserrat font-semibold text-ink text-lg">{p.tema}</h4>
                         <div className="flex flex-wrap gap-2 mt-1 text-sm text-ink-3 font-montserrat">
                           <span>{p.channel?.nome}</span>
                           <span>|</span>
                           <span>{p.area_direito}</span>
                           <span>|</span>
                           <span>{FORMAT_LABELS[p.formato]}</span>
                         </div>
                       </div>
                       <div className="flex items-center gap-3">
                         <StatusPill status={p.status} />
                         {p.comments && p.comments.length > 0 && (
                           <span className="text-xs text-ink-3">{p.comments.length} comentário{p.comments.length > 1 ? 's' : ''}</span>
                         )}
                       </div>
                     </div>
                   </Link>
                 ))}
               </div>
             </>
           )}
         </div>}
      </div>
    </div>
  )
}
