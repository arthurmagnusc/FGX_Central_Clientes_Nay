#!/usr/bin/env node
/**
 * Cria (ou redefine) o administrador a partir de ADMIN_SENHA_INICIAL.
 * A senha nunca aparece em migration nem em seed — só aqui, vinda do ambiente.
 *
 *   ADMIN_SENHA_INICIAL='...' SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run criar-admin
 */
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_SENHA_INICIAL, ADMIN_NOME = "Equipe FGX" } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
if (!ADMIN_SENHA_INICIAL || ADMIN_SENHA_INICIAL.length < 12) {
  console.error("Defina ADMIN_SENHA_INICIAL com pelo menos 12 caracteres.");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const hash = await bcrypt.hash(ADMIN_SENHA_INICIAL, 12);

const { data: existente } = await db.from("admin_user").select("id").limit(1).maybeSingle();

if (existente) {
  const { error } = await db.from("admin_user")
    .update({ senha_hash: hash, senha_inicial_trocada: false }).eq("id", existente.id);
  if (error) throw error;
  console.log("Senha do administrador redefinida.");
} else {
  const { error } = await db.from("admin_user").insert({ nome: ADMIN_NOME, senha_hash: hash });
  if (error) throw error;
  console.log("Administrador criado.");
}
console.log("O painel vai exibir aviso permanente até a senha inicial ser trocada.");
