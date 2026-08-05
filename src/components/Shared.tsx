import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  em_revisao: 'Em revisão',
  ajustada: 'Ajustada',
  aprovada: 'Aprovada',
  em_producao: 'Em produção',
  em_validacao: 'Em validação',
  aprovado: 'Aprovado',
  rascunho: 'Rascunho',
  publicado: 'Publicado',
  encerrado: 'Encerrado',
  solicitou_ajuste: 'Sol. ajuste',
}

export function StatusPill({ status, prefix }: { status: string; prefix?: string }) {
  const label = STATUS_LABELS[status] || status
  return (
    <span className={`pill pill-status-${status}`}>
      <span className="pill-dot" aria-hidden />
      {prefix ? `${prefix} · ${label}` : label}
    </span>
  )
}

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div className="fgx-logo" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      FGX
    </div>
  )
}

export function Header({
  title = 'Portal do Cliente',
  children,
}: {
  title?: string
  children?: React.ReactNode
}) {
  return (
    <header className="fgx-header px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <Logo />
        <span className="font-titillium font-semibold text-base sm:text-lg text-ink truncate">
          {title}
        </span>
      </div>
      <div className="flex items-center gap-3 sm:gap-5 flex-wrap justify-end">{children}</div>
    </header>
  )
}

/** Client portal chrome: white header + nav + rename */
export function ClientChrome({
  active,
  children,
}: {
  active?: 'entregaveis' | 'ciclo' | 'peca'
  children: React.ReactNode
}) {
  const { slug } = useParams<{ slug: string }>()
  const { pessoaNome, clientRename, logout } = useAuth()
  const [showRename, setShowRename] = useState(false)
  const [newName, setNewName] = useState('')

  const handleRename = async () => {
    if (!newName.trim()) return
    await clientRename(newName.trim())
    setShowRename(false)
  }

  return (
    <div className="min-h-screen bg-fgx-gray">
      <Header title="Central de Entregas | FGX">
        <span className="hidden sm:inline text-sm text-ink-3 font-montserrat">
          Olá, <span className="text-ink font-medium">{pessoaNome}</span>
        </span>
        {!showRename ? (
          <button
            type="button"
            className="fgx-nav-link text-xs underline"
            onClick={() => {
              setShowRename(true)
              setNewName(pessoaNome || '')
            }}
          >
            Não sou eu
          </button>
        ) : (
          <span className="flex items-center gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="border border-line rounded px-2 py-0.5 text-sm text-ink w-28"
              aria-label="Novo nome"
            />
            <button type="button" className="text-xs bg-fgx-red text-white px-2 py-0.5 rounded font-semibold" onClick={handleRename}>
              OK
            </button>
            <button type="button" className="text-xs text-ink-3 underline" onClick={() => setShowRename(false)}>
              Cancelar
            </button>
          </span>
        )}
        <Link
          to={`/c/${slug}/entregaveis`}
          className={`fgx-nav-link ${active === 'entregaveis' ? 'is-active' : ''}`}
        >
          Entregáveis
        </Link>
        <Link
          to={`/c/${slug}/ciclo`}
          className={`fgx-nav-link ${active === 'ciclo' || active === 'peca' ? 'is-active' : ''}`}
        >
          Ciclo editorial
        </Link>
        <button type="button" className="fgx-nav-link" onClick={logout}>
          Sair
        </button>
      </Header>
      {children}
    </div>
  )
}

export function PageIntro({
  eyebrow,
  title,
  status,
  description,
}: {
  eyebrow?: React.ReactNode
  title: string
  status?: React.ReactNode
  description?: string
}) {
  return (
    <div className="mb-8 animate-fade-up">
      {eyebrow && <div className="mb-3">{eyebrow}</div>}
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <h1 className="font-titillium font-bold text-2xl sm:text-3xl text-ink leading-tight">{title}</h1>
        {status}
      </div>
      {description && (
        <p className="text-ink-3 font-montserrat text-sm sm:text-base max-w-2xl leading-relaxed">{description}</p>
      )}
    </div>
  )
}

export function ContextPill({ letter, label }: { letter: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white border border-line px-2.5 py-1 text-sm font-montserrat text-ink-2">
      <span
        className="w-6 h-6 rounded-full bg-fgx-orange text-white text-xs font-bold flex items-center justify-center"
        aria-hidden
      >
        {letter}
      </span>
      {label}
    </span>
  )
}

function DocIcon() {
  return (
    <svg className="w-8 h-8 text-fgx-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  )
}

export function mimeBadge(mime?: string, titulo?: string): string {
  if (mime?.includes('pdf')) return 'PDF'
  if (mime?.includes('html')) return 'HTML'
  if (mime?.includes('word') || mime?.includes('document')) return 'DOC'
  if (mime?.includes('sheet') || mime?.includes('excel')) return 'XLS'
  if (mime?.includes('presentation') || mime?.includes('powerpoint')) return 'PPT'
  if (mime?.includes('image')) return 'IMG'
  const ext = titulo?.split('.').pop()?.toUpperCase()
  if (ext && ext.length <= 4) return ext
  return 'ARQ'
}

export function DeliverableCard({
  badge,
  stage,
  stageLabel,
  status,
  statusPrefix,
  title,
  description,
  meta,
  onOpen,
  onDownload,
}: {
  badge: string
  stage: string
  stageLabel: string
  status: string
  statusPrefix?: string
  title: string
  description?: string | null
  meta: string
  onOpen: () => void
  onDownload: () => void
}) {
  return (
    <article className="card flex flex-col h-full animate-fade-up hover:shadow-md transition-shadow">
      <div className="card-preview relative h-40 flex flex-col items-center justify-center px-4">
        <span className="absolute top-3 left-3 bg-ink text-white text-[10px] font-bold tracking-wider px-2 py-0.5 rounded">
          {badge}
        </span>
        <DocIcon />
        <p className="mt-2 font-titillium font-black text-3xl text-fgx-red leading-none">{stage}</p>
        <p className="mt-1 text-[11px] font-montserrat font-semibold tracking-widest text-ink-2 uppercase text-center">
          {stageLabel}
        </p>
      </div>
      <div className="p-5 flex flex-col flex-1 gap-3">
        <StatusPill status={status} prefix={statusPrefix} />
        <h3 className="font-titillium font-bold text-lg text-ink leading-snug">{title}</h3>
        {description && (
          <p className="text-sm text-ink-3 font-montserrat leading-relaxed line-clamp-3">{description}</p>
        )}
        <p className="text-xs text-ink-3 font-montserrat mt-auto">{meta}</p>
        <div className="flex flex-col gap-2 pt-1">
          <button type="button" className="btn-primary w-full" onClick={onOpen}>
            <EyeIcon />
            Abrir relatório
          </button>
          <button type="button" className="btn-secondary w-full" onClick={onDownload}>
            Baixar arquivo
          </button>
        </div>
      </div>
    </article>
  )
}

export function PieceCard({
  to,
  index,
  formatLabel,
  theme,
  channel,
  area,
  status,
  commentCount,
}: {
  to: string
  index: number
  formatLabel: string
  theme: string
  channel?: string
  area?: string
  status: string
  commentCount?: number
}) {
  return (
    <Link to={to} className="card flex flex-col h-full animate-fade-up hover:shadow-md hover:border-fgx-red/25 transition-all group">
      <div className="card-preview relative h-36 flex flex-col items-center justify-center px-4">
        <span className="absolute top-3 left-3 bg-ink text-white text-[10px] font-bold tracking-wider px-2 py-0.5 rounded">
          {formatLabel.slice(0, 8).toUpperCase()}
        </span>
        <DocIcon />
        <p className="mt-2 font-titillium font-black text-3xl text-fgx-red leading-none">{index}</p>
        <p className="mt-1 text-[11px] font-montserrat font-semibold tracking-widest text-ink-2 uppercase text-center">
          {formatLabel}
        </p>
      </div>
      <div className="p-5 flex flex-col flex-1 gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={status} prefix={`Peça ${index}`} />
          {commentCount && commentCount > 0 ? (
            <span className="text-xs text-fgx-blue font-semibold font-montserrat">{commentCount} comentário{commentCount > 1 ? 's' : ''}</span>
          ) : null}
        </div>
        <h3 className="font-titillium font-bold text-lg text-ink leading-snug group-hover:text-fgx-red transition-colors">
          {theme}
        </h3>
        <p className="text-sm text-ink-3 font-montserrat">
          {[channel, area].filter(Boolean).join(' · ')}
        </p>
        <span className="btn-primary w-full mt-auto pointer-events-none">
          <EyeIcon />
          Abrir peça
        </span>
      </div>
    </Link>
  )
}

export function Loading({ message = 'Carregando...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center">
        <div className="w-8 h-8 border-3 border-fgx-red border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-ink-3 font-montserrat text-sm">{message}</p>
      </div>
    </div>
  )
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="p-8 text-center">
      <p className="text-fgx-red font-montserrat font-medium mb-3">{message}</p>
      {onRetry && (
        <button type="button" className="btn-primary" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-line rounded ${className}`} />
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon?: string
  title: string
  description?: string
}) {
  return (
    <div className="text-center py-14 px-4 card">
      {icon && <div className="text-4xl mb-3">{icon}</div>}
      <h3 className="font-titillium font-semibold text-lg text-ink-2 mb-2">{title}</h3>
      {description && <p className="text-ink-3 text-sm font-montserrat max-w-md mx-auto">{description}</p>}
    </div>
  )
}

export function DemoCredBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-fgx-beige-light/70 px-4 py-3 mb-6 font-montserrat text-sm">
      {children}
    </div>
  )
}
