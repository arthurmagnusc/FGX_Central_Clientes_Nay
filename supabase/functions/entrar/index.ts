// POST /entrar  { slug, senha, nome }
// Verifica a senha compartilhada do escritório, grava a sessão com o nome
// informado e devolve o JWT que o front usará nas consultas.
//
// A comparação de senha acontece AQUI, no servidor. Nada de hash no bundle.
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { bancoAdmin } from "../_compartilhado/db.ts";
import { emitirToken, expiraEm } from "../_compartilhado/jwt.ts";
import { cabecalhosCors, json, erro, atrasoConstante } from "../_compartilhado/http.ts";

Deno.serve(async (req) => {
  const cors = cabecalhosCors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return erro("Método não permitido", 405, cors);

  const inicio = Date.now();
  let corpo: { slug?: string; senha?: string; nome?: string };
  try { corpo = await req.json(); } catch { return erro("Corpo inválido", 400, cors); }

  const slug = (corpo.slug ?? "").trim().toLowerCase();
  const senha = corpo.senha ?? "";
  const nome = (corpo.nome ?? "").trim();

  if (!slug || !senha) return erro("Informe a senha.", 400, cors);
  if (nome.length < 2) return erro("Informe seu nome para entrar.", 400, cors);
  if (nome.length > 80) return erro("Nome muito longo.", 400, cors);

  const db = bancoAdmin();
  const { data: cliente } = await db
    .from("cliente")
    .select("id, nome, slug, senha_hash, ativo")
    .eq("slug", slug)
    .maybeSingle();

  // Mensagem única para slug inexistente e senha errada: não confirmamos
  // quais escritórios existem para quem está tentando adivinhar.
  if (!cliente || !cliente.senha_hash || !cliente.ativo) {
    await atrasoConstante(inicio);
    return erro("Acesso não liberado para este endereço.", 401, cors);
  }

  const ok = await bcrypt.compare(senha, cliente.senha_hash);
  if (!ok) {
    await atrasoConstante(inicio);
    return erro("Senha incorreta.", 401, cors);
  }

  const { data: sessao, error: erroSessao } = await db
    .from("sessao")
    .insert({ cliente_id: cliente.id, pessoa_nome: nome, expira_em: expiraEm().toISOString() })
    .select("id")
    .single();
  if (erroSessao) return erro("Não foi possível iniciar a sessão.", 500, cors);

  const token = await emitirToken({
    sub: sessao.id,
    role: "authenticated",
    cliente_id: cliente.id,
    pessoa_nome: nome,
    is_admin: false,
  });

  await atrasoConstante(inicio);
  return json({
    token,
    cliente: { id: cliente.id, nome: cliente.nome, slug: cliente.slug },
    pessoa_nome: nome,
    expira_em: expiraEm().toISOString(),
  }, 200, cors);
});
