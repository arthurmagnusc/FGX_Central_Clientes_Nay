# Go-live — Portal do Cliente FGX

Checklist para ligar o Supabase e colocar o produto em produção.
Hoje o app roda em **modo demo** (Hono + seed em memória/JSON). O schema,
Edge Functions e libs de domínio já estão no repositório, prontos para ativar.

## Estado atual vs. alvo

| Camada | Agora (demo) | Go-live (produto) |
|---|---|---|
| Auth | Cookie/sessão Hono | Edge Functions `entrar` / `entrar-admin` + JWT |
| Dados | `backend/` in-memory | Postgres Supabase + RLS (`supabase/migrations/`) |
| Front | React + Vite (este repo) | Mesmo front; troca `api` → PostgREST + Functions |
| Arquivos | Demo / Vercel Blob opcional | Storage privado + `baixar-entregavel` / `baixar-relatorio` |
| Deploy | Vercel (front + `api/index.js`) | Vercel (front) + Supabase (DB + Functions) |

Schema canônico (PT): `supabase/migrations/0001`–`0003`.  
Migrations antigas em inglês ficaram em `supabase/legacy-en/` (não aplicar).

## Pré-requisitos

1. Projeto Supabase criado (região próxima dos usuários).
2. CLI: `npx supabase login` e `npx supabase link --project-ref <ref>`.
3. Domínio do portal definido (ex.: `portal.fgxgestao.com`) para CORS.
4. Em produção, defina a secret `ORIGENS_PERMITIDAS` com esse domínio. Sem ela, as Functions só liberam CORS de `localhost` (Vite) — nunca deixe produção assim.

## 1. Banco

```bash
npx supabase db push
# ou: aplicar 0001_schema.sql → 0002_rls.sql → 0003_permissoes.sql no SQL Editor
```

Opcional: `supabase/seed.sql` (canais + dados de exemplo).  
Validar RLS: `supabase/testes_rls_leitura.sql` e `testes_rls_escrita.sql` (ver `README-testes-rls.md`).

## 2. Secrets das Edge Functions

Criar `.env.functions` (não commitar) a partir de:

```
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...   # Settings → API → JWT Secret
ORIGENS_PERMITIDAS=https://portal.fgxgestao.com,http://localhost:5173
WEBHOOK_AVALIACAO_AJUSTE=
```

```bash
npx supabase secrets set --env-file .env.functions
npx supabase functions deploy entrar
npx supabase functions deploy entrar-admin
npx supabase functions deploy enviar-ajuste
npx supabase functions deploy baixar-entregavel
npx supabase functions deploy baixar-relatorio
```

## 3. Admin e senha do cliente

```bash
node scripts/criar-admin.mjs
node scripts/definir-senha-cliente.mjs
```

Ativar o cliente (`ativo = true`) e garantir `senha_hash` preenchido.

## 4. Frontend (env)

No Vercel / `.env.local`:

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_FUNCTIONS_URL=https://<ref>.supabase.co/functions/v1
```

Quando essas variáveis existirem, o front passa a usar Supabase (camada em
`src/lib/` + troca gradual de `api.ts`). Até lá, continua o Hono demo.

## 5. Storage

- Buckets privados para entregáveis e relatórios.
- Políticas: só service role nas Functions de download; nunca URL pública.

## 6. Cutover sugerido

1. Subir schema + RLS + seed mínimo (canais).
2. Deploy das 5 Functions; testar `entrar` e `entrar-admin` com curl.
3. Rodar scripts de admin/senha; login manual no staging.
4. Ligar env `VITE_*` no preview Vercel; validar Visão / Entregas / Conteúdos / Peça.
5. Testes de isolamento (dois clientes, um não vê o outro).
6. DNS + `ORIGENS_PERMITIDAS` de produção.
7. Desligar ou isolar a API Hono demo (`api/index.js`) quando o front não depender mais dela.

## 7. O que já está pronto no repo

- Migrations PT + RLS + grants
- Edge Functions (auth, download, webhook de ajuste)
- Libs de domínio: `blocos.ts`, `sanitizar.ts`, `formato.ts`, `tipos.ts`
- Testes unitários de blocos e sanitização
- Scripts de manutenção de senha
- Shells de cliente e admin alinhados ao protótipo HTML
- Handoff Claude: `docs/HANDOFF-CLAUDE.md`

## 8. Não fazer no cutover

- Não reaplicar `supabase/legacy-en/`.
- Não colocar `SERVICE_ROLE` ou `JWT_SECRET` no front.
- Não filtrar `cliente_id` no front “por precaução” — o isolamento é RLS.
- Não usar as aprovações como prova jurídica sem login individual (ver HANDOFF).
