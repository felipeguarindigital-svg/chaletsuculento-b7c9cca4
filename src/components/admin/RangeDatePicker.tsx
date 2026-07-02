// Selector de rango de fechas estilo Airbnb/Booking para el Panel Interno.
// - Un solo flujo: primer clic = check-in, segundo clic = check-out.
// - Hover preview del rango entre el check-in y el cursor (built-in en react-day-picker v9 mode="range").
// - Fechas bloqueadas (reservas confirmadas) no seleccionables; el rango no puede atravesarlas.
// - Check-out mínimo = check-in + 1 día (mínimo 1 noche).
import { useEffect, useMemo, useState } from "react";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { useServerFn } from "@tanstack/react-start";
import { getFechasBloqueadas } from "@/lib/reservas-external.functions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type ChaletName = "Suculento" | "Del Bosque" | "Cattleya" | "Ukiyo" | "Satori";

type Props = {
  chalet: ChaletName;
  checkin: string; // YYYY-MM-DD
  checkout: string; // YYYY-MM-DD
  onChange: (checkin: string, checkout: string) => void;
  // Fechas a excluir del "bloqueado" (útil en edición: no bloquearse a sí misma).
  excluirRango?: { checkin: string; checkout: string };
  disabled?: boolean;
};

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function parseYmd(s: string): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}
function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function fmt(d: Date) {
  return d.toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" });
}

export function RangeDatePicker({ chalet, checkin, checkout, onChange, excluirRango, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [blocked, setBlocked] = useState<string[]>([]);
  const fetchBloqueadas = useServerFn(getFechasBloqueadas);

  useEffect(() => {
    let cancelled = false;
    fetchBloqueadas({ data: { chalet } })
      .then(d => { if (!cancelled) setBlocked(Array.isArray(d) ? d : []); })
      .catch(() => { if (!cancelled) setBlocked([]); });
    return () => { cancelled = true; };
  }, [chalet, fetchBloqueadas]);

  // Excluir las noches del propio rango en edición (para no bloquearse a sí misma).
  const blockedSet = useMemo(() => {
    const s = new Set(blocked);
    if (excluirRango?.checkin && excluirRango?.checkout) {
      const a = parseYmd(excluirRango.checkin);
      const b = parseYmd(excluirRango.checkout);
      if (a && b) {
        for (let cur = new Date(a); cur < b; cur = addDays(cur, 1)) s.delete(ymd(cur));
      }
    }
    return s;
  }, [blocked, excluirRango?.checkin, excluirRango?.checkout]);

  const range: DateRange | undefined = useMemo(() => {
    const from = parseYmd(checkin);
    const to = parseYmd(checkout);
    if (!from) return undefined;
    return { from, to };
  }, [checkin, checkout]);

  const today = new Date(); today.setHours(0, 0, 0, 0);

  function handleSelect(next: DateRange | undefined) {
    if (!next?.from) { onChange("", ""); return; }
    // Si el rango elegido cruza una noche bloqueada, cortamos la selección en el check-in.
    if (next.to) {
      let hasBlocked = false;
      for (let cur = new Date(next.from); cur < next.to; cur = addDays(cur, 1)) {
        if (blockedSet.has(ymd(cur))) { hasBlocked = true; break; }
      }
      if (hasBlocked) {
        onChange(ymd(next.from), "");
        return;
      }
      // Mínimo 1 noche.
      if (next.to.getTime() === next.from.getTime()) {
        onChange(ymd(next.from), "");
        return;
      }
      onChange(ymd(next.from), ymd(next.to));
      setOpen(false);
      return;
    }
    onChange(ymd(next.from), "");
  }

  const nights = useMemo(() => {
    const a = parseYmd(checkin); const b = parseYmd(checkout);
    if (!a || !b) return 0;
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  }, [checkin, checkout]);

  const label = (() => {
    const a = parseYmd(checkin); const b = parseYmd(checkout);
    if (a && b) return `${fmt(a)} → ${fmt(b)} · ${nights} noche${nights === 1 ? "" : "s"}`;
    if (a) return `${fmt(a)} → selecciona salida`;
    return "Selecciona fechas";
  })();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-auto py-2",
            !checkin && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
        <div className="px-3 pt-3 pb-1 text-xs text-stone-600">
          {!checkin
            ? "Selecciona tu fecha de llegada"
            : !checkout
              ? "Ahora selecciona tu fecha de salida"
              : `${nights} noche${nights === 1 ? "" : "s"} seleccionada${nights === 1 ? "" : "s"}`}
        </div>
        <Calendar
          mode="range"
          selected={range}
          onSelect={handleSelect}
          numberOfMonths={1}
          defaultMonth={parseYmd(checkin) ?? new Date()}
          disabled={(day: Date) => {
            if (day < today) return true;
            // Fase de selección de check-out: el usuario ya eligió check-in y aún no check-out.
            // Una fecha bloqueada (noche ocupada) SÍ puede usarse como check-out siempre que
            // ninguna de las noches del rango [from, day) esté bloqueada. El día de check-out
            // no cuenta como noche.
            const selectingCheckout = !!range?.from && !range?.to;
            if (selectingCheckout) {
              const from = range!.from!;
              if (day <= from) return blockedSet.has(ymd(day));
              for (let cur = new Date(from); cur < day; cur = addDays(cur, 1)) {
                if (blockedSet.has(ymd(cur))) return true;
              }
              return false;
            }
            return blockedSet.has(ymd(day));
          }}
          excludeDisabled
          className="p-3 pointer-events-auto [--cell-size:2.5rem]"
        />
        <div className="px-3 pb-3 pt-1 flex items-center justify-between">
          <button
            type="button"
            className="text-xs text-stone-500 hover:text-stone-800"
            onClick={() => onChange("", "")}
          >
            Limpiar
          </button>
          <button
            type="button"
            className="text-xs font-medium text-amber-800 hover:text-amber-900"
            onClick={() => setOpen(false)}
          >
            Cerrar
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
