import { useMemo, useState } from 'react'
import { ClientShell } from '../components/ClientShell'
import { ENTREGAVEIS_DEMO, type DemoEntrega } from '../data/fiedra-demo'

const MINI_LABEL: Record<string, string> = {
  final: 'Final',
  novo: 'Novo',
  rev: 'Em revisão',
  val: 'Em validação',
}

export default function ClienteEntregas() {
  const [filtro, setFiltro] = useState('Todos')
  const [q, setQ] = useState('')

  const cats = useMemo(() => {
    const all = ENTREGAVEIS_DEMO.map((g) => ({
      id: g.cat,
      label: g.cat,
      count: g.itens.length,
    }))
    return [{ id: 'Todos', label: 'Todos', count: all.reduce((a, c) => a + c.count, 0) }, ...all]
  }, [])

  const itens = useMemo(() => {
    const flat: (DemoEntrega & { cat: string })[] = []
    ENTREGAVEIS_DEMO.forEach((g) => {
      g.itens.forEach((it) => flat.push({ ...it, cat: g.cat }))
    })
    return flat.filter((it) => {
      if (filtro !== 'Todos' && it.cat !== filtro) return false
      if (q.trim()) {
        const s = q.toLowerCase()
        return it.t.toLowerCase().includes(s) || it.d.toLowerCase().includes(s)
      }
      return true
    })
  }, [filtro, q])

  return (
    <ClientShell counts={{ entregas: ENTREGAVEIS_DEMO.reduce((a, g) => a + g.itens.length, 0) }}>
      <div className="sechead">
        <div className="secnum">02</div>
        <div>
          <h2>Entregas do projeto</h2>
          <div className="ss">Documentos mais recentes e materiais consolidados.</div>
        </div>
        <div className="tools">
          <div className="search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3-3" />
            </svg>
            <input
              placeholder="Buscar entrega…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Buscar"
            />
          </div>
        </div>
      </div>

      <div className="chips">
        {cats.map((c) => (
          <button
            key={c.id}
            type="button"
            className={filtro === c.id ? 'on' : ''}
            onClick={() => setFiltro(c.id)}
          >
            {c.label}
            <span className="c">{c.count}</span>
          </button>
        ))}
      </div>

      <div className="grid">
        {itens.map((it) => (
          <article key={it.t} className={`card ${it.hl ? 'hl' : ''}`}>
            {it.hl && <div className="ribbon">Entrega principal</div>}
            <div className="card-top">
              <div className={`ftype ${it.arq}`}>{it.arq.toUpperCase()}</div>
              <div style={{ minWidth: 0 }}>
                <div className="card-cat">{it.cat}</div>
                <h3>{it.t}</h3>
              </div>
            </div>
            <p className="desc">{it.d}</p>
            <div className="card-foot">
              <span className={`mini ${it.mini}`}>{MINI_LABEL[it.mini] || it.mini}</span>
              <span>v{it.v}</span>
              <span>{it.dt}</span>
              <span style={{ marginLeft: 'auto' }}>{it.kb}</span>
            </div>
            {it.hist.length > 0 && (
              <details className="versions">
                <summary>Versões anteriores ({it.hist.length})</summary>
                <ul>
                  {it.hist.map((h) => (
                    <li key={h.v}>
                      <span>v{h.v}</span>
                      <span>{h.dt}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button type="button" className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                Abrir
              </button>
              <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1 }}>
                Baixar
              </button>
            </div>
          </article>
        ))}
      </div>

      {itens.length === 0 && (
        <p style={{ color: 'var(--ink-3)', marginTop: 24, textAlign: 'center' }}>Nenhuma entrega neste filtro.</p>
      )}
    </ClientShell>
  )
}
