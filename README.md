# Portal do Cliente FGX

Plataforma onde clientes de recorrência da FGX Gestão (comunicação jurídica) acessam entregáveis macro do contrato e validam o texto das peças do ciclo editorial — com senha compartilhada por cliente, comentário por bloco e isolamento rigoroso entre clientes.

## Documentos de trabalho

| Arquivo | Uso |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Requisitos |
| [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) | Stack e dados |
| [`docs/IDENTIDADE-VISUAL.md`](docs/IDENTIDADE-VISUAL.md) | Marca FGX |
| [`PROMPT-SONNET.md`](PROMPT-SONNET.md) | Prompt inicial (já executado) |
| [`PROMPT-SONNET-CORRECAO.md`](PROMPT-SONNET-CORRECAO.md) | **Próximo prompt** — correções, UI/UX, Vercel (sem Supabase) |

> Fase atual: validar front + fluxos na Vercel com store demo. **Supabase fica para depois.**

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + TypeScript + Vite + React Router + Tailwind CSS |
| API | Hono (Node.js) em `/server` |
| Banco | JSON local (dev) / Supabase Postgres (prod) |
| Arquivos | Supabase Storage (bucket privado) |
| Testes | Vitest (unit) + Playwright (e2e) |
| i18n | 100% português do Brasil; datas dd/mm/aaaa |

## Setup rápido

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com ADMIN_SENHA_INICIAL (obrigatório)

# 3. Iniciar servidor API (porta 3001)
npm run dev:server

# 4. Em outro terminal, iniciar frontend (porta 5173)
npm run dev

# 5. Acessar
# Admin: http://localhost:5173/admin
# Cliente (ex): http://localhost:5173/c/fiedra
```

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `ADMIN_SENHA_INICIAL` | Sim | Senha inicial do admin (trocar no primeiro acesso) |
| `SUPABASE_URL` | Produção | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Produção | Chave service role do Supabase |
| `WEBHOOK_AVALIACAO_AJUSTE` | Não | URL do webhook para envio de ajustes |
| `SESSION_SECRET` | Sim | Segredo para assinatura de cookies |
| `COOKIE_SECURE` | Não | `true` em produção (HTTPS) |

## Configurando o sistema

### Primeiro acesso admin

1. Acesse `/admin` com a senha definida em `ADMIN_SENHA_INICIAL`
2. O sistema exibirá um aviso para trocar a senha inicial
3. Vá em **Senha** no menu lateral e troque a senha

### Cadastrando um cliente

1. No admin, vá em **Clientes** > **Novo cliente**
2. Preencha: nome, slug, senha (compartilhada do escritório), tom de voz, áreas-chave
3. Marque os canais contratados
4. Marque **Ativo** para liberar o acesso
5. Salve

O cliente poderá acessar em `/c/:slug` com a senha + nome da pessoa.

### Criando um ciclo editorial

1. Vá em **Ciclos** > **Novo ciclo**
2. Selecione o cliente, informe o mês de referência (YYYY-MM) e volume
3. O ciclo é criado como **rascunho** (invisível ao cliente)
4. Adicione peças e publique quando estiver pronto

### Publicando um ciclo

Na listagem de ciclos, clique em **Publicar** ao lado do ciclo em rascunho. O cliente verá o ciclo e suas peças.

### Criando peças

1. Dentro do ciclo, clique em **Nova peça**
2. Preencha tema, área do Direito, canal e formato
3. Adicione blocos de conteúdo (use "Dividir automaticamente" para quebrar por títulos)
4. Adicione trilha, raciocínios e fontes
5. Salve

### Enviando para avaliação (webhook)

1. Vá em **Ajustes**, selecione o ciclo
2. Encontre o comentário e clique em **Registrar ajuste**
3. Escolha pontual ou estrutural
4. Configure `WEBHOOK_AVALIACAO_AJUSTE` no `.env`
5. O sistema monta o JSON (cliente, peça, conteúdo integral, comentário) e envia ao webhook
6. Se a env var estiver ausente, o JSON fica disponível para download

### Ajuste estrutural → aditivo

Ajustes estruturais geram documentos aditivos em **Aditivos** no menu. É possível editar o conteúdo e exportar `.md`.

## Seed de demonstração

```bash
# Via API (servidor rodando)
curl -X POST http://localhost:3001/api/admin/seed-demo

# Ou no admin: Dashboard > Apagar ciclo demo (Fiedra)
```

O seed cria:

- 3 clientes (`fgb`, `fiedra`, `rsta`) sem senha, inativos
- Canais: Redes Sociais, Blog, Newsletter, Vídeo
- Ciclo demo `fiedra` 2026-06 publicado com 6 peças:
  - 2 carrosséis (7 e 5 slides)
  - 1 artigo blog
  - 1 análise técnica
  - 2 newsletters
- Textos longos (4.000+ caracteres)
- Trilha 9 etapas em 2 peças
- 2-3 raciocínios por peça
- 3-5 fontes com URL
- Comentários de exemplo
- 7 entregáveis placeholder

### Para usar o seed:

1. Acesse o admin e defina senha para o cliente `fiedra` (em Clientes > Editar)
2. Marque como **Ativo**
3. Execute o seed via botão no Dashboard ou API
4. Acesse `/c/fiedra` com a senha configurada

## Estrutura do projeto

```
/
  src/                    # Frontend React
    components/           # Componentes compartilhados
    hooks/                # Hooks (useAuth, useToast)
    lib/                  # API client, utilitários
    pages/                # Páginas (cliente + admin)
      admin/              # Portal admin
    types/                # TypeScript types
  server/                 # API Hono
    index.ts              # Servidor + rotas
    db.ts                 # Banco em JSON (dev)
  supabase/
    migrations/           # Migrations SQL
  tests/
    unit/                 # Vitest
    e2e/                  # Playwright
  docs/                   # PRD, Arquitetura, Identidade Visual
```

## Testes

```bash
# Unitários
npm test

# E2E (requer servidor rodando)
npx playwright install --with-deps chromium
npm run test:e2e
```

### Testes obrigatórios

1. **Fidelidade**: cadastra peça com ~8.000 chars e verifica renderização integral (sem truncamento, "ver mais", reticências)
2. **Isolamento**: sessão cliente A tenta acessar dados do B — deve falhar
3. **Persistência**: grava comentário, recarrega página, confere autor, data e trecho

## Modelo de dados

Consultar `supabase/migrations/` e `docs/ARQUITETURA.md` para o esquema completo com 16 tabelas, enums e índices.

## Segurança

- Senhas com hash bcrypt (nunca no bundle frontend)
- Cookie httpOnly, SameSite=Lax, 30 dias
- `client_id` sempre derivado da sessão, nunca do body/query/URL
- RLS configurável no Postgres para produção
- Nenhuma chave ou secret no frontend

## Deploy

Para deploy em produção:

1. Provisione um projeto Supabase
2. Execute as migrations em `supabase/migrations/`
3. Configure as variáveis de ambiente no `.env` de produção
4. Substitua o armazenamento JSON em `server/db.ts` pelo cliente Supabase
5. Faça deploy do frontend na Vercel/Netlify
6. Faça deploy do servidor como Edge Function ou servidor Node.js
