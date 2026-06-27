// Vista lista/tabla con filtros.
import { useMemo, useState } from "react";
import type { ReservaRow, ListFilters } from "@/lib/admin.functions";
import { CHALETS, CHALET_COLOR, ESTADO_BADGE } from "./chalet-styles";
import { formatCOP } from "@/lib/precios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  reservas: ReservaRow[];
  filters: ListFilters;
  onFiltersChange: (f: ListFilters) => void;
  onSelect: (id: string) => void;
};

export function ListView({ reservas, filters, onFiltersChange, onSelect }: Props) {
  const [busqueda, setBusqueda] = useState("");

  const filtered = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return reservas.filter(r => {
      if (!q) return true;
      return [r.codigo, r.nombre, r.whatsapp].some(v => v?.toLowerCase().includes(q));
    });
  }, [reservas, busqueda]);

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
        <select
          value={filters.chalet ?? "todos"}
          onChange={e => onFiltersChange({ ...filters, chalet: e.target.value as any })}
          className="rounded-md border px-2 py-1.5 text-sm bg-white"
        >
          <option value="todos">Todos los chalets</option>
          {CHALETS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filters.estado ?? "todos"}
          onChange={e => onFiltersChange({ ...filters, estado: e.target.value as any })}
          className="rounded-md border px-2 py-1.5 text-sm bg-white"
        >
          <option value="todos">Todos los estados</option>
          <option value="cotizacion">Cotización</option>
          <option value="reservado">Reservado</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <select
          value={filters.origen ?? "todos"}
          onChange={e => onFiltersChange({ ...filters, origen: e.target.value as any })}
          className="rounded-md border px-2 py-1.5 text-sm bg-white"
        >
          <option value="todos">Todos los orígenes</option>
          <option value="landing">Landing</option>
          <option value="manual">Manual</option>
        </select>
        <Input
          type="date"
          value={filters.desde ?? ""}
          onChange={e => onFiltersChange({ ...filters, desde: e.target.value || null })}
          placeholder="Desde"
        />
        <Input
          type="date"
          value={filters.hasta ?? ""}
          onChange={e => onFiltersChange({ ...filters, hasta: e.target.value || null })}
          placeholder="Hasta"
        />
        <Input
          placeholder="Buscar código, nombre o tel."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto -mx-5">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-600 text-xs uppercase">
            <tr>
              <th className="text-left px-3 py-2">Código</th>
              <th className="text-left px-3 py-2">Check-in</th>
              <th className="text-left px-3 py-2">Check-out</th>
              <th className="text-center px-3 py-2">Noches</th>
              <th className="text-left px-3 py-2">Chalet</th>
              <th className="text-left px-3 py-2">Nombre</th>
              <th className="text-left px-3 py-2">WhatsApp</th>
              <th className="text-left px-3 py-2">Estado</th>
              <th className="text-left px-3 py-2">Origen</th>
              <th className="text-right px-3 py-2">Alojamiento</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={11} className="text-center text-stone-500 py-8">Sin reservas con esos filtros.</td></tr>
            ) : filtered.map(r => {
              const totalNoches = r.desglose_noches && r.desglose_noches.length > 0
                ? r.desglose_noches.reduce((s, n) => s + Number(n.precio || 0), 0)
                : Number(r.precio_noche || 0) * Number(r.noches || 1);
              return (
                <tr key={r.id} className="border-t hover:bg-stone-50 cursor-pointer" onClick={() => onSelect(r.id)}>
                  <td className="px-3 py-2 font-mono text-xs">{r.codigo}</td>
                  <td className="px-3 py-2">{r.fecha}</td>
                  <td className="px-3 py-2">{r.fecha_checkout ?? "—"}</td>
                  <td className="px-3 py-2 text-center">{r.noches ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${CHALET_COLOR[r.chalet].badge}`}>
                      {r.chalet}
                    </span>
                  </td>
                  <td className="px-3 py-2">{r.nombre}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.whatsapp}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${ESTADO_BADGE[r.estado] ?? ""}`}>
                      {r.estado}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-stone-600">{r.origen}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCOP(totalNoches)}</td>
                  <td className="px-3 py-2 text-right">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onSelect(r.id); }}>
                      Ver
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
