// Precios por noche (por pareja) — alineados con la sección Reservas de la landing.
// Si cambias tarifas, este es el único lugar a tocar en el frontend.
// (Cada reserva guarda su `desglose_noches` en la DB, así que las cotizaciones
// históricas no se ven afectadas por cambios futuros aquí.)

import type { TipoTarifa } from "./tarifas";

export const PRECIO_POR_TIPO: Record<TipoTarifa, number> = {
  domingo_jueves: 350000,
  viernes: 420000,
  sabado: 495000,
  previa_festivo: 495000,
};

export const LABEL_TIPO: Record<TipoTarifa, string> = {
  domingo_jueves: "Domingo–Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  previa_festivo: "Previa de festivo",
};

export function formatCOP(n: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}
