import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.118.0'

/** Usuário do token enviado pelo app; null se não houver login válido. */
export async function getRequestUser(req: Request) {
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const {
    data: { user },
  } = await client.auth.getUser()
  return user
}

/** Cliente com service_role (ignora RLS): use só para o que a função precisa gravar. */
export function createAdminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })
}

/**
 * URL pública do projeto. Na produção é a própria SUPABASE_URL; no ambiente local
 * a função enxerga o gateway interno (http://kong:8000), que o navegador não alcança.
 */
export function publicSupabaseUrl() {
  const url = Deno.env.get('SUPABASE_URL')!
  return new URL(url).hostname === 'kong' ? 'http://127.0.0.1:54321' : url
}
