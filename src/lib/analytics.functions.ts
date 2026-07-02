// Métricas analíticas del Panel Interno. Lee del Supabase externo con service_role
// tras verificar la sesión y el rol del usuario. Acepta un rango [desde, hasta]
// (ambos YYYY-MM-DD inclusivos).
import { createServerFn } from "@tanstack/react-start";

type RolPanel = "administrador" | "operador" | "lectura";

async function verifyToken(accessToken: string): Promise<{ userId: string; rol: RolPanel }> {
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
  return { userId: row.id as string, rol: row.rol as RolPanel };
}

const CHALETS = ["Suculento", "Del Bosque", "Cattleya", "Ukiyo", "Satori"] as const;
type ChaletName = (typeof CHALETS)[number];

export type CategoriaAd = "experiencias_decoraciones" | "alimentacion_adicionales" | "adicionales_personalizados" | "sin_categoria";

export type AnalyticsPayload = {
  rango: { desde: string; hasta: string };
  chalet_filtro: ChaletName | "all";
  total_reservas: number;
  ocupacion_por_chalet: { chalet: ChaletName; noches_ocupadas: number; noches_totales: number; pct: number }[];
  ingresos_por_mes: { mes: string; ingresos: number }[];
  reservas_por_dia_semana: { dia: string; cantidad: number }[];
  origen_reservas: { origen: string; cantidad: number }[];
  ticket_promedio: { con_adicionales: number; sin_adicionales: number; reservas_consideradas: number };
  conversion: { cotizaciones_creadas: number; ahora_reservadas: number; canceladas: number; pct: number };
  adicionales_top: { nombre: string; cantidad: number; total_generado: number }[];
  adicionales_por_categoria: {
    categoria: CategoriaAd;
    subtotal_cantidad: number;
    subtotal_generado: number;
    items: { nombre: string; cantidad: number; total_generado: number }[];
  }[];
  adicionales_total_cantidad: number;
  adicionales_total_generado: number;
  tiempo_confirmacion_horas: { promedio: number | null; reservas_consideradas: number; soportado: boolean };
};

function ymdToDate(s: string): Date {
  return new Date(s + "T00:00:00");
}
function fmtYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export const getAnalytics = createServerFn({ method: "POST" })
  .inputValidator((d: { accessToken: string; desde: string; hasta: string; chalet?: ChaletName | "all" }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.desde) || !/^\d{4}-\d{2}-\d{2}$/.test(d.hasta)) {
      throw new Error("Fechas inválidas");
    }
    if (d.desde > d.hasta) throw new Error("Rango inválido");
    const chalet = d.chalet ?? "all";
    if (chalet !== "all" && !CHALETS.includes(chalet as ChaletName)) {
      throw new Error("Chalet inválido");
    }
    return { ...d, chalet };
  })
  .handler(async ({ data }): Promise<AnalyticsPayload> => {
    await verifyToken(data.accessToken);
    const { supabaseExternalAdmin } = await import(
      "@/integrations/supabase-external/client.server"
    );

    const desde = ymdToDate(data.desde);
    const hasta = ymdToDate(data.hasta);
    const totalDiasPeriodo = diffDays(desde, hasta) + 1;
    const chaletFiltro = (data.chalet ?? "all") as ChaletName | "all";

    // ---- Reservas con check-in dentro del periodo (para stays) ----
    let qStay = supabaseExternalAdmin
      .from("reservas")
      .select("id, chalet, fecha, fecha_checkout, noches, desglose_noches, precio_noche, estado, origen, creado_en")
      .gte("fecha", data.desde)
      .lte("fecha", data.hasta);
    if (chaletFiltro !== "all") qStay = qStay.eq("chalet", chaletFiltro);
    const { data: resStay, error: e1 } = await qStay;
    if (e1) throw new Error(e1.message);

    // ---- Reservas creadas dentro del periodo (cohorte para conversión / origen / tiempo) ----
    const desdeIso = data.desde + "T00:00:00";
    const hastaIso = data.hasta + "T23:59:59";
    let qCohort = supabaseExternalAdmin
      .from("reservas")
      .select("id, chalet, estado, origen, creado_en, confirmado_en")
      .gte("creado_en", desdeIso)
      .lte("creado_en", hastaIso);
    if (chaletFiltro !== "all") qCohort = qCohort.eq("chalet", chaletFiltro);
    const { data: resCohort, error: e2 } = await qCohort;
    // Si la columna confirmado_en no existe, reintentamos sin ella.
    let cohortRows: any[] = [];
    let confirmadoEnSoportado = true;
    if (e2) {
      confirmadoEnSoportado = false;
      let qCohort2 = supabaseExternalAdmin
        .from("reservas")
        .select("id, chalet, estado, origen, creado_en")
        .gte("creado_en", desdeIso)
        .lte("creado_en", hastaIso);
      if (chaletFiltro !== "all") qCohort2 = qCohort2.eq("chalet", chaletFiltro);
      const { data: r2, error: e2b } = await qCohort2;
      if (e2b) throw new Error(e2b.message);
      cohortRows = r2 ?? [];
    } else {
      cohortRows = resCohort ?? [];
    }


    // ===== Ocupación por chalet (basado en noches reservadas que caen dentro del periodo) =====
    const ocupMap = new Map<ChaletName, number>();
    CHALETS.forEach((c) => ocupMap.set(c, 0));
    for (const r of resStay ?? []) {
      if (r.estado !== "reservado") continue;
      const ci = ymdToDate(r.fecha);
      const co = r.fecha_checkout
        ? ymdToDate(r.fecha_checkout)
        : new Date(ci.getTime() + Number(r.noches ?? 1) * 86400000);
      for (let d = new Date(ci); d < co; d.setDate(d.getDate() + 1)) {
        if (d >= desde && d <= hasta) {
          const c = r.chalet as ChaletName;
          if (ocupMap.has(c)) ocupMap.set(c, (ocupMap.get(c) ?? 0) + 1);
        }
      }
    }
    const chaletsParaOcupacion = chaletFiltro === "all" ? CHALETS : [chaletFiltro as ChaletName];
    const ocupacion_por_chalet = chaletsParaOcupacion.map((c) => {
      const n = ocupMap.get(c) ?? 0;
      return {
        chalet: c,
        noches_ocupadas: n,
        noches_totales: totalDiasPeriodo,
        pct: totalDiasPeriodo > 0 ? Math.round((n / totalDiasPeriodo) * 100) : 0,
      };
    });

    // ===== Reservas reservado en el periodo (para ingresos, día semana, ticket, adicionales) =====
    const resReservado = (resStay ?? []).filter((r) => r.estado === "reservado");
    const idsReservado = resReservado.map((r) => r.id as string);

    const { data: adsAll } = idsReservado.length
      ? await supabaseExternalAdmin
          .from("reserva_adicionales")
          .select("reserva_id, precio_cobrado, adicional_id, nombre_personalizado, servicios_adicionales(nombre)")
          .in("reserva_id", idsReservado)
      : { data: [] as any[] };


    const adsPorReserva = new Map<string, number>();
    for (const a of adsAll ?? []) {
      const k = a.reserva_id as string;
      adsPorReserva.set(k, (adsPorReserva.get(k) ?? 0) + Number(a.precio_cobrado || 0));
    }

    function totalNochesDe(r: any): number {
      const dg = r.desglose_noches as { precio: number }[] | null;
      if (dg && dg.length > 0) return dg.reduce((s, n) => s + Number(n.precio || 0), 0);
      return Number(r.precio_noche || 0) * Number(r.noches || 1);
    }

    // ===== Ingresos por mes =====
    const ingresosMap = new Map<string, number>();
    for (const r of resReservado) {
      const mes = (r.fecha as string).slice(0, 7); // YYYY-MM
      const ingreso = totalNochesDe(r) + (adsPorReserva.get(r.id as string) ?? 0);
      ingresosMap.set(mes, (ingresosMap.get(mes) ?? 0) + ingreso);
    }
    const ingresos_por_mes = Array.from(ingresosMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, ingresos]) => ({ mes, ingresos }));

    // ===== Día semana más reservado (por check-in) =====
    const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const diaCount = [0, 0, 0, 0, 0, 0, 0];
    for (const r of resReservado) {
      const d = ymdToDate(r.fecha as string);
      const dow = d.getDay(); // 0 dom
      const idx = dow === 0 ? 6 : dow - 1;
      diaCount[idx]++;
    }
    const reservas_por_dia_semana = DIAS.map((dia, i) => ({ dia, cantidad: diaCount[i] }));

    // ===== Origen reservas (en cohorte) =====
    const origenMap = new Map<string, number>();
    for (const r of cohortRows) {
      const o = (r.origen as string) ?? "manual";
      origenMap.set(o, (origenMap.get(o) ?? 0) + 1);
    }
    const origen_reservas = Array.from(origenMap.entries()).map(([origen, cantidad]) => ({ origen, cantidad }));

    // ===== Ticket promedio =====
    let sumaCon = 0;
    let sumaSin = 0;
    for (const r of resReservado) {
      const noches = totalNochesDe(r);
      const ads = adsPorReserva.get(r.id as string) ?? 0;
      sumaSin += noches;
      sumaCon += noches + ads;
    }
    const ticket_promedio = {
      con_adicionales: resReservado.length > 0 ? Math.round(sumaCon / resReservado.length) : 0,
      sin_adicionales: resReservado.length > 0 ? Math.round(sumaSin / resReservado.length) : 0,
      reservas_consideradas: resReservado.length,
    };

    // ===== Tasa de conversión (cohorte por creado_en) =====
    const cotizCohort = cohortRows; // todas las creadas (independiente del estado actual)
    const ahoraReservadas = cotizCohort.filter((r) => r.estado === "reservado").length;
    const canceladas = cotizCohort.filter((r) => r.estado === "cancelado").length;
    const denom = cotizCohort.length - canceladas;
    const conversion = {
      cotizaciones_creadas: cotizCohort.length,
      ahora_reservadas: ahoraReservadas,
      canceladas,
      pct: denom > 0 ? Math.round((ahoraReservadas / denom) * 100) : 0,
    };

    // ===== Adicionales más vendidos + agrupado por categoría =====
    const { data: catalogo } = await supabaseExternalAdmin
      .from("servicios_adicionales")
      .select("id, nombre, categoria");
    type CatRow = { id: string; nombre: string; categoria: CategoriaAd | null };
    const nombreById = new Map<string, string>();
    const categoriaById = new Map<string, CategoriaAd>();
    for (const c of (catalogo ?? []) as CatRow[]) {
      nombreById.set(c.id, c.nombre);
      categoriaById.set(c.id, (c.categoria ?? "sin_categoria") as CategoriaAd);
    }
    const PERS_KEY = "__personalizado__";
    const adCount = new Map<string, number>();
    const adTotal = new Map<string, number>();
    for (const a of adsAll ?? []) {
      const k = a.adicional_id ? (a.adicional_id as string) : PERS_KEY;
      adCount.set(k, (adCount.get(k) ?? 0) + 1);
      adTotal.set(k, (adTotal.get(k) ?? 0) + Number(a.precio_cobrado || 0));
    }
    // Incluir servicios activos del catálogo aunque estén en 0
    for (const c of (catalogo ?? []) as CatRow[]) {
      if (!adCount.has(c.id)) adCount.set(c.id, 0);
      if (!adTotal.has(c.id)) adTotal.set(c.id, 0);
    }
    const adicionales_top = Array.from(adCount.entries())
      .map(([id, cantidad]) => ({
        nombre: id === PERS_KEY
          ? "Adicionales personalizados"
          : (nombreById.get(id) ?? "Servicio eliminado"),
        cantidad,
        total_generado: adTotal.get(id) ?? 0,
      }))
      .sort((a, b) => b.total_generado - a.total_generado);

    // Agrupar por categoría (los IDs sin catálogo caen en "sin_categoria",
    // los personalizados en "adicionales_personalizados" agrupados en 1 fila)
    const CAT_ORDER: CategoriaAd[] = [
      "experiencias_decoraciones",
      "alimentacion_adicionales",
      "adicionales_personalizados",
      "sin_categoria",
    ];
    const grupos = new Map<CategoriaAd, { nombre: string; cantidad: number; total_generado: number }[]>();
    for (const cat of CAT_ORDER) grupos.set(cat, []);
    for (const [id, cantidad] of adCount.entries()) {
      if (id === PERS_KEY) {
        grupos.get("adicionales_personalizados")!.push({
          nombre: "Adicionales personalizados",
          cantidad,
          total_generado: adTotal.get(id) ?? 0,
        });
        continue;
      }
      const cat = categoriaById.get(id) ?? "sin_categoria";
      grupos.get(cat)!.push({
        nombre: nombreById.get(id) ?? "Servicio eliminado",
        cantidad,
        total_generado: adTotal.get(id) ?? 0,
      });
    }
    const adicionales_por_categoria = CAT_ORDER
      .map((categoria) => {
        const items = (grupos.get(categoria) ?? [])
          .sort((a, b) => b.total_generado - a.total_generado);
        const subtotal_cantidad = items.reduce((s, i) => s + i.cantidad, 0);
        const subtotal_generado = items.reduce((s, i) => s + i.total_generado, 0);
        return { categoria, subtotal_cantidad, subtotal_generado, items };
      })
      // Ocultar "sin_categoria" y "adicionales_personalizados" cuando no aportan datos
      .filter((g) => (g.categoria !== "sin_categoria" && g.categoria !== "adicionales_personalizados") || g.items.length > 0);
    const adicionales_total_cantidad = adicionales_por_categoria.reduce((s, g) => s + g.subtotal_cantidad, 0);
    const adicionales_total_generado = adicionales_por_categoria.reduce((s, g) => s + g.subtotal_generado, 0);


    // ===== Tiempo promedio de confirmación =====
    let tiempo: AnalyticsPayload["tiempo_confirmacion_horas"] = {
      promedio: null,
      reservas_consideradas: 0,
      soportado: confirmadoEnSoportado,
    };
    if (confirmadoEnSoportado) {
      const confirmadas = cohortRows.filter(
        (r) => r.estado === "reservado" && r.creado_en && r.confirmado_en,
      );
      if (confirmadas.length > 0) {
        const sumaHoras = confirmadas.reduce((s, r) => {
          const a = new Date(r.creado_en as string).getTime();
          const b = new Date(r.confirmado_en as string).getTime();
          return s + Math.max(0, (b - a) / 3600000);
        }, 0);
        tiempo = {
          promedio: Math.round((sumaHoras / confirmadas.length) * 10) / 10,
          reservas_consideradas: confirmadas.length,
          soportado: true,
        };
      } else {
        tiempo = { promedio: null, reservas_consideradas: 0, soportado: true };
      }
    }

    return {
      rango: { desde: data.desde, hasta: data.hasta },
      chalet_filtro: chaletFiltro,
      total_reservas: resReservado.length,
      ocupacion_por_chalet,
      ingresos_por_mes,
      reservas_por_dia_semana,
      origen_reservas,
      ticket_promedio,
      conversion,
      adicionales_top,
      adicionales_por_categoria,
      adicionales_total_cantidad,
      adicionales_total_generado,
      tiempo_confirmacion_horas: tiempo,
    };
  });
