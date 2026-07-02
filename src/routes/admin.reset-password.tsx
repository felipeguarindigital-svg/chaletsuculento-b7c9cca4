import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getExternalSupabase } from "@/integrations/supabase-external/browser-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms);
    promise
      .then((v) => { window.clearTimeout(timer); resolve(v); })
      .catch((e) => { window.clearTimeout(timer); reject(e); });
  });
}

function readTokensFromHash() {
  if (typeof window === "undefined" || !window.location.hash) return null;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token };
}

export const Route = createFileRoute("/admin/reset-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Restablecer contraseña · Panel" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
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
    let active = true;
    (async () => {
      try {
        const hashTokens = readTokensFromHash();
        const client = await withTimeout(getExternalSupabase(), 8000, "No se pudo inicializar el acceso al panel.");
        if (!active) return;
        setSupabase(client);

        if (hashTokens) {
          const { data, error } = await withTimeout(client.auth.setSession(hashTokens), 8000, "No se pudo validar el enlace de recuperación.");
          if (error) throw error;
          if (!active) return;
          setEmail(data.session?.user.email ?? null);
          if (!data.session) {
            setError("Enlace de recuperación inválido o expirado. Solicita uno nuevo desde la pantalla de inicio de sesión.");
          } else if (typeof window !== "undefined") {
            window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
          }
          setReady(true);
          return;
        }

        const { data } = await withTimeout(client.auth.getSession(), 8000, "No se pudo leer la sesión de recuperación.");
        if (!active) return;
        if (data.session) setEmail(data.session.user.email ?? null);
        else setError("Enlace de recuperación inválido o expirado. Solicita uno nuevo desde la pantalla de inicio de sesión.");
        setReady(true);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No se pudo validar el enlace.");
        setReady(true);
      }
    })();
    return () => { active = false; };
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
    // Cierra la sesión de recuperación y redirige al login del panel.
    await supabase.auth.signOut();
    setTimeout(() => navigate({ to: "/admin", search: { reset: "ok" } as never }), 1200);
  }

  return (
    <div className="min-h-screen grid place-items-center bg-stone-100 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 space-y-5 border">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Restablecer contraseña</h1>
          <p className="text-sm text-stone-500 mt-1">Panel · Chalets Suculento</p>
          {email && <p className="text-xs text-stone-500 mt-2 font-mono">{email}</p>}
        </div>

        {!ready ? (
          <p className="text-sm text-stone-500">Validando enlace…</p>
        ) : success ? (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md p-3">
            Contraseña actualizada. Ya puedes iniciar sesión.
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
              {submitting ? "Guardando…" : "Actualizar contraseña"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
