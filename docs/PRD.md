# PRD — Portal do Cliente FGX

**Produto:** Portal do Cliente FGX  
**Cliente interno:** FGX Gestão (comunicação jurídica)  
**Idioma:** pt-BR · Datas: dd/mm/aaaa  
**Versão do PRD:** 1.0

---

## 1. Problema

Clientes de recorrência da FGX precisam, em um único lugar:

1. Acessar os **entregáveis macro** do contrato (diagnóstico, planejamento, propostas etc.).
2. **Revisar e validar o texto** das peças do ciclo editorial (carrosséis, artigos, análises, newsletters, roteiros).

Hoje isso se espalha por e-mail, drives e ferramentas distintas. A arte dos carrosséis continua em outra ferramenta — este portal valida **somente texto**.

## 2. Objetivos

| Objetivo | Métrica de sucesso |
|---|---|
| Centralizar entregáveis macro | Cliente baixa arquivos autenticados sem link público |
| Validar texto do ciclo editorial | Conteúdo exibido **na íntegra**; comentário por bloco; aprovar / solicitar ajuste |
| Operação interna enxuta | Admin cadastra clientes, ciclos, peças e ajustes sem stack paralela |
| Segurança multi-cliente | Sessão A nunca lê dados do cliente B (teste automatizado) |

## 3. Fora de escopo (v1)

- Login individual por e-mail / SSO / OAuth
- Upload ou pré-visualização de imagem nas peças
- Aprovação de arte
- Peças de Instagram e LinkedIn como canais separados (são um canal: **Redes Sociais**)
- Entregas do dia a dia (só entregáveis macro)
- App mobile nativo
- Notificações por e-mail/WhatsApp (pode ser fase 2)

## 4. Decisões de produto (divergências conscientes)

1. **Senha única por cliente** + nome declarado na sessão (rastreabilidade sem conta por pessoa).
2. **Canal ≠ formato** — canal = onde publica; formato = como o texto se estrutura.
3. **Instagram + LinkedIn = “Redes Sociais”** — evita peça e comentário duplicados.
4. **Só texto nas peças** — sem campo de imagem.
5. **Comentário por bloco** — uma mecânica para slide / cena / trecho.
6. **Entregáveis = macro** — diagnóstico, planejamento, apresentações, propostas, políticas, materiais institucionais, relatórios de resultado.
7. **Stack local controlável** — Supabase (Postgres + Storage + Edge Functions) em vez de Netlify Database/Blobs do prompt original Netlify AI. Isolamento reforçado com checagem de sessão **e** políticas RLS.

## 5. Personas

| Persona | Acesso | Precisa |
|---|---|---|
| Pessoa do cliente (escritório) | `/c/:slug` + senha compartilhada | Ver entregáveis, revisar peças, comentar, aprovar |
| Editor / equipe FGX | `/admin` + senha admin | Cadastrar tudo, publicar ciclo, registrar ajustes, exportar aditivos |

## 6. Autenticação

### Cliente
- Rota `/c/:slug` pede **senha** + **nome da pessoa**.
- Nome fica na sessão e acompanha comentários/aprovações automaticamente.
- Link “não sou eu” no cabeçalho troca o nome sem logout.
- Cliente sem senha configurada: rota responde que o acesso ainda não foi liberado; no admin aparece “acesso não configurado”.

### Admin
- `/admin` com senha de administrador.
- Senha inicial via `ADMIN_SENHA_INICIAL`; aviso permanente até trocar.

### Sessão
- Cookie `httpOnly`, `Secure`, `SameSite=Lax`, 30 dias.
- Payload: `client_id` ou `admin_id` + `pessoa_nome` (quando cliente).
- Hash de senha: bcrypt ou argon2 — **nunca** comparar no browser nem embutir no bundle.
- **Toda API deriva `client_id` da sessão**, nunca de parâmetro do cliente.

## 7. Áreas funcionais

### 7.1 Portal do cliente — Entregáveis

Biblioteca agrupada nesta ordem (categorias vazias ocultas):

1. Diagnóstico  
2. Planejamento  
3. Apresentações  
4. Propostas  
5. Políticas  
6. Materiais institucionais revisados  
7. Relatórios de resultado  

Cartão: título, descrição, categoria, versão, data, tipo/tamanho, pílula de status, **Baixar**.  
Download autenticado (Storage privado). Versões anteriores recolhidas.

### 7.2 Portal do cliente — Ciclo editorial

- Só ciclos `publicado` ou `encerrado` (rascunho invisível).
- Home do ciclo: mês, volume, status, barra de progresso; seletor de ciclos anteriores.
- Cartões de peças: tema, canal, área do Direito, status, contador de comentários.
- Página da peça: renderização por formato, comentário por bloco, histórico, ajustes, trilha, raciocínios, fontes, aprovar / solicitar ajuste, navegação anterior/próxima.

**Formatos:**
- `carrossel` — slides numerados, contagem de chars por slide, sem arte
- `artigo` — título, subtítulo, corpo
- `analise_tecnica` — artigo + tese no topo + referências no fim
- `texto_email` — assunto, pré-cabeçalho, corpo
- `roteiro_video` — cenas numeradas + fala

**Comentário por bloco:** rótulos “Comentar neste slide” / “Comentar nesta cena” / “Comentar neste trecho”. Autor vem da sessão.

### 7.3 Admin

- CRUD clientes (nome, slug, senha, tom de voz, áreas-chave, canais contratados)
- Upload entregáveis + publicar
- Ciclos: criar, publicar, encerrar; seed demo apagável
- Peças: conteúdo integral em blocos; “Dividir em blocos automaticamente”; sem imagem
- Limite de caracteres padrão por canal
- Comentários consolidados; registrar ajuste (pontual/estrutural)
- Ajuste estrutural → `additive_doc` editável + export `.md`
- “Enviar para avaliação” → webhook `WEBHOOK_AVALIACAO_AJUSTE` ou download JSON

## 8. REGRA CRÍTICA — fidelidade do conteúdo

O conteúdo de cada peça deve aparecer **EXATAMENTE** como cadastrado:

- Sem resumir, truncar, reescrever, reticências, “ver mais” que esconda texto
- Sem limite de altura com rolagem interna que pareça conteúdo faltando
- `piece_content.conteudo` = `TEXT` integral
- Markdown básico + DOMPurify (sem remover conteúdo legítimo)
- Limite de caracteres só **sinaliza** overflow — nunca corta

## 9. Clientes seed

| Cliente | Slug | Canais |
|---|---|---|
| Freire, Gerbasi e Bittencourt | `fgb` | redes_sociais, blog, newsletter, video |
| Fiedra, Britto e Ferreira Neto | `fiedra` | redes_sociais, blog, newsletter |
| Reis, Souza, Takeishi e Arsuffi | `rsta` | redes_sociais, blog, newsletter, video |

Seed: clientes **sem senha e inativos**. Ciclo demo publicado em `fiedra`, junho/2026, 6 peças + 7 entregáveis (ver arquitetura / prompt de execução).

## 10. Qualidade e aceite

- Responsivo (desktop, tablet, mobile)
- Loading e erro em todas as telas
- Toasts ao salvar/publicar
- Comentário não some se a gravação falhar (retry)
- Testes obrigatórios: **fidelidade**, **isolamento**, **persistência**
- Sentry opcional via `SENTRY_DSN`
- README em pt-BR com operação (senha cliente, admin, ciclo)

## 11. Documentos relacionados

- [`IDENTIDADE-VISUAL.md`](./IDENTIDADE-VISUAL.md)
- [`ARQUITETURA.md`](./ARQUITETURA.md)
- [`../PROMPT-SONNET.md`](../PROMPT-SONNET.md) — prompt único de implementação
