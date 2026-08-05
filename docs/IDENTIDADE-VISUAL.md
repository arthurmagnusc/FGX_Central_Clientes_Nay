# Identidade visual — FGX

Fonte: tokens do prompt do Portal do Cliente + design system do Livro do Projeto FGX. **Não inventar cor fora desta paleta.**

## Tokens do Portal (obrigatórios)

```css
:root {
  --fgx-red: #B12119;        /* vermelho institucional — títulos de seção, botões primários */
  --fgx-orange: #E77938;     /* laranja — gradientes, acentos, marcadores */
  --fgx-red-dark: #7E131C;
  --fgx-beige: #D9BCAA;
  --fgx-beige-light: #FAE7CF;
  --fgx-gray: #F2F2F2;       /* fundo da página */
  --fgx-green: #527F3E;      /* concluído */
  --fgx-gold: #FAB826;       /* em validação */
  --fgx-blue: #356FA9;       /* pendente do lado do cliente */
  --ink: #1C1A19;
  --ink-2: #4A4341;
  --ink-3: #7A716D;
  --line: #E4DEDA;
  --white: #FFFFFF;
}
```

## Tipografia

| Uso | Fonte | Pesos |
|---|---|---|
| Títulos, números, IDs | **Titillium Web** | 300 / 400 / 600 / 700 / 900 |
| Corpo, botões, tabelas | **Montserrat** | 300 / 400 / 500 / 600 / 700 |

Carregar via Google Fonts.

## Cabeçalho principal

```css
background:
  radial-gradient(900px 420px at 12% -10%, rgba(231,121,56,.32), transparent 60%),
  linear-gradient(150deg, #7E131C 0%, #B12119 55%, #C4331F 100%);
```

- Gradiente **apenas no topo** das páginas principais — não em toda a tela.
- Logotipo: quadrado com gradiente vermelho→laranja + letras **FGX** em Titillium Web 900.

## Comportamento de marca

- Fundo claro (`--fgx-gray`), cartões brancos.
- Vermelho e laranja em doses pequenas e de alto contraste (cabeçalho, títulos de seção, botões, faixas).
- **Não pintar áreas grandes de vermelho** fora do topo.
- Botões primários: `--fgx-red`. Secundários: contornados.
- Cartões: sombra sutil + borda `--line`.
- Tabelas: sem scroll horizontal no desktop; no mobile, linhas viram cartões empilhados.

## Pílulas de status (mapeamento fixo)

| Tabela | Valor | Rótulo | Texto | Fundo |
|---|---|---|---|---|
| `piece` | `pendente` | Pendente | `#7A716D` | `#F2F2F2` |
| `piece` | `em_revisao` | Em revisão | `#2A5A8C` | `rgba(53,111,169,.11)` |
| `piece` | `ajustada` | Ajustada | `#B2531D` | `rgba(231,121,56,.13)` |
| `piece` | `aprovada` | Aprovada | `#3F6530` | `rgba(82,127,62,.11)` |
| `deliverable` | `em_producao` | Em produção | `#B2531D` | `rgba(231,121,56,.13)` |
| `deliverable` | `em_validacao` | Em validação | `#8A6208` | `rgba(250,184,38,.16)` |
| `deliverable` | `aprovado` | Aprovado | `#3F6530` | `rgba(82,127,62,.11)` |
| `cycle` | `rascunho` | Rascunho | `#7A716D` | `#F2F2F2` |
| `cycle` | `publicado` | Publicado | `#2A5A8C` | `rgba(53,111,169,.11)` |
| `cycle` | `encerrado` | Encerrado | `#3F6530` | `rgba(82,127,62,.11)` |

## Referência institucional (Livro do Projeto)

Paleta ampliada usada em materiais FGX (alinhar quando possível; no portal prevalecem os tokens acima):

| Token | Hex | Uso |
|---|---|---|
| RED_PRIMARY | `#B12019` ≈ `#B12119` | Marca |
| RED_DEEP | `#8B1A1A` / `#7E131C` | Destaque profundo |
| ORANGE_FGX | `#E77938` | Acento |
| GREEN_OK | `#537F3F` ≈ `#527F3E` | Sucesso |
| BLUE_INFO | `#2A6F97` / `#356FA9` | Info / pendente cliente |
| BG | `#F4F1EE` / `#F2F2F2` | Fundo |
| INK | `#1A1A1A` / `#1C1A19` | Texto |

Idioma da interface: **português do Brasil**. Datas: **dd/mm/aaaa**.
