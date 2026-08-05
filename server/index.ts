import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { getDB, persist, hashPassword, verifyPassword, createSession, getSession, deleteSession, updateSessionName, seed } from './db'
import { v4 as uuidv4 } from 'uuid'

seed()

const app = new Hono()

app.use('/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}))

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  cookieHeader?.split(';').forEach(c => {
    const [k, ...v] = c.trim().split('=')
    if (k) cookies[k] = decodeURIComponent(v.join('='))
  })
  return cookies
}

async function requireClient(c: any) {
  const cookie = c.req.header('cookie') || ''
  const cookies = parseCookies(cookie)
  const session = getSession(cookies['fgx_session'] || '')
  if (!session || !session.client_id) {
    c.status(401)
    return c.json({ error: 'Não autenticado' })
  }
  const client = getDB().clients.find((cl: any) => cl.id === session.client_id)
  if (!client) { c.status(404); return c.json({ error: 'Cliente não encontrado' }) }
  return { session, client }
}

async function requireAdmin(c: any) {
  const cookie = c.req.header('cookie') || ''
  const cookies = parseCookies(cookie)
  const session = getSession(cookies['fgx_session'] || '')
  if (!session || !session.admin_id) {
    c.status(401)
    return c.json({ error: 'Não autenticado' })
  }
  return { session }
}

function setSessionCookie(c: any, token: string) {
  c.header('Set-Cookie', `fgx_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`)
}

// ===== AUTH ROUTES =====

app.post('/api/auth/cliente/login', async (c) => {
  const { slug, senha, nome } = await c.req.json()
  const client = getDB().clients.find((cl: any) => cl.slug === slug)
  if (!client) return c.json({ error: 'Cliente não encontrado' }, 404)
  if (!client.ativo) return c.json({ error: 'Acesso não liberado' }, 403)
  if (!client.senha_hash) return c.json({ error: 'Acesso ainda não configurado para este cliente' }, 403)
  if (!verifyPassword(senha, client.senha_hash)) return c.json({ error: 'Senha incorreta' }, 401)
  if (!nome?.trim()) return c.json({ error: 'Informe seu nome' }, 400)

  const token = createSession(client.id, null, nome.trim())
  setSessionCookie(c, token)

  const channels = getDB().client_channels
    .filter((cc: any) => cc.client_id === client.id)
    .map((cc: any) => ({ ...cc.channel, client_channel_id: cc.id }))

  return c.json({
    client_id: client.id, slug: client.slug, pessoa_nome: nome.trim(),
    nome: client.nome, tom_voz: client.tom_voz, areas_chave: client.areas_chave,
    regra_base_ref: client.regra_base_ref, channels,
  })
})

app.post('/api/auth/cliente/rename', async (c) => {
  const auth = await requireClient(c)
  if (!auth.session) return auth
  const { nome } = await c.req.json()
  const cookie = c.req.header('cookie') || ''
  const cookies = parseCookies(cookie)
  updateSessionName(cookies['fgx_session'] || '', nome.trim())
  return c.json({ ok: true, pessoa_nome: nome.trim() })
})

app.post('/api/auth/admin/login', async (c) => {
  const { senha } = await c.req.json()
  const admin = getDB().admin_users[0]
  if (!admin) return c.json({ error: 'Admin não configurado' }, 500)
  if (!verifyPassword(senha, admin.senha_hash)) return c.json({ error: 'Senha incorreta' }, 401)

  const token = createSession(null, admin.id, null)
  setSessionCookie(c, token)
  return c.json({ admin_id: admin.id, senha_inicial: admin.senha_inicial })
})

app.post('/api/auth/logout', (c) => {
  const cookie = c.req.header('cookie') || ''
  const cookies = parseCookies(cookie)
  deleteSession(cookies['fgx_session'] || '')
  c.header('Set-Cookie', 'fgx_session=; Path=/; HttpOnly; Max-Age=0')
  return c.json({ ok: true })
})

app.post('/api/auth/admin/change-password', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const { senhaAtual, senhaNova } = await c.req.json()
  const admin = getDB().admin_users[0]
  if (!verifyPassword(senhaAtual, admin.senha_hash)) return c.json({ error: 'Senha atual incorreta' }, 401)
  admin.senha_hash = hashPassword(senhaNova)
  admin.senha_inicial = false
  persist()
  return c.json({ ok: true })
})

app.post('/api/auth/admin/change-initial-password', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const { senhaNova } = await c.req.json()
  const admin = getDB().admin_users[0]
  admin.senha_hash = hashPassword(senhaNova)
  admin.senha_inicial = false
  persist()
  return c.json({ ok: true })
})

// ===== CLIENT PORTAL ROUTES =====

app.get('/api/cliente/me', async (c) => {
  const auth = await requireClient(c)
  if (!auth.session) return auth
  const { client, session } = auth
  const channels = getDB().client_channels
    .filter((cc: any) => cc.client_id === client.id)
    .map((cc: any) => ({
      ...getDB().channels.find((ch: any) => ch.id === cc.channel_id),
      client_channel_id: cc.id,
    })).filter(Boolean)
  return c.json({
    client_id: client.id, slug: client.slug, pessoa_nome: session.pessoa_nome,
    nome: client.nome, tom_voz: client.tom_voz, areas_chave: client.areas_chave,
    regra_base_ref: client.regra_base_ref, channels,
  })
})

app.get('/api/cliente/deliverables', async (c) => {
  const auth = await requireClient(c)
  if (!auth.session) return auth
  const items = getDB().deliverables.filter((d: any) => d.client_id === auth.client.id)
  return c.json(items)
})

app.get('/api/cliente/deliverables/:id/download', async (c) => {
  const auth = await requireClient(c)
  if (!auth.session) return auth
  const id = c.req.param('id')
  const del = getDB().deliverables.find((d: any) => d.id === id && d.client_id === auth.client.id)
  if (!del) return c.json({ error: 'Não encontrado' }, 404)
  return c.json({ url: `https://placeholder.example.com/${del.storage_path}` })
})

app.get('/api/cliente/cycles', async (c) => {
  const auth = await requireClient(c)
  if (!auth.session) return auth
  const cycles = getDB().cycles
    .filter((cy: any) => cy.client_id === auth.client.id && (cy.status === 'publicado' || cy.status === 'encerrado'))
    .sort((a: any, b: any) => b.created_at.localeCompare(a.created_at))
  return c.json(cycles.map((cy: any) => ({ ...cy, pieces: undefined })))
})

app.get('/api/cliente/cycles/:id', async (c) => {
  const auth = await requireClient(c)
  if (!auth.session) return auth
  const id = c.req.param('id')
  const cycle = getDB().cycles.find((cy: any) => cy.id === id && cy.client_id === auth.client.id)
  if (!cycle) return c.json({ error: 'Ciclo não encontrado' }, 404)

  const pieces = getDB().pieces
    .filter((p: any) => p.cycle_id === id)
    .sort((a: any, b: any) => a.ordem - b.ordem)
    .map((p: any) => {
      const channel = getDB().channels.find((ch: any) => ch.id === p.channel_id)
      const comments = getDB().comments.filter((c: any) => c.piece_id === p.id)
      return { ...p, channel, comments }
    })

  return c.json({ ...cycle, pieces, nearbyPieces: pieces })
})

app.get('/api/cliente/pieces/:id', async (c) => {
  const auth = await requireClient(c)
  if (!auth.session) return auth
  const id = c.req.param('id')
  const piece = getDB().pieces.find((p: any) => p.id === id)
  if (!piece) return c.json({ error: 'Peça não encontrada' }, 404)

  const cycle = getDB().cycles.find((cy: any) => cy.id === piece.cycle_id)
  if (!cycle || cycle.client_id !== auth.client.id)
    return c.json({ error: 'Acesso negado' }, 403)

  const channel = getDB().channels.find((ch: any) => ch.id === piece.channel_id)
  const contents = getDB().piece_contents.filter((c: any) => c.piece_id === id).sort((a: any, b: any) => a.ordem - b.ordem)
  const comments = getDB().comments.filter((c: any) => c.piece_id === id).sort((a: any, b: any) => b.created_at.localeCompare(a.created_at))
  const approvals = getDB().approvals.filter((a: any) => a.piece_id === id).sort((a: any, b: any) => b.created_at.localeCompare(a.created_at))
  const reasonings = getDB().piece_reasonings.filter((r: any) => r.piece_id === id).sort((a: any, b: any) => a.ordem - b.ordem)
  const trail = getDB().production_trails.filter((t: any) => t.piece_id === id).sort((a: any, b: any) => a.ordem - b.ordem)
  const sources = getDB().sources.filter((s: any) => s.piece_id === id).sort((a: any, b: any) => a.ordem - b.ordem)

  const allPieces = getDB().pieces.filter((p: any) => p.cycle_id === cycle.id).sort((a: any, b: any) => a.ordem - b.ordem)
  const nearbyPieces = allPieces

  return c.json({
    ...piece, channel, contents, comments, approvals,
    reasonings, trail, sources, nearbyPieces,
  })
})

app.post('/api/cliente/pieces/:id/comments', async (c) => {
  const auth = await requireClient(c)
  if (!auth.session) return auth
  const id = c.req.param('id')
  const piece = getDB().pieces.find((p: any) => p.id === id)
  if (!piece) return c.json({ error: 'Peça não encontrada' }, 404)

  const cycle = getDB().cycles.find((cy: any) => cy.id === piece.cycle_id)
  if (!cycle || cycle.client_id !== auth.client.id)
    return c.json({ error: 'Acesso negado' }, 403)

  const { texto, piece_content_id, trecho } = await c.req.json()
  const comment = {
    id: uuidv4(), piece_id: id, piece_content_id: piece_content_id || null,
    autor_nome: auth.session.pessoa_nome, autor_tipo: 'cliente',
    texto, trecho: trecho || null, created_at: new Date().toISOString(),
  }
  getDB().comments.push(comment)
  persist()
  return c.json(comment, 201)
})

app.post('/api/cliente/pieces/:id/approvals', async (c) => {
  const auth = await requireClient(c)
  if (!auth.session) return auth
  const id = c.req.param('id')
  const piece = getDB().pieces.find((p: any) => p.id === id)
  if (!piece) return c.json({ error: 'Peça não encontrada' }, 404)

  const cycle = getDB().cycles.find((cy: any) => cy.id === piece.cycle_id)
  if (!cycle || cycle.client_id !== auth.client.id)
    return c.json({ error: 'Acesso negado' }, 403)

  const { tipo } = await c.req.json()
  const approval = {
    id: uuidv4(), piece_id: id, tipo,
    autor_nome: auth.session.pessoa_nome,
    created_at: new Date().toISOString(),
  }
  getDB().approvals.push(approval)
  piece.status = tipo === 'aprovou' ? 'aprovada' : 'ajustada'
  persist()
  return c.json(approval, 201)
})

// ===== ADMIN ROUTES =====

app.get('/api/admin/channels', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  return c.json(getDB().channels)
})

app.get('/api/admin/clients', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  return c.json(getDB().clients)
})

app.get('/api/admin/clients/:id', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const client = getDB().clients.find((cl: any) => cl.id === c.req.param('id'))
  if (!client) return c.json({ error: 'Não encontrado' }, 404)
  const channels = getDB().client_channels.filter((cc: any) => cc.client_id === client.id)
  return c.json({ ...client, channels })
})

app.post('/api/admin/clients', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const data = await c.req.json()
  const id = uuidv4()
  const client: any = {
    id, nome: data.nome, slug: data.slug,
    senha_hash: data.senha ? hashPassword(data.senha) : null,
    tom_voz: data.tom_voz || null, areas_chave: data.areas_chave || null,
    regra_base_ref: data.regra_base_ref || null, ativo: data.ativo ?? true,
    created_at: new Date().toISOString(),
  }
  getDB().clients.push(client)

  // Update channels
  getDB().client_channels = getDB().client_channels.filter((cc: any) => cc.client_id !== id)
  for (const chId of data.channel_ids || []) {
    getDB().client_channels.push({ id: uuidv4(), client_id: id, channel_id: chId })
  }
  persist()
  return c.json(client, 201)
})

app.put('/api/admin/clients/:id', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const id = c.req.param('id')
  const client = getDB().clients.find((cl: any) => cl.id === id)
  if (!client) return c.json({ error: 'Não encontrado' }, 404)
  const data = await c.req.json()
  client.nome = data.nome
  client.slug = data.slug
  if (data.senha) client.senha_hash = hashPassword(data.senha)
  client.tom_voz = data.tom_voz || null
  client.areas_chave = data.areas_chave || null
  client.regra_base_ref = data.regra_base_ref || null
  client.ativo = data.ativo ?? client.ativo

  getDB().client_channels = getDB().client_channels.filter((cc: any) => cc.client_id !== id)
  for (const chId of data.channel_ids || []) {
    getDB().client_channels.push({ id: uuidv4(), client_id: id, channel_id: chId })
  }
  persist()
  return c.json(client)
})

// Deliverables
app.get('/api/admin/deliverables', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  return c.json(getDB().deliverables)
})

app.post('/api/admin/deliverables', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const formData = await c.req.formData()
  const file = formData.get('file') as File | null
  const del: any = {
    id: uuidv4(),
    client_id: formData.get('client_id'),
    categoria: formData.get('categoria'),
    titulo: formData.get('titulo'),
    descricao: formData.get('descricao') || null,
    versao: formData.get('versao') || '1.0',
    storage_path: file ? `deliverables/${uuidv4()}_${file.name}` : 'deliverables/placeholder.pdf',
    mime_type: file?.type || 'application/pdf',
    tamanho_bytes: file?.size || 0,
    status: 'em_validacao',
    created_at: new Date().toISOString(),
  }
  getDB().deliverables.push(del)
  persist()
  return c.json(del, 201)
})

// Cycles
app.get('/api/admin/cycles', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  return c.json(getDB().cycles.sort((a: any, b: any) => b.created_at.localeCompare(a.created_at)))
})

app.post('/api/admin/cycles', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const data = await c.req.json()
  const cycle: any = {
    id: uuidv4(), client_id: data.client_id, mes_referencia: data.mes_referencia,
    volume: data.volume || 1, status: 'rascunho', is_demo: false,
    created_at: new Date().toISOString(),
  }
  getDB().cycles.push(cycle)
  persist()
  return c.json(cycle, 201)
})

app.put('/api/admin/cycles/:id', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const cycle = getDB().cycles.find((cy: any) => cy.id === c.req.param('id'))
  if (!cycle) return c.json({ error: 'Não encontrado' }, 404)
  const data = await c.req.json()
  if (data.status) cycle.status = data.status
  if (data.is_demo !== undefined) cycle.is_demo = data.is_demo
  persist()
  return c.json(cycle)
})

app.delete('/api/admin/cycles/:id', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const id = c.req.param('id')
  getDB().cycles = getDB().cycles.filter((cy: any) => cy.id !== id)
  getDB().pieces = getDB().pieces.filter((p: any) => p.cycle_id !== id)
  persist()
  return c.json({ ok: true })
})

app.delete('/api/admin/cycles/demo/fiedra', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const fiedra = getDB().clients.find((cl: any) => cl.slug === 'fiedra')
  if (!fiedra) return c.json({ error: 'Cliente Fiedra não encontrado' }, 404)
  const demos = getDB().cycles.filter((cy: any) => cy.client_id === fiedra.id && cy.is_demo)
  for (const cy of demos) {
    getDB().pieces = getDB().pieces.filter((p: any) => p.cycle_id !== cy.id)
    getDB().piece_contents = getDB().piece_contents.filter((pc: any) => {
      const p = getDB().pieces.find((pp: any) => pp.id === pc.piece_id)
      return p && p.cycle_id !== cy.id
    })
  }
  getDB().cycles = getDB().cycles.filter((cy: any) => !demos.includes(cy))
  persist()
  return c.json({ ok: true })
})

// Pieces
app.get('/api/admin/cycles/:cycleId/pieces', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const pieces = getDB().pieces
    .filter((p: any) => p.cycle_id === c.req.param('cycleId'))
    .sort((a: any, b: any) => a.ordem - b.ordem)
    .map((p: any) => ({ ...p, channel: getDB().channels.find((ch: any) => ch.id === p.channel_id) }))
  return c.json(pieces)
})

app.get('/api/admin/pieces/:id', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const piece = getDB().pieces.find((p: any) => p.id === c.req.param('id'))
  if (!piece) return c.json({ error: 'Não encontrado' }, 404)
  const contents = getDB().piece_contents.filter((pc: any) => pc.piece_id === piece.id).sort((a: any, b: any) => a.ordem - b.ordem)
  const reasonings = getDB().piece_reasonings.filter((r: any) => r.piece_id === piece.id)
  const trail = getDB().production_trails.filter((t: any) => t.piece_id === piece.id)
  const sources = getDB().sources.filter((s: any) => s.piece_id === piece.id)
  return c.json({ ...piece, contents, reasonings, trail, sources })
})

app.post('/api/admin/pieces', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const data = await c.req.json()
  const piece: any = {
    id: uuidv4(), cycle_id: data.cycle_id, tema: data.tema, area_direito: data.area_direito,
    channel_id: data.channel_id, formato: data.formato, status: 'pendente',
    limite_caracteres_override: data.limite_caracteres_override || null,
    ordem: data.ordem || 1, created_at: new Date().toISOString(),
  }
  getDB().pieces.push(piece)
  persist()
  return c.json(piece, 201)
})

app.put('/api/admin/pieces/:id', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const piece = getDB().pieces.find((p: any) => p.id === c.req.param('id'))
  if (!piece) return c.json({ error: 'Não encontrado' }, 404)
  const data = await c.req.json()
  Object.assign(piece, data)
  persist()
  return c.json(piece)
})

// Piece contents
app.post('/api/admin/piece-contents', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const data = await c.req.json()
  const content: any = {
    id: uuidv4(), piece_id: data.piece_id, titulo_bloco: data.titulo_bloco || null,
    conteudo: data.conteudo, ordem: data.ordem || 1,
    created_at: new Date().toISOString(),
  }
  getDB().piece_contents.push(content)
  persist()
  return c.json(content, 201)
})

app.put('/api/admin/piece-contents/:id', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const content = getDB().piece_contents.find((pc: any) => pc.id === c.req.param('id'))
  if (!content) return c.json({ error: 'Não encontrado' }, 404)
  const data = await c.req.json()
  Object.assign(content, data)
  persist()
  return c.json(content)
})

app.delete('/api/admin/piece-contents/:id', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  getDB().piece_contents = getDB().piece_contents.filter((pc: any) => pc.id !== c.req.param('id'))
  persist()
  return c.json({ ok: true })
})

// Trails
app.post('/api/admin/trails', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const data = await c.req.json()
  const t: any = { id: uuidv4(), ...data, created_at: new Date().toISOString() }
  getDB().production_trails.push(t)
  persist()
  return c.json(t, 201)
})

app.put('/api/admin/trails/:id', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const t = getDB().production_trails.find((pt: any) => pt.id === c.req.param('id'))
  if (!t) return c.json({ error: 'Não encontrado' }, 404)
  Object.assign(t, await c.req.json())
  persist()
  return c.json(t)
})

app.delete('/api/admin/trails/:id', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  getDB().production_trails = getDB().production_trails.filter((pt: any) => pt.id !== c.req.param('id'))
  persist()
  return c.json({ ok: true })
})

// Reasonings
app.post('/api/admin/reasonings', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const data = await c.req.json()
  const r: any = { id: uuidv4(), ...data, created_at: new Date().toISOString() }
  getDB().piece_reasonings.push(r)
  persist()
  return c.json(r, 201)
})

app.put('/api/admin/reasonings/:id', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const r = getDB().piece_reasonings.find((pr: any) => pr.id === c.req.param('id'))
  if (!r) return c.json({ error: 'Não encontrado' }, 404)
  Object.assign(r, await c.req.json())
  persist()
  return c.json(r)
})

app.delete('/api/admin/reasonings/:id', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  getDB().piece_reasonings = getDB().piece_reasonings.filter((pr: any) => pr.id !== c.req.param('id'))
  persist()
  return c.json({ ok: true })
})

// Sources
app.post('/api/admin/sources', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const data = await c.req.json()
  const s: any = { id: uuidv4(), ...data, created_at: new Date().toISOString() }
  getDB().sources.push(s)
  persist()
  return c.json(s, 201)
})

app.put('/api/admin/sources/:id', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const s = getDB().sources.find((src: any) => src.id === c.req.param('id'))
  if (!s) return c.json({ error: 'Não encontrado' }, 404)
  Object.assign(s, await c.req.json())
  persist()
  return c.json(s)
})

app.delete('/api/admin/sources/:id', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  getDB().sources = getDB().sources.filter((src: any) => src.id !== c.req.param('id'))
  persist()
  return c.json({ ok: true })
})

// Comments
app.get('/api/admin/cycles/:cycleId/comments', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const pieces = getDB().pieces.filter((p: any) => p.cycle_id === c.req.param('cycleId'))
  const pieceIds = pieces.map((p: any) => p.id)
  const comments = getDB().comments.filter((cm: any) => pieceIds.includes(cm.piece_id))
  return c.json(comments)
})

app.get('/api/admin/pieces/:id/comments', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const comments = getDB().comments.filter((cm: any) => cm.piece_id === c.req.param('id'))
  return c.json(comments)
})

// Adjustments
app.post('/api/admin/adjustments', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const data = await c.req.json()
  const adj: any = {
    id: uuidv4(), ...data,
    status_avaliacao: 'pendente', additive_doc_id: null,
    created_at: new Date().toISOString(),
  }
  getDB().adjustments.push(adj)

  // Update piece status
  const piece = getDB().pieces.find((p: any) => p.id === data.piece_id)
  if (piece) piece.status = 'ajustada'

  persist()
  return c.json(adj, 201)
})

app.put('/api/admin/adjustments/:id', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const adj = getDB().adjustments.find((a: any) => a.id === c.req.param('id'))
  if (!adj) return c.json({ error: 'Não encontrado' }, 404)
  Object.assign(adj, await c.req.json())
  persist()
  return c.json(adj)
})

app.post('/api/admin/adjustments/:id/dispatch', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const adj = getDB().adjustments.find((a: any) => a.id === c.req.param('id'))
  if (!adj) return c.json({ error: 'Não encontrado' }, 404)

  const client = getDB().clients.find((cl: any) => {
    const piece = getDB().pieces.find((p: any) => p.id === adj.piece_id)
    if (!piece) return false
    const cycle = getDB().cycles.find((cy: any) => cy.id === piece.cycle_id)
    return cycle?.client_id === cl.id
  })

  const comment = getDB().comments.find((cm: any) => cm.id === adj.comment_id)
  const piece = getDB().pieces.find((p: any) => p.id === adj.piece_id)

  const payload = {
    cliente: {
      nome: client?.nome,
      tom_voz: client?.tom_voz,
      areas_chave: client?.areas_chave,
      regra_base_ref: client?.regra_base_ref,
    },
    peca: piece ? {
      tema: piece.tema,
      area_direito: piece.area_direito,
      formato: piece.formato,
    } : null,
    conteudo_integral: getDB().piece_contents
      .filter((pc: any) => pc.piece_id === adj.piece_id)
      .sort((a: any, b: any) => a.ordem - b.ordem)
      .map((pc: any) => pc.conteudo)
      .join('\n\n'),
    comentario_origem: comment ? { autor: comment.autor_nome, texto: comment.texto } : null,
    descricao_ajuste: adj.descricao,
    tipo: adj.tipo,
  }

  const webhookUrl = process.env.WEBHOOK_AVALIACAO_AJUSTE
  let resultado: string | null = null

  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      resultado = `Status ${res.status}`
    } catch (e: any) {
      resultado = `Erro: ${e.message}`
    }
  } else {
    resultado = 'JSON disponível para download'
  }

  const dispatch: any = {
    id: uuidv4(), adjustment_id: adj.id,
    destino: webhookUrl || 'download_json',
    payload: JSON.stringify(payload),
    resultado,
    created_at: new Date().toISOString(),
  }
  getDB().adjustment_dispatches.push(dispatch)
  adj.status_avaliacao = 'em_avaliacao'
  persist()

  return c.json({ dispatch, payload })
})

// Additive docs
app.get('/api/admin/clients/:clientId/additive-docs', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const docs = getDB().additive_docs.filter((ad: any) => ad.client_id === c.req.param('clientId'))
  return c.json(docs)
})

app.post('/api/admin/additive-docs', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const data = await c.req.json()
  const doc: any = {
    id: uuidv4(), ...data, created_at: new Date().toISOString(),
  }
  getDB().additive_docs.push(doc)
  persist()
  return c.json(doc, 201)
})

app.put('/api/admin/additive-docs/:id', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const doc = getDB().additive_docs.find((ad: any) => ad.id === c.req.param('id'))
  if (!doc) return c.json({ error: 'Não encontrado' }, 404)
  Object.assign(doc, await c.req.json())
  persist()
  return c.json(doc)
})

app.get('/api/admin/additive-docs/:id/export', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  const doc = getDB().additive_docs.find((ad: any) => ad.id === c.req.param('id'))
  if (!doc) return c.json({ error: 'Não encontrado' }, 404)
  return c.json({ conteudo: `# ${doc.titulo}\n\n${doc.conteudo}` })
})

// Seed demo
app.post('/api/admin/seed-demo', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  createSeedDemo()
  return c.json({ ok: true })
})

function createSeedDemo() {
  const fiedra = getDB().clients.find((cl: any) => cl.slug === 'fiedra')
  if (!fiedra) return

  const existing = getDB().cycles.find((cy: any) => cy.client_id === fiedra.id && cy.mes_referencia === '2026-06')
  if (existing) return

  const cycleId = uuidv4()
  getDB().cycles.push({
    id: cycleId, client_id: fiedra.id, mes_referencia: '2026-06', volume: 1,
    status: 'publicado', is_demo: true, created_at: new Date().toISOString(),
  })

  const channels = getDB().channels
  const rs = channels.find((ch: any) => ch.slug === 'redes_sociais')!
  const blog = channels.find((ch: any) => ch.slug === 'blog')!
  const nl = channels.find((ch: any) => ch.slug === 'newsletter')!

  const longText1 = `# A Nova Fronteira da Responsabilidade Civil

O cenário jurídico brasileiro tem passado por transformações profundas nos últimos anos, especialmente no que tange à responsabilidade civil. A jurisprudência dos tribunais superiores tem consolidado entendimentos que ampliam significativamente o escopo da proteção aos direitos da personalidade, criando novas fronteiras para a atuação dos operadores do Direito.

## Contextualização do Tema

O Código Civil de 2002 estabeleceu as bases para um sistema de responsabilidade civil mais aberto e principiológico. A cláusula geral de responsabilidade, prevista no artigo 927, parágrafo único, permite que a jurisprudência reconheça novos danos indenizáveis sem necessidade de previsão legal específica.

Este movimento de expansão tem sido particularmente relevante nas áreas de direito digital, proteção de dados pessoais e direitos da personalidade. A Lei Geral de Proteção de Dados (LGPD), em vigor desde 2020, trouxe novos parâmetros para a responsabilização por danos decorrentes do tratamento inadequado de informações pessoais.

## Análise da Jurisprudência Recente

O Superior Tribunal de Justiça tem decidido de forma reiterada pela possibilidade de cumulação de danos morais e estéticos, reconhecendo a autonomia destas categorias de dano. No REsp 1.845.678/SP, a Terceira Turma estabeleceu critérios objetivos para a quantificação do dano moral, levando em consideração:

- A gravidade da conduta do ofensor
- A extensão do dano suportado pela vítima
- As condições econômicas das partes
- O caráter pedagógico da indenização

Estes critérios, embora não constituam uma fórmula matemática precisa, têm servido como balizas importantes para a atuação dos tribunais estaduais, reduzindo a dispersão jurisprudencial e conferindo maior previsibilidade ao sistema.

## Implicações Práticas

Para os escritórios de advocacia que atuam na área contenciosa, estas mudanças representam tanto oportunidades quanto desafios. Por um lado, a ampliação do espectro de danos indenizáveis permite a formulação de pedidos mais abrangentes. Por outro, exige um nível mais elevado de fundamentação técnica e jurídica.

A utilização de provas periciais, especialmente nas áreas de contabilidade, psicologia e tecnologia da informação, tem se tornado cada vez mais relevante para demonstrar a extensão dos danos e fundamentar os pedidos indenizatórios.

É fundamental que os profissionais estejam atualizados não apenas sobre as decisões dos tribunais superiores, mas também sobre as tendências doutrinárias e as inovações legislativas que impactam a matéria.`

  const longText2 = `# Estratégias de Comunicação Jurídica nas Redes Sociais

O ambiente digital transformou radicalmente a forma como escritórios de advocacia se comunicam com seus públicos. As redes sociais, antes vistas com desconfiança pelo meio jurídico, hoje são ferramentas indispensáveis para a construção de autoridade e geração de negócios.

## O Cenário Atual

Dados recentes da Associação Brasileira de Marketing Jurídico indicam que mais de 70% dos escritórios de médio e grande porte mantêm presença ativa em pelo menos duas plataformas sociais. O LinkedIn lidera como canal preferencial para conteúdo técnico-jurídico, enquanto o Instagram tem se destacado na humanização das marcas jurídicas.

## Boas Práticas para Conteúdo Jurídico

### Linguagem Acessível

O grande desafio da comunicação jurídica nas redes sociais está em traduzir conceitos complexos para uma linguagem acessível, sem perder a precisão técnica. Algumas recomendações:

- Evitar o juridiquês sempre que possível
- Utilizar exemplos práticos e analogias
- Estruturar o conteúdo em tópicos claros
- Incluir elementos visuais que facilitem a compreensão

### Frequência e Consistência

A regularidade nas publicações é mais importante que o volume. Um cronograma consistente, mesmo que com menor frequência, gera melhores resultados que picos esporádicos de conteúdo.

## Formatos Recomendados

Cada plataforma demanda formatos específicos:

- **Carrosséis no Instagram/LinkedIn**: Ideais para conteúdos didáticos, passo a passo de procedimentos jurídicos, análises de casos em etapas
- **Artigos no LinkedIn**: Permitem aprofundamento técnico, citação de jurisprudência, desenvolvimento de teses jurídicas
- **Vídeos curtos**: Excelentes para dicas rápidas, comentários sobre notícias jurídicas, apresentação de profissionais

## Mensuração de Resultados

As métricas de sucesso na comunicação jurídica digital não se limitam a curtidas e compartilhamentos. Indicadores mais relevantes incluem:

1. Geração de leads qualificados
2. Convites para participação em eventos e publicações
3. Citações em veículos de imprensa especializada
4. Aumento no tráfego do site institucional
5. Solicitações de proposta comercial

## Considerações Éticas

É imprescindível observar as normas da OAB sobre publicidade na advocacia. O Provimento 205/2021 do CFOAB modernizou as regras, permitindo maior flexibilidade, mas mantendo restrições importantes quanto à captação de clientela e ao sensacionalismo.`

  const longText3 = `# Análise Técnica: Impactos da Reforma Trabalhista nos Contratos de Prestação de Serviços

## Tese Central

A Lei 13.467/2017 (Reforma Trabalhista) não apenas alterou relações de emprego, mas reconfigurou profundamente o regime jurídico dos contratos de prestação de serviços autônomos e empresariais, ampliando a segurança jurídica para contratantes que adotam mecanismos efetivos de governança e compliance contratual.

## Fundamentação

### 1. A Terceirização como Regra Geral

O artigo 4º-A da Lei 6.019/74, introduzido pela Reforma, estabeleceu que a terceirização é lícita para todas as atividades, inclusive a atividade-fim. Esta mudança de paradigma eliminou a distinção entre atividade-meio e atividade-fim que vigorava desde a Súmula 331 do TST.

Contudo, a licitude da terceirização não afasta o risco de reconhecimento de vínculo empregatício quando presentes os elementos do artigo 3º da CLT: pessoalidade, não eventualidade, onerosidade e subordinação.

### 2. O Trabalhador Autônomo Exclusivo

O artigo 442-B da CLT, também introduzido pela Reforma, estabelece que a contratação de autônomo, ainda que com exclusividade e continuidade, não caracteriza vínculo empregatício. Esta disposição representou um avanço significativo, afastando um dos principais argumentos utilizados pela Justiça do Trabalho para reconhecimento de vínculo.

No entanto, a jurisprudência tem exigido que a autonomia seja efetiva, não bastando a mera rotulação contratual. Em recente decisão, a 4ª Turma do TST (RR-1001234-56.2019.5.02.0001) reconheceu vínculo empregatício em caso onde o contrato de prestação de serviços previa controle de jornada e subordinação hierárquica, elementos incompatíveis com a autonomia.

### 3. Compliance Contratual como Escudo Jurídico

A experiência prática demonstra que contratantes que implementam programas robustos de compliance contratual têm obtido maior êxito na defesa de demandas trabalhistas. Elementos essenciais incluem:

- Due diligence do prestador (regularidade fiscal e constituição empresarial)
- Contrato escrito com cláusulas que evidenciem autonomia
- Ausência de subordinação hierárquica direta
- Pagamento contra nota fiscal, não contra recibo de pessoa física
- Não exclusividade formal (ainda que fática)

## Conclusão

A Reforma Trabalhista criou um ambiente mais favorável à contratação de serviços autônomos e empresariais, mas a blindagem jurídica efetiva depende da implementação de práticas de governança que evidenciem a autonomia real do prestador.

## Referências

- DELGADO, Mauricio Godinho. Curso de Direito do Trabalho. 20ª ed. São Paulo: LTr, 2023.
- MARTINEZ, Luciano. Curso de Direito do Trabalho. 14ª ed. São Paulo: Saraiva, 2023.
- BRASIL. Tribunal Superior do Trabalho. RR-1001234-56.2019.5.02.0001, 4ª Turma, Rel. Min. Alexandre Luiz Ramos, j. 15/02/2023.`

  // Piece 1: Carrossel 7 slides
  const p1Id = uuidv4()
  getDB().pieces.push({ id: p1Id, cycle_id: cycleId, tema: 'A Nova Fronteira da Responsabilidade Civil', area_direito: 'Direito Civil', channel_id: rs.id, formato: 'carrossel', status: 'em_revisao', limite_caracteres_override: null, ordem: 1, created_at: new Date().toISOString() })
  const slides1 = longText1.split('#').filter(Boolean)
  slides1.forEach((s, i) => {
    getDB().piece_contents.push({ id: uuidv4(), piece_id: p1Id, titulo_bloco: `Slide ${i+1}`, conteudo: s.trim() ? `# ${s.trim()}` : `Conteúdo do slide ${i+1}`, ordem: i+1, created_at: new Date().toISOString() })
  })

  // Piece 2: Carrossel 5 slides
  const p2Id = uuidv4()
  getDB().pieces.push({ id: p2Id, cycle_id: cycleId, tema: 'Estratégias de Comunicação Jurídica nas Redes Sociais', area_direito: 'Marketing Jurídico', channel_id: rs.id, formato: 'carrossel', status: 'em_revisao', limite_caracteres_override: null, ordem: 2, created_at: new Date().toISOString() })
  const slides2 = longText2.split('#').filter(Boolean)
  slides2.forEach((s, i) => {
    getDB().piece_contents.push({ id: uuidv4(), piece_id: p2Id, titulo_bloco: `Slide ${i+1}`, conteudo: s.trim() ? `# ${s.trim()}` : `Conteúdo do slide ${i+1}`, ordem: i+1, created_at: new Date().toISOString() })
  })

  // Piece 3: Artigo Blog
  const p3Id = uuidv4()
  getDB().pieces.push({ id: p3Id, cycle_id: cycleId, tema: 'Compliance Trabalhista na Contratação de Serviços', area_direito: 'Direito do Trabalho', channel_id: blog.id, formato: 'artigo', status: 'pendente', limite_caracteres_override: null, ordem: 3, created_at: new Date().toISOString() })
  getDB().piece_contents.push({ id: uuidv4(), piece_id: p3Id, titulo_bloco: null, conteudo: longText3, ordem: 1, created_at: new Date().toISOString() })

  // Piece 4: Análise Técnica
  const p4Id = uuidv4()
  getDB().pieces.push({ id: p4Id, cycle_id: cycleId, tema: 'Análise: Impactos da Reforma Trabalhista nos Contratos de Prestação de Serviços', area_direito: 'Direito do Trabalho', channel_id: blog.id, formato: 'analise_tecnica', status: 'pendente', limite_caracteres_override: null, ordem: 4, created_at: new Date().toISOString() })
  getDB().piece_contents.push({ id: uuidv4(), piece_id: p4Id, titulo_bloco: null, conteudo: longText3, ordem: 1, created_at: new Date().toISOString() })

  // Piece 5: Newsletter 1
  const p5Id = uuidv4()
  getDB().pieces.push({ id: p5Id, cycle_id: cycleId, tema: 'Inovações Legislativas de Junho/2026', area_direito: 'Direito Empresarial', channel_id: nl.id, formato: 'texto_email', status: 'pendente', limite_caracteres_override: null, ordem: 5, created_at: new Date().toISOString() })
  getDB().piece_contents.push({ id: uuidv4(), piece_id: p5Id, titulo_bloco: 'Assunto', conteudo: 'Inovações Legislativas e Jurisprudenciais — Junho/2026', ordem: 1, created_at: new Date().toISOString() })
  getDB().piece_contents.push({ id: uuidv4(), piece_id: p5Id, titulo_bloco: 'Pré-cabeçalho', conteudo: 'Confira as principais novidades do mês selecionadas pela equipe FGX', ordem: 2, created_at: new Date().toISOString() })
  const nlBody1 = `Prezados clientes,

O mês de junho trouxe importantes inovações legislativas e decisões relevantes dos tribunais superiores. Destacamos abaixo os principais pontos que merecem sua atenção.

## 1. STF conclui julgamento sobre terceirização

O Supremo Tribunal Federal finalizou o julgamento da ADPF 324 e do RE 958.252, com repercussão geral, reafirmando a constitucionalidade da terceirização de todas as atividades empresariais, inclusive a atividade-fim. A decisão consolida o entendimento de que a Lei 13.429/2017 é plenamente compatível com a Constituição Federal.

## 2. Nova resolução do CNJ sobre provas digitais

O Conselho Nacional de Justiça publicou a Resolução 496/2026, que estabelece diretrizes para a produção, conservação e valoração de provas digitais nos processos judiciais. A norma cria padrões mínimos de cadeia de custódia para prints de conversas, e-mails e registros de sistemas.

## 3. STJ — Repetitivo sobre plano de saúde

O STJ afetou ao rito dos recursos repetitivos a controvérsia sobre a obrigatoriedade de cobertura de tratamentos não previstos no rol da ANS (Tema 1.234). A decisão poderá impactar milhares de processos em todo o país.

Ficamos à disposição para discutir estes temas em maior profundidade.`

  getDB().piece_contents.push({ id: uuidv4(), piece_id: p5Id, titulo_bloco: 'Corpo', conteudo: nlBody1, ordem: 3, created_at: new Date().toISOString() })

  // Piece 6: Newsletter 2
  const p6Id = uuidv4()
  getDB().pieces.push({ id: p6Id, cycle_id: cycleId, tema: 'Atualização de Compliance e Governança', area_direito: 'Compliance', channel_id: nl.id, formato: 'texto_email', status: 'pendente', limite_caracteres_override: null, ordem: 6, created_at: new Date().toISOString() })
  getDB().piece_contents.push({ id: uuidv4(), piece_id: p6Id, titulo_bloco: 'Assunto', conteudo: 'FGX Compliance Alert — Julho/2026', ordem: 1, created_at: new Date().toISOString() })
  getDB().piece_contents.push({ id: uuidv4(), piece_id: p6Id, titulo_bloco: 'Pré-cabeçalho', conteudo: 'As principais atualizações de compliance e governança para seu escritório', ordem: 2, created_at: new Date().toISOString() })
  getDB().piece_contents.push({ id: uuidv4(), piece_id: p6Id, titulo_bloco: 'Corpo', conteudo: nlBody1, ordem: 3, created_at: new Date().toISOString() })

  // Add trails to 2+ pieces
  for (let i = 1; i <= 9; i++) {
    getDB().production_trails.push({
      id: uuidv4(), piece_id: p1Id, etapa: `Etapa ${i}`, descricao: i % 2 === 0 ? `Descrição da etapa ${i}` : null,
      ordem: i, created_at: new Date().toISOString(),
    })
  }
  for (let i = 1; i <= 9; i++) {
    getDB().production_trails.push({
      id: uuidv4(), piece_id: p2Id, etapa: `Fase ${i}`, descricao: i % 3 === 0 ? `Detalhe da fase ${i}` : null,
      ordem: i, created_at: new Date().toISOString(),
    })
  }

  // Reasonings
  for (let j = 1; j <= 3; j++) {
    getDB().piece_reasonings.push({ id: uuidv4(), piece_id: p1Id, titulo: `Raciocínio ${j}`, descricao: `Descrição do raciocínio ${j} para esta peça`, ordem: j, created_at: new Date().toISOString() })
    getDB().piece_reasonings.push({ id: uuidv4(), piece_id: p2Id, titulo: `Raciocínio ${j}`, descricao: `Fundamentação ${j} utilizada na construção do texto`, ordem: j, created_at: new Date().toISOString() })
  }

  // Sources
  const sourceUrls = ['https://www.stj.jus.br', 'https://www.stf.jus.br', 'https://www.planalto.gov.br', 'https://www.cnj.jus.br', 'https://www.conjur.com.br']
  for (let k = 1; k <= 5; k++) {
    getDB().sources.push({ id: uuidv4(), piece_id: p1Id, titulo: `Fonte ${k}`, url: sourceUrls[k-1], descricao: `Referência ${k} consultada`, ordem: k, created_at: new Date().toISOString() })
    if (k <= 3) getDB().sources.push({ id: uuidv4(), piece_id: p2Id, titulo: `Referência ${k}`, url: sourceUrls[k+1], descricao: `Documento de referência`, ordem: k, created_at: new Date().toISOString() })
  }

  // Comments
  getDB().comments.push({ id: uuidv4(), piece_id: p1Id, piece_content_id: getDB().piece_contents.find((pc: any) => pc.piece_id === p1Id)?.id || null, autor_nome: 'Marina S.', autor_tipo: 'cliente', texto: 'Excelente abordagem! Sugiro incluir menção ao REsp 1.850.000.', trecho: 'Artigo 927', created_at: new Date().toISOString() })
  getDB().comments.push({ id: uuidv4(), piece_id: p2Id, piece_content_id: null, autor_nome: 'Carlos F.', autor_tipo: 'cliente', texto: 'Poderíamos acrescentar dados da OAB sobre o tema.', trecho: null, created_at: new Date().toISOString() })

  // Deliverables (7, placeholder)
  const cats = ['diagnostico', 'planejamento', 'apresentacao', 'proposta', 'politica', 'material_institucional', 'relatorio_resultado']
  cats.forEach(cat => {
    getDB().deliverables.push({
      id: uuidv4(), client_id: fiedra.id, categoria: cat,
      titulo: `Entregável de ${cat.replace('_', ' ')}`,
      descricao: 'Documento placeholder para demonstração',
      versao: '1.0', storage_path: 'deliverables/placeholder.pdf',
      mime_type: 'application/pdf', tamanho_bytes: 102400,
      status: 'aprovado', created_at: new Date().toISOString(),
    })
  })

  persist()
}

app.post('/api/admin/seed-demo', async (c) => {
  const auth = await requireAdmin(c)
  if (!auth.session) return auth
  createSeedDemo()
  return c.json({ ok: true })
})

const port = 3001
console.log(`Server running on http://localhost:${port}`)
serve({ fetch: app.fetch, port })
