// Cliente Supabase EXTERNO (proyecto "Chalet-Suculento", gestionado por el usuario fuera de Lovable Cloud).
// Server-only: usar exclusivamente dentro de handlers de createServerFn o server routes.
// Para exponer datos al frontend, envuelve las consultas en un createServerFn y llámalo con useServerFn.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _anonClient: SupabaseClient | undefined;
let _adminClient: SupabaseClient | undefined;

function buildAnon(): SupabaseClient {
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

function buildAdmin(): SupabaseClient {
  const url = process.env.EXTERNAL_SUPABASE_URL;
  const service = process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) {
    throw new Error(
      "Faltan EXTERNAL_SUPABASE_URL o EXTERNAL_SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor.",
    );
  }
  return createClient(url, service, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

// Cliente anon: respeta RLS como rol `anon`. Para lecturas públicas.
export const supabaseExternal = new Proxy({} as SupabaseClient, {
  get(_, prop, receiver) {
    if (!_anonClient) _anonClient = buildAnon();
    return Reflect.get(_anonClient, prop, receiver);
  },
});

// Cliente service_role: BYPASEA RLS. Usar SOLO en server functions confiables.
export const supabaseExternalAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop, receiver) {
    if (!_adminClient) _adminClient = buildAdmin();
    return Reflect.get(_adminClient, prop, receiver);
  },
});
