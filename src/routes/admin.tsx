import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { getExternalSupabase } from "@/integrations/supabase-external/browser-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dashboard } from "@/components/admin/Dashboard";
import { UsuariosPanelView } from "@/components/admin/UsuariosPanelView";
import { AnalyticsView } from "@/components/admin/AnalyticsView";
import { CambiarPasswordDialog } from "@/components/admin/CambiarPasswordDialog";
import { CalendarDays, Users, BarChart3, KeyRound } from "lucide-react";
import { Toaster, toast } from "sonner";

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
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  // /admin también funciona como ruta padre de /admin/invite. En esa ruta hija
  // no debe ejecutarse el guard/login del panel, solo renderizar el formulario.
  if (pathname === "/admin/invite") {
    return <Outlet />;
  }

  return <AdminPanelPage />;
}

function AdminPanelPage() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [panelUser, setPanelUser] = useState<PanelUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [section, setSection] = useState<"reservas" | "analitica" | "usuarios">("reservas");

  useEffect(() => {
    // Si Supabase cae aquí por fallback al Site URL trayendo un hash de
    // invitación o recuperación, redirige a /admin/invite preservando el hash
    // ANTES de inicializar el cliente (que de otro modo consumiría el token).
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const safeHref = `${window.location.origin}${window.location.pathname}${window.location.search}${hash ? "#[auth-hash]" : ""}`;
      console.log("[InviteDebug] Admin guard ejecutado", {
        source: "admin-guard",
        href: safeHref,
        pathname: window.location.pathname,
        hasHash: Boolean(hash),
        hashKeys: hash ? Array.from(new URLSearchParams(hash.slice(1)).keys()) : [],
      });
      if (window.location.pathname === "/admin/invite") {
        console.log("[InviteDebug] Admin guard: ruta /admin/invite detectada, no redirige");
        return;
      }
      if (hash && /[#&](type=(invite|recovery)|access_token=)/.test(hash)) {
        console.log("[InviteDebug] Admin guard: token detectado, redirigiendo a /admin/invite");
        window.location.replace(`/admin/invite${hash}`);
        return;
      } else {
        console.log("[InviteDebug] Admin guard: no detectó token de invitación/recuperación");
      }
    }
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

  useEffect(() => {
    if (panelUser?.rol === "lectura" && section === "analitica") {
      setSection("reservas");
      toast.error("No tienes permisos para ver esta sección");
    }
  }, [panelUser, section]);

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
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border bg-white p-1">
              <button
                onClick={() => setSection("reservas")}
                className={`px-3 py-1.5 text-sm rounded-md inline-flex items-center gap-1.5 ${
                  section === "reservas" ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                <CalendarDays className="h-4 w-4" /> Reservas
              </button>
              {panelUser?.rol !== "lectura" && (
                <button
                  onClick={() => setSection("analitica")}
                  className={`px-3 py-1.5 text-sm rounded-md inline-flex items-center gap-1.5 ${
                    section === "analitica" ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  <BarChart3 className="h-4 w-4" /> Analítica
                </button>
              )}
              {panelUser?.rol === "administrador" && (
                <button
                  onClick={() => setSection("usuarios")}
                  className={`px-3 py-1.5 text-sm rounded-md inline-flex items-center gap-1.5 ${
                    section === "usuarios" ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  <Users className="h-4 w-4" /> Usuarios
                </button>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={async () => { await supabase?.auth.signOut(); }}>
              Cerrar sesión
            </Button>
          </div>
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
        ) : section === "usuarios" && panelUser.rol === "administrador" ? (
          <UsuariosPanelView accessToken={session.access_token} currentUserId={panelUser.id} />
        ) : section === "analitica" ? (
          <AnalyticsView accessToken={session.access_token} />
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
