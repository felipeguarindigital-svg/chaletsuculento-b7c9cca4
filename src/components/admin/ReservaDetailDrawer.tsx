// Drawer de detalle de reserva con cambios de estado, notas y eliminación.
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getReservaDetail, updateEstadoReserva, updateNotasReserva, deleteReserva,
  type ReservaDetail, type EstadoReserva, type RolPanel,
} from "@/lib/admin.functions";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatCOP, LABEL_TIPO } from "@/lib/precios";
import { getHorarios } from "@/lib/horarios";
import { CHALET_COLOR, ESTADO_BADGE } from "./chalet-styles";
import { toast } from "sonner";

function buildWhatsAppConfirmUrl(d: ReservaDetail): string {
  let phone = (d.whatsapp || "").replace(/\D/g, "");
  if (!phone.startsWith("57")) phone = "57" + phone.replace(/^0+/, "");
  const firstName = (d.nombre || "").trim().split(/\s+/)[0] || "";
  const total = d.total;
  const horarios = getHorarios(d.chalet);
  const checkInLine = `📅 Check-in: ${d.fecha}${horarios ? ` a las ${horarios.checkIn}` : ""}`;
  const checkOutLine = d.fecha_checkout
    ? `📅 Check-out: ${d.fecha_checkout}${horarios ? ` a las ${horarios.checkOut}` : ""}`
    : null;
  const lines: string[] = [
    `¡Hola ${firstName}! 🎉`,
    ``,
    `Tu reserva en Chalet Suculento ha sido confirmada ✅`,
    ``,
    `📋 Código: ${d.codigo}`,
    `🏡 Chalet: ${d.chalet}`,
    checkInLine,
    ...(checkOutLine ? [checkOutLine] : []),
    `🌙 Noches: ${d.noches ?? "—"}`,
    `💰 Total: ${formatCOP(total)}`,
  ];
  if (d.adicionales.length > 0) {
    lines.push("", "✨ Adicionales:");
    for (const a of d.adicionales) {
      lines.push(`• ${a.nombre ?? a.adicional_id} — ${formatCOP(a.precio_cobrado)}`);
    }
  }
  lines.push("", "¡Te esperamos para una experiencia inolvidable! 🌲");
  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
}


type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  reservaId: string | null;
  accessToken: string;
  rol: RolPanel;
  onChanged: () => void;
};

export function ReservaDetailDrawer({ open, onOpenChange, reservaId, accessToken, rol, onChanged }: Props) {
  const getDetail = useServerFn(getReservaDetail);
  const setEstado = useServerFn(updateEstadoReserva);
  const setNotas = useServerFn(updateNotasReserva);
  const remove = useServerFn(deleteReserva);
  const [data, setData] = useState<ReservaDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [notas, setNotasLocal] = useState("");
  const [saving, setSaving] = useState(false);

  const canEdit = rol === "administrador" || rol === "operador";
  const canDelete = rol === "administrador";

  useEffect(() => {
    if (!open || !reservaId) { setData(null); return; }
    setLoading(true);
    getDetail({ data: { accessToken, id: reservaId } })
      .then(d => { setData(d); setNotasLocal(d.notas ?? ""); })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [open, reservaId, accessToken, getDetail]);

  async function cambiarEstado(nuevo: EstadoReserva) {
    if (!data) return;
    setSaving(true);
    try {
      await setEstado({ data: { accessToken, id: data.id, estado: nuevo } });
      setData({ ...data, estado: nuevo });
      onChanged();
      toast.success(`Estado cambiado a ${nuevo}`);
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function guardarNotas() {
    if (!data) return;
    setSaving(true);
    try {
      await setNotas({ data: { accessToken, id: data.id, notas } });
      toast.success("Notas guardadas");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function eliminar() {
    if (!data) return;
    if (!confirm(`¿Eliminar la reserva ${data.codigo}? Esta acción no se puede deshacer.`)) return;
    setSaving(true);
    try {
      await remove({ data: { accessToken, id: data.id } });
      toast.success("Reserva eliminada");
      onChanged();
      onOpenChange(false);
    } catch (e: any) { toast.error(e.message); setSaving(false); }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalle de reserva</SheetTitle>
        </SheetHeader>

        {loading || !data ? (
          <p className="mt-6 text-stone-500">{loading ? "Cargando…" : "Sin datos"}</p>
        ) : (
          <div className="mt-4 space-y-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm">{data.codigo}</span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${ESTADO_BADGE[data.estado]}`}>
                {data.estado}
              </span>
            </div>

            <div className="rounded-lg border bg-stone-50 p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-stone-500">Chalet</span>
                <span className={`px-2 py-0.5 rounded-md text-xs ${CHALET_COLOR[data.chalet].badge}`}>{data.chalet}</span>
              </div>
              <div className="flex justify-between"><span className="text-stone-500">Check-in</span><span>{data.fecha}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">Check-out</span><span>{data.fecha_checkout ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">Noches</span><span>{data.noches ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">Tarifa</span><span>{LABEL_TIPO[data.tipo_tarifa]}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">Origen</span><span>{data.origen}</span></div>
            </div>

            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Huésped</p>
              <p className="font-medium">{data.nombre}</p>
              <p className="font-mono text-xs text-stone-600">{data.whatsapp}</p>
            </div>

            {data.desglose_noches && data.desglose_noches.length > 0 && (
              <div>
                <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Desglose noches</p>
                <div className="rounded-lg border divide-y text-sm">
                  {data.desglose_noches.map(n => (
                    <div key={n.fecha} className="flex justify-between px-3 py-1.5">
                      <span>{n.fecha} · <span className="text-stone-500">{LABEL_TIPO[n.tipo]}</span></span>
                      <span className="tabular-nums">{formatCOP(Number(n.precio))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Adicionales</p>
              {data.adicionales.length === 0 ? (
                <p className="text-sm text-stone-500">Sin adicionales</p>
              ) : (
                <div className="rounded-lg border divide-y text-sm">
                  {data.adicionales.map(a => (
                    <div key={a.id} className="flex justify-between px-3 py-1.5">
                      <span>{a.nombre ?? a.adicional_id}</span>
                      <span className="tabular-nums">{formatCOP(a.precio_cobrado)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-center justify-between">
              <span className="text-sm font-medium">Total</span>
              <span className="text-lg font-semibold tabular-nums">{formatCOP(data.total)}</span>
            </div>

            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Notas internas</p>
              <Textarea
                value={notas}
                onChange={(e) => setNotasLocal(e.target.value)}
                disabled={!canEdit}
                rows={3}
                placeholder="Notas internas para el equipo…"
              />
              {canEdit && (
                <Button size="sm" variant="outline" className="mt-2" onClick={guardarNotas} disabled={saving}>
                  Guardar notas
                </Button>
              )}
            </div>

            {canEdit && (
              <div className="space-y-2">
                <p className="text-xs text-stone-500 uppercase tracking-wider">Cambiar estado</p>
                <div className="flex flex-wrap gap-2">
                  {(["cotizacion","reservado","cancelado"] as EstadoReserva[]).map(s => (
                    <Button
                      key={s}
                      size="sm"
                      variant={data.estado === s ? "default" : "outline"}
                      disabled={saving || data.estado === s}
                      onClick={() => cambiarEstado(s)}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {canEdit && data.estado === "reservado" && (
              <div className="pt-3 border-t">
                <Button
                  size="sm"
                  className="bg-[#25D366] hover:bg-[#1ebe5d] text-white w-full"
                  onClick={() => {
                    const url = buildWhatsAppConfirmUrl(data);
                    window.open(url, "_blank", "noopener,noreferrer");
                  }}
                >
                  Enviar confirmación por WhatsApp
                </Button>
              </div>
            )}



            {canDelete && (
              <div className="pt-3 border-t">
                <Button variant="destructive" size="sm" onClick={eliminar} disabled={saving}>
                  Eliminar reserva
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
