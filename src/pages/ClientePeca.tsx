import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import { Header, Loading, ErrorMessage } from '../components/Shared'
import { StatusPill, FORMAT_LABELS, formatDateTime } from '../lib/utils'
import type { Piece, Comment, Approval, PieceContent, ProductionTrail, PieceReasoning, Source } from '../types'
import DOMPurify from 'dompurify'
import { marked } from 'marked'

function renderMarkdown(text: string): string {
  const raw = marked.parse(text, { async: false }) as string
  return DOMPurify.sanitize(raw, { ALLOWED_TAGS: ['p','br','strong','em','ul','ol','li','h1','h2','h3','h4','h5','h6','a','blockquote','code','pre'], ALLOWED_ATTR: ['href','target'] })
}

export default function ClientePeca() {
  const { slug, cycleId, pieceId } = useParams<{ slug: string; cycleId: string; pieceId: string }>()
  const { pessoaNome, clientRename, logout } = useAuth()
  const navigate = useNavigate()
  const [piece, setPiece] = useState<Piece | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [comentarioTexto, setComentarioTexto] = useState('')
  const [comentarioBlocoId, setComentarioBlocoId] = useState<string | null>(null)
  const [comentarioTrecho, setComentarioTrecho] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [submittingApproval, setSubmittingApproval] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [showRename, setShowRename] = useState(false)
  const [newName, setNewName] = useState('')
  const [showTrail, setShowTrail] = useState(false)
  const [showReasoning, setShowReasoning] = useState(false)
  const [showSources, setShowSources] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.getClientPiece(pieceId!),
      api.getClientPiece(pieceId!).then(() => {}),
    ]).then(([p]) => {
      setPiece(p)
      setComments(p.comments || [])
    }).catch(e => setError(e.message)).finally(() => setLoading(false))
  }
  useEffect(load, [pieceId])

  const toast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg); setToastType(type)
    setTimeout(() => setToastMsg(''), 3500)
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comentarioTexto.trim()) return
    setSubmittingComment(true)
    try {
      const savedText = comentarioTexto
      await api.createComment(pieceId!, {
        texto: savedText,
        piece_content_id: comentarioBlocoId || null,
        trecho: comentarioTrecho || null,
      })
      toast('Comentário salvo com sucesso!')
      setComentarioTexto('')
      setComentarioTrecho('')
      setComentarioBlocoId(null)
      load()
    } catch (e: any) {
      toast(e.message || 'Erro ao salvar comentário', 'error')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleApproval = async (tipo: 'aprovou' | 'solicitou_ajuste') => {
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
  const totalChars = piece?.contents?.reduce((sum, c) => sum + c.conteudo.length, 0) || 0
  const lastApproval = piece?.approvals?.[piece.approvals.length - 1]
  const isApproved = piece?.status === 'aprovada'

  const allComments = [...(piece?.comments || []), ...comments].filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i)
  const blockComments = (contentId: string) => allComments.filter(c => c.piece_content_id === contentId)
  const generalComments = allComments.filter(c => !c.piece_content_id)

  const blockLabel = (formato: string, idx: number) => {
    switch (formato) {
      case 'carrossel': return `Slide ${idx + 1}`
      case 'roteiro_video': return `Cena ${idx + 1}`
      default: return `Trecho`
    }
  }

  const navTo = (delta: number) => {
    if (!piece || !cycleId) return
    const pieces = piece.nearbyPieces || []
    const idx = pieces.findIndex((p: any) => p.id === pieceId)
    if (idx >= 0) {
      const target = pieces[idx + delta]
      if (target) navigate(`/c/${slug}/ciclo/${cycleId}/peca/${target.id}`)
    }
  }

  const handleRename = async () => {
    if (!newName.trim()) return
    await clientRename(newName.trim())
    setShowRename(false)
  }

  if (loading) return <div className="min-h-screen bg-fgx-gray"><Header><span /></Header><Loading /></div>
  if (error) return <div className="min-h-screen bg-fgx-gray"><Header><span /></Header><ErrorMessage message={error} onRetry={load} /></div>
  if (!piece) return <div className="min-h-screen bg-fgx-gray"><Header><span /></Header><ErrorMessage message="Peça não encontrada" /></div>

  return (
    <div className="min-h-screen bg-fgx-gray">
      <Header>
        <span className="text-sm opacity-90 font-montserrat">Olá, {pessoaNome}</span>
        {!showRename ? (
          <button className="text-xs underline opacity-80 hover:opacity-100" onClick={() => { setShowRename(true); setNewName(pessoaNome || '') }}>Não sou eu</button>
        ) : (
          <div className="flex items-center gap-2">
            <input value={newName} onChange={e => setNewName(e.target.value)} className="input-field text-sm py-1 w-28 text-ink" />
            <button className="text-xs bg-white text-fgx-red px-2 py-1 rounded font-semibold" onClick={handleRename}>OK</button>
            <button className="text-xs underline" onClick={() => setShowRename(false)}>Cancelar</button>
          </div>
        )}
        <Link to={`/c/${slug}/entregaveis`} className="text-sm underline opacity-80 hover:opacity-100 font-montserrat">Entregáveis</Link>
        <Link to={`/c/${slug}/ciclo`} className="text-sm underline opacity-80 hover:opacity-100 font-montserrat">Ciclo</Link>
        <button className="text-sm underline opacity-80 hover:opacity-100" onClick={logout}>Sair</button>
      </Header>

      {toastMsg && <div className={`toast ${toastType === 'success' ? 'toast-success' : 'toast-error'}`}>{toastMsg}</div>}

      <div className="max-w-4xl mx-auto p-6">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button className="btn-secondary text-sm" onClick={() => navTo(-1)} disabled={submittingApproval}>&larr; Anterior</button>
          <StatusPill status={piece.status} />
          <button className="btn-secondary text-sm" onClick={() => navTo(1)} disabled={submittingApproval}>Próxima &rarr;</button>
        </div>

        {/* Piece header */}
        <div className="card p-6 mb-6">
          <h1 className="font-titillium font-bold text-2xl text-ink mb-2">{piece.tema}</h1>
          <div className="flex flex-wrap gap-2 text-sm text-ink-3 font-montserrat">
            <span>{piece.channel?.nome}</span><span>|</span>
            <span>{piece.area_direito}</span><span>|</span>
            <span>{FORMAT_LABELS[piece.formato]}</span>
          </div>
          <div className="mt-3 text-sm font-montserrat">
            <span className={totalChars > channelLimit ? 'text-fgx-red font-semibold' : 'text-ink-3'}>
              {totalChars} de {channelLimit} caracteres
              {totalChars > channelLimit ? ' (acima do limite)' : ''}
            </span>
          </div>
        </div>

        {/* Content by format */}
        <div className="space-y-4 mb-8">
          {piece.contents?.map((bloco, idx) => (
            <div key={bloco.id} className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-fgx-red font-titillium uppercase tracking-wide">
                  {bloco.titulo_bloco || `${blockLabel(piece.formato, idx)} ${piece.contents!.length > 1 ? `${idx + 1} de ${piece.contents!.length}` : ''}`}
                </span>
                <span className="text-xs text-ink-3 font-montserrat">{bloco.conteudo.length} caracteres</span>
              </div>
              <div className="prose prose-sm max-w-none text-ink font-montserrat leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(bloco.conteudo) }} />

              {/* Block-level comments */}
              {blockComments(bloco.id).length > 0 && (
                <div className="mt-3 border-t border-line pt-3">
                  <p className="text-xs font-semibold text-ink-2 mb-2">{blockComments(bloco.id).length} comentário{blockComments(bloco.id).length > 1 ? 's' : ''} neste {blockLabel(piece.formato, idx).toLowerCase()}</p>
                  {blockComments(bloco.id).map(c => (
                    <div key={c.id} className="bg-fgx-gray rounded p-2 mb-1 text-sm">
                      <span className="font-semibold text-ink">{c.autor_nome}</span>
                      <span className="text-ink-3 text-xs ml-2">{formatDateTime(c.created_at)}</span>
                      {c.trecho && <p className="text-xs text-ink-3 italic mt-0.5">Trecho: &ldquo;{c.trecho}&rdquo;</p>}
                      <p className="text-ink mt-1">{c.texto}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment on this block */}
              <div className="mt-3">
                <button className="btn-ghost text-xs" onClick={() => setComentarioBlocoId(comentarioBlocoId === bloco.id ? null : bloco.id)}>
                  {comentarioBlocoId === bloco.id ? 'Cancelar' : `Comentar neste ${blockLabel(piece.formato, idx).toLowerCase()}`}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Approval section */}
        <div className="card p-5 mb-6">
          {isApproved && lastApproval ? (
            <div className="text-fgx-green font-montserrat font-semibold">
              Aprovada por {lastApproval.autor_nome} em {formatDateTime(lastApproval.created_at)}
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button className="btn-primary" onClick={() => handleApproval('aprovou')} disabled={submittingApproval}>
                {submittingApproval ? '...' : 'Aprovar peça'}
              </button>
              <button className="btn-secondary" onClick={() => handleApproval('solicitou_ajuste')} disabled={submittingApproval}>
                Solicitar ajuste
              </button>
            </div>
          )}
        </div>

        {/* General comment form */}
        <div className="card p-5 mb-6">
          <h3 className="font-titillium font-semibold text-lg text-ink mb-3">Comentário geral</h3>
          <form onSubmit={handleComment}>
            <textarea className="input-field mb-3" rows={4} value={comentarioTexto}
              placeholder="Escreva seu comentário sobre esta peça..."
              onChange={e => setComentarioTexto(e.target.value)} />
            {comentarioBlocoId && (
              <input className="input-field mb-3" placeholder="Trecho específico (opcional)"
                value={comentarioTrecho} onChange={e => setComentarioTrecho(e.target.value)} />
            )}
            <div className="flex items-center gap-3">
              <button type="submit" className="btn-primary" disabled={!comentarioTexto.trim() || submittingComment}>
                {submittingComment ? 'Salvando...' : 'Enviar comentário'}
              </button>
              {comentarioBlocoId && (
                <button type="button" className="btn-ghost" onClick={() => { setComentarioBlocoId(null); setComentarioTrecho('') }}>
                  Cancelar comentário por bloco
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Comment history */}
        <div className="card p-5 mb-6">
          <h3 className="font-titillium font-semibold text-lg text-ink mb-3">Histórico de comentários</h3>
          {allComments.length === 0 ? (
            <p className="text-ink-3 text-sm font-montserrat">Nenhum comentário ainda.</p>
          ) : (
            <div className="space-y-3">
              {allComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(c => (
                <div key={c.id} className="border-l-2 border-line pl-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-ink">{c.autor_nome}</span>
                    <span className="pill pill-status-{c.autor_tipo === 'cliente' ? 'pendente' : 'em_revisao'} text-xs">{c.autor_tipo}</span>
                    <span className="text-xs text-ink-3">{formatDateTime(c.created_at)}</span>
                  </div>
                  {c.trecho && <p className="text-xs text-ink-3 italic">Trecho: &ldquo;{c.trecho}&rdquo;</p>}
                  <p className="text-sm text-ink mt-1">{c.texto}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Collapsible sections */}
        {piece.trail && piece.trail.length > 0 && (
          <div className="card p-5 mb-6">
            <button className="font-titillium font-semibold text-lg text-ink flex items-center gap-2 w-full text-left"
              onClick={() => setShowTrail(!showTrail)}>
              Trilha de produção ({piece.trail.length} etapas)
              <span className="text-sm">{showTrail ? '▾' : '▸'}</span>
            </button>
            {showTrail && (
              <div className="mt-3 space-y-2">
                {piece.trail.sort((a, b) => a.ordem - b.ordem).map(t => (
                  <div key={t.id} className="flex gap-3 text-sm">
                    <span className="font-semibold text-fgx-red shrink-0">{t.ordem}.</span>
                    <div>
                      <p className="font-semibold text-ink">{t.etapa}</p>
                      {t.descricao && <p className="text-ink-3">{t.descricao}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {piece.reasonings && piece.reasonings.length > 0 && (
          <div className="card p-5 mb-6">
            <button className="font-titillium font-semibold text-lg text-ink flex items-center gap-2 w-full text-left"
              onClick={() => setShowReasoning(!showReasoning)}>
              Raciocínios ({piece.reasonings.length})
              <span className="text-sm">{showReasoning ? '▾' : '▸'}</span>
            </button>
            {showReasoning && (
              <div className="mt-3 space-y-3">
                {piece.reasonings.sort((a, b) => a.ordem - b.ordem).map(r => (
                  <div key={r.id} className="bg-fgx-gray rounded p-3">
                    <h4 className="font-semibold text-ink text-sm">{r.titulo}</h4>
                    <p className="text-sm text-ink-3 mt-1">{r.descricao}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {piece.sources && piece.sources.length > 0 && (
          <div className="card p-5 mb-6">
            <button className="font-titillium font-semibold text-lg text-ink flex items-center gap-2 w-full text-left"
              onClick={() => setShowSources(!showSources)}>
              Fontes ({piece.sources.length})
              <span className="text-sm">{showSources ? '▾' : '▸'}</span>
            </button>
            {showSources && (
              <div className="mt-3 space-y-2">
                {piece.sources.sort((a, b) => a.ordem - b.ordem).map(s => (
                  <div key={s.id} className="flex gap-3 text-sm">
                    <span className="font-semibold text-fgx-red shrink-0">{s.ordem}.</span>
                    <div>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-fgx-blue hover:underline">{s.titulo}</a>
                      {s.descricao && <p className="text-ink-3">{s.descricao}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Approvals history */}
        {piece.approvals && piece.approvals.length > 0 && (
          <div className="card p-5 mb-6">
            <h3 className="font-titillium font-semibold text-lg text-ink mb-3">Histórico de aprovações</h3>
            <div className="space-y-2">
              {piece.approvals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(a => (
                <div key={a.id} className="flex items-center gap-3 text-sm">
                  <StatusPill status={a.tipo === 'aprovou' ? 'aprovada' : 'pendente'} />
                  <span className="font-semibold text-ink">{a.autor_nome}</span>
                  <span className="text-ink-3">{formatDateTime(a.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
