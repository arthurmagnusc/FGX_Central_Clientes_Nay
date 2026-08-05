import { Link, useParams } from 'react-router-dom'
import { ClientShell } from '../components/ClientShell'
import { ESCOPO, EXTRAS, ENTREGAVEIS_DEMO, RELATORIOS_DEMO } from '../data/fiedra-demo'

function Icon({ d, sz = 18 }: { d: string; sz?: number }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
  )
}

export default function ClienteVisao() {
  const { slug } = useParams<{ slug: string }>()
  const totalEnt = ENTREGAVEIS_DEMO.reduce((a, g) => a + g.itens.length, 0)
  const base = `/c/${slug}`

  return (
    <ClientShell>
      <div className="hero">
        <div className="hero-l">
          <div className="eyebrow">
            <Icon d='<path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>' sz={15} />
            Contrato de recorrência 2026
          </div>
          <h1>
            Clareza para decidir.
            <br />
            Material para avançar.
          </h1>
          <p>
            Tudo o que foi contratado e tudo o que foi entregue, lado a lado — com os documentos do projeto, os
            relatórios do período e os conteúdos em validação em um só lugar.
          </p>
        </div>
        <div className="progress-card">
          <div className="ph">
            <span className="pl">Cumprimento do escopo</span>
            <span className="pv">100%</span>
          </div>
          <div className="track">
            <span style={{ width: '100%' }} />
          </div>
          <div className="pf">
            <span>
              <Icon d='<path d="M20 6L9 17l-5-5"/>' sz={14} /> 26 de 26 entregas com meta
            </span>
            <span>
              <Icon d='<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' sz={14} /> até 23/07
            </span>
          </div>
        </div>
      </div>

      <div className="statrow">
        <div className="s">
          <div className="ic">
            <Icon d='<path d="M4 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2z"/>' />
          </div>
          <div>
            <div className="sv">{totalEnt}</div>
            <div className="sl">Entregas disponíveis</div>
          </div>
          <Link className="link" to={`${base}/entregas`}>
            Abrir <span>→</span>
          </Link>
        </div>
        <div className="s">
          <div className="ic">
            <Icon d='<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>' />
          </div>
          <div>
            <div className="sv">{RELATORIOS_DEMO.length}</div>
            <div className="sl">Relatórios</div>
          </div>
          <Link className="link" to={`${base}/relatorios`}>
            Abrir <span>→</span>
          </Link>
        </div>
        <div className="s">
          <div className="ic">
            <Icon d='<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/>' />
          </div>
          <div>
            <div className="sv">Ciclo</div>
            <div className="sl">Painel de conteúdos</div>
          </div>
          <Link className="link" to={`${base}/conteudos`}>
            Validar <span>→</span>
          </Link>
        </div>
      </div>

      <div className="sechead">
        <div className="secnum">01</div>
        <div>
          <h2>Cumprimento de escopo</h2>
          <div className="ss">Metas contratuais do período operacional (07/05–23/07/2026).</div>
        </div>
      </div>

      <div className="scope">
        {ESCOPO.map((row) => (
          <div className="scope-row" key={row.nm}>
            <div className="nm">
              <b>{row.nm}</b>
              <span>{row.meta}</span>
            </div>
            <div className="bars">
              <div className="tk">
                <span style={{ width: `${Math.min(row.pct, 100)}%`, background: row.cor }} />
              </div>
            </div>
            <div className="num" style={{ color: row.cor }}>
              {row.real}/{row.prev}
            </div>
            <div className="st" style={{ color: row.cor }}>
              {row.st}
            </div>
          </div>
        ))}
      </div>

      <div className="extra">
        {EXTRAS.map((e) => (
          <div className="e" key={e.t}>
            <div className="ev">{e.v}</div>
            <div className="et">{e.t}</div>
          </div>
        ))}
      </div>

      <div className="note">
        Fonte: Relatório de Escopo Fiedra e Síntese Editorial — dados de demonstração validados com o escritório.
      </div>
    </ClientShell>
  )
}
