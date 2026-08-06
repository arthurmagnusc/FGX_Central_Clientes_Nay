/**
 * Modo de dados do portal.
 * Enquanto as env VITE_SUPABASE_* não estiverem definidas, tudo passa pelo Hono demo.
 * No go-live, preencher as três e trocar o consumidor de `api` gradualmente.
 */
export function isSupabaseReady(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  const fn = import.meta.env.VITE_FUNCTIONS_URL as string | undefined
  return Boolean(url?.trim() && anon?.trim() && fn?.trim())
}

export function dataBackendLabel(): 'hono-demo' | 'supabase' {
  return isSupabaseReady() ? 'supabase' : 'hono-demo'
}
