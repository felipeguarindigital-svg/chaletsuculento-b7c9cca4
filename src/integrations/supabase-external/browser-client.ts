// Cliente Supabase EXTERNO para el navegador (panel admin).
// Se inicializa una sola vez tras obtener la config pública desde /api/admin/config.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;
let _pending: Promise<SupabaseClient> | null = null;

export async function getExternalSupabase(): Promise<SupabaseClient> {
  if (_client) return _client;
  if (_pending) return _pending;
  _pending = (async () => {
    const res = await fetch("/api/admin/config");
    if (!res.ok) throw new Error("No se pudo obtener la configuración del panel");
    const { url, anonKey } = (await res.json()) as { url: string; anonKey: string };
    _client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "chalet-admin-auth",
      },
    });
    return _client;
  })();
  return _pending;
}
