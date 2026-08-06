import { describe, expect, it } from "vitest";
import { markdownSeguro } from "../../src/lib/sanitizar";

/**
 * REGRA CRÍTICA — sanitizar não pode engolir conteúdo legítimo.
 * Se alguém apertar a lista em lib/sanitizar.ts, estes testes quebram.
 */
describe("sanitização", () => {
  it("remove script", () => {
    expect(markdownSeguro('texto <script>alert(1)</script> fim')).not.toContain("script");
  });

  it("remove handler inline", () => {
    expect(markdownSeguro('<span onclick="roubar()">oi</span>')).not.toContain("onclick");
  });

  it("preserva negrito, itálico, listas e títulos", () => {
    const html = markdownSeguro("## Título\n\n**forte** e *ênfase*\n\n- um\n- dois");
    expect(html).toContain("<h2");
    expect(html).toContain("<strong>");
    expect(html).toContain("<em>");
    expect(html).toContain("<li>");
  });

  it("preserva acentuação, travessão e aspas tipográficas", () => {
    const original = "Ação, você, órgão — “aspas” e ‘simples’.";
    expect(markdownSeguro(original)).toContain("Ação, você, órgão — “aspas” e ‘simples’.");
  });

  it("preserva links com href", () => {
    const html = markdownSeguro("[planalto](https://www.planalto.gov.br)");
    expect(html).toContain('href="https://www.planalto.gov.br"');
  });

  it("não perde caracteres em texto longo", () => {
    const longo = Array.from({ length: 400 }, (_, i) => `Parágrafo ${i} com acentuação e vírgulas, ponto.`).join("\n\n");
    const html = markdownSeguro(longo);
    const semTags = html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    expect(semTags).toContain("Parágrafo 0 com acentuação");
    expect(semTags).toContain("Parágrafo 399 com acentuação");
  });
});
