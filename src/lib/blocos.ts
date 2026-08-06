/**
 * Divisão de texto em blocos.
 *
 * Está isolado aqui, sem React e sem DOM, porque é a regra que a equipe usa
 * dezenas de vezes por ciclo e a que mais dói se quebrar. Assim ela tem
 * teste unitário próprio (tests/unit/blocos.test.ts).
 */
export type ModoDivisao = "paragrafo" | "titulo" | "separador";

export interface BlocoRascunho { titulo: string; conteudo: string }

const LIMITE_TITULO_CURTO = 70;

export function dividirEmBlocos(texto: string, modo: ModoDivisao): BlocoRascunho[] {
  const limpo = texto.replace(/\r/g, "").trim();
  if (!limpo) return [];

  let blocos: BlocoRascunho[];

  if (modo === "separador") {
    blocos = limpo.split(/\n\s*-{3,}\s*\n/).map((p) => ({ titulo: "", conteudo: p.trim() }));
  } else if (modo === "titulo") {
    blocos = limpo.split(/\n(?=#{1,3}\s)/).map((parte) => {
      const m = parte.match(/^#{1,3}\s*(.+?)\n([\s\S]*)$/);
      if (m) return { titulo: m[1].trim(), conteudo: m[2].trim() };
      const so = parte.match(/^#{1,3}\s*(.+)$/);
      if (so) return { titulo: so[1].trim(), conteudo: "" };
      return { titulo: "", conteudo: parte.trim() };
    });
  } else {
    // Por parágrafo: linha em branco separa. Uma linha curta e sem pontuação
    // final vira título do parágrafo seguinte — é como a equipe escreve.
    const paragrafos = limpo.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    blocos = [];
    for (let i = 0; i < paragrafos.length; i++) {
      const p = paragrafos[i];
      const pareceTitulo =
        p.length <= LIMITE_TITULO_CURTO && !/[.!?:;]$/.test(p) && !p.includes("\n");
      if (pareceTitulo && i < paragrafos.length - 1) {
        blocos.push({ titulo: p, conteudo: paragrafos[++i] });
      } else {
        blocos.push({ titulo: "", conteudo: p });
      }
    }
  }

  return blocos.filter((b) => b.conteudo.trim() || b.titulo.trim());
}

/** Junta o bloco com o anterior, preservando o título do que vinha antes. */
export function juntarComAnterior(blocos: BlocoRascunho[], indice: number): BlocoRascunho[] {
  if (indice <= 0 || indice >= blocos.length) return blocos;
  const copia = blocos.slice();
  const anterior = copia[indice - 1];
  const atual = copia[indice];
  copia[indice - 1] = {
    titulo: anterior.titulo,
    conteudo: [anterior.conteudo, atual.titulo, atual.conteudo].filter(Boolean).join("\n\n").trim(),
  };
  copia.splice(indice, 1);
  return copia;
}

/** Separa um bloco nas quebras de linha duplas. */
export function separarBloco(blocos: BlocoRascunho[], indice: number): BlocoRascunho[] {
  const alvo = blocos[indice];
  if (!alvo) return blocos;
  const partes = alvo.conteudo.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (partes.length < 2) return blocos;
  const novos = partes.map((conteudo, i) => ({ titulo: i === 0 ? alvo.titulo : "", conteudo }));
  const copia = blocos.slice();
  copia.splice(indice, 1, ...novos);
  return copia;
}

export function mover<T>(lista: T[], de: number, para: number): T[] {
  if (para < 0 || para >= lista.length || de === para) return lista;
  const copia = lista.slice();
  const [item] = copia.splice(de, 1);
  copia.splice(para, 0, item);
  return copia;
}

export function totalCaracteres(blocos: { titulo?: string | null; conteudo: string }[]) {
  return blocos.reduce((soma, b) => soma + b.conteudo.length + (b.titulo?.length ?? 0), 0);
}
