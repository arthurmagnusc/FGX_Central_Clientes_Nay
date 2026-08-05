function formatBuildStamp(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function getBuildMeta() {
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'
  const buildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : ''
  const commit = typeof __GIT_COMMIT__ !== 'undefined' ? __GIT_COMMIT__ : ''
  const when = buildTime ? formatBuildStamp(buildTime) : '—'
  return { version, buildTime, commit, when }
}

/** Versão + data/hora do build — exibida sob a logo no cabeçalho. */
export function BuildStamp({ className = '' }: { className?: string }) {
  const { version, buildTime, commit, when } = getBuildMeta()
  const label = commit ? `v${version} · ${when} · ${commit}` : `v${version} · ${when}`

  return (
    <p
      className={`build-stamp-inline ${className}`.trim()}
      title={`Versão em produção\nBuild: ${buildTime || 'n/d'}${commit ? `\nCommit: ${commit}` : ''}`}
      aria-label={`Versão ${version}, build em ${when}`}
    >
      {label}
    </p>
  )
}
