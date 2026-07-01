// Server functions que hablan con el Supabase EXTERNO ("Chalet-Suculento").
// El cliente Supabase externo vive en *.server.ts y se importa dinámicamente
// dentro de cada handler para no filtrarlo al bundle del navegador.
import { createServerFn } from "@tanstack/react-start";

export type ServicioCategoria = "experiencias_decoraciones" | "alimentacion_adicionales";

export type ServicioAdicional = {
  id: string;
  nombre: string;
  descripcion: string | null;
  descripcion_larga: string | null;
  notas_adicionales: string | null;
  imagen_url: string | null;
  categoria: ServicioCategoria | null;
  precio: number;
  activo: boolean;
};

export const listServiciosAdicionales = createServerFn({ method: "GET" }).handler(
  async (): Promise<ServicioAdicional[]> => {
    const { supabaseExternal } = await import(
      "@/integrations/supabase-external/client.server"
    );
    const { data, error } = await supabaseExternal
      .from("servicios_adicionales")
      .select("id, nombre, descripcion, descripcion_larga, notas_adicionales, imagen_url, categoria, precio, activo")
      .eq("activo", true)
      .order("precio", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as ServicioAdicional[];
  },
);

export type FechasBloqueadasInput = {
  chalet: "Suculento" | "Del Bosque" | "Cattleya" | "Ukiyo" | "Satori";
};

// Devuelve las fechas (YYYY-MM-DD) bloqueadas por reservas confirmadas (estado='reservado')
// para el chalet indicado. Se expande el rango [fecha, fecha_checkout) — el día de checkout
// queda libre. Solo se exponen fechas: ningún dato personal sale del servidor.
export const getFechasBloqueadas = createServerFn({ method: "GET" })
  .inputValidator((input: FechasBloqueadasInput) => {
    if (!input?.chalet) throw new Error("chalet requerido");
    return input;
  })
  .handler(async ({ data }): Promise<string[]> => {
    const { supabaseExternalAdmin } = await import(
      "@/integrations/supabase-external/client.server"
    );
    const { data: rows, error } = await supabaseExternalAdmin
      .from("reservas")
      .select("fecha, fecha_checkout")
      .eq("chalet", data.chalet)
      .eq("estado", "reservado");
    if (error) throw new Error(error.message);

    // Aritmética puramente en strings YYYY-MM-DD para evitar cualquier
    // desplazamiento por zona horaria. Bloqueamos las NOCHES dormidas:
    // desde `fecha` (inclusive) hasta `fecha_checkout` (EXCLUSIVE). El día
    // de checkout queda libre porque el chalet se libera esa misma mañana.
    const toYmd = (v: string) => v.slice(0, 10); // soporta "YYYY-MM-DD" o ISO completo
    const addDay = (ymd: string) => {
      const [y, m, d] = ymd.split("-").map(Number);
      const next = new Date(Date.UTC(y, m - 1, d) + 86400000);
      const ny = next.getUTCFullYear();
      const nm = String(next.getUTCMonth() + 1).padStart(2, "0");
      const nd = String(next.getUTCDate()).padStart(2, "0");
      return `${ny}-${nm}-${nd}`;
    };

    const bloqueadas = new Set<string>();
    for (const r of (rows ?? []) as Array<{ fecha: string; fecha_checkout: string | null }>) {
      if (!r.fecha) continue;
      const start = toYmd(r.fecha);
      // Si no hay checkout, asumimos 1 noche → checkout = start + 1 día.
      const end = r.fecha_checkout ? toYmd(r.fecha_checkout) : addDay(start);
      // Recorremos [start, end) — nunca incluimos el día de checkout.
      for (let cur = start; cur < end; cur = addDay(cur)) {
        bloqueadas.add(cur);
      }
    }
    return Array.from(bloqueadas).sort();
  });

export type NocheDesglose = {
  fecha: string;
  tipo: "domingo_jueves" | "viernes" | "sabado" | "previa_festivo";
  precio: number;
};

export type CrearCotizacionInput = {
  chalet: "Suculento" | "Del Bosque" | "Cattleya" | "Ukiyo" | "Satori";
  fecha_checkin: string;   // YYYY-MM-DD
  fecha_checkout: string;  // YYYY-MM-DD (exclusiva)
  noches: number;
  desglose: NocheDesglose[];
  precio_noche_total: number; // suma de todas las noches
  tipo_tarifa_principal: NocheDesglose["tipo"];
  nombre: string;
  whatsapp: string;
  adicionales: Array<{ servicio_id: string; precio_cobrado: number }>;
};

export type CrearCotizacionOutput = {
  id: string;
  codigo: string;
};

function formatSupabaseError(error: {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
}) {
  return [
    error.message,
    error.code ? `code=${error.code}` : undefined,
    error.details ? `details=${error.details}` : undefined,
    error.hint ? `hint=${error.hint}` : undefined,
  ]
    .filter(Boolean)
    .join(" | ");
}

export const crearCotizacion = createServerFn({ method: "POST" })
  .inputValidator((input: CrearCotizacionInput) => {
    if (!input.nombre?.trim()) throw new Error("Nombre requerido");
    if (!input.whatsapp?.trim()) throw new Error("WhatsApp requerido");
    if (!input.fecha_checkin || !input.fecha_checkout) {
      throw new Error("Fechas requeridas");
    }
    if (input.noches < 1) throw new Error("Mínimo 1 noche");
    return input;
  })
  .handler(async ({ data }): Promise<CrearCotizacionOutput> => {
    const { supabaseExternalAdmin } = await import(
      "@/integrations/supabase-external/client.server"
    );

    const reservaInsert = {
      chalet: data.chalet,
      fecha: data.fecha_checkin,
      fecha_checkout: data.fecha_checkout,
      noches: data.noches,
      desglose_noches: data.desglose,
      nombre: data.nombre.trim(),
      whatsapp: data.whatsapp.trim(),
      tipo_tarifa: data.tipo_tarifa_principal,
      precio_noche: data.precio_noche_total,
      estado: "cotizacion" as const,
      origen: "landing" as const,
    };

    console.info("[crearCotizacion] valores INSERT reservas", {
      chalet: reservaInsert.chalet,
      fecha: reservaInsert.fecha,
      fecha_checkout: reservaInsert.fecha_checkout,
      noches: reservaInsert.noches,
      tipo_tarifa: reservaInsert.tipo_tarifa,
      precio_noche: reservaInsert.precio_noche,
      estado: reservaInsert.estado,
      origen: reservaInsert.origen,
      adicionales: data.adicionales.length,
    });

    const { data: reserva, error } = await supabaseExternalAdmin
      .from("reservas")
      .insert(reservaInsert)
      .select("id, codigo")
      .single();

    if (error || !reserva) {
      if (error) {
        console.error("[crearCotizacion] error Supabase INSERT reservas", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          estado_enviado: reservaInsert.estado,
          origen_enviado: reservaInsert.origen,
        });
        throw new Error(formatSupabaseError(error));
      }
      throw new Error("No se pudo crear la cotización");
    }

    if (data.adicionales.length > 0) {
      const filas = data.adicionales.map((a) => ({
        reserva_id: reserva.id,
        adicional_id: a.servicio_id,
        precio_cobrado: a.precio_cobrado,
      }));
      const { error: errAd } = await supabaseExternalAdmin
        .from("reserva_adicionales")
        .insert(filas);
      if (errAd) {
        // No revertimos la reserva: ya quedó la cotización registrada.
        // Solo registramos el fallo para diagnóstico server-side.
        console.error("[crearCotizacion] error Supabase INSERT adicionales", {
          code: errAd.code,
          message: errAd.message,
          details: errAd.details,
          hint: errAd.hint,
        });
      }
    }

    return { id: reserva.id as string, codigo: reserva.codigo as string };
  });
