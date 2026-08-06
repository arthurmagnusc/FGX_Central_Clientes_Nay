import DOMPurify from "dompurify";
import { marked } from "marked";

/**
 * REGRA CRÍTICA — fidelidade do conteúdo.
 *
 * A sanitização remove script e handlers, e NADA MAIS. Nenhuma tag de texto
 * entra na lista de bloqueio, para que sanitizar nunca engula conteúdo
 * legítimo do escritório. Se um dia alguém apertar esta lista, o teste
 * tests/unit/sanitizar.test.ts falha — é de propósito.
 */
marked.setOptions({ breaks: true, gfm: true });

const CONFIG: Parameters<typeof DOMPurify.sanitize>[1] = {
  ALLOWED_TAGS: [
    "p","br","strong","em","b","i","u","s","code","pre","blockquote",
    "ul","ol","li","h1","h2","h3","h4","h5","h6","a","hr","table","thead",
    "tbody","tr","th","td","span","div",
  ],
  ALLOWED_ATTR: ["href", "title", "target", "rel"],
  ALLOW_DATA_ATTR: false,
};

export function markdownSeguro(texto: string): string {
  const html = marked.parse(texto, { async: false }) as string;
  return DOMPurify.sanitize(html, CONFIG) as unknown as string;
}
