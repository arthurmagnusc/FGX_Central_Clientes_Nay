import { useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { BuildStamp } from './BuildStamp'
import { CLIENT_OFFICE, CLIENT_SHORT, ENTREGAVEIS_DEMO, RELATORIOS_DEMO } from '../data/fiedra-demo'
import '../styles/portal-cliente.css'

function svg(inner: string, sz = 19) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: inner }} />
  )
}

const NAV = [
  { id: 'visao', to: 'visao', n: 'Visão geral', ic: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' },
  { id: 'entregas', to: 'entregas', n: 'Entregas', ic: '<path d="M4 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2z"/>' },
  { id: 'relatorios', to: 'relatorios', n: 'Relatórios', ic: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>' },
  { id: 'conteudos', to: 'conteudos', n: 'Painel de Conteúdos', ic: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 14h8"/>' },
]

function initials(n: string) {
  return n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'CL'
}

export function ClientShell({
  children,
  crumb,
  counts,
}: {
  children: React.ReactNode
  crumb?: React.ReactNode
  counts?: { entregas?: number; relatorios?: number; conteudos?: number }
}) {
  const { slug } = useParams<{ slug: string }>()
  const { pessoaNome, logout } = useAuth()
  const location = useLocation()
  const [sideOpen, setSideOpen] = useState(false)
  const [flash, setFlash] = useState<{ msg: string; ok?: boolean } | null>(null)

  const showFlash = (msg: string, ok?: boolean) => {
    setFlash({ msg, ok })
    setTimeout(() => setFlash(null), 2600)
  }

  const base = `/c/${slug}`
  const path = location.pathname
  const active = NAV.find((n) => path.includes(`/${n.to}`))?.id || 'visao'

  const cnt: Record<string, number | null> = {
    visao: null,
    entregas: counts?.entregas ?? ENTREGAVEIS_DEMO.reduce((a, g) => a + g.itens.length, 0),
    relatorios: counts?.relatorios ?? RELATORIOS_DEMO.length,
    conteudos: counts?.conteudos ?? null,
  }

  return (
    <div className="portal-root">
      <aside className={`side ${sideOpen ? 'open' : ''}`} id="sidebar">
        <Link to={`${base}/visao`} className="brand" style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => setSideOpen(false)}>
          <div className="logo">FGX</div>
          <div>
            <div className="bn">Portal do Cliente</div>
            <div className="bs">Strategic Solutions</div>
            <BuildStamp light />
          </div>
        </Link>

        <div className="proj" onClick={() => showFlash('Contrato ativo: ' + CLIENT_SHORT)} role="button" tabIndex={0}>
          <div className="ini">FB</div>
          <div style={{ minWidth: 0 }}>
            <div className="pl">Contrato ativo</div>
            <div className="pn">{CLIENT_SHORT}</div>
          </div>
          <svg style={{ marginLeft: 'auto' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>

        <div className="navlabel">Workspace</div>
        <nav className="main">
          {NAV.map((n) => (
            <Link
              key={n.id}
              to={`${base}/${n.to}`}
              className={active === n.id ? 'on' : ''}
              onClick={() => setSideOpen(false)}
              style={{ textDecoration: 'none' }}
            >
              {svg(n.ic, 20)}
              <span>{n.n}</span>
              {cnt[n.id] != null && cnt[n.id]! > 0 ? <span className="cnt">{cnt[n.id]}</span> : null}
            </Link>
          ))}
        </nav>

        <div className="side-bottom">
          <div className="prot">
            {svg('<path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/>', 19)}
            <div>
              <div className="pt">Ambiente protegido</div>
              <div className="ps">Conteúdo exclusivo deste contrato</div>
            </div>
          </div>
          <button type="button" onClick={() => showFlash('Suporte: fale com seu gerente de relacionamento FGX.')}>
            {svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 113.5 2.3c-.6.3-1 .9-1 1.7"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>', 17)}
            Ajuda e suporte
          </button>
          <button type="button" onClick={logout}>
            {svg('<path d="M15 17l5-5-5-5M20 12H9M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h5"/>', 17)}
            Sair
          </button>
        </div>
      </aside>

      <main className="content">
        <div className="topbar">
          <button type="button" className="mobtoggle" onClick={() => setSideOpen((o) => !o)} aria-label="Menu">
            {svg('<path d="M4 7h16M4 12h16M4 17h16"/>', 19)}
          </button>
          <div className="crumb">
            {crumb || (
              <>
                <span>{CLIENT_SHORT}</span>
                <span>/</span>
                <b>{NAV.find((n) => n.id === active)?.n}</b>
              </>
            )}
          </div>
          <div className="right">
            <button type="button" className="bell" onClick={() => showFlash('Avisos do contrato aparecerão aqui.', true)}>
              {svg('<path d="M18 9a6 6 0 10-12 0c0 5-2 6-2 6h16s-2-1-2-6"/><path d="M10.5 20a2 2 0 003 0"/>', 21)}
              <i />
            </button>
            <div className="userchip" title={pessoaNome || ''}>
              <div className="av">{initials(pessoaNome || 'CL')}</div>
              <div>
                <div className="un">{pessoaNome}</div>
                <div className="uo">{CLIENT_OFFICE}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="pad">{children}</div>
      </main>

      {flash && <div className={`flash on ${flash.ok ? 'ok' : ''}`}>{flash.msg}</div>}
    </div>
  )
}
