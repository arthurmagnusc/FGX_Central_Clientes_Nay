import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import AdminLayout from './AdminLayout'
import { Loading, ErrorMessage } from '../../components/Shared'
import { formatDate } from '../../lib/utils'
import type { Client, AdditiveDoc } from '../../types'

export default function AdminAditivos() {
  const [clients, setClients] = useState<Client[]>([])
  const [docs, setDocs] = useState<AdditiveDoc[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ titulo: '', conteudo: '' })
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    api.getAdminClients().then(setClients).catch(e => setError(e.message))
  }, [])

  const loadDocs = (clientId: string) => {
    setSelectedClient(clientId)
    setLoading(true)
    api.getAdditiveDocs(clientId).then(setDocs).catch(e => setError(e.message)).finally(() => setLoading(false))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editingId) {
        await api.updateAdditiveDoc(editingId, form)
      } else {
        await api.createAdditiveDoc({ ...form, client_id: selectedClient })
      }
      setShowForm(false)
      setForm({ titulo: '', conteudo: '' })
      setEditingId(null)
      loadDocs(selectedClient)
    } catch (err: any) { setError(err.message) }
    setSaving(false)
  }

  const handleExport = async (id: string) => {
    try {
      const data = await api.exportAdditiveDoc(id)
      const blob = new Blob([data.conteudo || ''], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'aditivo.md'; a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) { setError(err.message) }
  }

  return (
    <AdminLayout>
      <h2 className="font-titillium font-bold text-2xl text-ink mb-6">Documentos aditivos</h2>
      {error && <ErrorMessage message={error} />}

      <div className="mb-4">
        <select className="input-field max-w-xs" value={selectedClient} onChange={e => loadDocs(e.target.value)}>
          <option value="">Selecione um cliente...</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      {selectedClient && (
        <button className="btn-primary mb-4" onClick={() => { setShowForm(true); setEditingId(null); setForm({ titulo: '', conteudo: '' }) }}>
          Novo aditivo
        </button>
      )}

      {showForm && (
        <div className="card p-6 mb-6 space-y-4">
          <h3 className="font-titillium font-semibold text-lg">{editingId ? 'Editar' : 'Novo'} aditivo</h3>
          <input className="input-field" placeholder="Título" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} />
          <textarea className="input-field" rows={10} placeholder="Conteúdo em markdown..." value={form.conteudo} onChange={e => setForm({...form, conteudo: e.target.value})} />
          <div className="flex gap-3">
            <button className="btn-primary" onClick={handleSave} disabled={saving}>Salvar</button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {loading ? <Loading /> :
       <div className="grid gap-4">
         {docs.map(d => (
           <div key={d.id} className="card p-4 flex flex-col sm:flex-row justify-between gap-3">
             <div>
               <h4 className="font-montserrat font-semibold text-ink">{d.titulo}</h4>
               <p className="text-xs text-ink-3 mt-1">{formatDate(d.created_at)}</p>
             </div>
             <div className="flex gap-2">
               <button className="btn-secondary text-sm" onClick={() => { setForm({ titulo: d.titulo, conteudo: d.conteudo }); setEditingId(d.id); setShowForm(true) }}>Editar</button>
               <button className="btn-secondary text-sm" onClick={() => handleExport(d.id)}>Exportar .md</button>
             </div>
           </div>
         ))}
       </div>}
    </AdminLayout>
  )
}
