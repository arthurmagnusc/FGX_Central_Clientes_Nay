import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import fs from 'node:fs'
import path from 'node:path'

const DB_FILE = path.join(process.cwd(), 'server', 'db.json')
const UPLOADS_DIR = path.join(process.cwd(), 'server', 'uploads')
let db: any = null

// In-memory file store for serverless fallback
const memoryStore: Map<string, { buffer: Buffer; mimeType: string }> = new Map()

try {
  if (fs.existsSync(DB_FILE)) {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'))
  }
} catch {}

if (!db) {
  db = {
    clients: [],
    admin_users: [],
    sessions: [],
    channels: [],
    client_channels: [],
    cycles: [],
    deliverables: [],
    pieces: [],
    piece_contents: [],
    piece_reasonings: [],
    comments: [],
    approvals: [],
    adjustments: [],
    production_trails: [],
    sources: [],
    additive_docs: [],
    adjustment_dispatches: [],
  }
}

function save() {
  // Em serverless (Vercel) o FS é efêmero/read-only — mantém só memória
  if (process.env.VERCEL || process.env.FGX_MEMORY_DB === '1') return
  try {
    const dir = path.dirname(DB_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
  } catch {
    // ignore persist errors in constrained environments
  }
}

export function getDB() { return db }
export function persist() { save() }

export async function storeFile(key: string, buffer: Buffer, mimeType: string): Promise<void> {
  // Vercel: Vercel Blob (if env configured)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import('@vercel/blob')
      await put(key, buffer, { access: 'public', contentType: mimeType })
      return
    } catch { /* fall through to memory */ }
  }
  // Local: disk
  if (!process.env.VERCEL) {
    try {
      const dir = path.join(UPLOADS_DIR, path.dirname(key))
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(path.join(UPLOADS_DIR, key), buffer)
      return
    } catch { /* fall through to memory */ }
  }
  // Memory fallback
  memoryStore.set(key, { buffer, mimeType })
}

export async function getFile(key: string): Promise<Buffer> {
  // Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { head } = await import('@vercel/blob')
      const blob = await head(key)
      if (blob) {
        const res = await fetch(blob.url)
        const ab = await res.arrayBuffer()
        return Buffer.from(ab)
      }
    } catch { /* fall through */ }
  }
  // Local disk
  const filePath = path.join(UPLOADS_DIR, key)
  if (!process.env.VERCEL && fs.existsSync(filePath)) {
    return fs.readFileSync(filePath)
  }
  // Memory
  const entry = memoryStore.get(key)
  if (entry) return entry.buffer
  throw new Error('File not found')
}

export function hashPassword(pwd: string): string {
  return bcrypt.hashSync(pwd, 10)
}

export function verifyPassword(pwd: string, hash: string): boolean {
  return bcrypt.compareSync(pwd, hash)
}

export function generateToken(): string {
  return uuidv4()
}

export function createSession(clientId: string | null, adminId: string | null, pessoaNome: string | null): string {
  const token = generateToken()
  const expira = new Date()
  expira.setDate(expira.getDate() + 30)
  db.sessions.push({
    id: uuidv4(), token, client_id: clientId, admin_id: adminId,
    pessoa_nome: pessoaNome, expira_em: expira.toISOString(), created_at: new Date().toISOString(),
  })
  save()
  return token
}

export function getSession(token: string) {
  const s = db.sessions.find((s: any) => s.token === token)
  if (!s) return null
  if (new Date(s.expira_em) < new Date()) return null
  return s
}

export function deleteSession(token: string) {
  db.sessions = db.sessions.filter((s: any) => s.token !== token)
  save()
}

export function updateSessionName(token: string, nome: string) {
  const s = db.sessions.find((s: any) => s.token === token)
  if (s) { s.pessoa_nome = nome; save() }
}

// Seed data
export function seed() {
  if (db.channels.length > 0) return

  db.channels = [
    { id: uuidv4(), slug: 'redes_sociais', nome: 'Redes Sociais', limite_caracteres_padrao: 2200 },
    { id: uuidv4(), slug: 'blog', nome: 'Blog', limite_caracteres_padrao: 6000 },
    { id: uuidv4(), slug: 'newsletter', nome: 'Newsletter', limite_caracteres_padrao: 4000 },
    { id: uuidv4(), slug: 'video', nome: 'Vídeo', limite_caracteres_padrao: 3000 },
  ]

  db.clients = [
    { id: uuidv4(), nome: 'Freire, Gerbasi e Bittencourt', slug: 'fgb', senha_hash: null, tom_voz: null, areas_chave: null, regra_base_ref: null, ativo: false, created_at: new Date().toISOString() },
    { id: uuidv4(), nome: 'Fiedra, Britto e Ferreira Neto', slug: 'fiedra', senha_hash: null, tom_voz: null, areas_chave: null, regra_base_ref: null, ativo: false, created_at: new Date().toISOString() },
    { id: uuidv4(), nome: 'Reis, Souza, Takeishi e Arsuffi', slug: 'rsta', senha_hash: null, tom_voz: null, areas_chave: null, regra_base_ref: null, ativo: false, created_at: new Date().toISOString() },
  ]

  // Assign channels to clients
  for (const client of db.clients) {
    const channelSlugs = client.slug === 'fiedra'
      ? ['redes_sociais', 'blog', 'newsletter']
      : ['redes_sociais', 'blog', 'newsletter', 'video']
    for (const slug of channelSlugs) {
      const ch = db.channels.find((c: any) => c.slug === slug)
      if (ch) {
        db.client_channels.push({
          id: uuidv4(), client_id: client.id, channel_id: ch.id,
          channel: ch,
        })
      }
    }
  }

  const adminSenha = process.env.ADMIN_SENHA_INICIAL || 'fgxadmin2026'
  db.admin_users = [{
    id: uuidv4(), nome_usuario: 'admin',
    senha_hash: hashPassword(adminSenha),
    senha_inicial: true, created_at: new Date().toISOString(),
  }]

  // Demo validation phase: fiedra already usable without manual setup
  const fiedra = db.clients.find((c: any) => c.slug === 'fiedra')
  if (fiedra) {
    fiedra.senha_hash = hashPassword(process.env.DEMO_CLIENT_SENHA || 'fiedra123')
    fiedra.ativo = true
  }

  save()
}
