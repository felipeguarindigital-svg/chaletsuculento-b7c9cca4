// Vista calendario del panel: cada día muestra puntos por chalet con reserva
// (cualquier noche dentro del rango cuenta). Click en día → onSelectDay.
import { useMemo, useState } from "react";
import type { ReservaRow } from "@/lib/admin.functions";
import { CHALETS, CHALET_COLOR, type ChaletName } from "./chalet-styles";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function fmt(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

export function CalendarView({
  reservas,
  onSelectDay,
}: {
  reservas: ReservaRow[];
  onSelectDay: (ymd: string) => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  // Mapa día → set de chalets con reserva (no cancelada) esa noche.
  const byDay = useMemo(() => {
    const m = new Map<string, Set<ChaletName>>();
    for (const r of reservas) {
      if (r.estado !== "reservado") continue;
      const ci = new Date(r.fecha + "T00:00:00");
      const co = r.fecha_checkout
        ? new Date(r.fecha_checkout + "T00:00:00")
        : new Date(ci.getTime() + (r.noches ?? 1) * 86400000);
      for (let d = new Date(ci); d < co; d.setDate(d.getDate()+1)) {
        const k = fmt(d);
        if (!m.has(k)) m.set(k, new Set());
        m.get(k)!.add(r.chalet as ChaletName);
      }
    }
    return m;
  }, [reservas]);

  function nav(dir: number) {
    let m = month + dir, y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setMonth(m); setYear(y);
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = fmt(today);

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => nav(-1)} className="p-2 rounded-md hover:bg-stone-100">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="font-semibold text-stone-800">{MONTHS[month]} {year}</h3>
        <button onClick={() => nav(1)} className="p-2 rounded-md hover:bg-stone-100">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["DOM","LUN","MAR","MIÉ","JUE","VIE","SÁB"].map(d => (
          <div key={d} className="text-center text-[10px] text-stone-500 tracking-wider py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
          const key = fmt(new Date(year, month, d));
          const chalets = byDay.get(key);
          const isToday = key === todayKey;
          return (
            <button
              key={key}
              onClick={() => onSelectDay(key)}
              className={`aspect-square sm:aspect-auto sm:min-h-[68px] p-1.5 rounded-lg border text-left transition hover:border-amber-400 hover:bg-amber-50/40 ${
                isToday ? "border-amber-500 bg-amber-50" : "border-stone-200 bg-white"
              }`}
            >
              <div className="text-xs font-medium text-stone-700">{d}</div>
              <div className="mt-1 flex flex-wrap gap-0.5">
                {chalets && [...chalets].map(c => (
                  <span
                    key={c}
                    title={c}
                    className={`${CHALET_COLOR[c].dot} h-1.5 w-1.5 rounded-full`}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-stone-600">
        {CHALETS.map(c => (
          <span key={c} className="inline-flex items-center gap-1.5">
            <span className={`${CHALET_COLOR[c].dot} h-2 w-2 rounded-full`} />
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}
