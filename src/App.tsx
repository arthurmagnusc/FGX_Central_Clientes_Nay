import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import ClienteLogin from './pages/ClienteLogin'
import ClienteEntregaveis from './pages/ClienteEntregaveis'
import ClienteCiclo from './pages/ClienteCiclo'
import ClientePeca from './pages/ClientePeca'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminClientes from './pages/admin/AdminClientes'
import AdminClienteEdit from './pages/admin/AdminClienteEdit'
import AdminEntregaveis from './pages/admin/AdminEntregaveis'
import AdminCiclos from './pages/admin/AdminCiclos'
import AdminCicloPecas from './pages/admin/AdminCicloPecas'
import AdminPecaEdit from './pages/admin/AdminPecaEdit'
import AdminComentarios from './pages/admin/AdminComentarios'
import AdminAjustes from './pages/admin/AdminAjustes'
import AdminAditivos from './pages/admin/AdminAditivos'
import AdminSenha from './pages/admin/AdminSenha'

function ProtectedCliente({ children }: { children: React.ReactNode }) {
  const { type, loading } = useAuth()
  if (loading) return <div className="p-8 text-center text-ink-3">Carregando...</div>
  if (type !== 'cliente') return <Navigate to="/" replace />
  return <>{children}</>
}

function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  const { type, loading } = useAuth()
  if (loading) return <div className="p-8 text-center text-ink-3">Carregando...</div>
  if (type !== 'admin') return <Navigate to="/admin" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/c/:slug" element={<ClienteLogin />} />
      <Route path="/c/:slug/entregaveis" element={<ProtectedCliente><ClienteEntregaveis /></ProtectedCliente>} />
      <Route path="/c/:slug/ciclo" element={<ProtectedCliente><ClienteCiclo /></ProtectedCliente>} />
      <Route path="/c/:slug/ciclo/:cycleId/peca/:pieceId" element={<ProtectedCliente><ClientePeca /></ProtectedCliente>} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<ProtectedAdmin><AdminDashboard /></ProtectedAdmin>} />
      <Route path="/admin/clientes" element={<ProtectedAdmin><AdminClientes /></ProtectedAdmin>} />
      <Route path="/admin/clientes/:id" element={<ProtectedAdmin><AdminClienteEdit /></ProtectedAdmin>} />
      <Route path="/admin/entregaveis" element={<ProtectedAdmin><AdminEntregaveis /></ProtectedAdmin>} />
      <Route path="/admin/ciclos" element={<ProtectedAdmin><AdminCiclos /></ProtectedAdmin>} />
      <Route path="/admin/ciclos/:cycleId/pecas" element={<ProtectedAdmin><AdminCicloPecas /></ProtectedAdmin>} />
      <Route path="/admin/ciclos/:cycleId/pecas/:pieceId" element={<ProtectedAdmin><AdminPecaEdit /></ProtectedAdmin>} />
      <Route path="/admin/comentarios" element={<ProtectedAdmin><AdminComentarios /></ProtectedAdmin>} />
      <Route path="/admin/ajustes" element={<ProtectedAdmin><AdminAjustes /></ProtectedAdmin>} />
      <Route path="/admin/aditivos" element={<ProtectedAdmin><AdminAditivos /></ProtectedAdmin>} />
      <Route path="/admin/senha" element={<ProtectedAdmin><AdminSenha /></ProtectedAdmin>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
