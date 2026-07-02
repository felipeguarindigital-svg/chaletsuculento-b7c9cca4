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
  cedula: string | null;
  whatsapp: string;
  tipo_tarifa: TipoTarifa;
  precio_noche: number;
  estado: EstadoReserva;
  origen: OrigenReserva;
  notas: string | null;
  created_at: string;
  descuento_tipo: DescuentoTipo | null;
  descuento_valor: number | null;
  abono: number | null;
  saldo_pendiente: number | null;
};

export type ReservaAcompanante = {
  id: string;
  reserva_id: string;
  nombre: string;
  cedula: string | null;
};

export type AcompananteInput = {
  nombre: string;
  cedula?: string | null;
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
  adicional_id: string | null;
  precio_cobrado: number;
  nombre?: string;
  categoria?: ServicioCategoriaLite;
  nombre_personalizado?: string | null;
  descripcion_personalizada?: string | null;
  es_personalizado: boolean;
};

/** Entrada para persistir un adicional (del catálogo o personalizado). */
export type AdicionalInput = {
  adicional_id: string | null;
  precio_cobrado: number;
  nombre_personalizado?: string | null;
  descripcion_personalizada?: string | null;
};

export type ReservaDetail = ReservaRow & {
  adicionales: ReservaAdicional[];
  acompanantes: ReservaAcompanante[];
  total_adicionales: number;
  subtotal: number;
  descuento_monto: number;
  total: number;
  saldo_pendiente_calc: number;
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
      .select("id, reserva_id, adicional_id, precio_cobrado, nombre_personalizado, descripcion_personalizada, servicios_adicionales(nombre, categoria)")
      .eq("reserva_id", data.id);
    if (errAd) throw new Error(errAd.message);
    const adicionales: ReservaAdicional[] = (ads ?? []).map((a: any) => {
      const esPers = !a.adicional_id;
      return {
        id: a.id,
        reserva_id: a.reserva_id,
        adicional_id: a.adicional_id ?? null,
        precio_cobrado: Number(a.precio_cobrado),
        nombre: esPers
          ? (a.nombre_personalizado ?? "Adicional personalizado")
          : (a.servicios_adicionales?.nombre ?? "Servicio eliminado"),
        categoria: (a.servicios_adicionales?.categoria ?? null) as ServicioCategoriaLite,
        nombre_personalizado: a.nombre_personalizado ?? null,
        descripcion_personalizada: a.descripcion_personalizada ?? null,
        es_personalizado: esPers,
      };
    });

    const { data: acomp, error: errAc } = await supabaseExternalAdmin
      .from("reserva_acompanantes")
      .select("id, reserva_id, nombre, cedula")
      .eq("reserva_id", data.id)
      .order("creado_en", { ascending: true });
    if (errAc) throw new Error(errAc.message);
    const acompanantes: ReservaAcompanante[] = (acomp ?? []).map((a: any) => ({
      id: a.id, reserva_id: a.reserva_id, nombre: a.nombre, cedula: a.cedula ?? null,
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
    const total = subtotal - descuento_monto;
    const abono = Number((r as any).abono ?? 0);
    const saldo_pendiente_calc = Math.max(0, total - abono);
    return {
      ...(r as ReservaRow),
      adicionales,
      acompanantes,
      total_adicionales: totalAd,
      subtotal,
      descuento_monto,
      total,
      saldo_pendiente_calc,
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
  cedula: string | null;
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
  abono: number;
  saldo_pendiente: number;
}>;


export const updateReserva = createServerFn({ method: "POST" })
  .inputValidator((d: {
    accessToken: string;
    id: string;
    patch: ReservaPatch;
    adicionales?: AdicionalInput[];
    acompanantes?: AcompananteInput[];
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
        const rows = data.adicionales.map((a) => ({
          reserva_id: data.id,
          adicional_id: a.adicional_id ?? null,
          precio_cobrado: a.precio_cobrado,
          nombre_personalizado: a.nombre_personalizado ?? null,
          descripcion_personalizada: a.descripcion_personalizada ?? null,
        }));
        const { error: e2 } = await supabaseExternalAdmin.from("reserva_adicionales").insert(rows);
        if (e2) throw new Error(e2.message);
      }
    }

    if (data.acompanantes) {
      await supabaseExternalAdmin.from("reserva_acompanantes").delete().eq("reserva_id", data.id);
      const filas = data.acompanantes
        .filter(a => a.nombre?.trim())
        .map(a => ({ reserva_id: data.id, nombre: a.nombre.trim(), cedula: a.cedula?.trim() || null }));
      if (filas.length > 0) {
        const { error: e3 } = await supabaseExternalAdmin.from("reserva_acompanantes").insert(filas);
        if (e3) throw new Error(e3.message);
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
    await supabaseExternalAdmin.from("reserva_acompanantes").delete().eq("reserva_id", data.id);
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
  cedula?: string | null;
  whatsapp: string;
  estado: "cotizacion" | "reservado";
  notas?: string;
  adicionales: AdicionalInput[];
  acompanantes?: AcompananteInput[];
  descuento_tipo?: DescuentoTipo | null;
  descuento_valor?: number | null;
  abono?: number;
};

/** Verifica si un chalet tiene una reserva "reservado" que se solape con el rango [checkin, checkout). */
export const checkDisponibilidadChalet = createServerFn({ method: "POST" })
  .inputValidator((d: { accessToken: string; chalet: ChaletName; checkin: string; checkout: string; excludeId?: string }) => d)
  .handler(async ({ data }): Promise<{ conflicto: boolean }> => {
    await verifyToken(data.accessToken);
    if (!data.chalet || !data.checkin || !data.checkout || data.checkin >= data.checkout) {
      return { conflicto: false };
    }
    const { supabaseExternalAdmin } = await import(
      "@/integrations/supabase-external/client.server"
    );
    let q = supabaseExternalAdmin
      .from("reservas")
      .select("id")
      .eq("chalet", data.chalet)
      .eq("estado", "reservado")
      .lt("fecha", data.checkout)
      .gt("fecha_checkout", data.checkin);
    if (data.excludeId) q = q.neq("id", data.excludeId);
    const { data: rows, error } = await q.limit(1);
    if (error) throw new Error(error.message);
    return { conflicto: (rows ?? []).length > 0 };
  });

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
    if (data.estado === "reservado") {
      const { data: otras, error: eOt } = await supabaseExternalAdmin
        .from("reservas")
        .select("id")
        .eq("chalet", data.chalet)
        .eq("estado", "reservado")
        .lt("fecha", data.fecha_checkout)
        .gt("fecha_checkout", data.fecha_checkin)
        .limit(1);
      if (eOt) throw new Error(eOt.message);
      if ((otras ?? []).length > 0) {
        throw new Error("Este chalet ya tiene una reserva confirmada en estas fechas");
      }
    }
    // Cálculo del saldo pendiente (para persistir referencia)
    const subNoches = data.desglose.reduce((s, n) => s + Number(n.precio || 0), 0);
    const subAd = data.adicionales.reduce((s, a) => s + Number(a.precio_cobrado || 0), 0);
    const subtotalCalc = subNoches + subAd;
    const descuentoCalc = computeDescuento(subtotalCalc, data.descuento_tipo ?? null, data.descuento_valor ?? 0);
    const totalCalc = subtotalCalc - descuentoCalc;
    const abono = Math.max(0, Number(data.abono ?? 0));
    const saldoPendiente = Math.max(0, totalCalc - abono);

    const insert = {
      chalet: data.chalet,
      fecha: data.fecha_checkin,
      fecha_checkout: data.fecha_checkout,
      noches: data.noches,
      desglose_noches: data.desglose,
      nombre: data.nombre.trim(),
      cedula: data.cedula?.trim() || null,
      whatsapp: data.whatsapp.trim(),
      tipo_tarifa: data.tipo_tarifa_principal,
      precio_noche: data.precio_noche_total,
      estado: data.estado,
      origen: "manual" as const,
      notas: data.notas ?? null,
      descuento_tipo: data.descuento_tipo ?? null,
      descuento_valor: data.descuento_valor ?? 0,
      abono,
      saldo_pendiente: saldoPendiente,
    };
    const { data: r, error } = await supabaseExternalAdmin
      .from("reservas").insert(insert).select("id, codigo").single();
    if (error || !r) throw new Error(error?.message ?? "No se pudo crear la reserva");
    if (data.adicionales.length > 0) {
      const rows = data.adicionales.map((a) => ({
        reserva_id: r.id,
        adicional_id: a.adicional_id ?? null,
        precio_cobrado: a.precio_cobrado,
        nombre_personalizado: a.nombre_personalizado ?? null,
        descripcion_personalizada: a.descripcion_personalizada ?? null,
      }));
      const { error: e2 } = await supabaseExternalAdmin.from("reserva_adicionales").insert(rows);
      if (e2) throw new Error(e2.message);
    }
    if (data.acompanantes && data.acompanantes.length > 0) {
      const filas = data.acompanantes
        .filter(a => a.nombre?.trim())
        .map(a => ({ reserva_id: r.id, nombre: a.nombre.trim(), cedula: a.cedula?.trim() || null }));
      if (filas.length > 0) {
        const { error: e3 } = await supabaseExternalAdmin.from("reserva_acompanantes").insert(filas);
        if (e3) throw new Error(e3.message);
      }
    }
    return { id: r.id as string, codigo: r.codigo as string };
  });

// ------------------ OPERACIONES DEL DÍA ------------------

export type OperacionFicha = {
  id: string;
  codigo: string;
  chalet: ChaletName;
  nombre: string;
  whatsapp: string;
  fecha: string;
  fecha_checkout: string | null;
  personas: number;
  adicionales: string[];
  saldo_pendiente: number;
};

export type OperacionesHoy = {
  hoy: string; // YYYY-MM-DD (America/Bogota)
  manana: string; // YYYY-MM-DD (America/Bogota)
  llegadas: OperacionFicha[];
  salidas: OperacionFicha[];
  en_casa: OperacionFicha[];
  llegadas_manana: OperacionFicha[];
};

function hoyBogota(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find(p => p.type === "year")!.value;
  const m = parts.find(p => p.type === "month")!.value;
  const d = parts.find(p => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

export const getOperacionesHoy = createServerFn({ method: "POST" })
  .inputValidator((d: { accessToken: string }) => d)
  .handler(async ({ data }): Promise<OperacionesHoy> => {
    await verifyToken(data.accessToken);
    const { supabaseExternalAdmin } = await import(
      "@/integrations/supabase-external/client.server"
    );
    const hoy = hoyBogota();
    // manana = hoy + 1 día (calculado sin TZ shift)
    const [yy, mm, dd] = hoy.split("-").map(Number);
    const mananaDate = new Date(Date.UTC(yy, mm - 1, dd + 1));
    const manana = `${mananaDate.getUTCFullYear()}-${String(mananaDate.getUTCMonth() + 1).padStart(2, "0")}-${String(mananaDate.getUTCDate()).padStart(2, "0")}`;

    // Traemos reservas "reservado" cuyo rango pueda tocar hoy o cuya llegada sea mañana.
    const { data: rows, error } = await supabaseExternalAdmin
      .from("reservas")
      .select("id, codigo, chalet, fecha, fecha_checkout, nombre, whatsapp, estado, saldo_pendiente")
      .eq("estado", "reservado")
      .or(`and(fecha.lte.${hoy},fecha_checkout.gte.${hoy}),fecha.eq.${manana}`);
    if (error) throw new Error(error.message);

    const reservas = (rows ?? []) as Array<{
      id: string; codigo: string; chalet: ChaletName;
      fecha: string; fecha_checkout: string | null;
      nombre: string; whatsapp: string;
      saldo_pendiente: number | null;
    }>;
    const ids = reservas.map(r => r.id);

    // Acompañantes (conteo) y adicionales (nombres) en lote.
    const acompByReserva = new Map<string, number>();
    const adicByReserva = new Map<string, string[]>();
    if (ids.length > 0) {
      const { data: acomp, error: eAc } = await supabaseExternalAdmin
        .from("reserva_acompanantes")
        .select("reserva_id")
        .in("reserva_id", ids);
      if (eAc) throw new Error(eAc.message);
      for (const a of (acomp ?? []) as Array<{ reserva_id: string }>) {
        acompByReserva.set(a.reserva_id, (acompByReserva.get(a.reserva_id) ?? 0) + 1);
      }
      const { data: ads, error: eAd } = await supabaseExternalAdmin
        .from("reserva_adicionales")
        .select("reserva_id, adicional_id, nombre_personalizado, servicios_adicionales(nombre)")
        .in("reserva_id", ids);
      if (eAd) throw new Error(eAd.message);
      for (const a of (ads ?? []) as any[]) {
        const nombre = a.adicional_id
          ? (a.servicios_adicionales?.nombre ?? "Servicio")
          : (a.nombre_personalizado ?? "Adicional personalizado");
        const arr = adicByReserva.get(a.reserva_id) ?? [];
        arr.push(nombre);
        adicByReserva.set(a.reserva_id, arr);
      }
    }

    const fichas: OperacionFicha[] = reservas.map(r => ({
      id: r.id, codigo: r.codigo, chalet: r.chalet,
      nombre: r.nombre, whatsapp: r.whatsapp,
      fecha: r.fecha, fecha_checkout: r.fecha_checkout,
      personas: 1 + (acompByReserva.get(r.id) ?? 0),
      adicionales: adicByReserva.get(r.id) ?? [],
      saldo_pendiente: Math.max(0, Number(r.saldo_pendiente ?? 0)),
    }));

    const llegadas = fichas.filter(f => f.fecha === hoy);
    const salidas = fichas.filter(f => f.fecha_checkout === hoy);
    const en_casa = fichas.filter(f => f.fecha < hoy && (f.fecha_checkout ?? "") > hoy);
    const llegadas_manana = fichas.filter(f => f.fecha === manana);

    return { hoy, manana, llegadas, salidas, en_casa, llegadas_manana };
  });

// Re-export del catálogo (lo usa el formulario manual también).
export { listServiciosAdicionales } from "@/lib/reservas-external.functions";
