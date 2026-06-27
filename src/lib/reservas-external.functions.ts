// Server functions que hablan con el Supabase EXTERNO ("Chalet-Suculento").
// El cliente Supabase externo vive en *.server.ts y se importa dinámicamente
// dentro de cada handler para no filtrarlo al bundle del navegador.
import { createServerFn } from "@tanstack/react-start";

export type ServicioAdicional = {
  id: string;
  nombre: string;
  descripcion: string | null;
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
      .select("id, nombre, descripcion, precio, activo")
      .eq("activo", true)
      .order("precio", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as ServicioAdicional[];
  },
);

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
    const { supabaseExternal } = await import(
      "@/integrations/supabase-external/client.server"
    );

    const { data: reserva, error } = await supabaseExternal
      .from("reservas")
      .insert({
        chalet: data.chalet,
        fecha: data.fecha_checkin,
        fecha_checkout: data.fecha_checkout,
        noches: data.noches,
        desglose_noches: data.desglose,
        nombre: data.nombre.trim(),
        whatsapp: data.whatsapp.trim(),
        tipo_tarifa: data.tipo_tarifa_principal,
        precio_noche: data.precio_noche_total,
        estado: "cotizacion",
        origen: "landing",
      })
      .select("id, codigo")
      .single();

    if (error || !reserva) {
      throw new Error(error?.message ?? "No se pudo crear la cotización");
    }

    if (data.adicionales.length > 0) {
      const filas = data.adicionales.map((a) => ({
        reserva_id: reserva.id,
        servicio_id: a.servicio_id,
        precio_cobrado: a.precio_cobrado,
      }));
      const { error: errAd } = await supabaseExternal
        .from("reserva_adicionales")
        .insert(filas);
      if (errAd) {
        // No revertimos la reserva: ya quedó la cotización registrada.
        // Solo registramos el fallo para diagnóstico server-side.
        console.error("[crearCotizacion] adicionales falló:", errAd.message);
      }
    }

    return { id: reserva.id as string, codigo: reserva.codigo as string };
  });
