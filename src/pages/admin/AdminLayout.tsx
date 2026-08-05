import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Logo } from '../../components/Shared'

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/clientes', label: 'Clientes' },
  { to: '/admin/entregaveis', label: 'Entregáveis' },
  { to: '/admin/ciclos', label: 'Ciclos' },
  { to: '/admin/comentarios', label: 'Comentários' },
  { to: '/admin/ajustes', label: 'Ajustes' },
  { to: '/admin/aditivos', label: 'Aditivos' },
  { to: '/admin/senha', label: 'Senha' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-fgx-gray">
      <header className="fgx-gradient-header px-6 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="font-titillium font-semibold text-lg">Admin FGX</span>
        </div>
        <button className="btn-ghost text-white" onClick={logout}>Sair</button>
      </header>
      <div className="flex flex-col md:flex-row">
        <nav className="md:w-56 bg-white md:border-r border-line md:min-h-[calc(100vh-56px)] p-4 flex md:flex-col flex-row flex-wrap gap-1">
          {NAV.map(item => (
            <Link key={item.to} to={item.to}
              className={`px-3 py-2 rounded text-sm font-montserrat font-medium transition-colors whitespace-nowrap ${
                location.pathname === item.to || (item.to !== '/admin/dashboard' && location.pathname.startsWith(item.to))
                  ? 'bg-fgx-red text-white'
                  : 'text-ink-2 hover:bg-fgx-gray'
              }`}>
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 p-6 max-w-6xl">
          {children}
        </main>
      </div>
    </div>
  )
}
