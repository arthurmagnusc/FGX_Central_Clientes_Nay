export function StatusPill({ status }: { status: string }) {
  const cls = `pill pill-status-${status}`
  const labels: Record<string, string> = {
    pendente: 'Pendente', em_revisao: 'Em revisão', ajustada: 'Ajustada', aprovada: 'Aprovada',
    em_producao: 'Em produção', em_validacao: 'Em validação', aprovado: 'Aprovado',
    rascunho: 'Rascunho', publicado: 'Publicado', encerrado: 'Encerrado',
    solicitou_ajuste: 'Sol. ajuste',
  }
  return <span className={cls}>{labels[status] || status}</span>
}

export function Logo() {
  return <div className="fgx-logo">FGX</div>
}

export function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className="fgx-gradient-header px-6 py-3 flex items-center justify-between text-white">
      <div className="flex items-center gap-3">
        <Logo />
        <span className="font-titillium font-semibold text-lg">Portal do Cliente</span>
      </div>
      <div className="flex items-center gap-4">{children}</div>
    </header>
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
      {onRetry && <button className="btn-primary" onClick={onRetry}>Tentar novamente</button>}
    </div>
  )
}
