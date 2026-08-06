// GET /baixar-relatorio?id=<uuid>
// Mesma lógica de baixar-entregavel: o arquivo do relatório é privado e só
// sai daqui com URL assinada de curta duração, depois de conferir a sessão.
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { bancoAdmin } from "../_compartilhado/db.ts";
import { cabecalhosCors, json, erro } from "../_compartilhado/http.ts";

const chave = await crypto.subtle.importKey(
  "raw", new TextEncoder().encode(Deno.env.get("SUPABASE_JWT_SECRET")!),
  { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"],
);

Deno.serve(async (req) => {
  const cors = cabecalhosCors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const auth = req.headers.get("authorization") ?? "";
  let claims: Record<string, unknown>;
  try { claims = await verify(auth.replace("Bearer ", ""), chave) as Record<string, unknown>; }
  catch { return erro("Sessão inválida ou expirada.", 401, cors); }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return erro("Informe o relatório.", 400, cors);

  const db = bancoAdmin();
  const { data: sessao } = await db
    .from("sessao").select("revogada, expira_em").eq("id", claims.sub as string).maybeSingle();
  if (!sessao || sessao.revogada || new Date(sessao.expira_em) < new Date()) {
    return erro("Sessão encerrada.", 401, cors);
  }

  const { data: rel } = await db
    .from("relatorio").select("id, cliente_id, storage_path, titulo, publicado").eq("id", id).maybeSingle();
  if (!rel || !rel.storage_path) return erro("Relatório não encontrado.", 404, cors);

  const ehAdmin = claims.is_admin === true;
  if (!ehAdmin && (rel.cliente_id !== claims.cliente_id || !rel.publicado)) {
    return erro("Relatório não encontrado.", 404, cors);
  }

  const { data: assinada, error } = await db.storage
    .from("entregaveis").createSignedUrl(rel.storage_path, 120);
  if (error || !assinada) return erro("Não foi possível gerar o link.", 500, cors);

  return json({ url: assinada.signedUrl, titulo: rel.titulo }, 200, cors);
});
