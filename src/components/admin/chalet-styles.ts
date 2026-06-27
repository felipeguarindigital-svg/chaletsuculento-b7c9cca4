// Mapeo de colores por chalet (puntos en calendario y badges).
export const CHALETS = ["Suculento", "Del Bosque", "Cattleya", "Ukiyo", "Satori"] as const;
export type ChaletName = (typeof CHALETS)[number];

export const CHALET_COLOR: Record<ChaletName, { dot: string; badge: string; initial: string }> = {
  "Suculento":  { dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-800", initial: "S" },
  "Del Bosque": { dot: "bg-green-700",   badge: "bg-green-100 text-green-800",     initial: "B" },
  "Cattleya":   { dot: "bg-rose-500",    badge: "bg-rose-100 text-rose-800",       initial: "C" },
  "Ukiyo":      { dot: "bg-indigo-500",  badge: "bg-indigo-100 text-indigo-800",   initial: "U" },
  "Satori":     { dot: "bg-amber-500",   badge: "bg-amber-100 text-amber-800",     initial: "T" },
};

export const ESTADO_BADGE: Record<string, string> = {
  cotizacion: "bg-amber-100 text-amber-800",
  reservado: "bg-emerald-100 text-emerald-800",
  cancelado: "bg-stone-200 text-stone-600 line-through",
};
