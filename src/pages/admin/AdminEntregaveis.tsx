import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import AdminLayout from './AdminLayout'
import { Loading, ErrorMessage } from '../../components/Shared'
import { StatusPill, CATEGORY_LABELS, formatDate, formatBytes } from '../../lib/utils'
import type { Deliverable, Client } from '../../types'

export default function AdminEntregaveis() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ client_id: '', categoria: 'diagnostico', titulo: '', descricao: '', versao: '1.0' })
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([api.getAdminDeliverables(), api.getAdminClients()])
      .then(([d, c]) => { setDeliverables(d); setClients(c) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { setError('Selecione um arquivo'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('client_id', form.client_id)
      fd.append('categoria', form.categoria)
      fd.append('titulo', form.titulo)
      fd.append('descricao', form.descricao)
      fd.append('versao', form.versao)
      fd.append('file', file)
      await api.createDeliverable(fd)
      setShowForm(false)
      setForm({ client_id: '', categoria: 'diagnostico', titulo: '', descricao: '', versao: '1.0' })
      setFile(null)
      load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const cats = ['diagnostico', 'planejamento', 'apresentacao', 'proposta', 'politica', 'material_institucional', 'relatorio_resultado']

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-titillium font-bold text-2xl text-ink">Entregáveis</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancelar' : 'Novo entregável'}</button>
      </div>
      {error && <ErrorMessage message={error} />}

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4 mb-6 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1">Cliente</label>
            <select className="input-field" value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} required>
              <option value="">Selecione...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1">Categoria</label>
            <select className="input-field" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} required>
              {cats.map(cat => <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1">Título</label>
            <input className="input-field" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1">Descrição</label>
            <input className="input-field" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1">Versão</label>
            <input className="input-field" value={form.versao} onChange={e => setForm({...form, versao: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1">Arquivo</label>
            <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} required />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Enviando...' : 'Criar entregável'}</button>
        </form>
      )}

      {loading ? <Loading /> :
       cats.map(cat => {
         const items = deliverables.filter(d => d.categoria === cat)
         if (items.length === 0) return null
         return (
           <div key={cat} className="mb-6">
             <h3 className="font-titillium font-semibold text-lg text-ink mb-3">{CATEGORY_LABELS[cat]}</h3>
             <div className="grid gap-3">
               {items.map(d => (
                 <div key={d.id} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                   <div>
                     <p className="font-montserrat font-semibold text-ink">{d.titulo}</p>
                     <div className="flex flex-wrap gap-2 mt-1 text-xs text-ink-3">
                       <span>{clients.find(c => c.id === d.client_id)?.nome || '-'}</span>
                       <span>v{d.versao}</span>
                       <span>{formatDate(d.created_at)}</span>
                       <span>{formatBytes(d.tamanho_bytes)}</span>
                       <StatusPill status={d.status} />
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           </div>
         )
       })}
    </AdminLayout>
  )
}
