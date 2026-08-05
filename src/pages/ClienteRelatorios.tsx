import { ClientShell } from '../components/ClientShell'
import { RELATORIOS_DEMO } from '../data/fiedra-demo'

export default function ClienteRelatorios() {
  return (
    <ClientShell counts={{ relatorios: RELATORIOS_DEMO.length }}>
      <div className="sechead">
        <div className="secnum">03</div>
        <div>
          <h2>Relatórios</h2>
          <div className="ss">Sínteses periódicas de escopo, desempenho e próximos passos.</div>
        </div>
      </div>

      {RELATORIOS_DEMO.map((r) => (
        <article className="rep" key={r.t}>
          <div className="rep-h">
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <h3>{r.t}</h3>
                {r.novo && <span className="mini novo">Novo</span>}
              </div>
              <div className="per">{r.per}</div>
              <p style={{ marginTop: 12, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6, maxWidth: 720 }}>{r.res}</p>
            </div>
          </div>
          <div className="rep-kpis">
            {r.kpis.map((k) => (
              <div className="k" key={k.l}>
                <div className="kv">{k.v}</div>
                <div className="kl">{k.l}</div>
              </div>
            ))}
          </div>
          <div className="rep-f">
            {r.secoes.map((s) => (
              <span key={s} className="tag n">
                {s}
              </span>
            ))}
            <button type="button" className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}>
              Abrir relatório
            </button>
          </div>
        </article>
      ))}
    </ClientShell>
  )
}
