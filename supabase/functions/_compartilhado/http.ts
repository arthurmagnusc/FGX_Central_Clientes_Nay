const origensPermitidas = (Deno.env.get("ORIGENS_PERMITIDAS") ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);

/** Fallback só para DX local quando ORIGENS_PERMITIDAS ainda não foi setado. */
const ORIGENS_DEV = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

export function cabecalhosCors(origem: string | null): Record<string, string> {
  // Produção: defina ORIGENS_PERMITIDAS com o domínio do portal.
  // Sem a variável: permite só localhost (vite/preview) — nunca libera origem arbitrária.
  const permitida = Boolean(
    origem && (
      origensPermitidas.length === 0
        ? ORIGENS_DEV.includes(origem)
        : origensPermitidas.includes(origem)
    ),
  );
  return {
    "Access-Control-Allow-Origin": permitida ? origem! : "null",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  };
}

export function json(corpo: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}

export function erro(mensagem: string, status = 400, extra: Record<string, string> = {}) {
  return json({ erro: mensagem }, status, extra);
}

// Atraso constante para não vazar, pelo tempo de resposta, se um slug existe.
export async function atrasoConstante(inicio: number, alvoMs = 350) {
  const decorrido = Date.now() - inicio;
  if (decorrido < alvoMs) await new Promise((r) => setTimeout(r, alvoMs - decorrido));
}
