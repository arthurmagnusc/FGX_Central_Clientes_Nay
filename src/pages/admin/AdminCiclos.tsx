import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import AdminLayout from './AdminLayout'
import { Loading, ErrorMessage } from '../../components/Shared'
import { StatusPill } from '../../lib/utils'
import type { Cycle, Client } from '../../types'

export default function AdminCiclos() {
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ client_id: '', mes_referencia: '', volume: 1 })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([api.getAdminCycles(), api.getAdminClients()])
      .then(([c, cl]) => { setCycles(c); setClients(cl) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.createCycle(form)
      setShowForm(false)
      setForm({ client_id: '', mes_referencia: '', volume: 1 })
      load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleStatus = async (id: string, status: 'publicado' | 'encerrado') => {
    try {
      await api.updateCycle(id, { status })
      load()
    } catch (err: any) { setError(err.message) }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-titillium font-bold text-2xl text-ink">Ciclos</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancelar' : 'Novo ciclo'}</button>
      </div>
      {error && <ErrorMessage message={error} />}

      {showForm && (
        <form onSubmit={handleCreate} className="card p-6 space-y-4 mb-6 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1">Cliente</label>
            <select className="input-field" value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} required>
              <option value="">Selecione...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1">Mês de referência (YYYY-MM)</label>
            <input className="input-field" value={form.mes_referencia} onChange={e => setForm({...form, mes_referencia: e.target.value})} placeholder="2026-06" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1">Volume</label>
            <input type="number" className="input-field" value={form.volume} onChange={e => setForm({...form, volume: parseInt(e.target.value)})} required />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Criando...' : 'Criar ciclo'}</button>
        </form>
      )}

      {loading ? <Loading /> :
       <div className="overflow-x-auto">
         <table className="w-full text-sm font-montserrat table-card">
           <thead><tr className="text-left text-ink-3 border-b border-line">
             <th className="py-2">Cliente</th><th className="py-2">Mês</th><th className="py-2">Volume</th><th className="py-2">Status</th><th className="py-2">Demo</th><th className="py-2">Ações</th>
           </tr></thead>
           <tbody>
             {cycles.map(c => (
               <tr key={c.id} className="border-b border-line hover:bg-fgx-gray/50">
                 <td className="py-2" data-label="Cliente">{clients.find(cl => cl.id === c.client_id)?.nome || '-'}</td>
                 <td className="py-2" data-label="Mês">{c.mes_referencia}</td>
                 <td className="py-2" data-label="Volume">{c.volume}</td>
                 <td className="py-2" data-label="Status"><StatusPill status={c.status} /></td>
                 <td className="py-2" data-label="Demo">{c.is_demo ? 'Sim' : '-'}</td>
                 <td className="py-2" data-label="Ações">
                   <div className="flex gap-2">
                     <Link to={`/admin/ciclos/${c.id}/pecas`} className="text-fgx-blue hover:underline text-xs">Peças</Link>
                     {c.status === 'rascunho' && <button className="text-fgx-blue hover:underline text-xs" onClick={() => handleStatus(c.id, 'publicado')}>Publicar</button>}
                     {c.status === 'publicado' && <button className="text-fgx-green hover:underline text-xs" onClick={() => handleStatus(c.id, 'encerrado')}>Encerrar</button>}
                   </div>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>}
    </AdminLayout>
  )
}
