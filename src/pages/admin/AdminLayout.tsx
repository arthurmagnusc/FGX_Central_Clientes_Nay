import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../lib/api'
import { BuildStamp } from '../../components/BuildStamp'
import '../../styles/portal-admin.css'

function Svg({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
  )
}

const NAV = [
  { to: '/admin/ciclos', match: '/admin/ciclos', n: 'Ciclos', ic: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4M16 3v4M4 11h16"/>', key: 'ciclos' },
  { to: '/admin/comentarios', match: '/admin/comentarios', n: 'Comentários', ic: '<path d="M21 12a8 8 0 01-8 8H7l-4 3V12a8 8 0 018-8h2a8 8 0 018 8z"/>', key: 'comentarios' },
  { to: '/admin/ajustes', match: '/admin/ajustes', n: 'Ajustes', ic: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>', key: 'ajustes' },
  { to: '/admin/aditivos', match: '/admin/aditivos', n: 'Aditivos', ic: '<path d="M12 5v14M5 12h14"/>', key: 'aditivos' },
  { to: '/admin/entregaveis', match: '/admin/entregaveis', n: 'Entregáveis', ic: '<path d="M4 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2z"/>', key: 'entregaveis' },
  { to: '/admin/clientes', match: '/admin/clientes', n: 'Clientes e canais', ic: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0112 0M16 5.5a3 3 0 010 5.8M18 20a5.5 5.5 0 00-3-4.5"/>', key: 'clientes' },
]

export default function AdminLayout({
  children,
  title,
}: {
  children: React.ReactNode
  title?: string
}) {
  const { logout } = useAuth()
  const location = useLocation()
  const [sideOpen, setSideOpen] = useState(false)
  const [clients, setClients] = useState<{ id: string; nome: string; slug: string }[]>([])
  const [clientId, setClientId] = useState('')
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    api.getAdminClients().then((list) => {
      setClients(list)
      const fiedra = list.find((c: any) => c.slug === 'fiedra') || list[0]
      if (fiedra) setClientId(fiedra.id)
      setCounts((c) => ({ ...c, clientes: list.length }))
    }).catch(() => {})
    Promise.all([
      api.getAdminCycles().catch(() => []),
      api.getAdminDeliverables().catch(() => []),
    ]).then(([cycles, dels]) => {
      setCounts((c) => ({
        ...c,
        ciclos: Array.isArray(cycles) ? cycles.length : 0,
        entregaveis: Array.isArray(dels) ? dels.length : 0,
      }))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (clients.length && !counts.clientes) {
      setCounts((c) => ({ ...c, clientes: clients.length }))
    }
  }, [clients, counts.clientes])

  const activeLabel =
    title ||
    NAV.find((n) => location.pathname === n.match || location.pathname.startsWith(n.match + '/'))?.n ||
    (location.pathname.includes('/senha') ? 'Configurações' : 'Admin')

  const selected = clients.find((c) => c.id === clientId)

  return (
    <div className="admin-root">
      <aside className={`side ${sideOpen ? 'open' : ''}`}>
        <Link to="/admin/ciclos" className="brand" style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => setSideOpen(false)}>
          <div className="logo">FGX</div>
          <div>
            <div className="bn">Portal FGX</div>
            <div className="bs">Painel interno</div>
            <BuildStamp light />
          </div>
        </Link>

        <div className="admtag">Área administrativa</div>

        <div className="cliSel">
          <div className="cl">Cliente em edição</div>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} aria-label="Cliente">
            {clients.length === 0 && <option value="">Carregando…</option>}
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="navlabel">Produção</div>
        <nav className="main">
          {NAV.map((n) => {
            const on =
              location.pathname === n.match ||
              (n.match !== '/admin/ciclos' && location.pathname.startsWith(n.match)) ||
              (n.match === '/admin/ciclos' && (location.pathname.startsWith('/admin/ciclos') || location.pathname === '/admin/dashboard'))
            const cnt = counts[n.key]
            return (
              <Link
                key={n.to}
                to={n.to}
                className={on ? 'on' : ''}
                onClick={() => setSideOpen(false)}
                style={{ textDecoration: 'none' }}
              >
                <Svg d={n.ic} size={19} />
                <span>{n.n}</span>
                {cnt ? <span className={`cnt ${n.key === 'comentarios' && cnt ? '' : 'mute'}`}>{cnt}</span> : null}
              </Link>
            )
          })}
        </nav>

        <div className="side-bottom">
          <Link to="/admin/senha" onClick={() => setSideOpen(false)} style={{ textDecoration: 'none' }}>
            <Svg d={'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1A1.7 1.7 0 008.9 19a1.7 1.7 0 00-1.9.4l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1A1.7 1.7 0 004.6 8.9a1.7 1.7 0 00-.4-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>'} size={17} />
            Configurações
          </Link>
          <button type="button" onClick={logout}>
            <Svg d={'<path d="M15 17l5-5-5-5M20 12H9M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h5"/>'} size={17} />
            Sair
          </button>
        </div>
      </aside>

      <main className="content">
        <div className="topbar">
          <button type="button" className="mobtoggle" onClick={() => setSideOpen((o) => !o)} aria-label="Menu">
            <Svg d={'<path d="M4 7h16M4 12h16M4 17h16"/>'} size={19} />
          </button>
          <div className="crumb">
            <span>{selected?.nome?.split(',')[0] || 'FGX'}</span>
            <span>/</span>
            <b>{activeLabel}</b>
          </div>
          <div className="right">
            <span style={{ fontSize: '12.5px', color: 'var(--ink-3)' }}>Equipe FGX</span>
          </div>
        </div>
        <div className="pad">{children}</div>
      </main>
    </div>
  )
}
