// Devuelve al navegador la URL y la anon key del Supabase externo "Chalet-Suculento".
// La anon key es pública por diseño (RLS la protege). No exponemos service_role.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/admin/config")({
  server: {
    handlers: {
      GET: async () => {
        const url = process.env.EXTERNAL_SUPABASE_URL;
        const anonKey = process.env.EXTERNAL_SUPABASE_ANON_KEY;
        if (!url || !anonKey) {
          return new Response(
            JSON.stringify({ error: "Config externa no disponible" }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
        return Response.json({ url, anonKey });
      },
    },
  },
});
