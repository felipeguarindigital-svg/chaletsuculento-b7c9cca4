import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { getExternalSupabase } from "@/integrations/supabase-external/browser-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dashboard } from "@/components/admin/Dashboard";
import { UsuariosPanelView } from "@/components/admin/UsuariosPanelView";
import { CalendarDays, Users } from "lucide-react";
import { Toaster } from "sonner";

type PanelUser = {
  id: string;
  nombre: string;
  rol: "administrador" | "operador" | "lectura";
};

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Panel · Chalets Suculento" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminPage,
});

function AdminPage() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [panelUser, setPanelUser] = useState<PanelUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleError, setRoleError] = useState<string | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const client = await getExternalSupabase();
      setSupabase(client);
      const { data } = await client.auth.getSession();
      setSession(data.session);
      setLoading(false);
      const { data: sub } = client.auth.onAuthStateChange((_e, s) => {
        setSession(s);
        if (!s) setPanelUser(null);
      });
      unsub = () => sub.subscription.unsubscribe();
    })();
    return () => { unsub?.(); };
  }, []);

  useEffect(() => {
    if (!supabase || !session) return;
    setRoleError(null);
    supabase
      .from("usuarios_panel")
      .select("id, nombre, rol")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { setRoleError(error.message); return; }
        if (!data) { setRoleError("Tu usuario no tiene acceso al panel."); return; }
        setPanelUser(data as PanelUser);
      });
  }, [supabase, session]);

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-stone-500">Cargando…</div>;
  }

  if (!session) return <LoginForm supabase={supabase} />;

  return (
    <div className="min-h-screen bg-stone-50">
      <Toaster richColors position="top-right" />
      <header className="border-b bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-semibold tracking-tight">Panel · Chalets Suculento</h1>
            {panelUser && (
              <p className="text-xs text-stone-500">
                {panelUser.nombre} ·{" "}
                <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-medium">
                  {panelUser.rol}
                </span>
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={async () => { await supabase?.auth.signOut(); }}>
            Cerrar sesión
          </Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {roleError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-medium">No se pudo cargar tu rol.</p>
            <p className="text-sm mt-1">{roleError}</p>
            <p className="text-sm mt-3">
              Sesión activa: <span className="font-mono">{session.user.email}</span>
            </p>
          </div>
        ) : !panelUser ? (
          <p className="text-stone-500">Verificando permisos…</p>
        ) : (
          <Dashboard accessToken={session.access_token} rol={panelUser.rol} />
        )}
      </main>
    </div>
  );
}

function LoginForm({ supabase }: { supabase: SupabaseClient | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) setError(error.message);
  }

  return (
    <div className="min-h-screen grid place-items-center bg-stone-100 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 space-y-5 border"
      >
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Panel administrativo</h1>
          <p className="text-sm text-stone-500 mt-1">Chalets Suculento</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Correo</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>
        )}
        <Button type="submit" className="w-full" disabled={submitting || !supabase}>
          {submitting ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
