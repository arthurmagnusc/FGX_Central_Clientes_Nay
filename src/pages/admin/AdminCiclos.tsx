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
      .then(([c, cl]) => {
        setCycles(c)
        setClients(cl)
      })
      .catch((e) => setError(e.message))
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
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <AdminLayout title="Ciclos">
      <div className="phead">
        <div>
          <h1>Ciclos</h1>
          <p className="ps">Publique e acompanhe os ciclos editoriais dos clientes.</p>
        </div>
        <div className="acts">
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : 'Novo ciclo'}
          </button>
        </div>
      </div>
      {error && <ErrorMessage message={error} />}

      {showForm && (
        <form onSubmit={handleCreate} className="card cardp mb-6 max-w-xl" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label>Cliente</label>
            <select className="inp" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} required>
              <option value="">Selecione...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Mês de referência (YYYY-MM)</label>
            <input className="inp" value={form.mes_referencia} onChange={(e) => setForm({ ...form, mes_referencia: e.target.value })} placeholder="2026-06" required />
          </div>
          <div className="field">
            <label>Volume</label>
            <input type="number" className="inp" value={form.volume} onChange={(e) => setForm({ ...form, volume: parseInt(e.target.value) })} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Criando...' : 'Criar ciclo'}
          </button>
        </form>
      )}

      {loading ? (
        <Loading />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--ink-3)', borderBottom: '1px solid var(--line)' }}>
                <th style={{ padding: '14px 18px' }}>Cliente</th>
                <th style={{ padding: '14px 18px' }}>Mês</th>
                <th style={{ padding: '14px 18px' }}>Volume</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px' }}>Demo</th>
                <th style={{ padding: '14px 18px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {cycles.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '14px 18px' }}>{clients.find((cl) => cl.id === c.client_id)?.nome || '-'}</td>
                  <td style={{ padding: '14px 18px' }}>{c.mes_referencia}</td>
                  <td style={{ padding: '14px 18px' }}>{c.volume}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <StatusPill status={c.status} />
                  </td>
                  <td style={{ padding: '14px 18px' }}>{c.is_demo ? 'Sim' : '-'}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <Link to={`/admin/ciclos/${c.id}/pecas`} className="btn btn-ghost btn-xs">
                        Peças
                      </Link>
                      {c.status === 'rascunho' && (
                        <button type="button" className="btn btn-primary btn-xs" onClick={() => handleStatus(c.id, 'publicado')}>
                          Publicar
                        </button>
                      )}
                      {c.status === 'publicado' && (
                        <button type="button" className="btn btn-green btn-xs" onClick={() => handleStatus(c.id, 'encerrado')}>
                          Encerrar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
