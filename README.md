# Portal do Cliente FGX

Plataforma onde clientes de recorrência da FGX Gestão (comunicação jurídica) acessam entregáveis macro do contrato e validam o texto das peças do ciclo editorial — com senha compartilhada por cliente, comentário por bloco e isolamento rigoroso entre clientes.

**Deploy:** https://fgx-central-clientes-nay.vercel.app

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + TypeScript + Vite + React Router + Tailwind CSS |
| API | Hono (Node.js) em `/backend`, serverless na Vercel via `/api` |
| Banco | Em memória (JSON opcional em disco local). Schema + RLS + Edge Functions já em `supabase/` — ver [docs/GO-LIVE.md](docs/GO-LIVE.md). |
| Arquivos | Vercel Blob (produção demo) / Storage Supabase no go-live |
| Testes | Vitest (unit: blocos, sanitização, …) + Playwright (e2e) |
| i18n | 100% português do Brasil; datas dd/mm/aaaa |

## Documentação

- [docs/GO-LIVE.md](docs/GO-LIVE.md) — checklist para ligar Supabase
- [docs/HANDOFF-CLAUDE.md](docs/HANDOFF-CLAUDE.md) — decisões de auth/RLS do pacote produto
- [docs/ARQUITETURA.md](docs/ARQUITETURA.md) · [docs/PRD.md](docs/PRD.md) · [docs/PADRAO-DESIGN.md](docs/PADRAO-DESIGN.md)

## Credenciais demo (ambiente de validação)

**Admin:** `/admin` — senha: `fgxadmin2026`

**Cliente Fiedra:** `/c/fiedra` — senha: `fiedra2026` (nome livre)

A Fiedra já vem ativa com ciclo demo publicado (junho/2026, 6 peças, 7 entregáveis). Os demais clientes (`fgb`, `rsta`) estão criados mas sem senha e inativos — configure no admin.

> Estas credenciais são para validação da demo. Troque-as em produção.

## Setup local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite se quiser trocar a senha admin inicial

# 3. Iniciar servidor API (porta 3001)
npm run dev:server

# 4. Em outro terminal, iniciar frontend (porta 5173)
npm run dev

# 5. Acessar
# Admin: http://localhost:5173/admin (senha: fgxadmin2026)
# Cliente: http://localhost:5173/c/fiedra (senha: fiedra2026)
```

## Deploy Vercel

### Variáveis de ambiente (configurar no dashboard da Vercel)

| Variável | Descrição |
|---|---|
| `ADMIN_SENHA_INICIAL` | Senha inicial do admin (ex.: `fgxadmin2026`) |
| `SESSION_SECRET` | Segredo para cookies de sessão |
| `COOKIE_SECURE` | `true` em produção (força cookie Secure) |
| `WEBHOOK_AVALIACAO_AJUSTE` | URL do webhook (opcional) |
| `BLOB_READ_WRITE_TOKEN` | Token do Vercel Blob para upload/download de arquivos |
| `DEMO_CLIENT_SENHA` | Senha do cliente demo (ex.: `fiedra2026`) |

### Build

O build é automático na Vercel:

```bash
npm run build   # compila frontend + esbuild da API
```

- `vercel.json` faz rewrite de `/api/*` → função serverless em `/api/index.js`
- Frontend servido como SPA em `/dist`

### Estrutura de deploy

```
/api/index.js        # Bundle da API Hono (gerado por esbuild)
/dist/               # Build do Vite (SPA)
vercel.json          # Rewrites
```

## Configurando o sistema

### Primeiro acesso admin

1. Acesse `/admin` com a senha em `ADMIN_SENHA_INICIAL` (ou `fgxadmin2026` default)
2. O sistema mostra aviso para trocar a senha inicial
3. Vá em **Senha** no menu e troque

### Cadastrando cliente

1. Admin > **Clientes** > **Novo cliente**
2. Preencha nome, slug, senha (compartilhada), tom de voz, áreas-chave
3. Marque os canais contratados e **Ativo**
4. O cliente acessa em `/c/:slug`

### Criando ciclo e peças

1. Admin > **Ciclos** > **Novo ciclo**
2. Selecione cliente, mês (YYYY-MM), volume
3. Ciclo criado como **rascunho** → adicione peças → **Publicar**
4. Cliente vê ciclos publicados/encerrados

### Upload de entregáveis

1. Admin > **Entregáveis** > **Novo entregável**
2. Selecione cliente, categoria e faça upload do arquivo
3. Local: salvo em `server/uploads/` (gitignored)
4. Vercel: usa Vercel Blob (configure `BLOB_READ_WRITE_TOKEN`)

### Seed demo

O seed roda automaticamente no boot. Para manual:

```
POST /api/admin/seed-demo  (requer sessão admin)
```

Cria ciclo Fiedra 2026-06 com 6 peças, textos longos, comentários, trilha, raciocínios, fontes e 7 entregáveis.

**Apagar demo:** No Dashboard admin > botão "Apagar ciclo demo (Fiedra)"

## Testes

```bash
# Unitários
npm test                # 5/5 passam

# E2E (requer servidor rodando)
npx playwright install --with-deps chromium
npm run test:e2e
```

### Testes obrigatórios

| Teste | Descrição |
|---|---|
| **Fidelidade** | Texto integral renderizado sem truncamento, "ver mais" ou overflow:hidden |
| **Isolamento** | Sessão cliente A não consegue ler dados do cliente B |
| **Persistência** | Comentário sobrevive a reload com autor e texto corretos |

## Modelo de dados

16 tabelas documentadas em `supabase/migrations/001_initial_schema.sql` (referência para próxima fase com Supabase). Atualmente o runtime usa armazenamento em memória.

## Roadmap — Próxima fase (Supabase)

- Substituir store em memória por Supabase Postgres
- Implementar RLS para isolamento adicional entre clientes
- Supabase Storage para arquivos (substituir Vercel Blob)
- Migrations aplicadas via `supabase migration up`
- Autenticação sem depender de sessão em memória

## Segurança

- Senhas com hash bcrypt (nunca no bundle frontend)
- Cookie HttpOnly, SameSite=Lax, 30 dias. Secure em produção.
- `client_id` sempre da sessão — nunca de body/query/URL
- Nenhuma chave ou secret exposta no frontend
- `.env` nunca commitado

## Documentação

| Doc | Conteúdo |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Requisitos |
| [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) | Stack e dados |
| [`docs/IDENTIDADE-VISUAL.md`](docs/IDENTIDADE-VISUAL.md) | Marca FGX |
| [`docs/PADRAO-DESIGN.md`](docs/PADRAO-DESIGN.md) | **Piso visual** (Central de Entregas SBP) |
| [`PROMPT-SONNET-CORRECAO.md`](PROMPT-SONNET-CORRECAO.md) | Prompt de correção / UI para Sonnet |
