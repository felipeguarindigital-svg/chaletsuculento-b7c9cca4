// Diálogo "Nueva reserva manual". Calcula el desglose con tarifasPorNoche y
// permite elegir estado inicial (cotización o reservado).
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  crearReservaManual, listServiciosAdicionales,
  computeDescuento, checkDisponibilidadChalet,
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
  const checkDispo = useServerFn(checkDisponibilidadChalet);

  const [chalet, setChalet] = useState<ChaletName>("Suculento");
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [estado, setEstado] = useState<"cotizacion" | "reservado">("reservado");
  const [notas, setNotas] = useState("");
  const [servicios, setServicios] = useState<ServicioAdicional[]>([]);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [personalizados, setPersonalizados] = useState<Array<{ key: string; nombre: string; descripcion: string; precio: number }>>([]);
  const [descuentoTipo, setDescuentoTipo] = useState<DescuentoTipo>("porcentaje");
  const [descuentoValor, setDescuentoValor] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [conflicto, setConflicto] = useState(false);
  const [checkingDispo, setCheckingDispo] = useState(false);


  useEffect(() => {
    if (!open) return;
    fetchServicios().then(setServicios).catch(() => {});
  }, [open, fetchServicios]);

  useEffect(() => {
    if (!open) { setConflicto(false); return; }
    if (!chalet || !checkin || !checkout || checkin >= checkout) {
      setConflicto(false); return;
    }
    let cancelled = false;
    setCheckingDispo(true);
    checkDispo({ data: { accessToken, chalet, checkin, checkout } })
      .then(r => { if (!cancelled) setConflicto(r.conflicto); })
      .catch(() => { if (!cancelled) setConflicto(false); })
      .finally(() => { if (!cancelled) setCheckingDispo(false); });
    return () => { cancelled = true; };
  }, [open, chalet, checkin, checkout, accessToken, checkDispo]);

  const desglose = useMemo(() => {
    if (!checkin || !checkout || checkin >= checkout) return [];
    return tarifasPorNoche(checkin, checkout).map(n => ({
      fecha: n.fecha, tipo: n.tipo, precio: PRECIO_POR_TIPO[n.tipo],
    }));
  }, [checkin, checkout]);

  const noches = desglose.length;
  const subNoches = desglose.reduce((s, n) => s + n.precio, 0);
  const adicionalesSel = servicios.filter(s => sel.has(s.id));
  const personalizadosValidos = personalizados.filter(p => p.nombre.trim() && p.precio > 0);
  const subAd = adicionalesSel.reduce((s, a) => s + Number(a.precio), 0)
    + personalizadosValidos.reduce((s, p) => s + p.precio, 0);
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
    if (adicionalesSel.length > 0 || personalizadosValidos.length > 0) {
      lines.push("", "✨ Adicionales:");
      for (const a of adicionalesSel) {
        lines.push(`• ${a.nombre} — ${formatCOP(Number(a.precio))}`);
      }
      for (const p of personalizadosValidos) {
        lines.push(`• ${p.nombre.trim()} — ${formatCOP(p.precio)}`);
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
          adicionales: [
            ...adicionalesSel.map(a => ({ adicional_id: a.id, precio_cobrado: Number(a.precio) })),
            ...personalizadosValidos.map(p => ({
              adicional_id: null,
              precio_cobrado: p.precio,
              nombre_personalizado: p.nombre.trim(),
              descripcion_personalizada: p.descripcion.trim() || null,
            })),
          ],
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
      setPersonalizados([]);
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
          {conflicto && (
            <div className="col-span-2 rounded-md border border-red-300 bg-red-50 p-2.5 text-sm text-red-800">
              ⚠️ Este chalet ya tiene una reserva confirmada en estas fechas. Elige otras fechas o cambia el chalet.
            </div>
          )}
          {checkingDispo && !conflicto && chalet && checkin && checkout && checkin < checkout && (
            <div className="col-span-2 text-xs text-stone-500">Verificando disponibilidad…</div>
          )}
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
            <div className="max-h-72 overflow-y-auto space-y-3">
              {([
                ["experiencias_decoraciones", "✨ Experiencias y Decoraciones"],
                ["alimentacion_adicionales", "🍽️ Alimentación y Adicionales"],
              ] as const).map(([cat, label]) => {
                const items = servicios.filter(s => s.categoria === cat);
                if (items.length === 0) return null;
                const selectedInCat = items.filter(s => sel.has(s.id)).length;
                return (
                  <div key={cat}>
                    <p className="text-xs font-semibold text-amber-900 mb-1.5 flex items-center justify-between">
                      <span>{label}</span>
                      <span className="text-stone-500 font-normal">{selectedInCat} de {items.length}</span>
                    </p>
                    <div className="space-y-1.5">
                      {items.map(s => {
                        const checked = sel.has(s.id);
                        return (
                          <div key={s.id} className={`rounded-md border text-sm ${checked ? "bg-amber-50 border-amber-300" : "border-stone-200"}`}>
                            <label className="flex items-center gap-2 p-2 cursor-pointer">
                              <input type="checkbox" checked={checked} onChange={() => {
                                const n = new Set(sel); if (checked) n.delete(s.id); else n.add(s.id); setSel(n);
                              }} />
                              <span className="flex-1">{s.nombre}</span>
                              <span className="tabular-nums text-xs text-stone-600">{formatCOP(Number(s.precio))}</span>
                            </label>
                            {s.descripcion_larga && (
                              <details className="px-2 pb-2 -mt-1">
                                <summary className="text-[11px] text-amber-700 hover:underline cursor-pointer select-none">Ver descripción</summary>
                                <p className="text-[12px] text-stone-600 whitespace-pre-line mt-1">{s.descripcion_larga}</p>
                                {s.notas_adicionales && (
                                  <p className="text-[11px] text-amber-800 mt-1">⚠️ {s.notas_adicionales}</p>
                                )}
                              </details>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-2 pt-3 border-t border-dashed border-stone-300">
          <p className="text-xs font-semibold text-indigo-900 mb-2 flex items-center justify-between">
            <span>🛠️ Adicionales personalizados</span>
            <span className="text-stone-500 font-normal">Solo panel interno</span>
          </p>
          <div className="space-y-2">
            {personalizados.map((p, idx) => (
              <div key={p.key} className="rounded-md border border-indigo-200 bg-indigo-50/40 p-2 space-y-1.5">
                <div className="flex gap-2 items-start">
                  <Input
                    value={p.nombre}
                    placeholder="Nombre (ej: Torta de cumpleaños)"
                    onChange={e => {
                      const arr = [...personalizados];
                      arr[idx] = { ...p, nombre: e.target.value };
                      setPersonalizados(arr);
                    }}
                    className="text-sm h-8"
                  />
                  <Button
                    type="button" size="sm" variant="ghost"
                    onClick={() => setPersonalizados(personalizados.filter((_, i) => i !== idx))}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                    aria-label="Eliminar"
                  >
                    ×
                  </Button>
                </div>
                <Input
                  value={p.descripcion}
                  placeholder="Descripción (opcional)"
                  onChange={e => {
                    const arr = [...personalizados];
                    arr[idx] = { ...p, descripcion: e.target.value };
                    setPersonalizados(arr);
                  }}
                  className="text-sm h-8"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500">Precio:</span>
                  <Input
                    type="number" min={0} value={p.precio}
                    onChange={e => {
                      const arr = [...personalizados];
                      arr[idx] = { ...p, precio: Math.max(0, Number(e.target.value) || 0) };
                      setPersonalizados(arr);
                    }}
                    className="text-sm h-8 w-32"
                  />
                  <span className="text-xs text-stone-600 tabular-nums ml-auto">{formatCOP(p.precio)}</span>
                </div>
              </div>
            ))}
            <Button
              type="button" size="sm" variant="outline"
              onClick={() => setPersonalizados([
                ...personalizados,
                { key: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, nombre: "", descripcion: "", precio: 0 },
              ])}
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            >
              + Agregar otro
            </Button>
          </div>
        </div>


        <div className="mt-2">
          <Label>Notas internas (opcional)</Label>
          <Input value={notas} onChange={e => setNotas(e.target.value)} />
        </div>

        <div className="mt-2 rounded-lg border border-stone-200 bg-stone-50 p-3 space-y-2">
          <p className="text-xs text-stone-500 uppercase tracking-wider">Descuento (interno)</p>
          <div className="flex gap-2">
            {(["porcentaje","valor_fijo"] as DescuentoTipo[]).map(t => (
              <Button
                key={t}
                type="button"
                size="sm"
                variant={descuentoTipo === t ? "default" : "outline"}
                onClick={() => setDescuentoTipo(t)}
              >
                {t === "porcentaje" ? "% Porcentaje" : "$ Valor fijo"}
              </Button>
            ))}
            <Input
              type="number"
              min={0}
              value={descuentoValor}
              onChange={e => setDescuentoValor(Math.max(0, Number(e.target.value) || 0))}
              className="w-32"
            />
          </div>
          {descuentoMonto > 0 && (
            <div className="flex justify-between text-xs text-stone-600">
              <span>Subtotal: {formatCOP(subtotal)}</span>
              <span>Descuento: -{formatCOP(descuentoMonto)}</span>
            </div>
          )}
        </div>

        <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-center justify-between">
          <span className="text-sm font-medium">Total</span>
          <span className="text-lg font-semibold tabular-nums">{formatCOP(total)}</span>
        </div>

        <div className="flex flex-wrap justify-end gap-2 mt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSubmit(false)} disabled={saving || (conflicto && estado === "reservado")}>{saving ? "Creando…" : "Crear reserva"}</Button>
          <Button
            onClick={() => onSubmit(true)}
            disabled={saving || (conflicto && estado === "reservado")}
            className="bg-[#25D366] hover:bg-[#1ebe5d] text-white"
          >
            Enviar cotización por WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
