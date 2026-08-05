import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import AdminLayout from './AdminLayout'
import { Loading, ErrorMessage } from '../../components/Shared'
import type { Client } from '../../types'

export default function AdminClientes() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    api.getAdminClients().then(setClients).catch(e => setError(e.message)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-titillium font-bold text-2xl text-ink">Clientes</h2>
        <Link to="/admin/clientes/novo" className="btn-primary">Novo cliente</Link>
      </div>
      {loading ? <Loading /> :
       error ? <ErrorMessage message={error} onRetry={load} /> :
       <div className="overflow-x-auto">
         <table className="w-full text-sm font-montserrat table-card">
           <thead><tr className="text-left text-ink-3 border-b border-line">
             <th className="py-2">Nome</th><th className="py-2">Slug</th><th className="py-2">Ativo</th><th className="py-2">Senha</th><th className="py-2"></th>
           </tr></thead>
           <tbody>
             {clients.map(c => (
               <tr key={c.id} className="border-b border-line hover:bg-fgx-gray/50">
                 <td className="py-2" data-label="Nome">{c.nome}</td>
                 <td className="py-2" data-label="Slug">{c.slug}</td>
                 <td className="py-2" data-label="Ativo">{c.ativo ? 'Sim' : 'Não'}</td>
                 <td className="py-2" data-label="Senha">{c.senha_hash ? 'Configurada' : <span className="text-fgx-red font-semibold">Não configurada</span>}</td>
                 <td className="py-2"><Link to={`/admin/clientes/${c.id}`} className="text-fgx-blue hover:underline text-xs">Editar</Link></td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>}
    </AdminLayout>
  )
}
