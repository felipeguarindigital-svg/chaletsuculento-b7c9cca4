import { useState, useEffect, useMemo, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listServiciosAdicionales,
  crearCotizacion,
  getFechasBloqueadas,
  type ServicioAdicional,
} from "@/lib/reservas-external.functions";
import { tarifasPorNoche, type TipoTarifa } from "@/lib/tarifas";
import { PRECIO_POR_TIPO, LABEL_TIPO, formatCOP } from "@/lib/precios";

const WHATSAPP_NUMBER = "573013060013";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const MONTH_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const C = {
  surface: "#FFFFFF",
  surfaceAlt: "#F8F5EF",
  border: "rgba(197,164,109,0.35)",
  borderSoft: "rgba(26,26,26,0.08)",
  text: "#1a1a1a",
  textMuted: "#6b6357",
  gold: "#C5A46D",
  goldDark: "#9c7f4f",
  blockedBg: "#f1e6e6",
  blockedText: "#b89a9a",
  error: "#b3261e",
  success: "#2e7d32",
};

type ChaletName = "Suculento" | "Del Bosque" | "Cattleya" | "Ukiyo" | "Satori";

type Props = { chaletName?: ChaletName | string };

function toKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function keyToDate(k: string) {
  const [y, mo, d] = k.split("-").map(Number);
  return new Date(y, mo - 1, d);
}
function dateToKey(dt: Date) {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}
function fmtKey(k: string) {
  if (!k) return "";
  const [y, m, d] = k.split("-");
  return `${parseInt(d)} ${MONTH_SHORT[parseInt(m) - 1]} ${y}`;
}


// Tipo predominante de la estadía: el más caro (mayor precio_noche).
function tipoPredominante(noches: Array<{ tipo: TipoTarifa }>): TipoTarifa {
  if (noches.length === 0) return "domingo_jueves";
  return noches.reduce((best, n) =>
    PRECIO_POR_TIPO[n.tipo] > PRECIO_POR_TIPO[best.tipo] ? n : best,
  ).tipo;
}

export default function ReservasSuculento({ chaletName = "Suculento" }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [blocked, setBlocked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectStart, setSelectStart] = useState<string | null>(null);
  const [selectEnd, setSelectEnd] = useState<string | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Adicionales
  const [servicios, setServicios] = useState<ServicioAdicional[]>([]);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [expandido, setExpandido] = useState<string | null>(null);
  const [tabCategoria, setTabCategoria] = useState<"experiencias_decoraciones" | "alimentacion_adicionales">("experiencias_decoraciones");

  const fetchServicios = useServerFn(listServiciosAdicionales);
  const submitCotizacion = useServerFn(crearCotizacion);
  const fetchBloqueadas = useServerFn(getFechasBloqueadas);

  useEffect(() => {
    fetchServicios()
      .then((data) => setServicios(data))
      .catch((e) => console.error("[servicios_adicionales] error:", e));
  }, [fetchServicios]);

  useEffect(() => {
    setLoading(true);
    setBlocked([]);
    setSelectStart(null);
    setSelectEnd(null);
    setSeleccionados(new Set());
    setError("");

    let cancelled = false;
    fetchBloqueadas({ data: { chalet: chaletName as ChaletName } })
      .then((data) => {
        if (cancelled) return;
        setBlocked(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((e) => {
        console.error("[fechas_bloqueadas] error:", e);
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [chaletName, fetchBloqueadas]);

  function changeMonth(dir: number) {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setViewMonth(m);
    setViewYear(y);
  }

  function isPast(y: number, m: number, d: number) {
    return new Date(y, m, d) < today;
  }

  // ¿Hay alguna noche bloqueada en el rango [startKey, endKey) (excluye checkout)?
  function rangoTieneNocheBloqueada(startKey: string, endKey: string) {
    const s = keyToDate(startKey);
    const e = keyToDate(endKey);
    if (s >= e) return false;
    const cur = new Date(s);
    while (cur < e) {
      if (blocked.includes(dateToKey(cur))) return true;
      cur.setDate(cur.getDate() + 1);
    }
    return false;
  }

  function handleDayClick(key: string) {
    const isBlocked = blocked.includes(key);

    // Caso: no hay inicio o el rango ya está completo → iniciar nuevo rango.
    if (!selectStart || (selectStart && selectEnd)) {
      // Un día bloqueado NO puede ser check-in (esa noche ya está ocupada).
      if (isBlocked) {
        setError("Esa noche ya está ocupada. Elige otro día de llegada.");
        return;
      }
      setSelectStart(key);
      setSelectEnd(null);
      setError("");
      return;
    }

    // Ya hay inicio, falta fin.
    if (key === selectStart) {
      setSelectStart(null);
      setError("");
      return;
    }

    // El fin debe ser posterior al inicio.
    if (keyToDate(key) <= keyToDate(selectStart)) {
      // Reiniciar desde este día (solo si no está bloqueado).
      if (isBlocked) {
        setError("Esa noche ya está ocupada. Elige otro día de llegada.");
        return;
      }
      setSelectStart(key);
      setSelectEnd(null);
      setError("");
      return;
    }

    // Validar que ninguna noche intermedia [start, key) esté bloqueada.
    // (El día `key` es checkout y puede coincidir con una noche bloqueada.)
    if (rangoTieneNocheBloqueada(selectStart, key)) {
      setError("Este rango incluye noches no disponibles. Elige otro rango.");
      setSelectEnd(null);
      return;
    }

    setSelectEnd(key);
    setError("");
  }

  function getDayClass(key: string, y: number, m: number, d: number) {
    if (isPast(y, m, d)) return "past";
    const isBlocked = blocked.includes(key);
    let s = selectStart ? keyToDate(selectStart) : null;
    let e = selectEnd ? keyToDate(selectEnd) : null;
    if (s && e && s > e) { const t = s; s = e; e = t; }
    const dt = new Date(y, m, d);
    if (selectStart === key) return "selected";
    if (selectEnd && dateToKey(e!) === key) return "selected-end";
    if (s && e && dt > s && dt < e) return "in-range";
    // Preview de rango con hover cuando solo hay check-in seleccionado.
    if (selectStart && !selectEnd && hoverKey) {
      const startDt = keyToDate(selectStart);
      const hoverDt = keyToDate(hoverKey);
      if (hoverDt > startDt && dt > startDt && dt <= hoverDt
          && !rangoTieneNocheBloqueada(selectStart, key === hoverKey ? key : dateToKey(hoverDt))) {
        if (key === hoverKey) return "hover-end";
        return "in-range";
      }
    }
    if (isBlocked) {
      // Si ya hay un inicio válido anterior y el rango intermedio está libre,
      // este día bloqueado puede usarse como checkout.
      if (selectStart && !selectEnd && keyToDate(key) > keyToDate(selectStart)
          && !rangoTieneNocheBloqueada(selectStart, key)) {
        return "blocked-checkout";
      }
      return "blocked";
    }
    return "available";
  }

  // -------- Cálculos de fechas y precio --------
  let startD = selectStart ? keyToDate(selectStart) : null;
  let endD = selectEnd ? keyToDate(selectEnd) : null;
  if (startD && endD && startD > endD) { const t = startD; startD = endD; endD = t; }

  const checkInKey = startD ? dateToKey(startD) : null;
  const checkOutKey = endD ? dateToKey(endD) : null;
  const nights = startD && endD
    ? Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const desglose = useMemo(() => {
    if (!checkInKey || !checkOutKey || nights < 1) return [];
    return tarifasPorNoche(checkInKey, checkOutKey).map((n) => ({
      fecha: n.fecha,
      tipo: n.tipo,
      precio: PRECIO_POR_TIPO[n.tipo],
    }));
  }, [checkInKey, checkOutKey, nights]);

  const subtotalNoches = desglose.reduce((s, n) => s + n.precio, 0);
  const adicionalesSeleccionados = servicios.filter((s) => seleccionados.has(s.id));
  const subtotalAdicionales = adicionalesSeleccionados.reduce((s, a) => s + Number(a.precio), 0);
  const total = subtotalNoches + subtotalAdicionales;

  const showForm = nights >= 1;

  function toggleAdicional(id: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit(incluirAdicionales: boolean) {
    setError("");
    if (!nombre.trim() || !telefono.trim()) {
      setError("Por favor completa tu nombre y WhatsApp.");
      return;
    }
    if (!checkInKey || !checkOutKey || nights < 1) {
      setError("Selecciona fecha de llegada y de salida (mínimo 1 noche).");
      return;
    }
    if (rangoTieneNocheBloqueada(checkInKey, checkOutKey)) {
      setError("El rango seleccionado incluye noches no disponibles. Elige otro rango.");
      return;
    }

    setSubmitting(true);
    try {
      const adicionalesPayload = incluirAdicionales
        ? adicionalesSeleccionados.map((a) => ({
            servicio_id: a.id,
            precio_cobrado: Number(a.precio),
          }))
        : [];

      const tipoPrincipal = tipoPredominante(desglose);

      const res = await submitCotizacion({
        data: {
          chalet: chaletName as ChaletName,
          fecha_checkin: checkInKey,
          fecha_checkout: checkOutKey,
          noches: nights,
          desglose,
          precio_noche_total: subtotalNoches,
          tipo_tarifa_principal: tipoPrincipal,
          nombre,
          whatsapp: telefono,
          adicionales: adicionalesPayload,
        },
      });

      // Mensaje de WhatsApp
      const totalFinal = subtotalNoches + (incluirAdicionales ? subtotalAdicionales : 0);
      let msg = `Hola, quiero reservar el chalet ${chaletName} 🌿\n\n`;
      msg += `🔖 Código: ${res.codigo}\n`;
      msg += `👤 Nombre: ${nombre.trim()}\n`;
      msg += `📱 WhatsApp: ${telefono.trim()}\n`;
      msg += `📅 Llegada: ${fmtKey(checkInKey)}\n`;
      msg += `📅 Salida: ${fmtKey(checkOutKey)}\n`;
      msg += `🌙 ${nights} noche${nights !== 1 ? "s" : ""}\n\n`;
      msg += `💰 Alojamiento: ${formatCOP(subtotalNoches)}\n`;
      if (incluirAdicionales && adicionalesSeleccionados.length > 0) {
        msg += `\n✨ Adicionales:\n`;
        adicionalesSeleccionados.forEach((a) => {
          msg += `  • ${a.nombre} — ${formatCOP(Number(a.precio))}\n`;
        });
        msg += `Subtotal adicionales: ${formatCOP(subtotalAdicionales)}\n`;
      }
      msg += `\n*Total estimado: ${formatCOP(totalFinal)}*\n\n`;
      msg += `¡Quedo atento/a a la confirmación!`;

      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
        "_blank",
      );
    } catch (e) {
      console.error("[crearCotizacion] error:", e);
      setError(
        e instanceof Error
          ? `No se pudo registrar la cotización: ${e.message}`
          : "No se pudo registrar la cotización. Intenta de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  return (
    <div style={{ fontFamily: "inherit" }}>
      {/* Calendar card */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <NavBtn onClick={() => changeMonth(-1)}>‹</NavBtn>
          <span style={{ fontSize: 16, fontWeight: 500, color: C.text, fontFamily: "'Playfair Display', serif" }}>
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <NavBtn onClick={() => changeMonth(1)}>›</NavBtn>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
          {["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"].map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: 10, color: C.textMuted, padding: "6px 0", letterSpacing: "0.12em" }}>{d}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: C.textMuted, padding: "2rem", fontSize: 14 }}>
            Cargando disponibilidad...
          </div>
        ) : (
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}
            onMouseLeave={() => setHoverKey(null)}
            onTouchMove={(e) => {
              const t = e.touches[0];
              if (!t) return;
              const el = document.elementFromPoint(t.clientX, t.clientY) as HTMLElement | null;
              const k = el?.getAttribute("data-day-key");
              if (k) setHoverKey(k);
            }}
            onTouchEnd={() => setHoverKey(null)}
          >
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
              const key = toKey(viewYear, viewMonth, d);
              const cls = getDayClass(key, viewYear, viewMonth, d);
              const clickable = cls !== "past" && cls !== "blocked";
              return (
                <div
                  key={key}
                  data-day-key={key}
                  onClick={() => { if (clickable) handleDayClick(key); }}
                  onMouseEnter={() => { if (clickable) setHoverKey(key); }}
                  title={cls === "blocked" ? "Noche no disponible" : cls === "blocked-checkout" ? "Solo disponible como salida" : undefined}
                  style={getDayStyle(cls)}
                >
                  {d}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", gap: "1.25rem", marginTop: 18, flexWrap: "wrap" }}>
          <LegendItem color={C.gold} label="Llegada / Salida" />
          <LegendItem color={C.blockedBg} border={C.blockedText} label="No disponible" />
          <LegendItem color="rgba(197,164,109,0.18)" border="rgba(197,164,109,0.4)" label="Rango" />
        </div>

        <p style={{ marginTop: 12, fontSize: 13, color: selectStart && !selectEnd ? C.goldDark : C.textMuted, textAlign: "center", fontWeight: selectStart && !selectEnd ? 500 : 400 }}>
          {!selectStart && "Selecciona tu fecha de llegada"}
          {selectStart && !selectEnd && "Ahora selecciona tu fecha de salida"}
          {selectStart && selectEnd && `${nights} noche${nights !== 1 ? "s" : ""} · toca cualquier fecha para cambiar`}
        </p>
      </div>



      {/* Resumen y formulario */}
      {showForm && (
        <div style={cardStyle}>
          {/* Resumen de fechas + desglose */}
          <div style={summaryBox}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 16, marginBottom: 12 }}>
              {fmtKey(checkInKey!)} → {fmtKey(checkOutKey!)} · {nights} noche{nights !== 1 ? "s" : ""}
            </div>
            <div style={{ borderTop: `1px dashed ${C.border}`, paddingTop: 12 }}>
              {desglose.map((n) => (
                <div key={n.fecha} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
                  <span>{fmtKey(n.fecha)} · {LABEL_TIPO[n.tipo]}</span>
                  <span>{formatCOP(n.precio)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.borderSoft}`, fontWeight: 600, fontSize: 14 }}>
                <span>Alojamiento</span>
                <span>{formatCOP(subtotalNoches)}</span>
              </div>
            </div>
          </div>

          <Field label="NOMBRE COMPLETO">
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" type="text" />
          </Field>

          <Field label="WHATSAPP">
            <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+57 300 000 0000" type="tel" />
          </Field>

          {/* Adicionales */}
          {servicios.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: 11, color: C.textMuted, letterSpacing: "0.18em", display: "block", marginBottom: 10 }}>
                SERVICIOS ADICIONALES (OPCIONAL)
              </label>

              {/* Tabs de categoría */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 6,
                background: C.surfaceAlt,
                padding: 4,
                borderRadius: 12,
                border: `1px solid ${C.borderSoft}`,
                marginBottom: 12,
              }}>
                {([
                  { id: "experiencias_decoraciones", label: "✨ Experiencias" },
                  { id: "alimentacion_adicionales", label: "🍽️ Alimentación" },
                ] as const).map((tab) => {
                  const active = tabCategoria === tab.id;
                  const count = servicios.filter((s) => s.categoria === tab.id).length;
                  const sel = servicios.filter((s) => s.categoria === tab.id && seleccionados.has(s.id)).length;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setTabCategoria(tab.id)}
                      style={{
                        background: active ? C.surface : "transparent",
                        border: active ? `1px solid ${C.gold}` : "1px solid transparent",
                        color: active ? C.text : C.textMuted,
                        borderRadius: 8,
                        padding: "10px 8px",
                        fontSize: 12,
                        fontWeight: active ? 600 : 500,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.15s",
                        boxShadow: active ? "0 2px 8px -4px rgba(131,105,83,0.25)" : "none",
                      }}
                    >
                      {tab.label}
                      <span style={{ display: "block", fontSize: 10, marginTop: 2, color: active ? C.goldDark : C.textMuted, letterSpacing: "0.05em" }}>
                        {sel > 0 ? `${sel} de ${count} seleccionado${sel !== 1 ? "s" : ""}` : `${count} disponibles`}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {servicios
                  .filter((s) => s.categoria === tabCategoria)
                  .map((s) => {
                    const checked = seleccionados.has(s.id);
                    const isOpen = expandido === s.id;
                    return (
                      <div
                        key={s.id}
                        style={{
                          borderRadius: 14,
                          border: `1px solid ${checked ? C.gold : C.borderSoft}`,
                          background: checked ? "rgba(197,164,109,0.08)" : C.surface,
                          overflow: "hidden",
                          transition: "all 0.15s",
                        }}
                      >
                        <div style={{ display: "flex", gap: 12, padding: 10, alignItems: "center" }}>
                          <div style={{
                            width: 64,
                            height: 64,
                            borderRadius: 10,
                            flexShrink: 0,
                            background: s.imagen_url
                              ? `url(${s.imagen_url}) center/cover no-repeat`
                              : `linear-gradient(135deg, rgba(197,164,109,0.35) 0%, rgba(197,164,109,0.15) 50%, rgba(131,105,83,0.25) 100%)`,
                            display: "grid",
                            placeItems: "center",
                            fontSize: 24,
                            color: C.goldDark,
                          }}>
                            {!s.imagen_url && (s.categoria === "alimentacion_adicionales" ? "🍽️" : "✨")}
                          </div>

                          <button
                            type="button"
                            onClick={() => setExpandido(isOpen ? null : s.id)}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              background: "transparent",
                              border: "none",
                              padding: 0,
                              textAlign: "left",
                              cursor: "pointer",
                              fontFamily: "inherit",
                              color: C.text,
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                              <span style={{ fontWeight: 500, fontSize: 14, lineHeight: 1.25 }}>{s.nombre}</span>
                              <span style={{ color: C.goldDark, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                                {formatCOP(Number(s.precio))}
                              </span>
                            </div>
                            <div style={{
                              marginTop: 4,
                              fontSize: 11,
                              color: C.textMuted,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              letterSpacing: "0.03em",
                            }}>
                              <span>{isOpen ? "Ocultar detalles" : "Ver detalles"}</span>
                              <span style={{
                                display: "inline-block",
                                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                                transition: "transform 0.2s",
                                fontSize: 10,
                              }}>⌄</span>
                            </div>
                          </button>

                          <label style={{
                            display: "grid",
                            placeItems: "center",
                            width: 32,
                            height: 32,
                            cursor: "pointer",
                            flexShrink: 0,
                          }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleAdicional(s.id)}
                              style={{ width: 20, height: 20, accentColor: C.gold, cursor: "pointer" }}
                            />
                          </label>
                        </div>

                        {isOpen && (
                          <div style={{
                            padding: "12px 14px 14px",
                            borderTop: `1px dashed ${C.border}`,
                            background: "rgba(248,245,239,0.5)",
                          }}>
                            {s.descripcion_larga ? (
                              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.55, whiteSpace: "pre-line" }}>
                                {s.descripcion_larga}
                              </div>
                            ) : s.descripcion ? (
                              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.55 }}>
                                {s.descripcion}
                              </div>
                            ) : null}
                            {s.notas_adicionales && (
                              <div style={{
                                marginTop: 10,
                                padding: "8px 10px",
                                background: "rgba(197,164,109,0.10)",
                                border: `1px solid ${C.border}`,
                                borderRadius: 8,
                                fontSize: 11,
                                color: C.textMuted,
                                lineHeight: 1.5,
                                display: "flex",
                                gap: 6,
                                whiteSpace: "pre-line",
                              }}>
                                <span style={{ flexShrink: 0 }}>⚠️</span>
                                <span>{s.notas_adicionales}</span>
                              </div>
                            )}
                            <label style={{
                              marginTop: 12,
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              fontSize: 12,
                              color: C.text,
                              cursor: "pointer",
                            }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleAdicional(s.id)}
                                style={{ width: 18, height: 18, accentColor: C.gold, cursor: "pointer" }}
                              />
                              <span>{checked ? "Añadido a tu reserva" : "Añadir a mi reserva"}</span>
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {adicionalesSeleccionados.length > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 13, color: C.text }}>
                  <span>Subtotal adicionales ({adicionalesSeleccionados.length})</span>
                  <span style={{ fontWeight: 600 }}>{formatCOP(subtotalAdicionales)}</span>
                </div>
              )}
            </div>
          )}

          {/* Total */}
          <div style={{
            background: "rgba(197,164,109,0.12)",
            border: `1px solid ${C.gold}`,
            borderRadius: 12,
            padding: "14px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}>
            <span style={{ fontSize: 13, letterSpacing: "0.1em", color: C.text }}>TOTAL ESTIMADO</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: C.text }}>
              {formatCOP(total)}
            </span>
          </div>

          {error && (
            <p style={{ color: C.error, fontSize: 13, marginBottom: 12 }}>{error}</p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              onClick={() => submit(true)}
              disabled={submitting}
              style={primaryBtn(submitting)}
            >
              {submitting ? "Enviando..." : "Continuar a WhatsApp"}
            </button>

            {adicionalesSeleccionados.length > 0 && (
              <button
                onClick={() => submit(false)}
                disabled={submitting}
                style={secondaryBtn(submitting)}
              >
                Omitir adicionales y continuar
              </button>
            )}
          </div>

          <p style={{ fontSize: 12, color: C.textMuted, textAlign: "center", marginTop: 12 }}>
            Al continuar registramos tu cotización y abrimos WhatsApp para confirmar disponibilidad y pago.
          </p>
        </div>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 20,
  padding: "1.5rem",
  marginBottom: "1.25rem",
  boxShadow: "0 10px 40px -20px rgba(131,105,83,0.25)",
};

const summaryBox: React.CSSProperties = {
  background: C.surfaceAlt,
  border: `1px solid ${C.borderSoft}`,
  borderRadius: 12,
  padding: "14px 16px",
  color: C.text,
  fontSize: 14,
  marginBottom: "1.5rem",
};

function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    width: "100%",
    background: disabled ? "#d8c8a8" : C.gold,
    color: C.text,
    border: "none",
    padding: "16px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    fontFamily: "inherit",
    transition: "background 0.2s",
  };
}

function secondaryBtn(disabled: boolean): React.CSSProperties {
  return {
    width: "100%",
    background: "transparent",
    color: C.goldDark,
    border: `1px solid ${C.border}`,
    padding: "14px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    fontFamily: "inherit",
  };
}

function NavBtn({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: C.surfaceAlt,
        border: `1px solid ${C.border}`,
        color: C.goldDark,
        cursor: "pointer",
        borderRadius: "50%",
        width: 36,
        height: 36,
        fontSize: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <label style={{ fontSize: 11, color: C.textMuted, letterSpacing: "0.18em", display: "block", marginBottom: 8 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: "100%",
        boxSizing: "border-box",
        background: C.surfaceAlt,
        border: `1px solid ${C.borderSoft}`,
        color: C.text,
        padding: "14px 16px",
        borderRadius: 12,
        fontSize: 14,
        outline: "none",
        fontFamily: "inherit",
      }}
    />
  );
}

function LegendItem({ color, border, label }: { color: string; border?: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{
        width: 12, height: 12, borderRadius: 3,
        background: color,
        border: border ? `1px solid ${border}` : undefined,
      }} />
      <span style={{ fontSize: 11, color: C.textMuted, letterSpacing: "0.05em" }}>{label}</span>
    </div>
  );
}

function getDayStyle(cls: string): React.CSSProperties {
  const base: React.CSSProperties = {
    textAlign: "center",
    padding: "11px 4px",
    fontSize: 14,
    borderRadius: 8,
    border: "1px solid transparent",
    transition: "all 0.15s",
    userSelect: "none",
    fontFamily: "inherit",
  };
  switch (cls) {
    case "selected":
      return { ...base, background: C.gold, color: C.text, fontWeight: 500, borderColor: C.gold, cursor: "pointer" };
    case "selected-end":
      return { ...base, background: C.goldDark, color: "#fff", borderColor: C.goldDark, cursor: "pointer" };
    case "in-range":
      return { ...base, background: "rgba(197,164,109,0.18)", borderColor: "rgba(197,164,109,0.4)", color: C.text, cursor: "pointer" };
    case "hover-end":
      return { ...base, background: "rgba(197,164,109,0.35)", borderColor: C.gold, color: C.text, cursor: "pointer" };
    case "blocked":
      return { ...base, background: C.blockedBg, color: C.blockedText, cursor: "not-allowed", textDecoration: "line-through" };
    case "blocked-checkout":
      return {
        ...base,
        background: `linear-gradient(135deg, ${C.blockedBg} 0%, ${C.blockedBg} 50%, rgba(197,164,109,0.25) 50%, rgba(197,164,109,0.25) 100%)`,
        color: C.text,
        cursor: "pointer",
        borderColor: "rgba(197,164,109,0.4)",
      };
    case "past":
      return { ...base, color: "#c8c0b0", cursor: "not-allowed" };
    default:
      return { ...base, color: C.text, cursor: "pointer", background: C.surfaceAlt };
  }
}
