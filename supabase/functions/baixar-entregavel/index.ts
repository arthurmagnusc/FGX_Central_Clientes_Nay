// GET /baixar-entregavel?id=<uuid>
// O arquivo no bucket é privado e o caminho não é adivinhável. Esta função
// confere o JWT, confirma que o entregável é do cliente da sessão e devolve
// uma URL assinada de 60 segundos. O link nunca vira público.
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { bancoAdmin } from "../_compartilhado/db.ts";
import { cabecalhosCors, json, erro } from "../_compartilhado/http.ts";

const chave = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(Deno.env.get("SUPABASE_JWT_SECRET")!),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"],
);

Deno.serve(async (req) => {
  const cors = cabecalhosCors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return erro("Não autenticado.", 401, cors);

  let claims: Record<string, unknown>;
  try { claims = await verify(token, chave) as Record<string, unknown>; }
  catch { return erro("Sessão inválida ou expirada.", 401, cors); }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return erro("Informe o entregável.", 400, cors);

  const db = bancoAdmin();

  // Sessão revogada continua com JWT válido até expirar — por isso conferimos.
  const { data: sessao } = await db
    .from("sessao").select("revogada, expira_em").eq("id", claims.sub as string).maybeSingle();
  if (!sessao || sessao.revogada || new Date(sessao.expira_em) < new Date()) {
    return erro("Sessão encerrada.", 401, cors);
  }

  const { data: item } = await db
    .from("entregavel")
    .select("id, cliente_id, storage_path, nome_arquivo, publicado_em")
    .eq("id", id).maybeSingle();

  if (!item) return erro("Entregável não encontrado.", 404, cors);

  const ehAdmin = claims.is_admin === true;
  const ehDono = item.cliente_id === claims.cliente_id;
  // Cliente também não baixa o que ainda não foi publicado.
  if (!ehAdmin && (!ehDono || !item.publicado_em)) {
    return erro("Entregável não encontrado.", 404, cors);
  }

  const { data: assinada, error } = await db.storage
    .from("entregaveis")
    .createSignedUrl(item.storage_path, 60, { download: item.nome_arquivo });
  if (error || !assinada) return erro("Não foi possível gerar o link.", 500, cors);

  return json({ url: assinada.signedUrl, nome_arquivo: item.nome_arquivo, expira_em_segundos: 60 }, 200, cors);
});
