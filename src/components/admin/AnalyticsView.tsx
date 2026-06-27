// Vista de Analítica del Panel Interno.
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAnalytics, type AnalyticsPayload } from "@/lib/analytics.functions";
import { formatCOP } from "@/lib/precios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Gauge, TrendingUp, Timer, CalendarCheck2 } from "lucide-react";

type Props = { accessToken: string };
type ChaletFiltro = "all" | "Suculento" | "Del Bosque" | "Cattleya" | "Ukiyo" | "Satori";
const CHALET_OPCIONES: ChaletFiltro[] = ["all", "Suculento", "Del Bosque", "Cattleya", "Ukiyo", "Satori"];

function fmtYmd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Preset = "mes" | "mes_pasado" | "u30" | "ano" | "custom";

function rangoPreset(p: Preset): { desde: string; hasta: string } {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  if (p === "mes") {
    const i = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const f = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    return { desde: fmtYmd(i), hasta: fmtYmd(f) };
  }
  if (p === "mes_pasado") {
    const i = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const f = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
    return { desde: fmtYmd(i), hasta: fmtYmd(f) };
  }
  if (p === "u30") {
    const i = new Date(hoy); i.setDate(i.getDate() - 29);
    return { desde: fmtYmd(i), hasta: fmtYmd(hoy) };
  }
  // año
  const i = new Date(hoy.getFullYear(), 0, 1);
  const f = new Date(hoy.getFullYear(), 11, 31);
  return { desde: fmtYmd(i), hasta: fmtYmd(f) };
}

const CHALET_COLORS: Record<string, string> = {
  "Suculento": "#10b981",
  "Del Bosque": "#15803d",
  "Cattleya": "#f43f5e",
  "Ukiyo": "#6366f1",
  "Satori": "#f59e0b",
};
const ORIGEN_COLORS: Record<string, string> = {
  landing: "#0ea5e9",
  manual: "#a855f7",
};

export function AnalyticsView({ accessToken }: Props) {
  const fetchAnalytics = useServerFn(getAnalytics);
  const [preset, setPreset] = useState<Preset>("mes");
  const [rango, setRango] = useState(() => rangoPreset("mes"));
  const [chalet, setChalet] = useState<ChaletFiltro>("all");
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchAnalytics({ data: { accessToken, desde: rango.desde, hasta: rango.hasta, chalet } })
      .then(setData)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [accessToken, rango.desde, rango.hasta, chalet, fetchAnalytics]);

  function elegirPreset(p: Preset) {
    setPreset(p);
    if (p !== "custom") setRango(rangoPreset(p));
  }

  const ingresosMesFmt = useMemo(() => {
    if (!data) return [];
    return data.ingresos_por_mes.map((m) => ({
      ...m,
      mesLabel: m.mes,
    }));
  }, [data]);

  const sinDatosOcupacion = data && data.ocupacion_por_chalet.every((c) => c.noches_ocupadas === 0);
  const sinDatosIngresos = data && data.ingresos_por_mes.length === 0;
  const sinDatosDia = data && data.reservas_por_dia_semana.every((d) => d.cantidad === 0);
  const sinDatosOrigen = data && data.origen_reservas.length === 0;
  const sinDatosAdic = data && data.adicionales_top.every((a) => a.cantidad === 0);

  return (
    <div className="space-y-6">
      {/* Selector de periodo */}
      <div className="rounded-xl border bg-white p-4 flex flex-wrap items-end gap-3">
        <div className="inline-flex rounded-lg border p-1 bg-stone-50">
          {([
            ["mes", "Este mes"],
            ["mes_pasado", "Mes pasado"],
            ["u30", "Últimos 30 días"],
            ["ano", "Este año"],
          ] as [Preset, string][]).map(([k, label]) => (
            <button
              key={k}
              onClick={() => elegirPreset(k)}
              className={`px-3 py-1.5 text-sm rounded-md ${
                preset === k ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => setPreset("custom")}
            className={`px-3 py-1.5 text-sm rounded-md ${
              preset === "custom" ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            Personalizado
          </button>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="desde" className="text-xs text-stone-500">Desde</Label>
            <Input
              id="desde" type="date" value={rango.desde}
              onChange={(e) => { setPreset("custom"); setRango((r) => ({ ...r, desde: e.target.value })); }}
              className="h-9"
            />
          </div>
          <div>
            <Label htmlFor="hasta" className="text-xs text-stone-500">Hasta</Label>
            <Input
              id="hasta" type="date" value={rango.hasta}
              onChange={(e) => { setPreset("custom"); setRango((r) => ({ ...r, hasta: e.target.value })); }}
              className="h-9"
            />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <Label htmlFor="chalet" className="text-xs text-stone-500">Chalet</Label>
            <select
              id="chalet"
              value={chalet}
              onChange={(e) => setChalet(e.target.value as ChaletFiltro)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {CHALET_OPCIONES.map((c) => (
                <option key={c} value={c}>{c === "all" ? "Todos los chalets" : c}</option>
              ))}
            </select>
          </div>
        </div>
        {loading && <span className="text-xs text-stone-500 ml-auto">Calculando…</span>}
      </div>

      {/* Tarjetas numéricas destacadas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NumberCard
          label="Reservas en el periodo"
          value={data ? String(data.total_reservas) : "…"}
          sub={chalet === "all" ? "Todos los chalets" : chalet}
          Icon={CalendarCheck2}
          tone="sky"
        />
        <NumberCard
          label="Ticket promedio por reserva"
          value={data ? formatCOP(data.ticket_promedio.con_adicionales) : "…"}
          sub={data ? `Sin adicionales: ${formatCOP(data.ticket_promedio.sin_adicionales)} · ${data.ticket_promedio.reservas_consideradas} reservas` : ""}
          Icon={TrendingUp}
          tone="emerald"
        />
        <NumberCard
          label="Tasa de conversión (cot. → reservado)"
          value={data ? `${data.conversion.pct}%` : "…"}
          sub={data ? `${data.conversion.ahora_reservadas} de ${Math.max(0, data.conversion.cotizaciones_creadas - data.conversion.canceladas)} (canceladas: ${data.conversion.canceladas})` : ""}
          Icon={Gauge}
          tone="indigo"
        />
        <NumberCard
          label="Tiempo promedio de confirmación"
          value={
            !data ? "…"
            : !data.tiempo_confirmacion_horas.soportado ? "—"
            : data.tiempo_confirmacion_horas.promedio === null ? "Sin datos"
            : `${data.tiempo_confirmacion_horas.promedio} h`
          }
          sub={
            !data ? ""
            : !data.tiempo_confirmacion_horas.soportado
              ? "Requiere columna confirmado_en (ver SQL)"
              : `${data.tiempo_confirmacion_horas.reservas_consideradas} reservas confirmadas en el periodo`
          }
          Icon={Timer}
          tone="amber"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Ocupación por chalet (% noches reservadas)">
          {sinDatosOcupacion ? <EmptyMsg /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data?.ocupacion_por_chalet ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="chalet" tick={{ fontSize: 12 }} />
                <YAxis unit="%" tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: any, _n, p: any) => [`${v}% (${p.payload.noches_ocupadas}/${p.payload.noches_totales} noches)`, "Ocupación"]} />
                <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                  {(data?.ocupacion_por_chalet ?? []).map((d) => (
                    <Cell key={d.chalet} fill={CHALET_COLORS[d.chalet] ?? "#78716c"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Ingresos por mes">
          {sinDatosIngresos ? <EmptyMsg /> : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={ingresosMesFmt}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="mesLabel" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v: any) => [formatCOP(Number(v)), "Ingresos"]} />
                <Line type="monotone" dataKey="ingresos" stroke="#d97706" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Día de la semana más reservado">
          {sinDatosDia ? <EmptyMsg /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data?.reservas_por_dia_semana ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Origen de las reservas (creadas en el periodo)">
          {sinDatosOrigen ? <EmptyMsg /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data?.origen_reservas ?? []}
                  dataKey="cantidad"
                  nameKey="origen"
                  outerRadius={90}
                  label={(e: any) => `${e.origen}: ${e.cantidad}`}
                >
                  {(data?.origen_reservas ?? []).map((d) => (
                    <Cell key={d.origen} fill={ORIGEN_COLORS[d.origen] ?? "#78716c"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Servicios adicionales más vendidos">
        {sinDatosAdic ? <EmptyMsg /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-stone-500 border-b">
                  <th className="py-2 pr-4 font-medium">Servicio</th>
                  <th className="py-2 pr-4 font-medium text-right">Veces vendido</th>
                  <th className="py-2 pl-4 font-medium text-right">Total generado</th>
                </tr>
              </thead>
              <tbody>
                {(data?.adicionales_top ?? []).map((a) => (
                  <tr key={a.nombre} className="border-b last:border-0 hover:bg-stone-50">
                    <td className="py-2 pr-4 text-stone-800">{a.nombre}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-stone-700">{a.cantidad}</td>
                    <td className="py-2 pl-4 text-right tabular-nums text-stone-700">{formatCOP(a.total_generado)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-stone-300 bg-stone-50 font-semibold text-stone-900">
                  <td className="py-2 pr-4 uppercase text-xs tracking-wider">Total general</td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {(data?.adicionales_top ?? []).reduce((s, a) => s + a.cantidad, 0)}
                  </td>
                  <td className="py-2 pl-4 text-right tabular-nums">
                    {formatCOP((data?.adicionales_top ?? []).reduce((s, a) => s + a.total_generado, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </ChartCard>
    </div>
  );
}

function NumberCard({
  label, value, sub, Icon, tone,
}: { label: string; value: string; sub?: string; Icon: any; tone: "emerald" | "amber" | "indigo" }) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  };
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
        <div className={`p-2 rounded-lg ring-1 ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-stone-500">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-stone-700 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function EmptyMsg() {
  return (
    <div className="h-[260px] grid place-items-center text-sm text-stone-400">
      No hay datos suficientes en el periodo seleccionado.
    </div>
  );
}
