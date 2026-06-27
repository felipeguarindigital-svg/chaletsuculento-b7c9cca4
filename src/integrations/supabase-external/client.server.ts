// Cliente Supabase EXTERNO (proyecto "Chalet-Suculento", gestionado por el usuario fuera de Lovable Cloud).
// Server-only: usar exclusivamente dentro de handlers de createServerFn o server routes.
// Para exponer datos al frontend, envuelve las consultas en un createServerFn y llámalo con useServerFn.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | undefined;

function build(): SupabaseClient {
  const url = process.env.EXTERNAL_SUPABASE_URL;
  const anon = process.env.EXTERNAL_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Faltan EXTERNAL_SUPABASE_URL o EXTERNAL_SUPABASE_ANON_KEY en el entorno del servidor.",
    );
  }
  return createClient(url, anon, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

// Cliente con la anon key del Supabase externo. Respeta RLS como rol `anon`.
// Para operaciones admin (service_role), añadiremos un segundo cliente cuando guardes esa key.
export const supabaseExternal = new Proxy({} as SupabaseClient, {
  get(_, prop, receiver) {
    if (!_client) _client = build();
    return Reflect.get(_client, prop, receiver);
  },
});
