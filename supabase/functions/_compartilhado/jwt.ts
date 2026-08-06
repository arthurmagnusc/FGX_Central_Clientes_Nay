// Emissão do JWT que o front usa para falar com o PostgREST.
// Assinado com o SUPABASE_JWT_SECRET do projeto, para que as políticas de
// RLS consigam ler as claims em request.jwt.claims.
import { create, getNumericDate, type Payload } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const segredo = Deno.env.get("SUPABASE_JWT_SECRET");
if (!segredo) throw new Error("SUPABASE_JWT_SECRET não configurado");

const chave = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(segredo),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"],
);

export const DIAS_DE_SESSAO = 30;

export interface ClaimsSessao {
  sub: string;            // id da sessão
  role: "authenticated";  // exigido pelo PostgREST
  cliente_id?: string;
  pessoa_nome?: string;
  is_admin?: boolean;
}

export async function emitirToken(claims: ClaimsSessao): Promise<string> {
  const payload: Payload = {
    ...claims,
    iss: "portal-fgx",
    iat: getNumericDate(0),
    exp: getNumericDate(DIAS_DE_SESSAO * 24 * 60 * 60),
  };
  return await create({ alg: "HS256", typ: "JWT" }, payload, chave);
}

export function expiraEm(): Date {
  return new Date(Date.now() + DIAS_DE_SESSAO * 24 * 60 * 60 * 1000);
}
