// POST /entrar-admin  { senha }
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { bancoAdmin } from "../_compartilhado/db.ts";
import { emitirToken, expiraEm } from "../_compartilhado/jwt.ts";
import { cabecalhosCors, json, erro, atrasoConstante } from "../_compartilhado/http.ts";

Deno.serve(async (req) => {
  const cors = cabecalhosCors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return erro("Método não permitido", 405, cors);

  const inicio = Date.now();
  let corpo: { senha?: string };
  try { corpo = await req.json(); } catch { return erro("Corpo inválido", 400, cors); }
  if (!corpo.senha) return erro("Informe a senha.", 400, cors);

  const db = bancoAdmin();
  const { data: admin } = await db
    .from("admin_user")
    .select("id, nome, senha_hash, senha_inicial_trocada")
    .order("criado_em", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!admin) {
    await atrasoConstante(inicio);
    return erro("Nenhum administrador cadastrado. Rode `npm run criar-admin`.", 401, cors);
  }

  if (!await bcrypt.compare(corpo.senha, admin.senha_hash)) {
    await atrasoConstante(inicio);
    return erro("Senha incorreta.", 401, cors);
  }

  const { data: sessao, error } = await db
    .from("sessao")
    .insert({ admin_id: admin.id, pessoa_nome: admin.nome, expira_em: expiraEm().toISOString() })
    .select("id").single();
  if (error) return erro("Não foi possível iniciar a sessão.", 500, cors);

  const token = await emitirToken({
    sub: sessao.id, role: "authenticated", pessoa_nome: admin.nome, is_admin: true,
  });

  await atrasoConstante(inicio);
  return json({
    token,
    admin: { id: admin.id, nome: admin.nome },
    // O painel mostra aviso permanente enquanto isto for false.
    senha_inicial_trocada: admin.senha_inicial_trocada,
    expira_em: expiraEm().toISOString(),
  }, 200, cors);
});
