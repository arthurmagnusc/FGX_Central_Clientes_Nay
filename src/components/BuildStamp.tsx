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

/** Versão e data/hora do build que está no ar (injetadas no Vite no momento do deploy). */
export function BuildStamp() {
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'
  const buildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : ''
  const commit = typeof __GIT_COMMIT__ !== 'undefined' ? __GIT_COMMIT__ : ''
  const when = buildTime ? formatBuildStamp(buildTime) : '—'

  const label = commit
    ? `v${version} · ${when} · ${commit}`
    : `v${version} · ${when}`

  return (
    <div
      className="build-stamp"
      title={`Versão em produção\nBuild: ${buildTime || 'n/d'}${commit ? `\nCommit: ${commit}` : ''}`}
      aria-label={`Versão ${version}, build em ${when}`}
    >
      {label}
    </div>
  )
}
