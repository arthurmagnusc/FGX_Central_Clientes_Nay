import { describe, expect, it } from "vitest";
import { dividirEmBlocos, juntarComAnterior, mover, separarBloco, totalCaracteres } from "../../src/lib/blocos";

describe("divisão em blocos", () => {
  it("quebra por parágrafo e reconhece linha curta como título", () => {
    const b = dividirEmBlocos(
      "A promessa de previsibilidade\n\nQuando a lei entrou em vigor, a leitura foi outra.\n\nSete anos depois, o quadro mudou.",
      "paragrafo");
    expect(b).toHaveLength(2);
    expect(b[0].titulo).toBe("A promessa de previsibilidade");
    expect(b[0].conteudo).toContain("Quando a lei entrou em vigor");
    expect(b[1].titulo).toBe("");
  });

  it("não trata como título uma linha curta terminada em pontuação", () => {
    const b = dividirEmBlocos("Quem responde?\n\nO Código não pergunta quem imprimiu.", "paragrafo");
    expect(b).toHaveLength(2);
    expect(b[0].titulo).toBe("");
  });

  it("quebra por título markdown", () => {
    const b = dividirEmBlocos("## Primeiro\nTexto um.\n## Segundo\nTexto dois.", "titulo");
    expect(b.map((x) => x.titulo)).toEqual(["Primeiro", "Segundo"]);
    expect(b[1].conteudo).toBe("Texto dois.");
  });

  it("quebra por separador", () => {
    const b = dividirEmBlocos("Slide um.\n\n---\n\nSlide dois.\n\n---\n\nSlide três.", "separador");
    expect(b).toHaveLength(3);
    expect(b[2].conteudo).toBe("Slide três.");
  });

  it("devolve lista vazia para texto em branco", () => {
    expect(dividirEmBlocos("   \n\n  ", "paragrafo")).toEqual([]);
  });

  it("preserva o texto integralmente ao dividir", () => {
    const texto = "Um.\n\nDois com acentuação: ação, você, órgão.\n\nTrês — com travessão e “aspas”.";
    const b = dividirEmBlocos(texto, "paragrafo");
    const remontado = b.map((x) => [x.titulo, x.conteudo].filter(Boolean).join("\n\n")).join("\n\n");
    expect(remontado.replace(/\s+/g, " ")).toBe(texto.replace(/\s+/g, " "));
  });
});

describe("manipulação de blocos", () => {
  const base = [{ titulo: "A", conteudo: "um" }, { titulo: "B", conteudo: "dois" }, { titulo: "", conteudo: "três" }];

  it("junta com o anterior preservando o título de cima", () => {
    const r = juntarComAnterior(base, 1);
    expect(r).toHaveLength(2);
    expect(r[0].titulo).toBe("A");
    expect(r[0].conteudo).toBe("um\n\nB\n\ndois");
  });

  it("não junta o primeiro bloco", () => {
    expect(juntarComAnterior(base, 0)).toEqual(base);
  });

  it("separa nas quebras duplas", () => {
    const r = separarBloco([{ titulo: "T", conteudo: "um\n\ndois\n\ntrês" }], 0);
    expect(r).toHaveLength(3);
    expect(r[0].titulo).toBe("T");
    expect(r[1].titulo).toBe("");
  });

  it("não separa bloco sem quebra dupla", () => {
    const b = [{ titulo: "", conteudo: "linha só" }];
    expect(separarBloco(b, 0)).toEqual(b);
  });

  it("move sem perder itens", () => {
    const r = mover(base, 0, 2);
    expect(r.map((x) => x.conteudo)).toEqual(["dois", "três", "um"]);
    expect(r).toHaveLength(base.length);
  });

  it("soma caracteres de título e conteúdo", () => {
    expect(totalCaracteres([{ titulo: "abc", conteudo: "de" }])).toBe(5);
  });
});
