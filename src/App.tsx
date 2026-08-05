import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Home from './pages/Home'
import ClienteLogin from './pages/ClienteLogin'
import ClienteVisao from './pages/ClienteVisao'
import ClienteEntregas from './pages/ClienteEntregas'
import ClienteRelatorios from './pages/ClienteRelatorios'
import ClienteConteudos from './pages/ClienteConteudos'
import ClientePeca from './pages/ClientePeca'
import AdminLogin from './pages/AdminLogin'
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
  const { type, loading, slug } = useAuth()
  if (loading) return <div className="p-8 text-center text-ink-3">Carregando...</div>
  if (type !== 'cliente') return <Navigate to={slug ? `/c/${slug}` : '/'} replace />
  return <>{children}</>
}

function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  const { type, loading } = useAuth()
  if (loading) return <div className="p-8 text-center text-ink-3">Carregando...</div>
  if (type !== 'admin') return <Navigate to="/admin" replace />
  return <>{children}</>
}

function RedirectEntregas() {
  const { slug } = useParams()
  return <Navigate to={`/c/${slug}/entregas`} replace />
}
function RedirectConteudos() {
  const { slug } = useParams()
  return <Navigate to={`/c/${slug}/conteudos`} replace />
}
function RedirectOldPeca() {
  const { slug, cycleId, pieceId } = useParams()
  return <Navigate to={`/c/${slug}/conteudos/${cycleId}/peca/${pieceId}`} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/c/:slug" element={<ClienteLogin />} />
      <Route path="/c/:slug/visao" element={<ProtectedCliente><ClienteVisao /></ProtectedCliente>} />
      <Route path="/c/:slug/entregas" element={<ProtectedCliente><ClienteEntregas /></ProtectedCliente>} />
      <Route path="/c/:slug/relatorios" element={<ProtectedCliente><ClienteRelatorios /></ProtectedCliente>} />
      <Route path="/c/:slug/conteudos" element={<ProtectedCliente><ClienteConteudos /></ProtectedCliente>} />
      <Route path="/c/:slug/conteudos/:cycleId/peca/:pieceId" element={<ProtectedCliente><ClientePeca /></ProtectedCliente>} />
      <Route path="/c/:slug/entregaveis" element={<RedirectEntregas />} />
      <Route path="/c/:slug/ciclo" element={<RedirectConteudos />} />
      <Route path="/c/:slug/ciclo/:cycleId/peca/:pieceId" element={<RedirectOldPeca />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<Navigate to="/admin/ciclos" replace />} />
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
