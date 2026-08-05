import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import { Header, Loading, ErrorMessage } from '../components/Shared'
import { StatusPill, CATEGORY_LABELS, formatDate, formatBytes } from '../lib/utils'
import type { Deliverable } from '../types'

export default function ClienteEntregaveis() {
  const { slug } = useParams<{ slug: string }>()
  const { pessoaNome, clientRename, logout } = useAuth()
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showRename, setShowRename] = useState(false)
  const [newName, setNewName] = useState('')
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set())

  const load = () => {
    setLoading(true)
    api.getClientDeliverables().then(setDeliverables).catch(e => setError(e.message)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleDownload = async (id: string) => {
    try {
      const data = await api.downloadDeliverable(id)
      if (data.url) window.open(data.url, '_blank')
    } catch (e: any) { setError(e.message) }
  }

  const handleRename = async () => {
    if (!newName.trim()) return
    await clientRename(newName.trim())
    setShowRename(false)
  }

  const grouped: Record<string, Deliverable[]> = {}
  deliverables.forEach(d => {
    if (!grouped[d.categoria]) grouped[d.categoria] = []
    grouped[d.categoria].push(d)
  })

  const catOrder = ['diagnostico', 'planejamento', 'apresentacao', 'proposta', 'politica', 'material_institucional', 'relatorio_resultado']

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
            <button className="text-xs bg-white text-fgx-red px-2 py-1 rounded font-semibold" onClick={handleRename}>OK</button>
            <button className="text-xs underline" onClick={() => setShowRename(false)}>Cancelar</button>
          </div>
        )}
        <Link to={`/c/${slug}/ciclo`} className="text-sm underline opacity-80 hover:opacity-100 font-montserrat">Ciclo Editorial</Link>
        <button className="text-sm underline opacity-80 hover:opacity-100" onClick={logout}>Sair</button>
      </Header>

      <div className="max-w-5xl mx-auto p-6">
        <h2 className="font-titillium font-bold text-2xl text-ink mb-6">Entregáveis do contrato</h2>
        {loading ? <Loading /> :
         error ? <ErrorMessage message={error} onRetry={load} /> :
         catOrder.map(cat => {
           const items = grouped[cat]
           if (!items || items.length === 0) return null
           return (
             <div key={cat} className="mb-8">
               <h3 className="font-titillium font-semibold text-lg text-ink mb-3">{CATEGORY_LABELS[cat]}</h3>
               <div className="grid gap-4">
                 {items.map(d => (
                   <div key={d.id} className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                     <div>
                       <h4 className="font-montserrat font-semibold text-ink">{d.titulo}</h4>
                       {d.descricao && <p className="text-ink-3 text-sm mt-1">{d.descricao}</p>}
                       <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-ink-3 font-montserrat">
                         <span>v{d.versao}</span>
                         <span>{formatDate(d.created_at)}</span>
                         <span>{d.mime_type}</span>
                         <span>{formatBytes(d.tamanho_bytes)}</span>
                         <StatusPill status={d.status} />
                       </div>
                     </div>
                     <button className="btn-primary text-sm shrink-0" onClick={() => handleDownload(d.id)}>Baixar</button>
                   </div>
                 ))}
               </div>
             </div>
           )
         })}
      </div>
    </div>
  )
}
