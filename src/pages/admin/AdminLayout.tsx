import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Logo } from '../../components/Shared'
import { BuildStamp } from '../../components/BuildStamp'

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
      <header className="fgx-header px-6 py-3 flex items-center justify-between">
        <Link to="/admin/dashboard" className="fgx-brand-link" aria-label="Voltar ao dashboard">
          <Logo />
          <div className="leading-tight min-w-0">
            <p className="font-titillium font-semibold text-base text-ink">Admin FGX</p>
            <BuildStamp />
          </div>
        </Link>
        <button type="button" className="fgx-nav-link fgx-nav-item fgx-nav-sair" onClick={logout}>
          Sair
        </button>
      </header>
      <div className="flex flex-col md:flex-row">
        <nav className="md:w-56 bg-white md:border-r border-line md:min-h-[calc(100vh-58px)] p-4 flex md:flex-col flex-row flex-wrap gap-1">
          {NAV.map((item) => {
            const active =
              location.pathname === item.to ||
              (item.to !== '/admin/dashboard' && location.pathname.startsWith(item.to))
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-2 rounded-lg text-sm font-montserrat font-medium transition-colors whitespace-nowrap ${
                  active ? 'bg-fgx-red text-white' : 'text-ink-2 hover:bg-fgx-gray'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <main className="flex-1 p-6 max-w-6xl">{children}</main>
      </div>
    </div>
  )
}
