// Tarjetas resumen del panel.
import { formatCOP } from "@/lib/precios";
import type { DashboardMetrics } from "@/lib/admin.functions";
import { CalendarCheck, FileClock, Percent, TrendingUp } from "lucide-react";

export function SummaryCards({ metrics, loading }: { metrics?: DashboardMetrics; loading: boolean }) {
  const items = [
    { label: "Reservas para hoy", value: metrics?.reservas_hoy ?? 0, Icon: CalendarCheck, tone: "emerald" },
    { label: "Cotizaciones pendientes", value: metrics?.cotizaciones_pendientes ?? 0, Icon: FileClock, tone: "amber" },
    { label: "Ocupación esta semana", value: `${metrics?.ocupacion_semana_pct ?? 0}%`, Icon: Percent, tone: "indigo" },
    { label: "Ingresos del mes", value: formatCOP(metrics?.ingresos_mes ?? 0), Icon: TrendingUp, tone: "rose" },
  ];
  const tones: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    rose: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map(({ label, value, Icon, tone }) => (
        <div key={label} className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
            <div className={`p-2 rounded-lg ring-1 ${tones[tone]}`}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
            {loading ? "…" : value}
          </p>
        </div>
      ))}
    </div>
  );
}
