import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../lib/api'
import AdminLayout from './AdminLayout'
import { Loading, ErrorMessage } from '../../components/Shared'
import { StatusPill } from '../../lib/utils'
import type { Cycle, Client } from '../../types'

export default function AdminDashboard() {
  const { logout } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([api.getAdminClients(), api.getAdminCycles()])
      .then(([c, cy]) => { setClients(c); setCycles(cy) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleDeleteDemo = async () => {
    if (!confirm('Apagar todo o ciclo demo da Fiedra? Esta ação não pode ser desfeita.')) return
    try {
      await api.deleteDemoCycle()
      load()
    } catch (e: any) { setError(e.message) }
  }

  if (loading) return <AdminLayout><Loading /></AdminLayout>
  if (error) return <AdminLayout><ErrorMessage message={error} onRetry={load} /></AdminLayout>

  return (
    <AdminLayout>
      <h2 className="font-titillium font-bold text-2xl text-ink mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-4 text-center">
          <p className="font-titillium font-bold text-2xl text-fgx-red">{clients.length}</p>
          <p className="text-ink-3 text-sm font-montserrat mt-1">Clientes</p>
        </div>
        <div className="card p-4 text-center">
          <p className="font-titillium font-bold text-2xl text-fgx-red">{cycles.length}</p>
          <p className="text-ink-3 text-sm font-montserrat mt-1">Ciclos</p>
        </div>
        <div className="card p-4 text-center">
          <Link to="/admin/clientes" className="btn-primary block text-center">Gerenciar clientes</Link>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <h3 className="font-titillium font-semibold text-lg text-ink mb-3">Ciclos recentes</h3>
        {cycles.length === 0 ? (
          <p className="text-ink-3 text-sm font-montserrat">Nenhum ciclo cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-montserrat">
              <thead><tr className="text-left text-ink-3 border-b border-line">
                <th className="py-2">Cliente</th><th className="py-2">Mês</th><th className="py-2">Volume</th><th className="py-2">Status</th><th className="py-2">Demo</th><th className="py-2">Ações</th>
              </tr></thead>
              <tbody>
                {cycles.slice(0, 10).map(c => (
                  <tr key={c.id} className="border-b border-line hover:bg-fgx-gray/50">
                    <td className="py-2">{clients.find(cl => cl.id === c.client_id)?.nome || '-'}</td>
                    <td className="py-2">{c.mes_referencia}</td>
                    <td className="py-2">{c.volume}</td>
                    <td className="py-2"><StatusPill status={c.status} /></td>
                    <td className="py-2">{c.is_demo ? 'Sim' : '-'}</td>
                    <td className="py-2"><Link to={`/admin/ciclos/${c.id}/pecas`} className="text-fgx-blue hover:underline text-xs">Peças</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {cycles.some(c => c.is_demo) && (
          <button className="btn-secondary mt-3 text-sm" onClick={handleDeleteDemo}>Apagar ciclo demo (Fiedra)</button>
        )}
      </div>
    </AdminLayout>
  )
}
