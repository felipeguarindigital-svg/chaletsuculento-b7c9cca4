// Diálogo "Nueva reserva manual". Calcula el desglose con tarifasPorNoche y
// permite elegir estado inicial (cotización o reservado).
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  crearReservaManual, listServiciosAdicionales,
  computeDescuento,
  type ChaletName, type DescuentoTipo,
} from "@/lib/admin.functions";
import type { ServicioAdicional } from "@/lib/reservas-external.functions";
import { tarifasPorNoche } from "@/lib/tarifas";
import { PRECIO_POR_TIPO, LABEL_TIPO, formatCOP } from "@/lib/precios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CHALETS } from "./chalet-styles";
import { getHorarios } from "@/lib/horarios";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  accessToken: string;
  onCreated: () => void;
};

export function NuevaReservaDialog({ open, onOpenChange, accessToken, onCreated }: Props) {
  const fetchServicios = useServerFn(listServiciosAdicionales);
  const submit = useServerFn(crearReservaManual);

  const [chalet, setChalet] = useState<ChaletName>("Suculento");
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [estado, setEstado] = useState<"cotizacion" | "reservado">("reservado");
  const [notas, setNotas] = useState("");
  const [servicios, setServicios] = useState<ServicioAdicional[]>([]);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [descuentoTipo, setDescuentoTipo] = useState<DescuentoTipo>("porcentaje");
  const [descuentoValor, setDescuentoValor] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchServicios().then(setServicios).catch(() => {});
  }, [open, fetchServicios]);

  const desglose = useMemo(() => {
    if (!checkin || !checkout || checkin >= checkout) return [];
    return tarifasPorNoche(checkin, checkout).map(n => ({
      fecha: n.fecha, tipo: n.tipo, precio: PRECIO_POR_TIPO[n.tipo],
    }));
  }, [checkin, checkout]);

  const noches = desglose.length;
  const subNoches = desglose.reduce((s, n) => s + n.precio, 0);
  const adicionalesSel = servicios.filter(s => sel.has(s.id));
  const subAd = adicionalesSel.reduce((s, a) => s + Number(a.precio), 0);
  const subtotal = subNoches + subAd;
  const descuentoMonto = computeDescuento(subtotal, descuentoTipo, descuentoValor);
  const total = subtotal - descuentoMonto;
  const tipoPrincipal = desglose.length > 0
    ? desglose.reduce((b, n) => PRECIO_POR_TIPO[n.tipo] > PRECIO_POR_TIPO[b.tipo] ? n : b).tipo
    : "domingo_jueves" as const;

  function buildWhatsAppUrl(codigo: string) {
    let phone = (whatsapp || "").replace(/\D/g, "");
    if (!phone.startsWith("57")) phone = "57" + phone.replace(/^0+/, "");
    const firstName = (nombre || "").trim().split(/\s+/)[0] || "";
    const horarios = getHorarios(chalet);
    const checkInLine = `📅 Check-in: ${checkin}${horarios ? ` a las ${horarios.checkIn}` : ""}`;
    const checkOutLine = `📅 Check-out: ${checkout}${horarios ? ` a las ${horarios.checkOut}` : ""}`;
    const lines: string[] = [];
    if (estado === "reservado") {
      lines.push(
        `¡Hola ${firstName}! 🎉`, ``,
        `Tu reserva en Chalet Suculento ha sido confirmada ✅`, ``,
      );
    } else {
      lines.push(
        `¡Hola ${firstName}! 👋`, ``,
        `Aquí tienes el detalle de tu cotización en Chalet Suculento:`, ``,
      );
    }
    lines.push(
      `📋 Código: ${codigo}`,
      `🏡 Chalet: ${chalet}`,
      checkInLine,
      checkOutLine,
      `🌙 Noches: ${noches}`,
    );
    if (adicionalesSel.length > 0) {
      lines.push("", "✨ Adicionales:");
      for (const a of adicionalesSel) {
        lines.push(`• ${a.nombre} — ${formatCOP(Number(a.precio))}`);
      }
    }
    if (descuentoMonto > 0) {
      lines.push("", `💰 Subtotal: ${formatCOP(subtotal)}`);
      lines.push(`🎁 Descuento: -${formatCOP(descuentoMonto)}`);
      lines.push(`✅ Total a pagar: ${formatCOP(total)}`);
    } else {
      lines.push("", `💰 Total: ${formatCOP(total)}`);
    }
    if (estado === "reservado") {
      lines.push("", "¡Te esperamos para una experiencia inolvidable! 🌲");
    }
    return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  async function onSubmit(sendWhatsApp = false) {
    if (!nombre.trim() || !whatsapp.trim()) { toast.error("Nombre y WhatsApp son requeridos"); return; }
    if (noches < 1) { toast.error("Selecciona check-in y check-out"); return; }
    setSaving(true);
    try {
      const res = await submit({
        data: {
          accessToken, chalet, fecha_checkin: checkin, fecha_checkout: checkout,
          noches, desglose, precio_noche_total: subNoches,
          tipo_tarifa_principal: tipoPrincipal,
          nombre, whatsapp, estado, notas: notas || undefined,
          adicionales: adicionalesSel.map(a => ({ adicional_id: a.id, precio_cobrado: Number(a.precio) })),
          descuento_tipo: descuentoValor > 0 ? descuentoTipo : null,
          descuento_valor: descuentoValor > 0 ? descuentoValor : 0,
        },
      });
      toast.success(`Reserva creada: ${res.codigo}`);
      if (sendWhatsApp) {
        window.open(buildWhatsAppUrl(res.codigo), "_blank", "noopener,noreferrer");
      }
      onCreated();
      onOpenChange(false);
      // reset
      setNombre(""); setWhatsapp(""); setCheckin(""); setCheckout(""); setNotas(""); setSel(new Set());
      setDescuentoTipo("porcentaje"); setDescuentoValor(0);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nueva reserva manual</DialogTitle></DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Chalet</Label>
            <select value={chalet} onChange={e => setChalet(e.target.value as ChaletName)}
              className="w-full mt-1 rounded-md border px-3 py-1.5 text-sm bg-white">
              {CHALETS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label>Check-in</Label>
            <Input type="date" value={checkin} onChange={e => setCheckin(e.target.value)} />
          </div>
          <div>
            <Label>Check-out</Label>
            <Input type="date" value={checkout} onChange={e => setCheckout(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>Nombre</Label>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>WhatsApp</Label>
            <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+57 300 000 0000" />
          </div>
          <div className="col-span-2">
            <Label>Estado inicial</Label>
            <div className="flex gap-2 mt-1">
              {(["cotizacion","reservado"] as const).map(s => (
                <Button key={s} type="button" size="sm"
                  variant={estado === s ? "default" : "outline"}
                  onClick={() => setEstado(s)}>{s}</Button>
              ))}
            </div>
          </div>
        </div>

        {desglose.length > 0 && (
          <div className="mt-2 rounded-lg border bg-stone-50 p-3 text-sm">
            <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Desglose ({noches} noches)</p>
            {desglose.map(n => (
              <div key={n.fecha} className="flex justify-between py-0.5">
                <span>{n.fecha} · <span className="text-stone-500">{LABEL_TIPO[n.tipo]}</span></span>
                <span className="tabular-nums">{formatCOP(n.precio)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 mt-2 border-t font-medium">
              <span>Alojamiento</span><span className="tabular-nums">{formatCOP(subNoches)}</span>
            </div>
          </div>
        )}

        {servicios.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Adicionales</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {servicios.map(s => {
                const checked = sel.has(s.id);
                return (
                  <label key={s.id} className={`flex items-center gap-2 p-2 rounded-md border text-sm cursor-pointer ${checked ? "bg-amber-50 border-amber-300" : "border-stone-200"}`}>
                    <input type="checkbox" checked={checked} onChange={() => {
                      const n = new Set(sel); if (checked) n.delete(s.id); else n.add(s.id); setSel(n);
                    }} />
                    <span className="flex-1">{s.nombre}</span>
                    <span className="tabular-nums text-xs text-stone-600">{formatCOP(Number(s.precio))}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-2">
          <Label>Notas internas (opcional)</Label>
          <Input value={notas} onChange={e => setNotas(e.target.value)} />
        </div>

        <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-center justify-between">
          <span className="text-sm font-medium">Total</span>
          <span className="text-lg font-semibold tabular-nums">{formatCOP(total)}</span>
        </div>

        <div className="flex flex-wrap justify-end gap-2 mt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSubmit(false)} disabled={saving}>{saving ? "Creando…" : "Crear reserva"}</Button>
          <Button
            onClick={() => onSubmit(true)}
            disabled={saving}
            className="bg-[#25D366] hover:bg-[#1ebe5d] text-white"
          >
            Enviar cotización por WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
