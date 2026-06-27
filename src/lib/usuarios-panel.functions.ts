// Server functions para gestión de usuarios del panel (solo administrador).
// Usa service_role para crear/editar/eliminar usuarios en Auth + usuarios_panel.
import { createServerFn } from "@tanstack/react-start";

export type RolPanel = "administrador" | "operador" | "lectura";

export type PanelUserRow = {
  id: string;
  nombre: string;
  rol: RolPanel;
  email: string | null;
  creado_en: string | null;
  last_sign_in_at: string | null;
};

type AuthCtx = { userId: string; rol: RolPanel };

async function verifyAdmin(accessToken: string): Promise<AuthCtx> {
  if (!accessToken) throw new Error("Sesión requerida");
  const { supabaseExternalAdmin } = await import(
    "@/integrations/supabase-external/client.server"
  );
  const { data, error } = await supabaseExternalAdmin.auth.getUser(accessToken);
  if (error || !data.user) throw new Error("Sesión inválida");
  const { data: row, error: rolErr } = await supabaseExternalAdmin
    .from("usuarios_panel")
    .select("id, rol")
    .eq("id", data.user.id)
    .maybeSingle();
  if (rolErr) throw new Error(rolErr.message);
  if (!row) throw new Error("Sin acceso al panel");
  if (row.rol !== "administrador") throw new Error("Solo el administrador puede gestionar usuarios");
  return { userId: row.id as string, rol: row.rol as RolPanel };
}

export const listPanelUsers = createServerFn({ method: "POST" })
  .inputValidator((d: { accessToken: string }) => d)
  .handler(async ({ data }): Promise<PanelUserRow[]> => {
    await verifyAdmin(data.accessToken);
    const { supabaseExternalAdmin } = await import(
      "@/integrations/supabase-external/client.server"
    );
    const { data: rows, error } = await supabaseExternalAdmin
      .from("usuarios_panel")
      .select("id, nombre, rol, creado_en")
      .order("creado_en", { ascending: true });
    if (error) throw new Error(error.message);

    // Traer info de Auth para cada uno. listUsers pagina; con <200 usuarios basta una página.
    const { data: auth, error: authErr } = await supabaseExternalAdmin.auth.admin.listUsers({
      page: 1, perPage: 200,
    });
    if (authErr) throw new Error(authErr.message);
    const byId = new Map(auth.users.map(u => [u.id, u]));

    return (rows ?? []).map((r: any) => {
      const u = byId.get(r.id);
      return {
        id: r.id,
        nombre: r.nombre,
        rol: r.rol,
        email: u?.email ?? null,
        creado_en: r.creado_en,
        last_sign_in_at: u?.last_sign_in_at ?? null,
      };
    });
  });

export const invitarUsuarioPanel = createServerFn({ method: "POST" })
  .inputValidator((d: { accessToken: string; email: string; nombre: string; rol: RolPanel; redirectTo?: string }) => {
    if (!d.email?.trim()) throw new Error("Correo requerido");
    if (!d.nombre?.trim()) throw new Error("Nombre requerido");
    if (!["administrador", "operador", "lectura"].includes(d.rol)) throw new Error("Rol inválido");
    return d;
  })
  .handler(async ({ data }): Promise<{ id: string }> => {
    await verifyAdmin(data.accessToken);
    const { supabaseExternalAdmin } = await import(
      "@/integrations/supabase-external/client.server"
    );

    const email = data.email.trim().toLowerCase();

    // Si el correo ya existe en Auth, reutilízalo. Si no, invita.
    let userId: string | null = null;
    const { data: existing } = await supabaseExternalAdmin.auth.admin.listUsers({
      page: 1, perPage: 200,
    });
    const match = existing?.users.find(u => (u.email ?? "").toLowerCase() === email);
    if (match) {
      userId = match.id;
    } else {
      const { data: inv, error: invErr } = await supabaseExternalAdmin.auth.admin
        .inviteUserByEmail(email, {
          data: { nombre: data.nombre.trim() },
          redirectTo: data.redirectTo,
        });
      if (invErr || !inv.user) throw new Error(invErr?.message ?? "No se pudo invitar al usuario");
      userId = inv.user.id;
    }

    // Verificar que no exista ya en usuarios_panel
    const { data: yaExiste } = await supabaseExternalAdmin
      .from("usuarios_panel").select("id").eq("id", userId).maybeSingle();
    if (yaExiste) throw new Error("Ese usuario ya tiene acceso al panel");

    const { error: insErr } = await supabaseExternalAdmin
      .from("usuarios_panel")
      .insert({ id: userId, nombre: data.nombre.trim(), rol: data.rol });
    if (insErr) throw new Error(insErr.message);

    return { id: userId };
  });

export const actualizarRolUsuarioPanel = createServerFn({ method: "POST" })
  .inputValidator((d: { accessToken: string; id: string; rol: RolPanel }) => {
    if (!["administrador", "operador", "lectura"].includes(d.rol)) throw new Error("Rol inválido");
    return d;
  })
  .handler(async ({ data }) => {
    const ctx = await verifyAdmin(data.accessToken);
    if (data.id === ctx.userId && data.rol !== "administrador") {
      throw new Error("No puedes quitarte a ti mismo el rol de administrador");
    }
    const { supabaseExternalAdmin } = await import(
      "@/integrations/supabase-external/client.server"
    );
    const { error } = await supabaseExternalAdmin
      .from("usuarios_panel").update({ rol: data.rol }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const eliminarUsuarioPanel = createServerFn({ method: "POST" })
  .inputValidator((d: { accessToken: string; id: string }) => d)
  .handler(async ({ data }) => {
    const ctx = await verifyAdmin(data.accessToken);
    if (data.id === ctx.userId) {
      throw new Error("No puedes eliminar tu propio acceso");
    }
    const { supabaseExternalAdmin } = await import(
      "@/integrations/supabase-external/client.server"
    );
    // Primero quitar del panel
    const { error: delPanelErr } = await supabaseExternalAdmin
      .from("usuarios_panel").delete().eq("id", data.id);
    if (delPanelErr) throw new Error(delPanelErr.message);
    // Luego revocar el acceso eliminando el usuario en Auth
    const { error: delAuthErr } = await supabaseExternalAdmin.auth.admin.deleteUser(data.id);
    if (delAuthErr) throw new Error(delAuthErr.message);
    return { ok: true };
  });
