#!/usr/bin/env node
/**
 * Define a senha compartilhada de um escritório e ativa o acesso.
 * Enquanto isso não roda, /c/<slug> responde que o acesso não foi liberado.
 *
 *   node scripts/definir-senha-cliente.mjs fiedra 'senha-forte-aqui'
 */
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const [slug, senha] = process.argv.slice(2);
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!slug || !senha) {
  console.error("Uso: node scripts/definir-senha-cliente.mjs <slug> <senha>");
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
if (senha.length < 10) {
  console.error("A senha precisa de pelo menos 10 caracteres. Ela é compartilhada pelo escritório inteiro.");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: cliente } = await db.from("cliente").select("id, nome").eq("slug", slug).maybeSingle();
if (!cliente) { console.error(`Cliente com slug "${slug}" não existe.`); process.exit(1); }

const { error } = await db.from("cliente")
  .update({ senha_hash: await bcrypt.hash(senha, 12), ativo: true }).eq("id", cliente.id);
if (error) throw error;

console.log(`Senha definida para ${cliente.nome}. Acesso em /c/${slug} liberado.`);
