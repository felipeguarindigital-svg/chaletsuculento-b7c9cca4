// Vista de operaciones del día: llegadas, salidas y huéspedes en casa hoy.
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getOperacionesHoy, type OperacionesHoy as Ops, type OperacionFicha, type RolPanel } from "@/lib/admin.functions";
import { getHorarios } from "@/lib/horarios";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  accessToken: string;
  rol: RolPanel;
  refreshTick: number;
  onSelectReserva: (id: string) => void;
};

type Bloque = "llegadas" | "salidas" | "en_casa";

const BLOQUE_META: Record<Bloque, { emoji: string; titulo: string; vacio: string; chaletText: string; ring: string; bg: string }> = {
  llegadas: {
    emoji: "🟢", titulo: "LLEGADAS HOY", vacio: "Sin llegadas hoy",
    chaletText: "text-emerald-700", ring: "border-emerald-200", bg: "bg-emerald-50/60",
  },
  salidas: {
    emoji: "🔴", titulo: "SALIDAS HOY", vacio: "Sin salidas hoy",
    chaletText: "text-rose-700", ring: "border-rose-200", bg: "bg-rose-50/60",
  },
  en_casa: {
    emoji: "🟡", titulo: "EN CASA HOY", vacio: "Sin huéspedes en casa",
    chaletText: "text-amber-700", ring: "border-amber-200", bg: "bg-amber-50/60",
  },
};

function tituloHoy(iso: string): string {
  // iso viene en YYYY-MM-DD calculado con TZ Bogotá; construimos Date estable
  const [y, m, d] = iso.split("-").map(Number);
  const local = new Date(y, m - 1, d);
  const s = new Intl.DateTimeFormat("es-CO", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(local);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function abrirWhatsApp(whatsapp: string) {
  let phone = (whatsapp || "").replace(/\D/g, "");
  if (!phone) return;
  if (!phone.startsWith("57")) phone = "57" + phone.replace(/^0+/, "");
  window.open(`https://wa.me/${phone}`, "_blank", "noopener,noreferrer");
}

function Ficha({
  ficha, bloque, rol, onSelect,
}: { ficha: OperacionFicha; bloque: Bloque; rol: RolPanel; onSelect: (id: string) => void }) {
  const meta = BLOQUE_META[bloque];
  const horarios = getHorarios(ficha.chalet);
  const hora = bloque === "salidas" ? horarios?.checkOut : horarios?.checkIn;
  const canWA = rol !== "lectura";

  return (
    <div className={`rounded-xl border ${meta.ring} ${meta.bg} p-3 space-y-2`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`font-semibold text-sm ${meta.chaletText}`}>{ficha.chalet}</p>
        {hora && (
          <span className="text-xs text-stone-600 tabular-nums whitespace-nowrap">
            {bloque === "salidas" ? "Check-out" : "Check-in"} {hora}
          </span>
        )}
      </div>
      <div className="text-sm text-stone-800 font-medium">{ficha.nombre}</div>
      <div className="text-xs text-stone-600">👥 {ficha.personas} persona{ficha.personas === 1 ? "" : "s"}</div>
      {ficha.adicionales.length > 0 && (
        <ul className="text-xs text-stone-600 list-disc pl-4 space-y-0.5">
          {ficha.adicionales.map((n, i) => (<li key={i}>{n}</li>))}
        </ul>
      )}
      {bloque === "salidas" && hora && (
        <p className="text-[11px] text-stone-500 italic">
          Chalet disponible para limpieza después de las {hora}
        </p>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button size="sm" variant="outline" className="h-8" onClick={() => onSelect(ficha.id)}>
          Ver detalle
        </Button>
        {canWA && (
          <Button
            size="sm"
            className="h-8 bg-[#25D366] hover:bg-[#1ebe5d] text-white"
            onClick={() => abrirWhatsApp(ficha.whatsapp)}
          >
            📱 WhatsApp
          </Button>
        )}
      </div>
    </div>
  );
}

function Bloque({
  bloque, fichas, rol, onSelect,
}: { bloque: Bloque; fichas: OperacionFicha[]; rol: RolPanel; onSelect: (id: string) => void }) {
  const meta = BLOQUE_META[bloque];
  return (
    <div className="rounded-2xl border border-stone-200 bg-white/70 p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold tracking-wide text-stone-800">
          {meta.emoji} {meta.titulo}
        </h3>
        <span className="text-xs text-stone-500 tabular-nums">{fichas.length}</span>
      </div>
      {fichas.length === 0 ? (
        <p className="text-sm text-stone-500 italic">{meta.vacio}</p>
      ) : (
        <div className="space-y-2">
          {fichas.map(f => (
            <Ficha key={f.id} ficha={f} bloque={bloque} rol={rol} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

export function OperacionesHoy({ accessToken, rol, refreshTick, onSelectReserva }: Props) {
  const fetchOps = useServerFn(getOperacionesHoy);
  const [ops, setOps] = useState<Ops | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchOps({ data: { accessToken } })
      .then(setOps)
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [accessToken, refreshTick, fetchOps]);

  const hoyStr = ops ? tituloHoy(ops.hoy) : "";
  const total = ops ? ops.llegadas.length + ops.salidas.length + ops.en_casa.length : 0;

  return (
    <section className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/70 to-white p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-stone-900">
          📅 HOY {ops && <span className="text-stone-600 font-normal">· {hoyStr}</span>}
        </h2>
      </header>

      {loading ? (
        <p className="text-sm text-stone-500">Cargando operaciones del día…</p>
      ) : !ops ? null : total === 0 ? (
        <p className="text-sm text-stone-600 py-4 text-center">
          ✨ Sin actividad hoy — disfruta la calma
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          <Bloque bloque="llegadas" fichas={ops.llegadas} rol={rol} onSelect={onSelectReserva} />
          <Bloque bloque="salidas" fichas={ops.salidas} rol={rol} onSelect={onSelectReserva} />
          <Bloque bloque="en_casa" fichas={ops.en_casa} rol={rol} onSelect={onSelectReserva} />
        </div>
      )}
    </section>
  );
}
