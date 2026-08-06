# Handoff — Portal do Cliente FGX

Documento para quem vai assumir o código. Explica **por que** as coisas estão
como estão, o que ficou de fora e onde estão os riscos. O `README.md` cobre o
como rodar.

---

## 1. Autenticação: por que não é Supabase Auth

O modelo do negócio é **uma senha compartilhada por escritório**, não login
individual. Foi decisão do cliente: os sócios não querem gerenciar usuários, e
um portal com cinco logins por escritório vira suporte.

O fluxo:

1. `POST /entrar` recebe `{ slug, senha, nome }`.
2. A Edge Function compara a senha com o bcrypt guardado em `cliente.senha_hash`.
   **Isso acontece no servidor** — nenhum hash chega ao navegador.
3. Grava uma linha em `sessao` com o nome informado.
4. Emite um JWT HS256 assinado com o `SUPABASE_JWT_SECRET` do projeto, com as
   claims `cliente_id`, `pessoa_nome` e `is_admin`.
5. O front usa esse JWT no header `Authorization` das chamadas ao PostgREST.

O ganho de assinar com o segredo do próprio projeto é que **as políticas de RLS
conseguem ler as claims** em `request.jwt.claims`. É isso que faz o isolamento
ser garantido pelo banco e não por cada consulta lembrar de filtrar.

### O nome de quem entra

O nome é declarado, não verificado. Ele existe para o histórico não ficar
anônimo — cada comentário e cada aprovação carrega quem fez e quando.

Há uma proteção contra o caso mais óbvio: a política de insert de `comentario`
exige que `autor_nome` seja **igual ao nome da sessão**. Não dá para comentar
como outra pessoa alterando o corpo da requisição. Mas alguém que saiba a senha
do escritório pode digitar qualquer nome ao entrar.

**Se algum dia for preciso saber com certeza jurídica quem aprovou o quê, o
modelo tem que mudar para login individual.** Registre isso antes de usar as
aprovações como prova de aceite contratual.

### Onde guardamos o token

Em `sessionStorage`, não em `localStorage`: ele morre ao fechar a aba, o que
reduz a exposição num computador compartilhado do escritório.

A alternativa mais segura seria cookie `httpOnly`, imune a XSS. O custo é alto:
o navegador deixaria de falar direto com o PostgREST e toda leitura passaria a
precisar de uma Edge Function intermediária — perdendo justamente a garantia de
RLS que motivou escolher Supabase.

A mitigação adotada foi a outra ponta: o conteúdo é sanitizado com DOMPurify
antes de virar HTML (`src/lib/sanitizar.ts`), então a superfície de XSS é
pequena. Se o portal um dia passar a exibir HTML vindo de fora, **reavalie esta
decisão**.

---

## 2. Isolamento entre clientes

Está em `supabase/migrations/0002_rls.sql`, e é a parte do sistema que mais
merece cuidado numa revisão.

O princípio: **nenhuma consulta no front filtra por `cliente_id`**. Se você
encontrar uma que filtra, é sinal de que a política correspondente está errada.
O filtro é do banco.

### Dois bugs que só apareceram rodando

Validei as políticas contra um Postgres 16 local. Duas coisas quebraram, e
nenhuma delas era visível lendo o SQL:

**Recursão infinita.** `peca_visivel_ao_cliente()` consulta `peca` e é usada
dentro da política de select da própria `peca`. A consulta interna disparava a
política de novo, que chamava a função de novo — *stack depth limit exceeded*.
Resolvido com `security definer` e `search_path` fixo. **Qualquer função nova
que consulte uma tabela e seja usada na política dessa mesma tabela precisa do
mesmo tratamento.**

**Hash de senha legível.** `revoke select (senha_hash)` é silenciosamente
ignorado enquanto o papel tiver `select` na tabela inteira — e o Supabase
concede isso a `authenticated` por padrão. Foi preciso revogar o select da tabela
e devolver as colunas permitidas uma a uma (`0003_permissoes.sql`).

O arnês desses testes está em `supabase/testes_rls_leitura.sql` e
`testes_rls_escrita.sql`. **Rode antes de qualquer deploy que toque em policy.**

### O que o cliente pode escrever

Só três coisas: inserir comentário, inserir aprovação e mudar o status da peça
entre `aprovada` e `em_revisao`. Ele não edita conteúdo, tema, nem qualquer
outro campo — a política de update de `peca` tem `with check` explícito.

---

## 3. Modelo de dados: o que foi acrescentado ao PRD

Três campos não estavam no PRD original e apareceram ao trabalhar com o material
real do cliente (Síntese Editorial da Fiedra, Plano 2026):

- **`editoria`** — por cliente. A Fiedra tem seis (Fiedra em Destaque, Atuação
  Estratégica, Institucional, Cenários do Varejo, Frente Imobiliária, Negócios).
  Cada escritório tem a sua lista, por isso é tabela e não enum.
- **`pilar`** — idem, três na Fiedra.
- **`funil`** — topo, meio ou fundo. Determina o padrão do formato.
- **`gancho_*`** — o fato que ancora a peça, classificado em jornalístico ou
  analítico. A Síntese define meta de 3 peças jornalísticas em 6 por mês, e não
  havia onde registrar isso.

**Canal e formato são coisas separadas.** O PRD misturava: tratava "carrossel"
como canal. Aqui o canal é onde a peça é publicada (Redes Sociais, Blog,
Newsletter, Vídeo) e o formato é como ela se parece (carrossel, artigo, análise
técnica, texto de e-mail, roteiro de vídeo). Instagram e LinkedIn viraram um
canal só porque o conteúdo é replicado nos dois.

**Não existe upload de imagem nas peças.** O ciclo editorial valida texto; a arte
é aprovada em outra ferramenta. Se alguém pedir para "só acrescentar uma
miniatura", confirme com a Nayara antes — foi decisão explícita, não esquecimento.

---

## 4. Bloco é a unidade de comentário

`peca_bloco` é o que o cliente comenta isoladamente: slide no carrossel, cena no
roteiro, trecho no artigo. Uma mecânica só para todos os formatos — o que muda é
o rótulo do botão (`src/lib/formato.ts`).

### O cuidado ao reeditar uma peça

`salvarPeca()` reescreve os blocos. Blocos cujo **texto não mudou** são
reaproveitados pelo id, então os comentários continuam ancorados. Os que mudaram
são recriados, e os comentários que apontavam para eles passam a apontar para a
peça inteira (`peca_bloco_id = null`) em vez de sumir.

Isso é deliberado: **comentário de cliente não se perde nunca**, nem quando a
peça é reescrita. A alternativa — apagar em cascata — é mais simples e teria
apagado histórico de validação.

Se a reedição de peças com muitos comentários virar rotina, vale trocar o
casamento por texto exato por um casamento por similaridade. Hoje, texto
alterado = comentário desancorado.

---

## 5. O que ficou de fora

**Duas telas do admin não foram desenhadas:** *Entregáveis* e *Clientes e
canais*. O banco já suporta as duas e as rotas existem (`EmBreve.tsx`); falta a
interface, que é formulário simples, sem decisão de desenho pendente. Enquanto
isso, o cadastro sai pelo painel do Supabase ou pelos scripts em `scripts/`.

**Fora do MVP, por decisão da Nayara:**
- exportação de relatório de ciclo em PDF e Excel;
- notificação por e-mail quando um ciclo é publicado.

**Não implementado e não pedido:** upload de arquivo pela interface do admin. Os
entregáveis precisam ser colocados no bucket `entregaveis` e a linha criada em
`entregavel` com o `storage_path` correspondente. Essa é provavelmente a primeira
coisa a construir depois das duas telas acima.

---

## 6. Pontos de atenção antes de colocar cliente real

1. **`ORIGENS_PERMITIDAS`.** Sem essa variável, o CORS das Edge Functions recusa
   qualquer origem. É o padrão seguro, mas significa que o portal não funciona
   até você preencher com o domínio de produção.

2. **Senhas de escritório.** São compartilhadas por várias pessoas e não expiram.
   Combine com o cliente uma rotina de troca — e lembre que trocar a senha não
   derruba as sessões abertas, porque o JWT vale 30 dias. Para derrubar, marque
   `sessao.revogada = true`; as Edge Functions checam, mas o PostgREST não.
   **Se isso for requisito, adicione a checagem de revogação numa policy.**

3. **Sessões não são limpas.** A tabela `sessao` cresce indefinidamente. Um
   `delete from sessao where expira_em < now()` semanal resolve.

4. **`enviar-ajuste` não valida a resposta do webhook.** Grava o status HTTP e
   segue. Se a ferramenta de IA passar a devolver conteúdo que precise ser lido,
   isso muda.

5. **O bundle está em 540 KB.** Aceitável para um portal interno, mas se a
   percepção de lentidão aparecer, o caminho é `React.lazy` nas rotas do admin,
   que o cliente nunca carrega.

6. **Sem Sentry.** O PRD previa captura de erros de frontend por variável de
   ambiente. Não foi implementado — os erros aparecem em tela para o usuário, mas
   ninguém é notificado.

---

## 7. Mapa do código

```
supabase/
  migrations/0001_schema.sql       tabelas, enums, índices
  migrations/0002_rls.sql          isolamento — leia antes de mexer em qualquer policy
  migrations/0003_permissoes.sql   privilégios de coluna, views, bucket
  seed.sql                         3 escritórios, canais, editorias e pilares
  functions/entrar                 login do cliente (bcrypt + JWT)
  functions/entrar-admin           login interno
  functions/baixar-entregavel      URL assinada de 60s
  functions/baixar-relatorio       idem, para relatórios
  functions/enviar-ajuste          webhook de avaliação, com fallback para download
  testes_rls_*.sql                 os testes que pegaram os dois bugs

src/lib/
  supabase.ts    cliente PostgREST com o JWT da sessão
  api.ts         leitura e escrita do lado do cliente
  apiAdmin.ts    tudo do lado interno
  blocos.ts      divisão de texto — puro, sem React, com teste unitário
  sanitizar.ts   markdown + DOMPurify; a lista de tags é ampla de propósito
  sessao.ts      token em sessionStorage
  formato.ts     rótulos e formatação pt-BR num lugar só

src/paginas/cliente/   Entrar, VisaoGeral, Entregas, Relatorios, PainelConteudos, PaginaPeca
src/paginas/admin/     EntrarAdmin, AdminCiclos, AdminPeca, AdminComentarios, AdminAjustes
```

O arquivo mais denso é `paginas/cliente/PaginaPeca.tsx` — é onde vivem a exibição
integral, o comentário por bloco e a aprovação. Comece por ele.
