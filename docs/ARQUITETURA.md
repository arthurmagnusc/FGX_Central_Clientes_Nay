# Arquitetura — Portal do Cliente FGX

## 1. Visão geral

```
┌─────────────────────────┐     ┌─────────────────────────┐
│  Portal Cliente         │     │  Portal Admin           │
│  /c/:slug               │     │  /admin                 │
└───────────┬─────────────┘     └───────────┬─────────────┘
            │                               │
            └───────────────┬───────────────┘
                            ▼
                 React + TypeScript + Vite
                 React Router + Tailwind
                            │
                            ▼
              API (Supabase Edge Functions
              ou server Hono/Express em /server)
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
     Postgres          Storage          Webhook
     (Supabase)        (privado)     WEBHOOK_AVALIACAO
     + RLS
```

## 2. Stack travada (v1)

| Camada | Escolha | Motivo |
|---|---|---|
| Frontend | React 18+ · TypeScript · Vite · React Router · Tailwind | Igual ao brief; DX local |
| Banco | **Supabase Postgres** (go-live) · Hono in-memory (demo atual) | RLS real entre clientes; migrations versionadas em `supabase/migrations/` (vocabulário PT) |
| Arquivos | **Supabase Storage** (privado) no go-live | Download só via Edge Functions autenticadas |
| API | **Edge Functions** no go-live · `backend/` Hono na demo Vercel | Auth, CRUD, upload/download, webhook |
| Auth | JWT + claims RLS (go-live) · sessão Hono (demo) | Senha compartilhada por cliente; ver `docs/HANDOFF-CLAUDE.md` |
| Testes | Vitest + Playwright (e2e fidelidade/isolamento/persistência) | Aceite do PRD |
| Observabilidade | Sentry (opcional, `SENTRY_DSN`) | Erros de frontend |
| Deploy alvo | Vercel (front) + Supabase (back) | Checklist em `docs/GO-LIVE.md` |

**Modo atual:** demo com Hono. Ligar Supabase quando as env `VITE_SUPABASE_*` e secrets das Functions estiverem prontas (`src/lib/dataMode.ts`).

**Não usar:** Firebase, Netlify Database/Blobs (salvo se explicitamente pedido depois), senha no frontend, URLs públicas de arquivo.

## 3. Modelo de dados

Tabelas (Postgres), com FKs e índices:

| Tabela | Papel |
|---|---|
| `client` | Empresa cliente: slug, senha_hash, tom_de_voz, areas_chave, regra_base_ref, ativo |
| `admin_user` | Admin FGX |
| `session` | token, client_id?, admin_id?, pessoa_nome?, expira_em |
| `deliverable` | Entregável macro + blob_key/storage_path + versão + status |
| `cycle` | Ciclo editorial por mês_referencia |
| `channel` | redes_sociais, blog, newsletter, video + limite_caracteres_padrao |
| `client_channel` | Canais contratados por cliente |
| `piece` | Peça: tema, area_direito, canal, formato, status, limite override, ordem |
| `piece_reasoning` | Raciocínios da produção |
| `piece_content` | Blocos de texto integral (`TEXT`) |
| `comment` | Comentário de peça ou bloco; autor_nome da sessão |
| `approval` | aprovou / solicitou_ajuste |
| `adjustment` | pontual / estrutural + status_avaliacao |
| `production_trail` | Etapas da trilha |
| `source` | Fontes consultadas |
| `additive_doc` | Documento aditivo (ajuste estrutural) |
| `adjustment_dispatch` *(recomendado)* | Log de envios ao webhook (data, destino, resultado) |

Enums e status: ver PRD e tabela de pílulas em `IDENTIDADE-VISUAL.md`.

### Isolamento

1. Cookie de sessão → resolve `client_id`.
2. Toda query de dados do cliente filtra por esse `client_id`.
3. RLS no Postgres como segunda barreira (policies por `client_id` derivado de claim/sessão, ou service role só no server com checks manuais obrigatórios).
4. Teste e2e: sessão do cliente A tenta ler B → deve falhar.

## 4. Rotas frontend

| Rota | Quem | Função |
|---|---|---|
| `/c/:slug` | Público → autenticado | Login cliente |
| `/c/:slug/entregaveis` | Cliente | Biblioteca |
| `/c/:slug/ciclo` | Cliente | Home do ciclo |
| `/c/:slug/ciclo/:cycleId/peca/:pieceId` | Cliente | Página da peça |
| `/admin` | Admin | Login |
| `/admin/*` | Admin | Clientes, entregáveis, ciclos, peças, comentários, ajustes, aditivos |

## 5. Contratos de API (mínimo)

Todas as rotas de cliente exigem sessão cliente; admin exige sessão admin.

- `POST /auth/client/login` — slug + senha + nome → cookie
- `POST /auth/client/rename` — troca pessoa_nome
- `POST /auth/logout`
- `POST /auth/admin/login`
- `GET /client/me` — perfil + canais
- `GET /client/deliverables` · `GET /client/deliverables/:id/download`
- `GET /client/cycles` · `GET /client/cycles/:id` · `GET /client/pieces/:id`
- `POST /client/pieces/:id/comments` · `POST /client/pieces/:id/approvals`
- Admin CRUD espelhado + `POST /admin/adjustments/:id/dispatch` + export aditivo

## 6. Estrutura de pastas sugerida

```
/
  apps/web/                 # Vite React
  supabase/
    migrations/
    functions/
  docs/
  README.md
  PROMPT-SONNET.md
```

Alternativa monólito simples:

```
/
  src/                      # frontend
  server/                   # Hono API
  supabase/migrations/
```

## 7. Variáveis de ambiente

```
SUPABASE_URL=
SUPABASE_ANON_KEY=          # só se usado com RLS estrito; preferir service no server
SUPABASE_SERVICE_ROLE_KEY=  # somente server / Edge Functions
ADMIN_SENHA_INICIAL=
WEBHOOK_AVALIACAO_AJUSTE=   # opcional
SENTRY_DSN=                 # opcional
SESSION_SECRET=
COOKIE_SECURE=true
```

Nenhuma dessas chaves no bundle do frontend.

## 8. Seed de demonstração

- 3 clientes (`fgb`, `fiedra`, `rsta`) sem senha, inativos até admin configurar
- Canais seed + `client_channel`
- Ciclo demo `fiedra` 2026-06 publicado, 6 peças (2 carrosséis 7 e 5 slides, artigo, análise, 2 newsletters)
- Textos longos (≥4.000 chars em peças corridas, 5–8 blocos)
- Trilha 9 etapas em ≥2 peças; 2–3 raciocínios; 3–5 fontes
- Comentários de exemplo (incl. por bloco)
- 7 entregáveis (1 por categoria) — PDF placeholder no Storage
- No admin: marcar como demo + botão apagar ciclo demo inteiro

## 9. Ordem de implementação

1. Migrations + seed canais/clientes  
2. Auth (cliente + admin) + cookie + isolamento  
3. Portal cliente: entregáveis + download  
4. Portal cliente: ciclo + peça (formatos + fidelidade)  
5. Comentários / aprovação  
6. Admin completo  
7. Ajustes + aditivo + webhook  
8. Testes e2e + README + polish visual FGX  
