// Shell del dashboard: tarjetas resumen + toggle Calendario/Lista + drawers.
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getDashboardMetrics, listReservas,
  type DashboardMetrics, type ReservaRow, type ListFilters, type RolPanel,
} from "@/lib/admin.functions";
import { SummaryCards } from "./SummaryCards";
import { CalendarView } from "./CalendarView";
import { ListView } from "./ListView";
import { OperacionesHoy } from "./OperacionesHoy";
import { ReservaDetailDrawer } from "./ReservaDetailDrawer";
import { NuevaReservaDialog } from "./NuevaReservaDialog";
import { CHALET_COLOR, ESTADO_BADGE } from "./chalet-styles";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, CalendarDays, Table2 } from "lucide-react";
import { formatCOP } from "@/lib/precios";
import { toast } from "sonner";

type Props = {
  accessToken: string;
  rol: RolPanel;
};

export function Dashboard({ accessToken, rol }: Props) {
  const fetchMetrics = useServerFn(getDashboardMetrics);
  const fetchReservas = useServerFn(listReservas);
  const [metrics, setMetrics] = useState<DashboardMetrics | undefined>(undefined);
  const [reservas, setReservas] = useState<ReservaRow[]>([]);
  const [loadingM, setLoadingM] = useState(true);
  const [view, setView] = useState<"calendario" | "lista">("calendario");
  const [filters, setFilters] = useState<ListFilters>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dayOpen, setDayOpen] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newInitialCheckin, setNewInitialCheckin] = useState<string | undefined>(undefined);
  const [tick, setTick] = useState(0);

  const canCreate = rol === "administrador" || rol === "operador";

  useEffect(() => {
    if (rol === "lectura") { setLoadingM(false); return; }
    setLoadingM(true);
    fetchMetrics({ data: { accessToken } })
      .then(setMetrics).catch(e => toast.error(e.message))
      .finally(() => setLoadingM(false));
  }, [accessToken, tick, fetchMetrics, rol]);

  useEffect(() => {
    fetchReservas({ data: { accessToken, filters } })
      .then(setReservas).catch(e => toast.error(e.message));
  }, [accessToken, filters, tick, fetchReservas]);

  const reservasDelDia = useMemo(() => {
    if (!dayOpen) return [];
    return reservas.filter(r => {
      if (r.estado === "cancelado") return false;
      const ci = r.fecha;
      const co = r.fecha_checkout ?? r.fecha;
      return ci <= dayOpen && dayOpen < co;
    });
  }, [reservas, dayOpen]);

  function refresh() { setTick(t => t + 1); }

  return (
    <div className="space-y-6">
      <OperacionesHoy
        accessToken={accessToken}
        rol={rol}
        refreshTick={tick}
        onSelectReserva={(id) => { setSelectedId(id); setDrawerOpen(true); }}
      />

      {rol === "lectura" ? (
        <div className="rounded-lg border border-dashed border-stone-300 bg-white/60 p-4 text-sm text-stone-500">
          Acceso restringido a tu rol
        </div>
      ) : (
        <SummaryCards metrics={metrics} loading={loadingM} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border bg-white p-1">
          <button
            onClick={() => setView("calendario")}
            className={`px-3 py-1.5 text-sm rounded-md inline-flex items-center gap-1.5 ${
              view === "calendario" ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <CalendarDays className="h-4 w-4" /> Calendario
          </button>
          <button
            onClick={() => setView("lista")}
            className={`px-3 py-1.5 text-sm rounded-md inline-flex items-center gap-1.5 ${
              view === "lista" ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <Table2 className="h-4 w-4" /> Lista
          </button>
        </div>

        {canCreate && (
          <Button onClick={() => { setNewInitialCheckin(undefined); setNewOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Nueva reserva manual
          </Button>
        )}
      </div>

      {view === "calendario" ? (
        <CalendarView reservas={reservas} onSelectDay={(k) => setDayOpen(k)} />
      ) : (
        <ListView
          reservas={reservas}
          filters={filters}
          onFiltersChange={setFilters}
          onSelect={(id) => { setSelectedId(id); setDrawerOpen(true); }}
        />
      )}

      <ReservaDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        reservaId={selectedId}
        accessToken={accessToken}
        rol={rol}
        onChanged={refresh}
      />

      <NuevaReservaDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        accessToken={accessToken}
        onCreated={refresh}
      />

      {/* Panel lateral con reservas del día (vista calendario) */}
      <Sheet open={!!dayOpen} onOpenChange={(o) => !o && setDayOpen(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>Reservas del {dayOpen}</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-2">
            {reservasDelDia.length === 0 ? (
              <p className="text-sm text-stone-500">Sin reservas activas ese día.</p>
            ) : reservasDelDia.map(r => {
              const totalNoches = r.desglose_noches && r.desglose_noches.length > 0
                ? r.desglose_noches.reduce((s, n) => s + Number(n.precio || 0), 0)
                : Number(r.precio_noche || 0) * Number(r.noches || 1);
              return (
                <button
                  key={r.id}
                  className="w-full text-left rounded-lg border bg-white p-3 hover:border-amber-400 hover:bg-amber-50/40"
                  onClick={() => { setSelectedId(r.id); setDrawerOpen(true); setDayOpen(null); }}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${CHALET_COLOR[r.chalet].badge}`}>{r.chalet}</span>
                    <span className={`px-2 py-0.5 rounded-md text-xs ${ESTADO_BADGE[r.estado]}`}>{r.estado}</span>
                  </div>
                  <p className="mt-2 font-medium text-sm">{r.nombre}</p>
                  <p className="font-mono text-xs text-stone-600">{r.whatsapp}</p>
                  <div className="mt-1 text-xs text-stone-500 flex justify-between">
                    <span>{r.fecha} → {r.fecha_checkout ?? "—"}</span>
                    <span className="tabular-nums">{formatCOP(totalNoches)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
