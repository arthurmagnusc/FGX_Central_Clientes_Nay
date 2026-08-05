import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import { ClientChrome, ErrorMessage, Skeleton, StatusPill, PageIntro, ContextPill } from '../components/Shared'
import { FORMAT_LABELS, formatDateTime } from '../lib/utils'
import type { Piece, Comment, Adjustment } from '../types'
import DOMPurify from 'dompurify'
import { marked } from 'marked'

function renderMarkdown(text: string): string {
  const raw = marked.parse(text, { async: false }) as string
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: ['p','br','strong','em','ul','ol','li','h1','h2','h3','h4','h5','h6','a','blockquote','code','pre','table','thead','tbody','tr','th','td','hr','span'],
    ALLOWED_ATTR: ['href','target','rel'],
  })
}

function blockLabel(formato: string, idx: number) {
  switch (formato) {
    case 'carrossel': return `Slide ${idx + 1}`
    case 'roteiro_video': return `Cena ${idx + 1}`
    default: return `Trecho ${idx + 1}`
  }
}

function CharCounter({ current, limit }: { current: number; limit: number }) {
  const pct = Math.min((current / limit) * 100, 100)
  const state = pct > 100 ? 'over' : pct > 90 ? 'warn' : 'ok'
  const colors = { ok: 'text-ink-3', warn: 'text-fgx-gold', over: 'text-fgx-red font-semibold' }
  return (
    <div className="flex items-center gap-2 text-xs font-montserrat">
      <span className={colors[state]}>{current} / {limit} caracteres</span>
      {state === 'over' && <span className="text-fgx-red">(acima do limite)</span>}
      <div className="w-16 h-1.5 bg-fgx-gray rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${pct > 100 ? 'bg-fgx-red' : pct > 90 ? 'bg-fgx-gold' : 'bg-fgx-green'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  )
}

// Format-specific content renderers
function CarrosselView({ contents, pieceId }: { contents: any[]; pieceId: string }) {
  return (
    <div className="space-y-6">
      {contents.map((bloco, idx) => (
        <div key={bloco.id} className="border-l-3 border-fgx-red/20 pl-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-fgx-red font-titillium">
              {bloco.titulo_bloco || `Slide ${idx + 1} de ${contents.length}`}
            </span>
            <span className="text-xs text-ink-3 font-montserrat">{bloco.conteudo.length} chars</span>
          </div>
          <div className="prose prose-sm max-w-none text-ink font-montserrat leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(bloco.conteudo) }} />
        </div>
      ))}
    </div>
  )
}

function ArtigoView({ contents }: { contents: any[] }) {
  return (
    <div className="prose prose-base max-w-none text-ink font-montserrat leading-relaxed space-y-6">
      {contents.map(bloco => (
        <div key={bloco.id} dangerouslySetInnerHTML={{ __html: renderMarkdown(bloco.conteudo) }} />
      ))}
    </div>
  )
}

function AnaliseTecnicaView({ contents }: { contents: any[] }) {
  const fullText = contents.map(c => c.conteudo).join('\n\n')
  const teseMatch = fullText.match(/##\s*Tese Central[^#]+/s)
  const refsMatch = fullText.match(/##\s*Referências[^#]+$/s)
  const tese = teseMatch ? teseMatch[0] : ''
  const bodyWithoutRefs = teseMatch && refsMatch
    ? fullText.replace(tese, '').replace(refsMatch[0], '')
    : fullText.replace(/##\s*Referências[^#]+$/s, '')
  const refs = refsMatch ? refsMatch[0] : ''

  return (
    <div className="space-y-6">
      {tese && (
        <div className="bg-fgx-red/5 border-l-3 border-fgx-red rounded-r-lg p-4">
          <div className="prose prose-sm max-w-none text-ink font-montserrat leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(tese) }} />
        </div>
      )}
      <div className="prose prose-base max-w-none text-ink font-montserrat leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(bodyWithoutRefs) }} />
      {refs && (
        <div className="bg-fgx-gray/50 border border-line rounded-lg p-4">
          <div className="prose prose-sm max-w-none text-ink-2 font-montserrat"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(refs) }} />
        </div>
      )}
    </div>
  )
}

function TextoEmailView({ contents }: { contents: any[] }) {
  const assunto = contents.find(c => c.titulo_bloco?.toLowerCase() === 'assunto')
  const preheader = contents.find(c => c.titulo_bloco?.toLowerCase().includes('pré-cabeçalho') || c.titulo_bloco?.toLowerCase().includes('preheader'))
  const corpo = contents.filter(c => c !== assunto && c !== preheader)
  return (
    <div className="space-y-4">
      {assunto && (
        <div>
          <p className="text-xs text-ink-3 font-montserrat uppercase tracking-wide mb-1">Assunto</p>
          <p className="text-lg font-semibold text-ink font-titillium border-b border-line pb-2">{assunto.conteudo}</p>
        </div>
      )}
      {preheader && (
        <div>
          <p className="text-xs text-ink-3 font-montserrat uppercase tracking-wide mb-1">Pré-cabeçalho</p>
          <p className="text-sm text-ink-3 italic font-montserrat">{preheader.conteudo}</p>
        </div>
      )}
      <div className="prose prose-base max-w-none text-ink font-montserrat leading-relaxed">
        {corpo.map(bloco => (
          <div key={bloco.id} dangerouslySetInnerHTML={{ __html: renderMarkdown(bloco.conteudo) }} />
        ))}
      </div>
    </div>
  )
}

function RoteiroVideoView({ contents }: { contents: any[] }) {
  return (
    <div className="space-y-5">
      {contents.map((bloco, idx) => (
        <div key={bloco.id} className="flex gap-4 group">
          <div className="shrink-0 w-8 h-8 rounded-full bg-fgx-red/10 flex items-center justify-center mt-0.5">
            <span className="text-xs font-bold text-fgx-red font-montserrat">{idx + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-fgx-red font-titillium uppercase tracking-wide mb-1">
              {bloco.titulo_bloco || `Cena ${idx + 1} de ${contents.length}`}
            </p>
            <div className="prose prose-sm max-w-none text-ink font-montserrat leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(bloco.conteudo) }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function CollapsibleSection({ title, count, defaultOpen, children }: { title: string; count?: number; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen || false)
  return (
    <div className="border border-line rounded-lg bg-white">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 text-left font-titillium font-semibold text-ink hover:bg-fgx-gray/30 transition-colors">
        <span>{title}{count !== undefined ? ` (${count})` : ''}</span>
        <span className="text-sm text-ink-3 transition-transform duration-200" style={{ transform: open ? 'rotate(90deg)' : '' }}>▸</span>
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  )
}

export default function ClientePeca() {
  const { slug, cycleId, pieceId } = useParams<{ slug: string; cycleId: string; pieceId: string }>()
  const { pessoaNome } = useAuth()
  const navigate = useNavigate()
  const [piece, setPiece] = useState<Piece | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [comentarioTexto, setComentarioTexto] = useState('')
  const [comentarioBlocoId, setComentarioBlocoId] = useState<string | null>(null)
  const [comentarioTrecho, setComentarioTrecho] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [commentFailText, setCommentFailText] = useState('')
  const [submittingApproval, setSubmittingApproval] = useState(false)
  const [showConfirmApprove, setShowConfirmApprove] = useState(false)
  const [showConfirmAdjust, setShowConfirmAdjust] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [activeCommentBlock, setActiveCommentBlock] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    api.getClientPiece(pieceId!)
      .then(p => setPiece(p))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [pieceId])

  const toast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg); setToastType(type)
    setTimeout(() => setToastMsg(''), 4000)
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comentarioTexto.trim()) return
    const savedText = comentarioTexto
    setSubmittingComment(true)
    setCommentFailText('')
    try {
      await api.createComment(pieceId!, {
        texto: savedText,
        piece_content_id: activeCommentBlock || null,
        trecho: comentarioTrecho || null,
      })
      toast('Comentário salvo!')
      setComentarioTexto('')
      setComentarioTrecho('')
      setActiveCommentBlock(null)
      setComentarioBlocoId(null)
      load()
    } catch (e: any) {
      setCommentFailText(savedText)
      toast('Falha ao salvar. O texto foi mantido — tente novamente.', 'error')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleRetryComment = () => {
    setComentarioTexto(commentFailText)
    setCommentFailText('')
  }

  const handleApproval = async (tipo: 'aprovou' | 'solicitou_ajuste') => {
    setShowConfirmApprove(false)
    setShowConfirmAdjust(false)
    setSubmittingApproval(true)
    try {
      await api.createApproval(pieceId!, tipo)
      toast(tipo === 'aprovou' ? 'Peça aprovada!' : 'Ajuste solicitado!')
      load()
    } catch (e: any) {
      toast(e.message || 'Erro', 'error')
    } finally {
      setSubmittingApproval(false)
    }
  }

  const channelLimit = piece?.limite_caracteres_override || piece?.channel?.limite_caracteres_padrao || 2200
  const totalChars = piece?.contents?.reduce((sum: number, c: any) => sum + c.conteudo.length, 0) || 0
  const lastApproval = piece?.approvals?.[piece.approvals.length - 1]
  const isApproved = piece?.status === 'aprovada'
  const comments = piece?.comments || []
  const adjustments = (piece as any)?.adjustments || []

  const navPieces = piece?.nearbyPieces || []
  const currentIdx = navPieces.findIndex((p: any) => p.id === pieceId)
  const hasPrev = currentIdx > 0
  const hasNext = currentIdx < navPieces.length - 1

  const navTo = (delta: number) => {
    if (currentIdx < 0) return
    const target = navPieces[currentIdx + delta]
    if (target) navigate(`/c/${slug}/ciclo/${cycleId}/peca/${target.id}`)
  }

  const blockComments = (contentId: string) => comments.filter(c => c.piece_content_id === contentId)
  const generalComments = comments.filter(c => !c.piece_content_id)

  if (loading) return (
    <ClientChrome active="peca">
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </ClientChrome>
  )
  if (error) return <ClientChrome active="peca"><ErrorMessage message={error} onRetry={load} /></ClientChrome>
  if (!piece) return <ClientChrome active="peca"><ErrorMessage message="Peça não encontrada" /></ClientChrome>

  const FormatRenderer = {
    carrossel: CarrosselView,
    artigo: ArtigoView,
    analise_tecnica: AnaliseTecnicaView,
    texto_email: TextoEmailView,
    roteiro_video: RoteiroVideoView,
  }[piece.formato] || ArtigoView

  const contents = piece.contents || []
  const initial = (pessoaNome || slug || 'C').charAt(0).toUpperCase()

  return (
    <ClientChrome active="peca">
      {toastMsg && (
        <div className={`toast ${toastType === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toastMsg}
          {toastType === 'error' && commentFailText && (
            <button type="button" className="ml-2 underline font-bold" onClick={handleRetryComment}>Tentar novamente</button>
          )}
        </div>
      )}

      <div className="page-shell max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <button type="button" className="btn-secondary text-sm px-4" onClick={() => navTo(-1)} disabled={!hasPrev}>
            &larr; Anterior
          </button>
          <Link to={`/c/${slug}/ciclo`} className="fgx-nav-link text-sm">Voltar ao ciclo</Link>
          <button type="button" className="btn-secondary text-sm px-4" onClick={() => navTo(1)} disabled={!hasNext}>
            Próxima &rarr;
          </button>
        </div>

        <PageIntro
          eyebrow={
            <ContextPill
              letter={initial}
              label={`${FORMAT_LABELS[piece.formato]} · ${piece.channel?.nome || ''} · ${piece.area_direito || ''}`}
            />
          }
          title={piece.tema}
          status={<StatusPill status={piece.status} />}
          description={undefined}
        />
        <div className="mb-8 -mt-4">
          <CharCounter current={totalChars} limit={channelLimit} />
        </div>

        {/* Content area — format-specific */}
        <div className="card p-6 md:p-8 mb-8 overflow-visible">
          <FormatRenderer contents={contents} pieceId={piece.id} />
        </div>

        {/* Approval section */}
        <div className="card p-6 mb-6">
          {isApproved && lastApproval ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-fgx-green/10 flex items-center justify-center">
                <span className="text-fgx-green font-bold">✓</span>
              </div>
              <div>
                <p className="font-montserrat font-semibold text-fgx-green">Peça aprovada</p>
                <p className="text-sm text-ink-3">por {lastApproval.autor_nome} em {formatDateTime(lastApproval.created_at)}</p>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-titillium font-semibold text-lg text-ink mb-4">Validação da peça</h3>
              <div className="flex flex-wrap gap-3">
                <button className="btn-primary" onClick={() => setShowConfirmApprove(true)} disabled={submittingApproval}>
                  Aprovar peça
                </button>
                <button className="btn-secondary" onClick={() => setShowConfirmAdjust(true)} disabled={submittingApproval}>
                  Solicitar ajuste
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Confirm dialogs */}
        {showConfirmApprove && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
              <p className="font-montserrat text-ink mb-4">Confirmar aprovação de <strong>{piece.tema}</strong>?</p>
              <div className="flex gap-3 justify-end">
                <button className="btn-secondary" onClick={() => setShowConfirmApprove(false)}>Cancelar</button>
                <button className="btn-primary" onClick={() => handleApproval('aprovou')}>Confirmar</button>
              </div>
            </div>
          </div>
        )}
        {showConfirmAdjust && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
              <p className="font-montserrat text-ink mb-4">Solicitar ajuste em <strong>{piece.tema}</strong>?</p>
              <div className="flex gap-3 justify-end">
                <button className="btn-secondary" onClick={() => setShowConfirmAdjust(false)}>Cancelar</button>
                <button className="btn-primary" onClick={() => handleApproval('solicitou_ajuste')}>Confirmar</button>
              </div>
            </div>
          </div>
        )}

        {/* Comments by block */}
        {contents.map((bloco, idx) => {
          const bComments = blockComments(bloco.id)
          return (
            <div key={bloco.id} className="card p-5 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-ink-2 font-titillium uppercase tracking-wide">
                  {bloco.titulo_bloco || `${blockLabel(piece.formato, idx)} de ${contents.length}`}
                </span>
                <button className="btn-ghost text-xs"
                  onClick={() => setActiveCommentBlock(activeCommentBlock === bloco.id ? null : bloco.id)}>
                  {activeCommentBlock === bloco.id ? 'Fechar' : `Comentar neste ${blockLabel(piece.formato, idx).toLowerCase()}`}
                </button>
              </div>

              {bComments.length > 0 && (
                <div className="mb-3 space-y-2">
                  {bComments.map(c => (
                    <div key={c.id} className="bg-fgx-gray/50 rounded p-2.5 text-sm border-l-2 border-fgx-red/20">
                      <span className="font-semibold text-ink">{c.autor_nome}</span>
                      <span className="text-ink-3 text-xs ml-2">{formatDateTime(c.created_at)}</span>
                      {c.trecho && <p className="text-xs text-ink-2 italic mt-0.5">&ldquo;{c.trecho}&rdquo;</p>}
                      <p className="text-ink mt-1">{c.texto}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeCommentBlock === bloco.id && (
                <div className="mt-3 space-y-2">
                  <input className="input-field text-sm" placeholder="Trecho específico (opcional)"
                    value={comentarioTrecho} onChange={e => setComentarioTrecho(e.target.value)} />
                  <textarea className="input-field text-sm" rows={3}
                    value={comentarioTexto}
                    placeholder="Escreva seu comentário..."
                    onChange={e => setComentarioTexto(e.target.value)} />
                  <button className="btn-primary text-sm" onClick={handleComment}
                    disabled={!comentarioTexto.trim() || submittingComment}>
                    {submittingComment ? 'Salvando...' : 'Enviar'}
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {/* General comment */}
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-titillium font-semibold text-lg text-ink">Comentário geral</h3>
            <button className="btn-ghost text-xs"
              onClick={() => setActiveCommentBlock(activeCommentBlock === 'general' ? null : 'general')}>
              Escrever
            </button>
          </div>
          {generalComments.length > 0 && (
            <div className="mb-3 space-y-2">
              {generalComments.map(c => (
                <div key={c.id} className="bg-fgx-gray/50 rounded p-2.5 text-sm border-l-2 border-line">
                  <span className="font-semibold text-ink">{c.autor_nome}</span>
                  <span className="text-ink-3 text-xs ml-2">{formatDateTime(c.created_at)}</span>
                  <p className="text-ink mt-1">{c.texto}</p>
                </div>
              ))}
            </div>
          )}
          {activeCommentBlock === 'general' && (
            <div className="space-y-2">
              <textarea className="input-field text-sm" rows={3}
                value={comentarioTexto} placeholder="Seu comentário sobre a peça..."
                onChange={e => setComentarioTexto(e.target.value)} />
              <button className="btn-primary text-sm" onClick={handleComment}
                disabled={!comentarioTexto.trim() || submittingComment}>
                {submittingComment ? 'Salvando...' : 'Enviar'}
              </button>
            </div>
          )}
        </div>

        {/* History */}
        <div className="card p-5 mb-6">
          <h3 className="font-titillium font-semibold text-lg text-ink mb-4">Histórico</h3>
          {comments.length === 0 && (!piece.approvals || piece.approvals.length === 0) ? (
            <p className="text-ink-3 text-sm font-montserrat">Nenhuma atividade registrada.</p>
          ) : (
            <div className="space-y-3">
              {[...comments, ...(piece.approvals || []).map((a: any) => ({ ...a, _type: 'approval' }))]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((item, i) => (
                  <div key={item.id || i} className="flex gap-3 text-sm">
                    <div className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${item._type === 'approval' ? 'bg-fgx-green' : item.autor_tipo === 'editor' ? 'bg-fgx-blue' : 'bg-fgx-orange'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink">{item.autor_nome}</span>
                        <span className={`pill text-xs ${item._type === 'approval' ? 'pill-status-aprovada' : item.autor_tipo === 'editor' ? 'pill-status-em_revisao' : 'pill-status-pendente'}`}>
                          {item._type === 'approval' ? (item.tipo === 'aprovou' ? 'Aprovou' : 'Sol. ajuste') : item.autor_tipo}
                        </span>
                        <span className="text-xs text-ink-3">{formatDateTime(item.created_at)}</span>
                      </div>
                      {item.trecho && <p className="text-xs text-ink-2 italic">&ldquo;{item.trecho}&rdquo;</p>}
                      {item.texto && <p className="text-ink mt-0.5">{item.texto}</p>}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Adjustments section */}
        {adjustments.length > 0 && (
          <div className="card p-5 mb-6">
            <h3 className="font-titillium font-semibold text-lg text-ink mb-4">Ajustes ({adjustments.length})</h3>
            <div className="space-y-3">
              {adjustments.map((adj: Adjustment) => (
                <div key={adj.id} className="bg-fgx-gray/30 rounded p-3 border border-line">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`pill ${adj.tipo === 'estrutural' ? 'pill-status-ajustada' : 'pill-status-em_revisao'}`}>
                      <span className="pill-dot" aria-hidden />
                      {adj.tipo === 'estrutural' ? 'Estrutural' : 'Pontual'}
                    </span>
                    <StatusPill status={adj.status_avaliacao} />
                  </div>
                  <p className="text-sm text-ink">{adj.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trail, reasonings, sources */}
        {piece.trail && piece.trail.length > 0 && (
          <CollapsibleSection title="Trilha de produção" count={piece.trail.length}>
            <div className="space-y-2">
              {piece.trail.sort((a: any, b: any) => a.ordem - b.ordem).map((t: any) => (
                <div key={t.id} className="flex gap-3 text-sm">
                  <span className="font-bold text-fgx-red shrink-0">{t.ordem}.</span>
                  <div>
                    <p className="font-semibold text-ink">{t.etapa}</p>
                    {t.descricao && <p className="text-ink-3">{t.descricao}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}
        <div className="h-3" />
        {piece.reasonings && piece.reasonings.length > 0 && (
          <CollapsibleSection title="Raciocínios" count={piece.reasonings.length}>
            <div className="space-y-3">
              {piece.reasonings.sort((a: any, b: any) => a.ordem - b.ordem).map((r: any) => (
                <div key={r.id} className="bg-fgx-gray/50 rounded p-3">
                  <h4 className="font-semibold text-ink text-sm">{r.titulo}</h4>
                  <p className="text-sm text-ink-2 mt-1">{r.descricao}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}
        <div className="h-3" />
        {piece.sources && piece.sources.length > 0 && (
          <CollapsibleSection title="Fontes" count={piece.sources.length}>
            <div className="space-y-2">
              {piece.sources.sort((a: any, b: any) => a.ordem - b.ordem).map((s: any) => (
                <div key={s.id} className="flex gap-3 text-sm">
                  <span className="font-bold text-fgx-red shrink-0">{s.ordem}.</span>
                  <div>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-fgx-blue hover:underline">
                      {s.titulo}
                    </a>
                    {s.descricao && <p className="text-ink-3">{s.descricao}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </ClientChrome>
  )
}
