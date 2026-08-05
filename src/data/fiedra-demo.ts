/** Dados de demonstração validados no protótipo portal-fgx-v2.html (Fiedra). */

export const ESCOPO = [
  { nm: 'Posts em redes sociais', meta: 'meta 8/mês', prev: 22, real: 23, pct: 104, st: 'meta superada', cor: '#527F3E' },
  { nm: 'Newsletter / e-mail marketing', meta: 'meta 1/mês', prev: 2, real: 2, pct: 100, st: 'meta cumprida', cor: '#527F3E' },
  { nm: 'Blog / Área de Publicações', meta: 'meta 1/mês', prev: 2, real: 2, pct: 100, st: 'meta cumprida', cor: '#527F3E' },
]

export const EXTRAS = [
  { v: '+1', t: 'Reestruturação de perfil — capa e bio (LinkedIn e Instagram), destaques, linktree e 3 posts institucionais fixados' },
  { v: '+2', t: 'Apresentação institucional e modelo de proposta comercial revisados e entregues' },
  { v: '+2', t: 'Atualização de informações no site e base de governança' },
  { v: '+1', t: 'Endomarketing — card de comunicação interna' },
]

export type DemoEntrega = {
  t: string
  d: string
  v: number
  dt: string
  arq: string
  kb: string
  mini: string
  hl?: boolean
  hist: { v: number; dt: string }[]
}

export const ENTREGAVEIS_DEMO: { cat: string; itens: DemoEntrega[] }[] = [
  {
    cat: 'Estratégia',
    itens: [
      { t: 'Diagnóstico de Comunicação e Posicionamento', d: 'Leitura consolidada da presença atual, mapeamento de concorrentes por patamar e identificação dos territórios próprios, disputados e abertos.', v: 2, dt: '12/03/2026', arq: 'pdf', kb: '4,8 MB', mini: 'final', hl: true, hist: [{ v: 1, dt: '04/02/2026' }] },
      { t: 'Síntese Editorial — Camada 1', d: 'Consolidação dos oito blocos de identidade, negócio, audiência, linguagem, arquitetura editorial e travas de governança.', v: 3, dt: '11/05/2026', arq: 'docx', kb: '1,8 MB', mini: 'final', hist: [{ v: 2, dt: '28/04/2026' }, { v: 1, dt: '15/04/2026' }] },
      { t: 'Plano de Comunicação 2026', d: 'Pilares editoriais, editorias, volumetria contratada, hierarquia de canais e modelo de progressão trimestral.', v: 1, dt: '20/03/2026', arq: 'pdf', kb: '6,7 MB', mini: 'final', hist: [] },
    ],
  },
  {
    cat: 'Conteúdo',
    itens: [
      { t: 'Apresentação institucional — revisão', d: 'Revisão e adaptação da apresentação institucional geral, de documento denso a narrativa visual.', v: 2, dt: '03/07/2026', arq: 'pptx', kb: '22,4 MB', mini: 'rev', hist: [{ v: 1, dt: '08/05/2026' }] },
      { t: 'Modelo de proposta comercial — revisão', d: 'Revisão do modelo de proposta, de carta em texto corrido a peça de apresentação.', v: 1, dt: '03/07/2026', arq: 'pptx', kb: '9,1 MB', mini: 'novo', hist: [] },
      { t: 'Calendário editorial estruturado', d: 'Calendário do ciclo com temas, canais, formatos e responsáveis, cruzado com o fluxo de aprovação.', v: 4, dt: '01/07/2026', arq: 'xlsx', kb: '892 KB', mini: 'rev', hist: [{ v: 3, dt: '01/06/2026' }, { v: 2, dt: '02/05/2026' }] },
    ],
  },
  {
    cat: 'Operação',
    itens: [
      { t: 'Diretriz de comunicação e tom de voz', d: 'Tom de voz, o que dizer e o que não dizer, regras de menção a clientes e fluxo de aprovação interna.', v: 1, dt: '06/05/2026', arq: 'pdf', kb: '1,1 MB', mini: 'final', hist: [] },
      { t: 'Documento de governança — escopo e SLA', d: 'Escopo contratado, prazos de aprovação, responsabilidades de cada lado e critérios de contagem de entrega.', v: 1, dt: '06/05/2026', arq: 'pdf', kb: '780 KB', mini: 'final', hist: [] },
      { t: 'Política de uso de casos e anonimização', d: 'Critérios para citar atuação sem expor cliente, com árvore de decisão para casos ativos e encerrados.', v: 1, dt: '25/02/2026', arq: 'pdf', kb: '640 KB', mini: 'final', hist: [] },
    ],
  },
]

export const RELATORIOS_DEMO = [
  {
    t: 'Relatório de Escopo — Maio a Julho de 2026',
    per: 'Período de 07/05 a 23/07/2026 · emitido em 24/07/2026',
    novo: true,
    res: 'Onze semanas de operação com todas as metas contratuais cumpridas. A frente de posts fechou acima do previsto e a produção total superou o volume publicado, incluindo peças que aguardaram validação.',
    kpis: [
      { v: '100%', l: 'do volume com meta definida foi publicado' },
      { v: '23/22', l: 'posts de feed publicados sobre previstos' },
      { v: '31', l: 'peças produzidas no período' },
      { v: '2', l: 'materiais estruturais entregues' },
    ],
    secoes: ['Resumo executivo', 'Cumprimento de escopo', 'Destaque do período', 'Desempenho e audiência', 'Eventos e reconhecimentos', 'Próximos passos'],
  },
  {
    t: 'Relatório de Escopo — Março a Abril de 2026',
    per: 'Período de 01/03 a 30/04/2026 · emitido em 05/05/2026',
    novo: false,
    res: 'Ciclo de estruturação: diagnóstico, síntese editorial e plano de comunicação entregues antes da ativação da operação de conteúdo, iniciada em 07/05.',
    kpis: [
      { v: '3', l: 'entregas estratégicas finalizadas' },
      { v: '100%', l: 'do escopo de imersão concluído' },
      { v: '2', l: 'meses de preparação' },
      { v: '1', l: 'plano 2026 aprovado' },
    ],
    secoes: ['Resumo executivo', 'Entregas da imersão', 'Próximos passos'],
  },
]

export const CLIENT_OFFICE = 'Fiedra · Britto & Ferreira Neto'
export const CLIENT_SHORT = 'Fiedra'
