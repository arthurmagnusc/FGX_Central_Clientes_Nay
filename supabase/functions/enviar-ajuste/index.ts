// POST /enviar-ajuste  { ajuste_id }
// Monta o pacote que a ferramenta de IA precisa para avaliar o pedido de
// ajuste e faz POST no webhook. Sem WEBHOOK_AVALIACAO_AJUSTE configurado,
// devolve o mesmo JSON para a equipe levar à mão — o botão nunca fica morto.
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { bancoAdmin } from "../_compartilhado/db.ts";
import { cabecalhosCors, json, erro } from "../_compartilhado/http.ts";

const chave = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(Deno.env.get("SUPABASE_JWT_SECRET")!),
  { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"],
);

Deno.serve(async (req) => {
  const cors = cabecalhosCors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return erro("Método não permitido", 405, cors);

  const auth = req.headers.get("authorization") ?? "";
  let claims: Record<string, unknown>;
  try { claims = await verify(auth.replace("Bearer ", ""), chave) as Record<string, unknown>; }
  catch { return erro("Sessão inválida.", 401, cors); }
  if (claims.is_admin !== true) return erro("Somente a equipe FGX.", 403, cors);

  const { ajuste_id } = await req.json().catch(() => ({ ajuste_id: null }));
  if (!ajuste_id) return erro("Informe o ajuste.", 400, cors);

  const db = bancoAdmin();
  const { data: ajuste } = await db
    .from("ajuste")
    .select(`id, descricao, tipo, status_avaliacao,
             comentario:comentario_id (id, autor_nome, texto, criado_em),
             peca:peca_id (
               id, tema, area_direito, formato, funil, canal_codigo,
               gancho_texto, gancho_tipo, gancho_url,
               editoria:editoria_id (nome),
               pilar:pilar_id (nome),
               ciclo:ciclo_id (mes_referencia,
                 cliente:cliente_id (id, nome, slug, tom_de_voz, areas_chave, regra_base_ref)))`)
    .eq("id", ajuste_id).maybeSingle();

  if (!ajuste) return erro("Ajuste não encontrado.", 404, cors);

  const { data: blocos } = await db
    .from("peca_bloco").select("ordem, titulo, conteudo")
    .eq("peca_id", (ajuste.peca as any).id).order("ordem");

  const peca: any = ajuste.peca;
  const cliente = peca.ciclo.cliente;

  const pacote = {
    cliente: {
      id: cliente.id, nome: cliente.nome, slug: cliente.slug,
      tom_de_voz: cliente.tom_de_voz,
      areas_chave: cliente.areas_chave,
      regra_base_ref: cliente.regra_base_ref,
    },
    peca: {
      id: peca.id, tema: peca.tema, area_direito: peca.area_direito,
      canal: peca.canal_codigo, formato: peca.formato, funil: peca.funil,
      editoria: peca.editoria?.nome ?? null,
      pilar: peca.pilar?.nome ?? null,
      mes_referencia: peca.ciclo.mes_referencia,
      gancho: { texto: peca.gancho_texto, tipo: peca.gancho_tipo, url: peca.gancho_url },
      // Conteúdo integral: a ferramenta de avaliação precisa do texto inteiro,
      // não de um resumo.
      conteudo: (blocos ?? []).map((b) => ({ ordem: b.ordem, titulo: b.titulo, texto: b.conteudo })),
    },
    comentario_de_origem: ajuste.comentario ?? null,
    ajuste: { id: ajuste.id, descricao: ajuste.descricao, tipo: ajuste.tipo, status: ajuste.status_avaliacao },
  };

  const webhook = Deno.env.get("WEBHOOK_AVALIACAO_AJUSTE");
  if (!webhook) {
    // Sem webhook, o front baixa este JSON.
    return json({ modo: "download", pacote }, 200, cors);
  }

  let resultado = "ok", status = 200;
  try {
    const r = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pacote),
    });
    status = r.status;
    resultado = r.ok ? `ok (${r.status})` : `falha (${r.status})`;
  } catch (e) {
    resultado = `falha: ${(e as Error).message}`;
    status = 502;
  }

  await db.from("ajuste").update({
    enviado_em: new Date().toISOString(),
    enviado_destino: webhook.replace(/\?.*$/, ""),   // sem query string, que pode ter token
    enviado_resultado: resultado,
  }).eq("id", ajuste_id);

  return json({ modo: "webhook", resultado }, status >= 400 ? 502 : 200, cors);
});
