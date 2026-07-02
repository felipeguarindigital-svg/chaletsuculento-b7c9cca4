// Drawer de detalle de reserva con modo edición, cambios de estado y eliminación.
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getReservaDetail, updateEstadoReserva, updateNotasReserva, updateReserva,
  deleteReserva, listServiciosAdicionales, computeDescuento,
  type ReservaDetail, type EstadoReserva, type RolPanel, type ChaletName,
  type DescuentoTipo,
} from "@/lib/admin.functions";
import type { ServicioAdicional } from "@/lib/reservas-external.functions";
import { tarifasPorNoche } from "@/lib/tarifas";
import { PRECIO_POR_TIPO, formatCOP, LABEL_TIPO } from "@/lib/precios";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getHorarios } from "@/lib/horarios";
import { CHALETS, CHALET_COLOR, ESTADO_BADGE } from "./chalet-styles";
import { toast } from "sonner";

function buildWhatsAppConfirmUrl(d: ReservaDetail): string {
  let phone = (d.whatsapp || "").replace(/\D/g, "");
  if (!phone.startsWith("57")) phone = "57" + phone.replace(/^0+/, "");
  const firstName = (d.nombre || "").trim().split(/\s+/)[0] || "";
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
  ];
  if (d.descuento_monto > 0) {
    lines.push(
      `💰 Subtotal: ${formatCOP(d.subtotal)}`,
      `🎁 Descuento: -${formatCOP(d.descuento_monto)}`,
      `✅ Total a pagar: ${formatCOP(d.total)}`,
    );
  } else {
    lines.push(`💰 Total: ${formatCOP(d.total)}`);
  }
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

type PersonalizadoRow = {
  key: string; // key local para render
  nombre: string;
  descripcion: string;
  precio: number;
};

type EditState = {
  chalet: ChaletName;
  fecha: string;
  fecha_checkout: string;
  nombre: string;
  whatsapp: string;
  estado: EstadoReserva;
  selAdicionales: Set<string>;
  personalizados: PersonalizadoRow[];
  descuentoTipo: DescuentoTipo;
  descuentoValor: number;
};



export function ReservaDetailDrawer({ open, onOpenChange, reservaId, accessToken, rol, onChanged }: Props) {
  const getDetail = useServerFn(getReservaDetail);
  const setEstado = useServerFn(updateEstadoReserva);
  const setNotas = useServerFn(updateNotasReserva);
  const saveReserva = useServerFn(updateReserva);
  const fetchServicios = useServerFn(listServiciosAdicionales);
  const remove = useServerFn(deleteReserva);

  const [data, setData] = useState<ReservaDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [notas, setNotasLocal] = useState("");
  const [saving, setSaving] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [servicios, setServicios] = useState<ServicioAdicional[]>([]);

  const canEdit = rol === "administrador" || rol === "operador";
  const canDelete = rol === "administrador";

  useEffect(() => {
    if (!open || !reservaId) { setData(null); setEditMode(false); setEdit(null); return; }
    setLoading(true);
    setEditMode(false);
    getDetail({ data: { accessToken, id: reservaId } })
      .then(d => { setData(d); setNotasLocal(d.notas ?? ""); })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [open, reservaId, accessToken, getDetail]);

  // Cargar catálogo cuando se entra en modo edición.
  useEffect(() => {
    if (editMode && servicios.length === 0) {
      fetchServicios().then(setServicios).catch(() => {});
    }
  }, [editMode, fetchServicios, servicios.length]);

  // Recálculo de noches y desglose en modo edición.
  const desgloseEdit = useMemo(() => {
    if (!edit || !edit.fecha || !edit.fecha_checkout || edit.fecha >= edit.fecha_checkout) return [];
    return tarifasPorNoche(edit.fecha, edit.fecha_checkout).map(n => ({
      fecha: n.fecha, tipo: n.tipo, precio: PRECIO_POR_TIPO[n.tipo],
    }));
  }, [edit]);
  const nochesEdit = desgloseEdit.length;
  const subNochesEdit = desgloseEdit.reduce((s, n) => s + n.precio, 0);
  const tipoPrincipalEdit = desgloseEdit.length > 0
    ? desgloseEdit.reduce((b, n) => PRECIO_POR_TIPO[n.tipo] > PRECIO_POR_TIPO[b.tipo] ? n : b).tipo
    : "domingo_jueves" as const;
  const adicionalesSelEdit = edit
    ? servicios.filter(s => edit.selAdicionales.has(s.id))
    : [];
  const personalizadosEdit = edit?.personalizados ?? [];
  const personalizadosValidos = personalizadosEdit.filter(p => p.nombre.trim() && p.precio > 0);
  const subAdEdit = adicionalesSelEdit.reduce((s, a) => s + Number(a.precio), 0)
    + personalizadosValidos.reduce((s, p) => s + p.precio, 0);
  const subtotalEdit = subNochesEdit + subAdEdit;
  const descuentoMontoEdit = edit
    ? computeDescuento(subtotalEdit, edit.descuentoTipo, edit.descuentoValor)
    : 0;
  const totalEdit = subtotalEdit - descuentoMontoEdit;


  function entrarEdicion() {
    if (!data) return;
    const catalogoIds = data.adicionales
      .filter(a => !a.es_personalizado && a.adicional_id)
      .map(a => a.adicional_id as string);
    const pers: PersonalizadoRow[] = data.adicionales
      .filter(a => a.es_personalizado)
      .map((a, i) => ({
        key: `p-${i}-${a.id}`,
        nombre: a.nombre_personalizado ?? a.nombre ?? "",
        descripcion: a.descripcion_personalizada ?? "",
        precio: Number(a.precio_cobrado || 0),
      }));
    setEdit({
      chalet: data.chalet,
      fecha: data.fecha,
      fecha_checkout: data.fecha_checkout ?? "",
      nombre: data.nombre,
      whatsapp: data.whatsapp,
      estado: data.estado,
      selAdicionales: new Set(catalogoIds),
      personalizados: pers,
      descuentoTipo: (data.descuento_tipo ?? "porcentaje") as DescuentoTipo,
      descuentoValor: Number(data.descuento_valor ?? 0),
    });
    setEditMode(true);
  }


  function cancelarEdicion() {
    setEditMode(false);
    setEdit(null);
  }

  async function guardarEdicion() {
    if (!data || !edit) return;
    if (!edit.nombre.trim() || !edit.whatsapp.trim()) {
      toast.error("Nombre y WhatsApp son requeridos"); return;
    }
    if (nochesEdit < 1) { toast.error("Selecciona check-in y check-out válidos"); return; }
    setSaving(true);
    try {
      await saveReserva({
        data: {
          accessToken,
          id: data.id,
          patch: {
            chalet: edit.chalet,
            fecha: edit.fecha,
            fecha_checkout: edit.fecha_checkout,
            nombre: edit.nombre.trim(),
            whatsapp: edit.whatsapp.trim(),
            noches: nochesEdit,
            desglose_noches: desgloseEdit,
            precio_noche: subNochesEdit,
            tipo_tarifa: tipoPrincipalEdit,
            estado: edit.estado,
            descuento_tipo: edit.descuentoValor > 0 ? edit.descuentoTipo : null,
            descuento_valor: edit.descuentoValor > 0 ? edit.descuentoValor : 0,
          },

          adicionales: [
            ...adicionalesSelEdit.map(a => ({
              adicional_id: a.id,
              precio_cobrado: Number(a.precio),
            })),
            ...personalizadosValidos.map(p => ({
              adicional_id: null,
              precio_cobrado: p.precio,
              nombre_personalizado: p.nombre.trim(),
              descripcion_personalizada: p.descripcion.trim() || null,
            })),
          ],
        },
      });

      toast.success("Cambios guardados");
      // refrescar detalle
      const fresh = await getDetail({ data: { accessToken, id: data.id } });
      setData(fresh);
      setNotasLocal(fresh.notas ?? "");
      setEditMode(false);
      setEdit(null);
      onChanged();
    } catch (e: any) {
      toast.error(e.message ?? "No se pudo guardar");
    } finally { setSaving(false); }
  }

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
          <SheetTitle>{editMode ? "Editar reserva" : "Detalle de reserva"}</SheetTitle>
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

            {!editMode ? (
              <div className="rounded-lg border bg-stone-50 p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-stone-500">Chalet</span>
                  <span className={`px-2 py-0.5 rounded-md text-xs ${CHALET_COLOR[data.chalet].badge}`}>{data.chalet}</span>
                </div>
                <div className="flex justify-between"><span className="text-stone-500">Check-in</span><span>{data.fecha}{getHorarios(data.chalet) ? ` · ${getHorarios(data.chalet)!.checkIn}` : ""}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Check-out</span><span>{data.fecha_checkout ?? "—"}{data.fecha_checkout && getHorarios(data.chalet) ? ` · ${getHorarios(data.chalet)!.checkOut}` : ""}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Noches</span><span>{data.noches ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Tarifa</span><span>{LABEL_TIPO[data.tipo_tarifa]}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Origen</span><span>{data.origen}</span></div>
              </div>
            ) : (
              <div className="rounded-lg border bg-amber-50/50 p-3 space-y-3 text-sm">
                <div>
                  <Label className="text-xs">Chalet</Label>
                  <select
                    value={edit!.chalet}
                    onChange={e => setEdit({ ...edit!, chalet: e.target.value as ChaletName })}
                    className="w-full mt-1 rounded-md border px-3 py-1.5 text-sm bg-white"
                  >
                    {CHALETS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Check-in</Label>
                    <Input type="date" value={edit!.fecha}
                      onChange={e => setEdit({ ...edit!, fecha: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Check-out</Label>
                    <Input type="date" value={edit!.fecha_checkout}
                      onChange={e => setEdit({ ...edit!, fecha_checkout: e.target.value })} />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-stone-600 pt-1">
                  <span>Noches: <b>{nochesEdit}</b></span>
                  <span>Tarifa principal: <b>{LABEL_TIPO[tipoPrincipalEdit]}</b></span>
                </div>
                <div>
                  <Label className="text-xs">Estado</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(["cotizacion","reservado","cancelado"] as EstadoReserva[]).map(s => (
                      <Button
                        key={s}
                        type="button"
                        size="sm"
                        variant={edit!.estado === s ? "default" : "outline"}
                        onClick={() => setEdit({ ...edit!, estado: s })}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-stone-500">
                  Código <b>{data.codigo}</b> y origen <b>{data.origen}</b> no son editables.
                </div>

              </div>
            )}

            {!editMode ? (
              <div>
                <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Huésped</p>
                <p className="font-medium">{data.nombre}</p>
                <p className="font-mono text-xs text-stone-600">{data.whatsapp}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Nombre</Label>
                  <Input value={edit!.nombre}
                    onChange={e => setEdit({ ...edit!, nombre: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">WhatsApp</Label>
                  <Input value={edit!.whatsapp}
                    onChange={e => setEdit({ ...edit!, whatsapp: e.target.value })} />
                </div>
              </div>
            )}

            {!editMode && data.desglose_noches && data.desglose_noches.length > 0 && (
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

            {editMode && desgloseEdit.length > 0 && (
              <div>
                <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Desglose recalculado</p>
                <div className="rounded-lg border divide-y text-sm bg-stone-50">
                  {desgloseEdit.map(n => (
                    <div key={n.fecha} className="flex justify-between px-3 py-1.5">
                      <span>{n.fecha} · <span className="text-stone-500">{LABEL_TIPO[n.tipo]}</span></span>
                      <span className="tabular-nums">{formatCOP(n.precio)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between px-3 py-1.5 font-medium">
                    <span>Alojamiento</span><span className="tabular-nums">{formatCOP(subNochesEdit)}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Adicionales</p>
              {!editMode ? (
                data.adicionales.length === 0 ? (
                  <p className="text-sm text-stone-500">Sin adicionales</p>
                ) : (
                  <div className="rounded-lg border divide-y text-sm">
                    {data.adicionales.map(a => {
                      const catLabel = a.categoria === "experiencias_decoraciones"
                        ? "✨ Experiencias y Decoraciones"
                        : a.categoria === "alimentacion_adicionales"
                          ? "🍽️ Alimentación y Adicionales"
                          : "Sin categoría";
                      return (
                        <div key={a.id} className="flex items-start justify-between px-3 py-1.5 gap-3">
                          <div className="min-w-0">
                            <p className="truncate">{a.nombre ?? a.adicional_id}</p>
                            <p className="text-[11px] text-stone-500">{catLabel}</p>
                          </div>
                          <span className="tabular-nums whitespace-nowrap">{formatCOP(a.precio_cobrado)}</span>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                servicios.length === 0 ? (
                  <p className="text-sm text-stone-500">Cargando servicios…</p>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-3">
                    {([
                      ["experiencias_decoraciones", "✨ Experiencias y Decoraciones"],
                      ["alimentacion_adicionales", "🍽️ Alimentación y Adicionales"],
                    ] as const).map(([cat, label]) => {
                      const items = servicios.filter(s => s.categoria === cat);
                      if (items.length === 0) return null;
                      const selectedInCat = items.filter(s => edit!.selAdicionales.has(s.id)).length;
                      return (
                        <div key={cat}>
                          <p className="text-xs font-semibold text-amber-900 mb-1.5 flex items-center justify-between">
                            <span>{label}</span>
                            <span className="text-stone-500 font-normal">{selectedInCat} de {items.length}</span>
                          </p>
                          <div className="space-y-1.5">
                            {items.map(s => {
                              const checked = edit!.selAdicionales.has(s.id);
                              return (
                                <div key={s.id} className={`rounded-md border text-sm ${checked ? "bg-amber-50 border-amber-300" : "border-stone-200"}`}>
                                  <label className="flex items-center gap-2 p-2 cursor-pointer">
                                    <input type="checkbox" checked={checked} onChange={() => {
                                      const n = new Set(edit!.selAdicionales);
                                      if (checked) n.delete(s.id); else n.add(s.id);
                                      setEdit({ ...edit!, selAdicionales: n });
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
                    <p className="text-[11px] text-stone-500 mt-1">
                      Los adicionales nuevos se guardan al precio actual del catálogo.
                    </p>
                  </div>
                )
              )}
            </div>


            {/* Descuento */}
            {!editMode ? (
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm">
                <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Descuento (interno)</p>
                {data.descuento_monto > 0 ? (
                  <div className="space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Tipo</span>
                      <span>{data.descuento_tipo === "porcentaje" ? `${Number(data.descuento_valor ?? 0)}%` : "Valor fijo"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Subtotal</span>
                      <span className="tabular-nums">{formatCOP(data.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>Descuento</span>
                      <span className="tabular-nums">-{formatCOP(data.descuento_monto)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-stone-500">Sin descuento aplicado ($0 / 0%)</p>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 space-y-2">
                <p className="text-xs text-stone-500 uppercase tracking-wider">Descuento (interno)</p>
                <div className="flex flex-wrap gap-2">
                  {(["porcentaje","valor_fijo"] as DescuentoTipo[]).map(t => (
                    <Button
                      key={t}
                      type="button"
                      size="sm"
                      variant={edit!.descuentoTipo === t ? "default" : "outline"}
                      onClick={() => setEdit({ ...edit!, descuentoTipo: t })}
                    >
                      {t === "porcentaje" ? "% Porcentaje" : "$ Valor fijo"}
                    </Button>
                  ))}
                  <Input
                    type="number"
                    min={0}
                    value={edit!.descuentoValor}
                    onChange={e => setEdit({ ...edit!, descuentoValor: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-32"
                  />
                </div>
                {descuentoMontoEdit > 0 && (
                  <div className="flex justify-between text-xs text-stone-600">
                    <span>Subtotal: {formatCOP(subtotalEdit)}</span>
                    <span>Descuento: -{formatCOP(descuentoMontoEdit)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-center justify-between">
              <span className="text-sm font-medium">Total</span>
              <span className="text-lg font-semibold tabular-nums">
                {formatCOP(editMode ? totalEdit : data.total)}
              </span>
            </div>

            {!editMode && (
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
            )}

            {canEdit && !editMode && (
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

            {canEdit && !editMode && data.estado === "reservado" && (
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

            {canEdit && (
              <div className="pt-3 border-t flex flex-wrap gap-2">
                {!editMode ? (
                  <Button size="sm" variant="outline" onClick={entrarEdicion}>
                    Editar
                  </Button>
                ) : (
                  <>
                    <Button size="sm" onClick={guardarEdicion} disabled={saving}>
                      {saving ? "Guardando…" : "Guardar"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelarEdicion} disabled={saving}>
                      Cancelar edición
                    </Button>
                  </>
                )}
              </div>
            )}

            {canDelete && !editMode && (
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
