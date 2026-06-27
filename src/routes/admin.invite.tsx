import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getExternalSupabase } from "@/integrations/supabase-external/browser-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/invite")({
  ssr: false,
  head: () => ({ meta: [{ title: "Configura tu contraseña · Panel" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: InvitePage,
});

function InvitePage() {
  const navigate = useNavigate();
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const client = await getExternalSupabase();
      setSupabase(client);
      // detectSessionInUrl procesa el hash automáticamente
      const { data } = await client.auth.getSession();
      if (data.session) setEmail(data.session.user.email ?? null);
      else {
        // Esperar un instante por si está procesando el hash
        await new Promise(r => setTimeout(r, 400));
        const { data: d2 } = await client.auth.getSession();
        if (d2.session) setEmail(d2.session.user.email ?? null);
        else setError("Enlace de invitación inválido o expirado. Pídele al administrador que te reenvíe la invitación.");
      }
      setReady(true);
    })();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden."); return; }
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) { setError(error.message); return; }
    setSuccess(true);
    setTimeout(() => navigate({ to: "/admin" }), 1200);
  }

  return (
    <div className="min-h-screen grid place-items-center bg-stone-100 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 space-y-5 border">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Configura tu contraseña</h1>
          <p className="text-sm text-stone-500 mt-1">Panel · Chalets Suculento</p>
          {email && <p className="text-xs text-stone-500 mt-2 font-mono">{email}</p>}
        </div>

        {!ready ? (
          <p className="text-sm text-stone-500">Validando invitación…</p>
        ) : success ? (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md p-3">
            ¡Listo! Redirigiendo al panel…
          </p>
        ) : !email ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
            {error ?? "Enlace inválido."}
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pw">Nueva contraseña</Label>
              <Input id="pw" type="password" autoComplete="new-password" required
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw2">Confirmar contraseña</Label>
              <Input id="pw2" type="password" autoComplete="new-password" required
                value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Guardando…" : "Guardar y entrar"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
