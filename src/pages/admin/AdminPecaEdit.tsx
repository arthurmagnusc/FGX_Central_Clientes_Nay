import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import AdminLayout from './AdminLayout'
import { Loading, ErrorMessage } from '../../components/Shared'
import { FORMAT_LABELS } from '../../lib/utils'
import { dividirEmBlocos, juntarComAnterior, mover, separarBloco, totalCaracteres, type ModoDivisao } from '../../lib/blocos'
import type { Channel } from '../../types'

type BlocoEdit = { id?: string; titulo_bloco: string; conteudo: string; ordem: number }
type ItemComId = { id?: string }

function idsOrfaos(anteriores: ItemComId[], proximos: ItemComId[]): string[] {
  const vivos = new Set(
    proximos.map(p => p.id).filter((id): id is string => typeof id === 'string'),
  )
  return anteriores
    .map(a => a.id)
    .filter((id): id is string => typeof id === 'string' && !vivos.has(id))
}

export default function AdminPecaEdit() {
  const { cycleId, pieceId } = useParams<{ cycleId: string; pieceId: string }>()
  const navigate = useNavigate()
  const isNew = pieceId === 'nova'
  const [loading, setLoading] = useState(!isNew)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [channels, setChannels] = useState<Channel[]>([])
  const [modoDivisao, setModoDivisao] = useState<ModoDivisao>('paragrafo')
  const [form, setForm] = useState({
    tema: '', area_direito: '', channel_id: '', formato: 'carrossel', limite_caracteres_override: '', ordem: 1,
  })
  const [contents, setContents] = useState<BlocoEdit[]>([])
  const [reasonings, setReasonings] = useState<{ id?: string; titulo: string; descricao: string; ordem: number }[]>([])
  const [trails, setTrails] = useState<{ id?: string; etapa: string; descricao: string; ordem: number }[]>([])
  const [sources, setSources] = useState<{ id?: string; titulo: string; url: string; descricao: string; ordem: number }[]>([])
  const [removedContentIds, setRemovedContentIds] = useState<string[]>([])
  const [removedReasoningIds, setRemovedReasoningIds] = useState<string[]>([])
  const [removedTrailIds, setRemovedTrailIds] = useState<string[]>([])
  const [removedSourceIds, setRemovedSourceIds] = useState<string[]>([])

  useEffect(() => {
    api.getAdminChannels().then(setChannels)
    if (!isNew) {
      api.getAdminPiece(pieceId!).then(p => {
        setForm({
          tema: p.tema, area_direito: p.area_direito, channel_id: p.channel_id, formato: p.formato,
          limite_caracteres_override: p.limite_caracteres_override?.toString() || '', ordem: p.ordem,
        })
        setContents((p.contents || []).map((c: { id: string; titulo_bloco?: string | null; conteudo: string; ordem: number }) => ({
          id: c.id, titulo_bloco: c.titulo_bloco || '', conteudo: c.conteudo, ordem: c.ordem,
        })))
        setReasonings((p.reasonings || []).map((r: { id: string; titulo: string; descricao: string; ordem: number }) => ({
          id: r.id, titulo: r.titulo, descricao: r.descricao, ordem: r.ordem,
        })))
        setTrails((p.trail || []).map((t: { id: string; etapa: string; descricao?: string | null; ordem: number }) => ({
          id: t.id, etapa: t.etapa, descricao: t.descricao || '', ordem: t.ordem,
        })))
        setSources((p.sources || []).map((s: { id: string; titulo: string; url: string; descricao?: string | null; ordem: number }) => ({
          id: s.id, titulo: s.titulo, url: s.url, descricao: s.descricao || '', ordem: s.ordem,
        })))
      }).catch(e => setError(e.message)).finally(() => setLoading(false))
    }
  }, [pieceId, isNew])

  const aplicarBlocos = (proximos: BlocoEdit[]) => {
    const orfaos = idsOrfaos(contents, proximos)
    if (orfaos.length) setRemovedContentIds(prev => [...prev, ...orfaos])
    setContents(proximos.map((c, i) => ({ ...c, ordem: i + 1 })))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let pid = pieceId !== 'nova' ? pieceId : null
      if (isNew) {
        const res = await api.createPiece({
          ...form,
          cycle_id: cycleId,
          limite_caracteres_override: form.limite_caracteres_override ? parseInt(form.limite_caracteres_override) : null,
        })
        pid = res.id
      } else {
        await api.updatePiece(pieceId!, {
          ...form,
          limite_caracteres_override: form.limite_caracteres_override ? parseInt(form.limite_caracteres_override) : null,
        })
      }

      for (const id of removedContentIds) await api.deletePieceContent(id)
      for (const id of removedReasoningIds) await api.deleteReasoning(id)
      for (const id of removedTrailIds) await api.deleteTrail(id)
      for (const id of removedSourceIds) await api.deleteSource(id)

      for (const c of contents) {
        if (c.id) await api.updatePieceContent(c.id, { titulo_bloco: c.titulo_bloco || null, conteudo: c.conteudo, ordem: c.ordem })
        else await api.createPieceContent({ piece_id: pid, titulo_bloco: c.titulo_bloco || null, conteudo: c.conteudo, ordem: c.ordem })
      }
      for (const r of reasonings) {
        if (r.id) await api.updateReasoning(r.id, { titulo: r.titulo, descricao: r.descricao, ordem: r.ordem })
        else await api.createReasoning({ piece_id: pid, titulo: r.titulo, descricao: r.descricao, ordem: r.ordem })
      }
      for (const t of trails) {
        if (t.id) await api.updateTrail(t.id, { etapa: t.etapa, descricao: t.descricao || null, ordem: t.ordem })
        else await api.createTrail({ piece_id: pid, etapa: t.etapa, descricao: t.descricao || null, ordem: t.ordem })
      }
      for (const s of sources) {
        if (s.id) await api.updateSource(s.id, { titulo: s.titulo, url: s.url, descricao: s.descricao || null, ordem: s.ordem })
        else await api.createSource({ piece_id: pid, titulo: s.titulo, url: s.url, descricao: s.descricao || null, ordem: s.ordem })
      }
      navigate(`/admin/ciclos/${cycleId}/pecas`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const splitBlocks = () => {
    const fullText = contents
      .map(c => [c.titulo_bloco, c.conteudo].filter(Boolean).join('\n\n'))
      .join('\n\n')
    const blocos = dividirEmBlocos(fullText, modoDivisao)
    if (!blocos.length) return
    // Reestrutura tudo: IDs antigos vão para remoção; blocos novos nascem sem id.
    aplicarBlocos(blocos.map(b => ({ titulo_bloco: b.titulo, conteudo: b.conteudo, ordem: 0 })))
  }

  const reordenar = (de: number, para: number) => {
    setContents(mover(contents, de, para).map((c, i) => ({ ...c, ordem: i + 1 })))
  }

  const juntarBloco = (i: number) => {
    const unidos = juntarComAnterior(
      contents.map(x => ({ titulo: x.titulo_bloco, conteudo: x.conteudo })),
      i,
    )
    // Mantém o id do bloco de cima; o de baixo (i) vira órfão.
    const proximos: BlocoEdit[] = unidos.map((b, j) => {
      if (j < i - 1) return { ...contents[j], titulo_bloco: b.titulo, conteudo: b.conteudo, ordem: j + 1 }
      if (j === i - 1) return { id: contents[i - 1]?.id, titulo_bloco: b.titulo, conteudo: b.conteudo, ordem: j + 1 }
      // índices após a fusão deslocam +1 em relação a contents
      return { ...contents[j + 1], titulo_bloco: b.titulo, conteudo: b.conteudo, ordem: j + 1 }
    })
    aplicarBlocos(proximos)
  }

  const separarNoIndice = (i: number) => {
    const rascunho = contents.map(x => ({ titulo: x.titulo_bloco, conteudo: x.conteudo }))
    const separados = separarBloco(rascunho, i)
    if (separados.length === rascunho.length) return
    const extras = separados.length - rascunho.length
    const proximos: BlocoEdit[] = separados.map((b, j) => {
      if (j < i) return { ...contents[j], titulo_bloco: b.titulo, conteudo: b.conteudo, ordem: j + 1 }
      if (j === i) return { id: contents[i]?.id, titulo_bloco: b.titulo, conteudo: b.conteudo, ordem: j + 1 }
      if (j > i && j <= i + extras) return { titulo_bloco: b.titulo, conteudo: b.conteudo, ordem: j + 1 }
      return { ...contents[j - extras], titulo_bloco: b.titulo, conteudo: b.conteudo, ordem: j + 1 }
    })
    aplicarBlocos(proximos)
  }

  if (loading) return <AdminLayout><Loading /></AdminLayout>

  return (
    <AdminLayout>
      <h2 className="font-titillium font-bold text-2xl text-ink mb-6">{isNew ? 'Nova peça' : 'Editar peça'}</h2>
      {error && <ErrorMessage message={error} />}

      <div className="space-y-6 max-w-3xl">
        <div className="card p-6 space-y-4">
          <h3 className="font-titillium font-semibold text-lg text-ink">Dados básicos</h3>
          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1">Tema</label>
            <input className="input-field" value={form.tema} onChange={e => setForm({ ...form, tema: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1">Área do Direito</label>
            <input className="input-field" value={form.area_direito} onChange={e => setForm({ ...form, area_direito: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-2 mb-1">Canal</label>
              <select className="input-field" value={form.channel_id} onChange={e => setForm({ ...form, channel_id: e.target.value })}>
                <option value="">Selecione...</option>
                {channels.map(ch => <option key={ch.id} value={ch.id}>{ch.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-2 mb-1">Formato</label>
              <select className="input-field" value={form.formato} onChange={e => setForm({ ...form, formato: e.target.value })}>
                {Object.entries(FORMAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-2 mb-1">Ordem</label>
              <input type="number" className="input-field" value={form.ordem} onChange={e => setForm({ ...form, ordem: parseInt(e.target.value) || 1 })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1">Limite de caracteres (override, opcional)</label>
            <input type="number" className="input-field max-w-xs" value={form.limite_caracteres_override} onChange={e => setForm({ ...form, limite_caracteres_override: e.target.value })} />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="font-titillium font-semibold text-lg text-ink">Blocos de conteúdo</h3>
              <p className="text-xs text-ink-3 font-montserrat mt-0.5">{totalCaracteres(contents)} caracteres no total</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <select
                className="input-field text-sm w-auto"
                value={modoDivisao}
                onChange={e => setModoDivisao(e.target.value as ModoDivisao)}
                title="Como dividir o texto"
              >
                <option value="paragrafo">Por parágrafo</option>
                <option value="titulo">Por título (#)</option>
                <option value="separador">Por ---</option>
              </select>
              <button type="button" className="btn-secondary text-sm" onClick={splitBlocks}>Dividir</button>
              <button type="button" className="btn-secondary text-sm" onClick={() => setContents([...contents, { titulo_bloco: '', conteudo: '', ordem: contents.length + 1 }])}>+ Bloco</button>
            </div>
          </div>
          {contents.map((c, i) => (
            <div key={c.id ?? `new-${i}`} className="border border-line rounded p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-ink-2">Bloco {i + 1} · {c.conteudo.length} chars</span>
                <div className="flex gap-2">
                  {i > 0 && <button type="button" className="text-xs text-fgx-blue hover:underline" onClick={() => reordenar(i, i - 1)}>▲</button>}
                  {i < contents.length - 1 && <button type="button" className="text-xs text-fgx-blue hover:underline" onClick={() => reordenar(i, i + 1)}>▼</button>}
                  {i > 0 && (
                    <button type="button" className="text-xs text-fgx-blue hover:underline" onClick={() => juntarBloco(i)}>Juntar ↑</button>
                  )}
                  <button type="button" className="text-xs text-fgx-blue hover:underline" onClick={() => separarNoIndice(i)}>Separar</button>
                  <button type="button" className="text-xs text-fgx-red hover:underline" onClick={() => {
                    aplicarBlocos(contents.filter((_, j) => j !== i))
                  }}>× Remover</button>
                </div>
              </div>
              <input className="input-field mb-2" placeholder="Título do bloco (opcional)"
                value={c.titulo_bloco} onChange={e => { const nc = [...contents]; nc[i] = { ...nc[i], titulo_bloco: e.target.value }; setContents(nc) }} />
              <textarea className="input-field" rows={6} value={c.conteudo}
                onChange={e => { const nc = [...contents]; nc[i] = { ...nc[i], conteudo: e.target.value }; setContents(nc) }} />
            </div>
          ))}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-titillium font-semibold text-lg text-ink">Trilha de produção</h3>
            <button type="button" className="btn-secondary text-sm" onClick={() => setTrails([...trails, { etapa: '', descricao: '', ordem: trails.length + 1 }])}>+ Etapa</button>
          </div>
          {trails.map((t, i) => (
            <div key={t.id ?? `trail-${i}`} className="flex gap-2 mb-2">
              <span className="text-fgx-red font-bold shrink-0 pt-2">{i + 1}.</span>
              <div className="flex-1 space-y-1">
                <input className="input-field" placeholder="Etapa" value={t.etapa} onChange={e => { const nt = [...trails]; nt[i] = { ...nt[i], etapa: e.target.value }; setTrails(nt) }} />
                <input className="input-field" placeholder="Descrição" value={t.descricao} onChange={e => { const nt = [...trails]; nt[i] = { ...nt[i], descricao: e.target.value }; setTrails(nt) }} />
              </div>
              <button type="button" className="text-xs text-fgx-red shrink-0 pt-2" onClick={() => {
                if (t.id) setRemovedTrailIds(prev => [...prev, t.id!])
                setTrails(trails.filter((_, j) => j !== i).map((x, j) => ({ ...x, ordem: j + 1 })))
              }}>×</button>
            </div>
          ))}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-titillium font-semibold text-lg text-ink">Raciocínios</h3>
            <button type="button" className="btn-secondary text-sm" onClick={() => setReasonings([...reasonings, { titulo: '', descricao: '', ordem: reasonings.length + 1 }])}>+ Raciocínio</button>
          </div>
          {reasonings.map((r, i) => (
            <div key={r.id ?? `reason-${i}`} className="border border-line rounded p-3 mb-2">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-ink-2">{i + 1}.</span>
                <button type="button" className="text-xs text-fgx-red" onClick={() => {
                  if (r.id) setRemovedReasoningIds(prev => [...prev, r.id!])
                  setReasonings(reasonings.filter((_, j) => j !== i).map((x, j) => ({ ...x, ordem: j + 1 })))
                }}>×</button>
              </div>
              <input className="input-field mb-2" placeholder="Título" value={r.titulo} onChange={e => { const nr = [...reasonings]; nr[i] = { ...nr[i], titulo: e.target.value }; setReasonings(nr) }} />
              <textarea className="input-field" rows={3} placeholder="Descrição" value={r.descricao} onChange={e => { const nr = [...reasonings]; nr[i] = { ...nr[i], descricao: e.target.value }; setReasonings(nr) }} />
            </div>
          ))}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-titillium font-semibold text-lg text-ink">Fontes</h3>
            <button type="button" className="btn-secondary text-sm" onClick={() => setSources([...sources, { titulo: '', url: '', descricao: '', ordem: sources.length + 1 }])}>+ Fonte</button>
          </div>
          {sources.map((s, i) => (
            <div key={s.id ?? `source-${i}`} className="border border-line rounded p-3 mb-2">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-ink-2">{i + 1}.</span>
                <button type="button" className="text-xs text-fgx-red" onClick={() => {
                  if (s.id) setRemovedSourceIds(prev => [...prev, s.id!])
                  setSources(sources.filter((_, j) => j !== i).map((x, j) => ({ ...x, ordem: j + 1 })))
                }}>×</button>
              </div>
              <input className="input-field mb-2" placeholder="Título" value={s.titulo} onChange={e => { const ns = [...sources]; ns[i] = { ...ns[i], titulo: e.target.value }; setSources(ns) }} />
              <input className="input-field mb-2" placeholder="URL" value={s.url} onChange={e => { const ns = [...sources]; ns[i] = { ...ns[i], url: e.target.value }; setSources(ns) }} />
              <input className="input-field" placeholder="Descrição" value={s.descricao} onChange={e => { const ns = [...sources]; ns[i] = { ...ns[i], descricao: e.target.value }; setSources(ns) }} />
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar peça'}</button>
          <button type="button" className="btn-secondary" onClick={() => navigate(`/admin/ciclos/${cycleId}/pecas`)}>Cancelar</button>
        </div>
      </div>
    </AdminLayout>
  )
}
