# Padrão mínimo de design — Portal FGX

**Referência obrigatória:** [Central de Entregas · SBP LAW](https://claude.ai/public/artifacts/4a11b4f8-b0af-467a-8337-0850046fc77b)  
**Screenshot local:** [`docs/assets/padrao-central-entregas-sbp.png`](./assets/padrao-central-entregas-sbp.png)

Este é o **piso visual**. Qualquer tela do Portal do Cliente abaixo desse nível é rejeitada. Tokens de cor continuam FGX (`docs/IDENTIDADE-VISUAL.md`); a composição e o acabamento seguem esta referência.

---

## O que a referência estabelece

### Chrome (estrutura)

- Header **branco**, limpo, com logo + título à esquerda e navegação textual à direita.
- Separador fino **vermelho FGX** sob o header (não um bloco vermelho enorme em toda a viewport).
- Fundo de página cinza claro / off-white; conteúdo em cartões brancos.
- Muita respiração: padding generoso, hierarquia clara, sem “dashboard lotado”.

### Tipografia e hierarquia

- Título de página grande e bold.
- Linha de contexto acima do título (pill/avatar + área técnica).
- Parágrafo de apoio curto em cinza médio.
- Status pill discreto ao lado do título (ex.: ENTREGUE).

### Cards de entregável / peça (padrão ouro)

Cada card tem duas zonas:

1. **Topo visual (~40%)**
   - Fundo bege/creme com listras diagonais sutis
   - Badge de tipo no canto (HTML / PDF / etc.)
   - Ícone + número/etapa grande em vermelho + rótulo em caixa alta

2. **Corpo informativo (~60%)**
   - Status pill (ex.: “ETAPA 1 · ENTREGUE”)
   - Título bold
   - Descrição curta em cinza
   - Metadado (tipo + tamanho)
   - **Dois CTAs:**
     - Primário sólido vermelho FGX (“Abrir…”)
     - Secundário contornado (“Baixar…”)

Cards: raio ~12px, sombra suave, borda leve. Grid 3 colunas no desktop; 1 coluna no mobile.

### Botões

- Primário: vermelho FGX, texto branco, cantos bem arredondados.
- Secundário: branco, borda cinza, texto escuro.
- Não usar botões “fantasma” sem contraste.

### Status

- Sucesso / entregue: verde suave (fundo + texto), ponto colorido.
- Demais status: seguir pílulas já definidas em `IDENTIDADE-VISUAL.md`, no mesmo espírito visual (pill, não chip agressivo).

---

## Como aplicar no Portal FGX

| Tela | Obrigatório neste padrão |
|---|---|
| Login | Composição limpa, marca presente, caixa de credenciais demo elegante — não “form solto” |
| Entregáveis | **Espelhar os cards da referência** (preview + status + meta + Abrir/Baixar) |
| Ciclo / peças | Mesma linguagem de card; filtros e progresso discretos |
| Página da peça | Leitura editorial; chrome branco; vermelho só em acentos/CTAs |
| Admin | Pode ser mais denso, mas mesmos tokens, tipografia e botões |

### Ajuste em relação ao brief antigo

O prompt inicial pedia header com **gradiente vermelho** dominante.  
**Novo padrão mínimo:** header branco + filete vermelho (como a referência). Gradiente FGX pode aparecer só no mark/logo ou em momentos hero muito pontuais — **não** pintar a página inteira de vermelho.

---

## Critério de aceite visual

Antes de chamar UI de “pronta”, comparar lado a lado com `docs/assets/padrao-central-entregas-sbp.png`:

- [ ] Header branco + filete vermelho  
- [ ] Cards com zona visual + zona info  
- [ ] CTA primário vermelho + secundário outline  
- [ ] Status pills no estilo da referência  
- [ ] Espaçamento e tipografia no mesmo nível de acabamento  
- [ ] Mobile: cards empilhados sem quebrar a hierarquia  

Se a tela “parece MVP genérico de Tailwind”, **não passou**.
