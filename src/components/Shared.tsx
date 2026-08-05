import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { BuildStamp } from './BuildStamp'

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
    <div className="fgx-logo" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      FGX
    </div>
  )
}

export function Header({
  homeTo = '/',
  title = 'Central de Entregas',
  children,
}: {
  homeTo?: string
  title?: string
  children?: React.ReactNode
}) {
  return (
    <header className="fgx-header px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
      <Link to={homeTo} className="fgx-brand-link min-w-0" aria-label="Voltar ao início">
        <Logo />
        <div className="min-w-0 leading-tight">
          <p className="font-titillium font-semibold text-base sm:text-[1.05rem] text-ink truncate">{title}</p>
          <BuildStamp />
        </div>
      </Link>
      <nav className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end" aria-label="Principal">
        {children}
      </nav>
    </header>
  )
}

export function ClientChrome({
  active,
  children,
}: {
  active?: 'entregaveis' | 'ciclo' | 'peca'
  children: React.ReactNode
}) {
  const { slug } = useParams<{ slug: string }>()
  const { logout } = useAuth()
  const homeTo = `/c/${slug}/entregaveis`

  return (
    <div className="min-h-screen">
      <Header homeTo={homeTo} title="Central de Entregas">
        <Link
          to={homeTo}
          className={`fgx-nav-link fgx-nav-item ${active === 'entregaveis' ? 'is-active' : ''}`}
        >
          Entregáveis
          <span className="fgx-nav-sub">Projeto</span>
        </Link>
        <Link
          to={`/c/${slug}/ciclo`}
          className={`fgx-nav-link fgx-nav-item ${active === 'ciclo' || active === 'peca' ? 'is-active' : ''}`}
        >
          Ciclo Editorial
        </Link>
        <span className="fgx-nav-divider" aria-hidden />
        <button type="button" className="fgx-nav-link fgx-nav-item fgx-nav-sair" onClick={logout}>
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
    <div className="mb-8 sm:mb-10 animate-fade-up">
      {eyebrow && <div className="mb-3.5">{eyebrow}</div>}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-2.5">
        <h1 className="font-titillium font-bold text-[1.65rem] sm:text-[2rem] text-ink leading-[1.15] tracking-tight">
          {title}
        </h1>
        {status}
      </div>
      {description && (
        <p className="text-ink-3 font-montserrat text-sm sm:text-[0.95rem] max-w-2xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}

export function ContextPill({ letter, label }: { letter: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/90 border border-line px-2.5 py-1 text-sm font-montserrat text-ink-2 shadow-sm">
      <span
        className="w-6 h-6 rounded-full bg-fgx-orange text-white text-xs font-bold flex items-center justify-center shadow-sm"
        aria-hidden
      >
        {letter}
      </span>
      {label}
    </span>
  )
}

export function FilterBar({
  items,
  value,
  onChange,
  allLabel = 'Todos',
}: {
  items: { id: string; label: string; count?: number }[]
  value: string
  onChange: (id: string) => void
  allLabel?: string
}) {
  const total = items.reduce((s, i) => s + (i.count || 0), 0)
  return (
    <div className="flex flex-wrap gap-2 mb-7" role="tablist" aria-label="Filtros">
      <button
        type="button"
        role="tab"
        aria-selected={!value}
        className={`filter-chip ${!value ? 'is-active' : ''}`}
        onClick={() => onChange('')}
      >
        {allLabel}
        <span className="count">{total}</span>
      </button>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          className={`filter-chip ${value === item.id ? 'is-active' : ''}`}
          onClick={() => onChange(value === item.id ? '' : item.id)}
        >
          {item.label}
          {typeof item.count === 'number' && <span className="count">{item.count}</span>}
        </button>
      ))}
    </div>
  )
}

function DocIcon() {
  return (
    <svg className="w-9 h-9 text-fgx-red/85" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.4}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
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
  busy,
  stagger = 0,
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
  busy?: 'open' | 'download' | null
  stagger?: number
}) {
  const staggerClass = stagger > 0 ? `stagger-${Math.min(stagger, 8)}` : ''
  return (
    <article className={`card card-interactive flex flex-col h-full animate-fade-up ${staggerClass}`}>
      <div className="card-preview relative h-[9.5rem] flex flex-col items-center justify-center px-4">
        <span className="absolute top-3 left-3 bg-ink text-white text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md">
          {badge}
        </span>
        <DocIcon />
        <p className="mt-1.5 font-titillium font-black text-[2rem] text-fgx-red leading-none tabular-nums">{stage}</p>
        <p className="mt-1.5 text-[10px] font-montserrat font-semibold tracking-[0.14em] text-fgx-red/80 uppercase text-center px-2">
          {stageLabel}
        </p>
      </div>
      <div className="p-5 flex flex-col flex-1 gap-2.5">
        <StatusPill status={status} prefix={statusPrefix} />
        <h3 className="font-titillium font-bold text-[1.05rem] text-ink leading-snug">{title}</h3>
        {description ? (
          <p className="text-[0.8125rem] text-ink-3 font-montserrat leading-relaxed line-clamp-3">{description}</p>
        ) : (
          <p className="text-[0.8125rem] text-ink-3/50 font-montserrat italic">Sem descrição</p>
        )}
        <p className="text-[0.7rem] text-ink-3 font-montserrat mt-auto pt-1">{meta}</p>
        <div className="btn-row pt-1">
          <button type="button" className="btn-primary" onClick={onOpen} disabled={!!busy}>
            {busy === 'open' ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <EyeIcon />
            )}
            Abrir
          </button>
          <button type="button" className="btn-secondary" onClick={onDownload} disabled={!!busy}>
            {busy === 'download' ? (
              <span className="w-3.5 h-3.5 border-2 border-ink-3 border-t-transparent rounded-full animate-spin" />
            ) : null}
            Baixar
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
  stagger = 0,
}: {
  to: string
  index: number
  formatLabel: string
  theme: string
  channel?: string
  area?: string
  status: string
  commentCount?: number
  stagger?: number
}) {
  const staggerClass = stagger > 0 ? `stagger-${Math.min(stagger, 8)}` : ''
  return (
    <Link
      to={to}
      className={`card card-interactive flex flex-col h-full animate-fade-up ${staggerClass} group no-underline`}
    >
      <div className="card-preview relative h-[8.75rem] flex flex-col items-center justify-center px-4">
        <span className="absolute top-3 left-3 bg-ink text-white text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md">
          {formatLabel.slice(0, 10).toUpperCase()}
        </span>
        <DocIcon />
        <p className="mt-1.5 font-titillium font-black text-[2rem] text-fgx-red leading-none tabular-nums">{index}</p>
        <p className="mt-1.5 text-[10px] font-montserrat font-semibold tracking-[0.14em] text-fgx-red/80 uppercase text-center">
          {formatLabel}
        </p>
      </div>
      <div className="p-5 flex flex-col flex-1 gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={status} prefix={`Peça ${index}`} />
          {commentCount && commentCount > 0 ? (
            <span className="text-xs text-fgx-blue font-semibold font-montserrat">
              {commentCount} coment.
            </span>
          ) : null}
        </div>
        <h3 className="font-titillium font-bold text-[1.05rem] text-ink leading-snug group-hover:text-fgx-red transition-colors">
          {theme}
        </h3>
        <p className="text-[0.8125rem] text-ink-3 font-montserrat">
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
        <div className="w-8 h-8 border-2 border-fgx-red border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-ink-3 font-montserrat text-sm">{message}</p>
      </div>
    </div>
  )
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card p-10 text-center overflow-visible">
      <p className="text-fgx-red font-montserrat font-medium mb-4">{message}</p>
      {onRetry && (
        <button type="button" className="btn-primary" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-line/80 rounded-lg ${className}`} />
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
    <div className="text-center py-16 px-6 card overflow-visible">
      {icon && <div className="text-4xl mb-3 opacity-80">{icon}</div>}
      <h3 className="font-titillium font-semibold text-lg text-ink-2 mb-2">{title}</h3>
      {description && <p className="text-ink-3 text-sm font-montserrat max-w-md mx-auto leading-relaxed">{description}</p>}
    </div>
  )
}

export function DemoCredBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-fgx-beige-light/80 px-4 py-3.5 mb-6 font-montserrat text-sm shadow-sm">
      {children}
    </div>
  )
}
