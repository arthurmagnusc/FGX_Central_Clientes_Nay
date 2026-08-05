# PROMPT COMPLETO — Sonnet: implementar Portal do Cliente FGX

> Cole este arquivo **inteiro** como única mensagem de implementação.  
> Contexto local: repositório `FGX_Central_Clientes_Nay`.  
> Documentos de apoio (já no repo): `docs/PRD.md`, `docs/ARQUITETURA.md`, `docs/IDENTIDADE-VISUAL.md`.

---

Você é um engenheiro sênior. Implemente **do zero** a aplicação web **Portal do Cliente FGX** neste repositório, seguindo estritamente o PRD e a arquitetura em `docs/`. Ao terminar, o app deve rodar localmente com seed e passar os três testes de aceite.

Não peça permissão para cada arquivo. Não invente escopo. Não use Netlify Database/Blobs nem o agente Netlify. Não use Firebase. Stack travada abaixo.

---

## 0. Missão em uma frase

Plataforma onde clientes de recorrência da FGX Gestão (comunicação jurídica) acessam entregáveis macro do contrato e validam **somente o texto** das peças do ciclo editorial — com senha compartilhada por cliente, comentário por bloco e isolamento rigoroso entre clientes.

## 1. Stack obrigatória

- **Frontend:** React + TypeScript + Vite + React Router + Tailwind CSS
- **Banco:** Supabase Postgres, migrations em `supabase/migrations/`
- **Arquivos:** Supabase Storage (bucket privado) para PDF/DOCX/PPTX/XLSX dos entregáveis
- **API:** Supabase Edge Functions **ou** servidor Hono/Express em `/server` — escolha uma e documente no README. Toda lógica sensível fica no server.
- **Testes:** Vitest (unit) + Playwright (e2e dos 3 testes obrigatórios)
- **i18n de UI:** 100% português do Brasil; datas `dd/mm/aaaa`
- Nenhuma senha, chave ou `SERVICE_ROLE` no bundle do frontend

## 2. Identidade visual

Implemente exatamente os tokens e regras de `docs/IDENTIDADE-VISUAL.md`:

- CSS variables FGX (vermelho `#B12119`, laranja `#E77938`, etc.)
- Fontes: Titillium Web (títulos) + Montserrat (corpo) via Google Fonts
- Cabeçalho com o gradiente especificado **só no topo** das páginas principais
- Logo: quadrado gradiente vermelho→laranja + “FGX” Titillium 900
- Pílulas de status com a tabela de cores **exata** do doc
- Fundo claro, cartões brancos, vermelho/laranja em doses pequenas
- Tabelas sem scroll horizontal no desktop; mobile = cartões empilhados
- Responsivo desktop / tablet / celular

## 3. Autenticação

### Cliente (`/c/:slug`)
- Senha única da empresa + **nome da pessoa** na entrada
- Nome gravado na sessão; usado em todo comentário e aprovação (não pedir de novo)
- Link discreto “não sou eu” no cabeçalho para trocar o nome
- Cliente sem `senha_hash`: mensagem de acesso não liberado; admin mostra “acesso não configurado”

### Admin (`/admin`)
- Senha própria; inicial de `ADMIN_SENHA_INICIAL`
- Aviso permanente até a senha inicial ser trocada

### Sessão
- Cookie `httpOnly`, `Secure`, `SameSite=Lax`, 30 dias
- Guarda `client_id` **ou** `admin_id` + `pessoa_nome`
- Hash bcrypt ou argon2 no server
- **Isolamento:** toda leitura/escrita de dados do cliente deriva `client_id` da sessão do cookie — **nunca** de query/body/URL controlável pelo browser. Reforce com RLS no Postgres.

## 4. Modelo de dados

Crie migrations com FKs, enums e índices para:

`client`, `admin_user`, `session`, `deliverable`, `cycle`, `channel`, `client_channel`, `piece`, `piece_reasoning`, `piece_content`, `comment`, `approval`, `adjustment`, `production_trail`, `source`, `additive_doc`, e tabela de log de despacho do webhook (ex.: `adjustment_dispatch`).

Campos e enums conforme `docs/PRD.md` / `docs/ARQUITETURA.md`.

**Não existe upload de imagem nas peças.** `piece_content.conteudo` é `TEXT` integral.

Categorias de entregável (ordem fixa):  
`diagnostico`, `planejamento`, `apresentacao`, `proposta`, `politica`, `material_institucional`, `relatorio_resultado`

Canais: `redes_sociais`, `blog`, `newsletter`, `video`  
Formatos: `carrossel`, `artigo`, `analise_tecnica`, `texto_email`, `roteiro_video`

## 5. REGRA CRÍTICA — fidelidade do conteúdo (condição de aceite #1)

Exibir o conteúdo **EXATAMENTE** como cadastrado:

- Sem resumir, truncar, reescrever, reticências, “ver mais” que esconda texto
- Sem max-height + overflow que pareça conteúdo faltando
- Markdown básico (negrito, itálico, listas, títulos) + DOMPurify **sem** remover conteúdo legítimo
- Limite de caracteres do canal só **sinaliza** overflow visualmente — nunca corta nem bloqueia o texto

## 6. Portal do cliente

Após login em `/c/:slug`, duas áreas:

### 6.1 Entregáveis do contrato
- Agrupar pelas 7 categorias na ordem acima; ocultar vazias
- Cartão: título, descrição, categoria, versão, data, mime/tamanho, pílula, **Baixar**
- Download só via API autenticada (path do Storage não público / não adivinhável)
- Versão atual em destaque; anteriores recolhidas

### 6.2 Ciclo editorial
- Só ciclos `publicado` / `encerrado`
- Home: mês, volume, status, barra de progresso segmentada; seletor de ciclos
- Cartões: tema, canal, área do Direito, status, nº comentários
- Página da peça:
  - Render por formato (carrossel = slides “Slide X de Y” + chars; artigo; análise com tese + refs; e-mail; roteiro = “Cena X de Y”)
  - Comentário da peça inteira + **por bloco** (rótulos: slide / cena / trecho)
  - Painel de histórico cronológico (autor, tipo cliente/editor, data/hora, trecho)
  - Ajustes, trilha (recolhível), raciocínios (recolhível), fontes (links nova aba)
  - Seções vazias não renderizam
  - Botões **Aprovar peça** / **Solicitar ajuste** → grava `approval` + muda status; aprovada mostra “Aprovada por [nome] em [data]”
  - Navegação anterior / próxima no ciclo
  - Contador chars vs limite do canal (ou override da peça)

Canal **Redes Sociais** é um só (Instagram+LinkedIn replicados).

## 7. Portal admin (`/admin`)

Implemente:

1. CRUD clientes: nome, slug, senha, tom de voz, áreas-chave, canais contratados  
2. Upload/publicação de entregáveis (cliente, categoria, título, descrição, arquivo, versão)  
3. Criar ciclo (mês_referencia); **publicar** (rascunho invisível ao cliente); encerrar  
4. Cadastrar peças: tema, área, canal (só contratados), formato, limite opcional  
5. Conteúdo integral em blocos + botão **“Dividir em blocos automaticamente”** (quebra por títulos/parágrafos) + juntar/separar/reordenar; título opcional por bloco; **sem imagem**  
6. Trilha, raciocínios, fontes  
7. Limite padrão por canal  
8. Ver aprovações (quem/quando)  
9. Comentários consolidados por ciclo/peça com filtros  
10. Registrar ajuste a partir de comentário (pontual | estrutural); status_avaliacao  
11. Estrutural → criar/editar `additive_doc` + export `.md` + listagem por cliente  
12. **Enviar para avaliação:** monta JSON (cliente: nome, tom, áreas, regra_base_ref; peça; conteúdo integral; comentário origem; descrição do ajuste) → POST `WEBHOOK_AVALIACAO_AJUSTE`; se env var ausente, **baixa o JSON**; logar data/destino/resultado na UI  
13. Seed demo marcado no admin + botão **apagar ciclo demo por inteiro**

## 8. Seed

Migration/seed com:

| Cliente | Slug | Canais |
|---|---|---|
| Freire, Gerbasi e Bittencourt | `fgb` | redes_sociais, blog, newsletter, video |
| Fiedra, Britto e Ferreira Neto | `fiedra` | redes_sociais, blog, newsletter |
| Reis, Souza, Takeishi e Arsuffi | `rsta` | redes_sociais, blog, newsletter, video |

- Clientes **sem senha**, inativos  
- Admin criado a partir de `ADMIN_SENHA_INICIAL` no bootstrap (ou instrução clara no README)  
- Ciclo demo **fiedra**, `2026-06`, `publicado`, **6 peças**: 2 carrosséis (7 e 5 slides), 1 artigo blog, 1 análise técnica, 2 newsletters  
- Textos longos realistas (≥4.000 chars nas peças corridas, 5–8 blocos)  
- Trilha 9 etapas em ≥2 peças; 2–3 raciocínios cada; 3–5 fontes com URL  
- Comentários de exemplo (incl. por bloco)  
- 7 entregáveis (1 por categoria) com PDF placeholder no Storage  

## 9. Qualidade UX

- Loading e erro em todas as telas (nunca tela branca)
- Toasts ao salvar comentário e publicar
- **Comentário não pode se perder:** se falhar, texto permanece + mensagem + retry
- Sentry se `SENTRY_DSN` existir

## 10. Testes automatizados obrigatórios

1. **Fidelidade:** cadastra peça com ~8.000 chars (títulos, listas, negrito, aspas, acentos, especiais); lê na UI do cliente; compara caractere a caractere com o original; falha se truncar / reticências / “ver mais” / max-height engañoso / sanitização remover conteúdo  
2. **Isolamento:** sessão do cliente A tenta ler dados do B (URL/API) e **deve falhar**  
3. **Persistência:** grava comentário, recarrega, confere autor, data e trecho  

Rode os testes e deixe scripts no `package.json`.

## 11. README (pt-BR)

Explicar: setup Supabase, env vars, como definir senha de cliente, trocar senha admin, cadastrar cliente, configurar canais, publicar ciclo, rodar seed e testes.

## 12. Ordem de implementação (obrigatória)

1. Scaffold Vite + Tailwind + Router + tema FGX  
2. Migrations + seed canais/clientes  
3. Auth cliente/admin + cookies + middleware de isolamento  
4. Portal cliente: entregáveis + download  
5. Portal cliente: ciclo + peça (formatos + fidelidade de conteúdo)  
6. Comentários + aprovações  
7. Admin completo  
8. Ajustes + aditivo + webhook/JSON  
9. Seed demo rico + Playwright dos 3 testes  
10. Polish visual + README  

Commits pequenos e mensagens claras. Ao final: `npm run dev` sobe o app; `npm test` / e2e passam.

## 13. Critérios de aceite (checklist)

- [ ] UI 100% pt-BR, datas dd/mm/aaaa  
- [ ] Tokens e pílulas FGX corretos  
- [ ] Login cliente (senha + nome) e admin  
- [ ] Isolamento multi-cliente comprovado por teste  
- [ ] Entregáveis com download autenticado  
- [ ] Ciclo editorial completo com 5 formatos  
- [ ] Conteúdo integral (teste de fidelidade verde)  
- [ ] Comentário por bloco + persistência  
- [ ] Admin opera o fluxo ponta a ponta  
- [ ] Ajuste estrutural → aditivo `.md`  
- [ ] Webhook ou download JSON  
- [ ] Seed fiedra utilizável  
- [ ] README operacional  

## 14. O que NÃO fazer

- Não resumir/truncar conteúdo de peça  
- Não criar campo de imagem/miniatura de slide  
- Não separar Instagram e LinkedIn  
- Não colocar secrets no frontend  
- Não confiar em `client_id` vindo do browser  
- Não entregar só mock/UI sem API e banco  
- Não usar Supabase Auth por e-mail no lugar do modelo de senha compartilhada  

---

**Comece agora pelo scaffold + migrations + auth.** Depois portal do cliente; por último admin, seed rico e testes. Quando terminar, liste o que foi entregue e como rodar.
