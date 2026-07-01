// Server functions del Panel Interno (Supabase EXTERNO "Chalet-Suculento").
// Cada función recibe el access_token del usuario, verifica su sesión contra
// el Supabase externo, busca su rol en `usuarios_panel`, aplica la restricción
// correspondiente y, si está autorizado, ejecuta la operación con el cliente
// admin (service_role). Esto evita depender de RLS por rol y centraliza la
// autorización en un único lugar auditable.
import { createServerFn } from "@tanstack/react-start";

export type RolPanel = "administrador" | "operador" | "lectura";

export type ChaletName = "Suculento" | "Del Bosque" | "Cattleya" | "Ukiyo" | "Satori";
export type EstadoReserva = "cotizacion" | "reservado" | "cancelado";
export type OrigenReserva = "landing" | "manual";
export type TipoTarifa = "domingo_jueves" | "viernes" | "sabado" | "previa_festivo";

export type NocheDesglose = { fecha: string; tipo: TipoTarifa; precio: number };

export type DescuentoTipo = "porcentaje" | "valor_fijo";

export type ReservaRow = {
  id: string;
  codigo: string;
  chalet: ChaletName;
  fecha: string;
  fecha_checkout: string | null;
  noches: number | null;
  desglose_noches: NocheDesglose[] | null;
  nombre: string;
  whatsapp: string;
  tipo_tarifa: TipoTarifa;
  precio_noche: number;
  estado: EstadoReserva;
  origen: OrigenReserva;
  notas: string | null;
  created_at: string;
  descuento_tipo: DescuentoTipo | null;
  descuento_valor: number | null;
};

/** Calcula el monto de descuento en pesos a partir del subtotal (noches + adicionales). */
export function computeDescuento(
  subtotal: number,
  tipo: DescuentoTipo | null | undefined,
  valor: number | null | undefined,
): number {
  const v = Number(valor ?? 0);
  if (!tipo || !v || v <= 0 || subtotal <= 0) return 0;
  if (tipo === "porcentaje") {
    const pct = Math.max(0, Math.min(100, v));
    return Math.round((subtotal * pct) / 100);
  }
  return Math.min(Math.round(v), subtotal);
}

export type ServicioCategoriaLite = "experiencias_decoraciones" | "alimentacion_adicionales" | null;

export type ReservaAdicional = {
  id: string;
  reserva_id: string;
  adicional_id: string;
  precio_cobrado: number;
  nombre?: string;
  categoria?: ServicioCategoriaLite;
};

export type ReservaDetail = ReservaRow & {
  adicionales: ReservaAdicional[];
  total_adicionales: number;
  subtotal: number;
  descuento_monto: number;
  total: number;
};

type AuthCtx = { userId: string; rol: RolPanel; nombre: string };

async function verifyToken(accessToken: string): Promise<AuthCtx> {
  if (!accessToken) throw new Error("Sesión requerida");
  const { supabaseExternalAdmin } = await import(
    "@/integrations/supabase-external/client.server"
  );
  const { data, error } = await supabaseExternalAdmin.auth.getUser(accessToken);
  if (error || !data.user) throw new Error("Sesión inválida");
  const { data: row, error: rolErr } = await supabaseExternalAdmin
    .from("usuarios_panel")
    .select("id, rol, nombre")
    .eq("id", data.user.id)
    .maybeSingle();
  if (rolErr) throw new Error(rolErr.message);
  if (!row) throw new Error("Sin acceso al panel");
  return { userId: row.id as string, rol: row.rol as RolPanel, nombre: row.nombre as string };
}

function requireRol(ctx: AuthCtx, allowed: RolPanel[]) {
  if (!allowed.includes(ctx.rol)) throw new Error("No autorizado para esta acción");
}

// ------------------ MÉTRICAS DEL DASHBOARD ------------------

export type DashboardMetrics = {
  reservas_hoy: number;
  cotizaciones_pendientes: number;
  ocupacion_semana_pct: number;
  ingresos_mes: number;
};

const CHALETS_TOTAL = 5;

function startOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = x.getDay(); // 0=dom
  const diff = dow === 0 ? -6 : 1 - dow; // semana inicia lunes
  x.setDate(x.getDate() + diff);
  return x;
}

function fmtYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const getDashboardMetrics = createServerFn({ method: "POST" })
  .inputValidator((d: { accessToken: string }) => d)
  .handler(async ({ data }): Promise<DashboardMetrics> => {
    await verifyToken(data.accessToken);
    const { supabaseExternalAdmin } = await import(
      "@/integrations/supabase-external/client.server"
    );

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const hoy = fmtYmd(today);
    const lunes = startOfWeek(today);
    const domingo = new Date(lunes); domingo.setDate(domingo.getDate() + 6);
    const inicioMes = new Date(today.getFullYear(), today.getMonth(), 1);
    const finMes = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Reservas para hoy = check-in hoy y estado reservado
    const { count: reservasHoy } = await supabaseExternalAdmin
      .from("reservas")
      .select("id", { count: "exact", head: true })
      .eq("estado", "reservado")
      .eq("fecha", hoy);

    const { count: cotizaciones } = await supabaseExternalAdmin
      .from("reservas")
      .select("id", { count: "exact", head: true })
      .eq("estado", "cotizacion");

    // Ocupación semana: noches reservadas en [lunes, domingo] / (5 chalets * 7)
    const { data: reservasSemana } = await supabaseExternalAdmin
      .from("reservas")
      .select("fecha, fecha_checkout, noches")
      .eq("estado", "reservado")
      .lte("fecha", fmtYmd(domingo));

    let nochesOcupadas = 0;
    for (const r of reservasSemana ?? []) {
      const ci = new Date(r.fecha + "T00:00:00");
      const co = r.fecha_checkout
        ? new Date(r.fecha_checkout + "T00:00:00")
        : new Date(ci.getTime() + (r.noches ?? 1) * 86400000);
      for (let d = new Date(ci); d < co; d.setDate(d.getDate() + 1)) {
        if (d >= lunes && d <= domingo) nochesOcupadas++;
      }
    }
    const ocupacionPct = Math.round((nochesOcupadas / (CHALETS_TOTAL * 7)) * 100);

    // Ingresos del mes: precio_noche * noches + adicionales (solo reservado, check-in dentro del mes)
    const { data: resMes } = await supabaseExternalAdmin
      .from("reservas")
      .select("id, precio_noche, noches, desglose_noches")
      .eq("estado", "reservado")
      .gte("fecha", fmtYmd(inicioMes))
      .lte("fecha", fmtYmd(finMes));

    let ingresos = 0;
    const ids: string[] = [];
    for (const r of resMes ?? []) {
      // Si hay desglose, ese es el precio total real de noches; si no, fallback.
      const desglose = (r.desglose_noches as NocheDesglose[] | null) ?? null;
      if (desglose && desglose.length > 0) {
        ingresos += desglose.reduce((s, n) => s + Number(n.precio || 0), 0);
      } else {
        ingresos += Number(r.precio_noche || 0) * Number(r.noches || 1);
      }
      ids.push(r.id as string);
    }
    if (ids.length > 0) {
      const { data: ads } = await supabaseExternalAdmin
        .from("reserva_adicionales")
        .select("precio_cobrado")
        .in("reserva_id", ids);
      for (const a of ads ?? []) ingresos += Number(a.precio_cobrado || 0);
    }

    return {
      reservas_hoy: reservasHoy ?? 0,
      cotizaciones_pendientes: cotizaciones ?? 0,
      ocupacion_semana_pct: ocupacionPct,
      ingresos_mes: ingresos,
    };
  });

// ------------------ LISTAR RESERVAS ------------------

export type ListFilters = {
  chalet?: ChaletName | "todos";
  estado?: EstadoReserva | "todos";
  origen?: OrigenReserva | "todos";
  desde?: string | null;
  hasta?: string | null;
};

export const listReservas = createServerFn({ method: "POST" })
  .inputValidator((d: { accessToken: string; filters?: ListFilters }) => d)
  .handler(async ({ data }): Promise<ReservaRow[]> => {
    await verifyToken(data.accessToken);
    const { supabaseExternalAdmin } = await import(
      "@/integrations/supabase-external/client.server"
    );
    let q = supabaseExternalAdmin
      .from("reservas")
      .select("*")
      .order("fecha", { ascending: false })
      .limit(500);
    const f = data.filters ?? {};
    if (f.chalet && f.chalet !== "todos") q = q.eq("chalet", f.chalet);
    if (f.estado && f.estado !== "todos") q = q.eq("estado", f.estado);
    if (f.origen && f.origen !== "todos") q = q.eq("origen", f.origen);
    if (f.desde) q = q.gte("fecha", f.desde);
    if (f.hasta) q = q.lte("fecha", f.hasta);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as ReservaRow[];
  });

// ------------------ DETALLE ------------------

export const getReservaDetail = createServerFn({ method: "POST" })
  .inputValidator((d: { accessToken: string; id: string }) => d)
  .handler(async ({ data }): Promise<ReservaDetail> => {
    await verifyToken(data.accessToken);
    const { supabaseExternalAdmin } = await import(
      "@/integrations/supabase-external/client.server"
    );
    const { data: r, error } = await supabaseExternalAdmin
      .from("reservas").select("*").eq("id", data.id).single();
    if (error || !r) throw new Error(error?.message ?? "Reserva no encontrada");
    const { data: ads, error: errAd } = await supabaseExternalAdmin
      .from("reserva_adicionales")
      .select("id, reserva_id, adicional_id, precio_cobrado, servicios_adicionales(nombre)")
      .eq("reserva_id", data.id);
    if (errAd) throw new Error(errAd.message);
    const adicionales: ReservaAdicional[] = (ads ?? []).map((a: any) => ({
      id: a.id,
      reserva_id: a.reserva_id,
      adicional_id: a.adicional_id,
      precio_cobrado: Number(a.precio_cobrado),
      nombre: a.servicios_adicionales?.nombre,
    }));
    const totalAd = adicionales.reduce((s, a) => s + a.precio_cobrado, 0);
    const desglose = (r.desglose_noches as NocheDesglose[] | null) ?? null;
    const totalNoches = desglose && desglose.length > 0
      ? desglose.reduce((s, n) => s + Number(n.precio || 0), 0)
      : Number(r.precio_noche || 0) * Number(r.noches || 1);
    const subtotal = totalNoches + totalAd;
    const descTipo = (r as any).descuento_tipo as DescuentoTipo | null;
    const descValor = Number((r as any).descuento_valor ?? 0);
    const descuento_monto = computeDescuento(subtotal, descTipo, descValor);
    return {
      ...(r as ReservaRow),
      adicionales,
      total_adicionales: totalAd,
      subtotal,
      descuento_monto,
      total: subtotal - descuento_monto,
    };
  });

// ------------------ MUTACIONES ------------------

export const updateEstadoReserva = createServerFn({ method: "POST" })
  .inputValidator((d: { accessToken: string; id: string; estado: EstadoReserva }) => d)
  .handler(async ({ data }) => {
    const ctx = await verifyToken(data.accessToken);
    requireRol(ctx, ["administrador", "operador"]);
    const { supabaseExternalAdmin } = await import(
      "@/integrations/supabase-external/client.server"
    );
    const { error } = await supabaseExternalAdmin
      .from("reservas").update({ estado: data.estado }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateNotasReserva = createServerFn({ method: "POST" })
  .inputValidator((d: { accessToken: string; id: string; notas: string }) => d)
  .handler(async ({ data }) => {
    const ctx = await verifyToken(data.accessToken);
    requireRol(ctx, ["administrador", "operador"]);
    const { supabaseExternalAdmin } = await import(
      "@/integrations/supabase-external/client.server"
    );
    const { error } = await supabaseExternalAdmin
      .from("reservas").update({ notas: data.notas }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type ReservaPatch = Partial<{
  nombre: string;
  whatsapp: string;
  chalet: ChaletName;
  fecha: string;
  fecha_checkout: string;
  noches: number;
  desglose_noches: NocheDesglose[];
  precio_noche: number;
  tipo_tarifa: TipoTarifa;
  estado: EstadoReserva;
  descuento_tipo: DescuentoTipo | null;
  descuento_valor: number | null;
}>;


export const updateReserva = createServerFn({ method: "POST" })
  .inputValidator((d: {
    accessToken: string;
    id: string;
    patch: ReservaPatch;
    adicionales?: Array<{ adicional_id: string; precio_cobrado: number }>;
  }) => d)
  .handler(async ({ data }) => {
    const ctx = await verifyToken(data.accessToken);
    requireRol(ctx, ["administrador", "operador"]);
    const { supabaseExternalAdmin } = await import(
      "@/integrations/supabase-external/client.server"
    );

    // Conflict check: si se editan chalet/fecha/fecha_checkout, o si el estado
    // pasa a "reservado", validar que no se solape con otra reserva "reservado"
    // del mismo chalet (excluyendo esta).
    const p = data.patch;
    if (p.chalet || p.fecha || p.fecha_checkout || p.estado === "reservado") {
      const { data: actual, error: eAct } = await supabaseExternalAdmin
        .from("reservas")
        .select("chalet, fecha, fecha_checkout, estado")
        .eq("id", data.id)
        .single();
      if (eAct || !actual) throw new Error(eAct?.message ?? "Reserva no encontrada");
      const chalet = p.chalet ?? (actual.chalet as ChaletName);
      const ci = p.fecha ?? (actual.fecha as string);
      const co = p.fecha_checkout ?? (actual.fecha_checkout as string);
      const estadoFinal = p.estado ?? (actual.estado as EstadoReserva);
      if (estadoFinal === "reservado" && chalet && ci && co) {
        const { data: otras, error: eOt } = await supabaseExternalAdmin
          .from("reservas")
          .select("id, fecha, fecha_checkout")
          .eq("chalet", chalet)
          .eq("estado", "reservado")
          .neq("id", data.id)
          .lt("fecha", co)
          .gt("fecha_checkout", ci);
        if (eOt) throw new Error(eOt.message);
        if ((otras ?? []).length > 0) {
          throw new Error("Este chalet ya tiene una reserva confirmada en estas fechas");
        }
      }
    }


    const { error } = await supabaseExternalAdmin
      .from("reservas").update(data.patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    if (data.adicionales) {
      await supabaseExternalAdmin.from("reserva_adicionales").delete().eq("reserva_id", data.id);
      if (data.adicionales.length > 0) {
        const { error: e2 } = await supabaseExternalAdmin
          .from("reserva_adicionales")
          .insert(data.adicionales.map((a) => ({ ...a, reserva_id: data.id })));
        if (e2) throw new Error(e2.message);
      }
    }
    return { ok: true };
  });

export const deleteReserva = createServerFn({ method: "POST" })
  .inputValidator((d: { accessToken: string; id: string }) => d)
  .handler(async ({ data }) => {
    const ctx = await verifyToken(data.accessToken);
    requireRol(ctx, ["administrador"]);
    const { supabaseExternalAdmin } = await import(
      "@/integrations/supabase-external/client.server"
    );
    await supabaseExternalAdmin.from("reserva_adicionales").delete().eq("reserva_id", data.id);
    const { error } = await supabaseExternalAdmin
      .from("reservas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type CrearManualInput = {
  accessToken: string;
  chalet: ChaletName;
  fecha_checkin: string;
  fecha_checkout: string;
  noches: number;
  desglose: NocheDesglose[];
  precio_noche_total: number;
  tipo_tarifa_principal: TipoTarifa;
  nombre: string;
  whatsapp: string;
  estado: "cotizacion" | "reservado";
  notas?: string;
  adicionales: Array<{ adicional_id: string; precio_cobrado: number }>;
  descuento_tipo?: DescuentoTipo | null;
  descuento_valor?: number | null;
};

export const crearReservaManual = createServerFn({ method: "POST" })
  .inputValidator((d: CrearManualInput) => {
    if (!d.nombre?.trim()) throw new Error("Nombre requerido");
    if (!d.whatsapp?.trim()) throw new Error("WhatsApp requerido");
    if (d.noches < 1) throw new Error("Mínimo 1 noche");
    return d;
  })
  .handler(async ({ data }): Promise<{ id: string; codigo: string }> => {
    const ctx = await verifyToken(data.accessToken);
    requireRol(ctx, ["administrador", "operador"]);
    const { supabaseExternalAdmin } = await import(
      "@/integrations/supabase-external/client.server"
    );
    const insert = {
      chalet: data.chalet,
      fecha: data.fecha_checkin,
      fecha_checkout: data.fecha_checkout,
      noches: data.noches,
      desglose_noches: data.desglose,
      nombre: data.nombre.trim(),
      whatsapp: data.whatsapp.trim(),
      tipo_tarifa: data.tipo_tarifa_principal,
      precio_noche: data.precio_noche_total,
      estado: data.estado,
      origen: "manual" as const,
      notas: data.notas ?? null,
      descuento_tipo: data.descuento_tipo ?? null,
      descuento_valor: data.descuento_valor ?? 0,
    };
    const { data: r, error } = await supabaseExternalAdmin
      .from("reservas").insert(insert).select("id, codigo").single();
    if (error || !r) throw new Error(error?.message ?? "No se pudo crear la reserva");
    if (data.adicionales.length > 0) {
      const { error: e2 } = await supabaseExternalAdmin
        .from("reserva_adicionales")
        .insert(data.adicionales.map((a) => ({ ...a, reserva_id: r.id })));
      if (e2) throw new Error(e2.message);
    }
    return { id: r.id as string, codigo: r.codigo as string };
  });

// Re-export del catálogo (lo usa el formulario manual también).
export { listServiciosAdicionales } from "@/lib/reservas-external.functions";
