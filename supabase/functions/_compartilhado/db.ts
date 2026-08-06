import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// Cliente com service role: usado SÓ dentro das Edge Functions, para as
// operações que precisam furar o RLS (conferir senha, criar sessão, assinar
// URL de arquivo). Esta chave nunca vai para o navegador.
export function bancoAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}
