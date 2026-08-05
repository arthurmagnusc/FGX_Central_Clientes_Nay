# PROMPT SONNET — Correção, UI/UX e deploy Vercel (sem Supabase ainda)

> **Deploy já no ar:** https://fgx-central-clientes-nay.vercel.app  
> GitHub: https://github.com/arthurmagnusc/FGX_Central_Clientes_Nay  
> API: `api/index.js` (bundle Hono Node via esbuild a partir de `backend/vercel-entry.ts`) + rewrite `/api/*` → `/api`.  
> Complete UI/UX, uploads reais, testes e polish; mantenha o deploy Vercel **verde**.  
> **NÃO conecte Supabase nesta rodada.**  
> Cole este arquivo **inteiro** como única mensagem numa conversa nova com o Sonnet, neste repositório.

Documentos: `docs/PRD.md`, `docs/ARQUITETURA.md`, `docs/IDENTIDADE-VISUAL.md`, `docs/PADRAO-DESIGN.md` (**piso visual**), `PROMPT-SONNET.md` (brief original).

---

## Missão

Transforme o Portal do Cliente FGX de “esqueleto utilizável” em **produto demo-ready**:

1. Corrigir todos os bloqueadores e gaps listados abaixo (exceto Supabase).
2. Redesign até o **padrão mínimo** de `docs/PADRAO-DESIGN.md` (Central de Entregas SBP) — identidade FGX, acabamento da referência.
3. Tornar o app deployável e estável na **Vercel** (front + API).
4. Seed demo rico e utilizável sem setup manual penoso.
5. Testes e2e que **falham de verdade** se o requisito quebrar.

Não peça permissão arquivo a arquivo. Não diga “completo” sem checklist verde. Commits claros.

---

## Fora de escopo nesta rodada

- Conectar Supabase Postgres / Storage / RLS  
- Netlify Database/Blobs  
- Login por e-mail / OAuth  
- Upload de imagem nas peças / aprovação de arte  
- Separar Instagram e LinkedIn  

Deixe migrations em `supabase/` como estão (referência futura). Não delete. Só **não dependa** delas no runtime agora.

---

## Parte A — Bugs e gaps obrigatórios

### A1. Persistência demo (sem Supabase)

- Mantenha store em memória + seed no boot (e/ou JSON em disco no `npm run dev:server` local).
- Na Vercel (serverless), use store **em memória com seed automático** a cada cold start **OU** Vercel KV / outro storage efêmero simples — documente a escolha.
- Garanta: após deploy, admin e cliente demo funcionam sem passos manuais obscuros.
- **Nunca** commitar `.env` nem senhas reais de produção.

### A2. Upload e download de entregáveis (real o suficiente para demo)

Hoje o download devolve `placeholder.example.com` e o upload não guarda bytes.

Implemente storage local/demo:

- Local: pasta `server/uploads/` (gitignored)  
- Vercel: **Vercel Blob** (preferível) **ou** base64 no store em memória só para demos pequenas  

Download **sempre** autenticado (sessão cliente dono do arquivo ou admin). Nunca URL pública adivinhável. Servir bytes com `Content-Disposition` e mime corretos.

### A3. Ajustes visíveis no portal do cliente

Na página da peça (`ClientePeca`), exibir seção **Ajustes** quando houver registros:

- descrição, tipo (pontual/estrutural), status, vínculo ao comentário de origem  
- seções vazias não aparecem  

API cliente deve devolver adjustments da peça com isolamento por `client_id` da sessão.

### A4. Layouts por formato (não só blocos genéricos)

Renderização distinta e cuidada:

| Formato | Comportamento visual |
|---|---|
| `carrossel` | “Slide X de Y”, contagem de chars por slide, tipografia confortável, **sem** simular arte |
| `artigo` | Hierarquia título / subtítulo / corpo |
| `analise_tecnica` | Bloco de **tese** no topo + corpo + bloco final de **referências** |
| `texto_email` | Assunto em destaque, pré-cabeçalho, corpo |
| `roteiro_video` | “Cena X de Y” + marcação + fala |

Comentário por bloco permanece, com rótulos certos (slide / cena / trecho).

### A5. Fidelidade de conteúdo

- Conteúdo integral, sem truncar, sem “ver mais”, sem max-height enganoso.
- Markdown básico ok, mas sanitização **não pode remover conteúdo legítimo**.
- Preferir renderização que preserve o texto cadastrado; se usar `marked`, garanta que o teste de fidelidade valide o texto visível de forma rigorosa (não só `length > 100`).
- Limite de chars só sinaliza overflow — nunca corta.

### A6. Auth / cookies / isolamento

- Cookie: `HttpOnly`, `SameSite=Lax`, 30 dias; `Secure` quando `COOKIE_SECURE=true` ou em produção.
- `client_id` **sempre** da sessão — nunca de body/query/URL.
- Corrigir rota `seed-demo` duplicada (só uma).
- Corrigir className quebrado do tipo literal `pill-status-{...}` (usar template string).
- Seed-demo e rotas admin sensíveis exigem sessão admin.

### A7. Testes e2e de verdade

Reescreva:

1. **Fidelidade** — peça com texto longo conhecido (~8k chars com acentos, listas, markdown); ler na UI; assert forte (conteúdo presente na íntegra / comparação séria). Deve falhar se truncar.
2. **Isolamento** — sessão A tenta ler peça/ciclo/entregável de B por ID → 403/404. **Zero** asserts tautológicos (`|| true`).
3. **Persistência** — comenta, reload, confere autor + texto + trecho/bloco.

Scripts `npm test` e `npm run test:e2e` documentados. E2e devem setupar senha/ativo do cliente via API autenticada de admin, não depender de milagres.

### A8. README

Atualizar para: local, Vercel, seed demo, senhas demo, o que ainda falta (Supabase na próxima fase). Remover instruções contraditórias (ex.: “POST seed-demo sem auth” se a rota exige admin).

---

## Parte B — UI/UX: padrão mínimo obrigatório (prioridade máxima)

**Referência de piso visual (não negociável):**  
[`docs/PADRAO-DESIGN.md`](docs/PADRAO-DESIGN.md) + screenshot [`docs/assets/padrao-central-entregas-sbp.png`](docs/assets/padrao-central-entregas-sbp.png)  
Artifact: https://claude.ai/public/artifacts/4a11b4f8-b0af-467a-8337-0850046fc77b  

Tokens de cor/fonte: `docs/IDENTIDADE-VISUAL.md`. **Não** inventar outra marca.  
Se a UI ficar abaixo desse padrão, a rodada **não está aceita**.

### O que copiar da referência (Central de Entregas SBP)

- Header **branco** + navegação textual + **filete vermelho** fino (não hero vermelho em tela cheia).
- Fundo cinza claro; cartões brancos com sombra suave e raio ~12px.
- Título de página grande + contexto (pill/avatar) + status pill + parágrafo curto.
- **Cards de entregável/peça em duas zonas:**
  - topo: fundo bege com listras sutis, badge de tipo, ícone + número/etapa em vermelho + rótulo em caixa alta;
  - corpo: status, título, descrição, meta (tipo/tamanho), **dois botões** (Abrir vermelho + Baixar outline).
- Grid 3 colunas no desktop; 1 no mobile.
- Tipografia Titillium (títulos/números) + Montserrat (corpo).
- Muita respiração — portal jurídico sóbrio, nunca “dashboard lotado”.

### Telas a redesenhar até bater o padrão

1. **Login cliente/admin** — composição limpa; credenciais demo visíveis e elegantes.  
2. **Entregáveis** — **deve parecer a referência** (cards Abrir/Baixar).  
3. **Ciclo + cards de peça** — mesma linguagem visual.  
4. **Página da peça** — leitura editorial; comentário por bloco discreto; histórico lateral no desktop.  
5. **Admin** — mesmos tokens/botões; densidade ok, sem planilha crua.

### Micro UX

- “Não sou eu”, navegação anterior/próxima, contador de chars com semântica visual  
- Loading skeleton, empty states, toasts, retry de comentário  
- 2–3 motions sutis (entrada, toast, expandir) — sem excesso  

---

## Parte C — Deploy Vercel (obrigatório)

Faça o app rodar na Vercel **nesta rodada**:

1. Unificar front + API num deploy Vercel (ex.: Vite build + Hono como serverless `/api/*`, ou estrutura equivalente limpa).
2. `vercel.json` (rewrites do SPA + API) correto.
3. Variáveis de ambiente documentadas no README e `.env.example`:
   - `ADMIN_SENHA_INICIAL`
   - `SESSION_SECRET`
   - `COOKIE_SECURE` (true em prod)
   - `WEBHOOK_AVALIACAO_AJUSTE` (opcional)
   - credenciais Blob se usar Vercel Blob
4. Seed automático no boot da API em produção (clientes `fgb`/`fiedra`/`rsta`, canais, admin, ciclo demo fiedra publicado com peças longas).
5. Senhas demo documentadas no README (ex.: admin + `fiedra` ativos para validação pública da demo — deixe explícito que é ambiente de validação).
6. Proxy local (`vite` → API) continua funcionando com `npm run dev` + `npm run dev:server` **ou** um único comando `npm run dev` se unificar.

Se precisar alterar a estrutura de pastas para Vercel, faça — mas preserve clareza.

**Entrega de deploy:** após push, o projeto deve buildar na Vercel. Se o link de produção já existir no repo, garanta build verde. Documente URL esperada e passos de env na Vercel.

---

## Parte D — Avançar tudo o que puder (além do mínimo)

Com o tempo restante, avance na ordem:

1. Polish visual fino (espaçamento, tipografia, empty/loading) em **todas** as telas admin  
2. Comentários consolidados no admin mais usáveis (filtros, registrar ajuste inline)  
3. Fluxo aditivo estrutural + export `.md` polido  
4. Webhook/download JSON com histórico visível na UI do ajuste  
5. “Dividir em blocos automaticamente” mais inteligente e reorder por drag se viável  
6. Acessibilidade básica (contraste, focus ring, `aria` em modais)  
7. Performance percebida (lazy das seções pesadas da peça)  

Não invente features fora do PRD. Aprofunde o que já está no escopo.

---

## Ordem de execução sugerida

1. Deploy shape (Vercel + API unificada) + seed boot  
2. Upload/download real (demo)  
3. Ajustes no cliente + layouts por formato + fidelidade  
4. Cookies/Secure + bugs pontuais  
5. UI/UX redesign das telas principais  
6. E2e reescritos + README  
7. Polish admin e extras da Parte D  

---

## Critérios de aceite (checklist final)

- [ ] App abre na Vercel com login admin e cliente demo  
- [ ] Download de entregável autentica e serve arquivo real (não URL placeholder)  
- [ ] Página da peça: 5 formatos distintos + comentário por bloco + ajustes visíveis  
- [ ] Conteúdo longo sem truncamento visual  
- [ ] Isolamento: teste e2e falha se vazar dado entre clientes  
- [ ] Fidelidade e persistência: e2e sérios verdes  
- [ ] Cookie Secure em produção  
- [ ] UI/UX no **piso** de `docs/PADRAO-DESIGN.md` (comparar com `docs/assets/padrao-central-entregas-sbp.png`)  
- [ ] Header branco + filete vermelho; cards com zona visual + Abrir/Baixar  
- [ ] Identidade FGX respeitada (Titillium + Montserrat, `--fgx-red`)  
- [ ] README atualizado; Supabase listado como **próxima fase**  
- [ ] Sem secrets commitados  

---

## Ao terminar

Liste:

1. O que corrigiu  
2. O que melhorou em UI/UX  
3. Como rodar local e na Vercel  
4. Credenciais demo  
5. O que ficou de propósito para a fase Supabase  

Comece agora.
