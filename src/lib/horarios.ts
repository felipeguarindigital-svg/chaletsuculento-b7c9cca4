// Horarios fijos de check-in y check-out por chalet.
import type { ChaletName } from "@/components/admin/chalet-styles";

export const HORARIOS_CHALET: Record<ChaletName, { checkIn: string; checkOut: string }> = {
  "Suculento":  { checkIn: "3:00 p.m.", checkOut: "12:00 m." },
  "Del Bosque": { checkIn: "4:00 p.m.", checkOut: "1:00 p.m." },
  "Cattleya":   { checkIn: "2:00 p.m.", checkOut: "11:00 a.m." },
  "Ukiyo":      { checkIn: "6:00 p.m.", checkOut: "3:00 p.m." },
  "Satori":     { checkIn: "5:00 p.m.", checkOut: "2:00 p.m." },
};

export function getHorarios(chalet: string): { checkIn: string; checkOut: string } | null {
  return HORARIOS_CHALET[chalet as ChaletName] ?? null;
}
