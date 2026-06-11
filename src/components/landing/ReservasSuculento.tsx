import { useState, useEffect, type ReactNode } from "react";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzRJzjQzJJEBdohrhSN-bkhRcwW9JmxOrK-WuMXtp8Ndbc3WcWOyR7Gjb8oaAvUMEOxXA/exec";

const WHATSAPP_NUMBER = "573013060013";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const MONTH_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

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

export default function ReservasSuculento() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [blocked, setBlocked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectStart, setSelectStart] = useState<string | null>(null);
  const [selectEnd, setSelectEnd] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(APPS_SCRIPT_URL)
      .then((r) => r.json())
      .then((data: unknown) => {
        setBlocked(Array.isArray(data) ? (data as string[]) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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

  function handleDayClick(key: string) {
    if (!selectStart || (selectStart && selectEnd)) {
      setSelectStart(key);
      setSelectEnd(null);
    } else {
      if (key === selectStart) {
        setSelectStart(null);
      } else {
        setSelectEnd(key);
      }
    }
    setError("");
  }

  function getDayClass(key: string, y: number, m: number, d: number) {
    if (isPast(y, m, d)) return "past";
    if (blocked.includes(key)) return "blocked";
    let s = selectStart ? keyToDate(selectStart) : null;
    let e = selectEnd ? keyToDate(selectEnd) : null;
    if (s && e && s > e) { let t = s; s = e; e = t; }
    const dt = new Date(y, m, d);
    if (selectStart === key) return "selected";
    if (selectEnd && dateToKey(e!) === key) return "selected-end";
    if (s && e && dt > s && dt < e) return "in-range";
    return "available";
  }

  function enviarWhatsApp() {
    if (!nombre.trim() || !telefono.trim()) {
      setError("Por favor completa tu nombre y teléfono.");
      return;
    }
    if (!selectStart) {
      setError("Por favor selecciona al menos una fecha.");
      return;
    }
    let s = selectStart, e = selectEnd;
    let sd = keyToDate(s), ed = e ? keyToDate(e) : null;
    if (ed && sd > ed) { let t = sd; sd = ed; ed = t; s = dateToKey(sd); e = dateToKey(ed); }
    let msg = `Hola, quiero reservar en Chalet Suculento 🌿\n\n`;
    msg += `👤 Nombre: ${nombre.trim()}\n`;
    msg += `📱 Teléfono: ${telefono.trim()}\n`;
    msg += `📅 Llegada: ${fmtKey(s)}\n`;
    if (e) msg += `📅 Salida: ${fmtKey(e)}\n`;
    msg += `\n¡Quedo atento/a a la confirmación!`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  let startD = selectStart ? keyToDate(selectStart) : null;
  let endD = selectEnd ? keyToDate(selectEnd) : null;
  if (startD && endD && startD > endD) { let t = startD; startD = endD; endD = t; }
  const nights = startD && endD ? Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const showForm = !!selectStart;

  return (
    <section style={{
      background: "#111",
      padding: "5rem 1.5rem",
      fontFamily: "inherit",
    }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>

        {/* Header */}
        <p style={{ fontSize: 12, letterSpacing: "0.15em", color: "#a89070", textTransform: "uppercase", marginBottom: 8 }}>
          Disponibilidad
        </p>
        <h2 style={{ fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 400, color: "#f5f0e8", marginBottom: "2.5rem", lineHeight: 1.3 }}>
          Elige tu fecha y{" "}
          <em style={{ fontStyle: "italic", color: "#c9a96e" }}>reserva tu escapada.</em>
        </h2>

        {/* Calendar box */}
        <div style={{
          background: "#1a1a1a",
          border: "0.5px solid #2a2a2a",
          borderRadius: 16,
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}>
          {/* Nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <NavBtn onClick={() => changeMonth(-1)}>‹</NavBtn>
            <span style={{ fontSize: 15, fontWeight: 500, color: "#f5f0e8" }}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <NavBtn onClick={() => changeMonth(1)}>›</NavBtn>
          </div>

          {/* Weekdays */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
            {["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"].map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: 11, color: "#555", padding: "4px 0", letterSpacing: "0.06em" }}>{d}</div>
            ))}
          </div>

          {/* Days */}
          {loading ? (
            <div style={{ textAlign: "center", color: "#a89070", padding: "2rem", fontSize: 14 }}>
              Cargando disponibilidad...
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                const key = toKey(viewYear, viewMonth, d);
                const cls = getDayClass(key, viewYear, viewMonth, d);
                const styles = getDayStyle(cls);
                return (
                  <div
                    key={key}
                    onClick={() => {
                      if (cls !== "past" && cls !== "blocked") handleDayClick(key);
                    }}
                    title={cls === "blocked" ? "No disponible" : undefined}
                    style={styles}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div style={{ display: "flex", gap: "1.25rem", marginTop: 16, flexWrap: "wrap" }}>
            <LegendItem color="#c9a96e" label="Seleccionado" />
            <LegendItem color="#2a1a1a" border="#5a3a3a" label="No disponible" />
            <LegendItem color="rgba(201,169,110,0.15)" border="rgba(201,169,110,0.3)" label="Rango" />
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div style={{
            background: "#1a1a1a",
            border: "0.5px solid #2a2a2a",
            borderRadius: 16,
            padding: "1.5rem",
          }}>
            {/* Selected dates info */}
            <div style={{
              background: "#252525",
              border: "0.5px solid #3a3a3a",
              borderRadius: 8,
              padding: "12px 16px",
              textAlign: "center",
              color: "#c9a96e",
              fontSize: 14,
              marginBottom: "1.5rem",
            }}>
              {selectEnd
                ? `📅 ${fmtKey(dateToKey(startD!))} → ${fmtKey(dateToKey(endD!))} · ${nights} noche${nights !== 1 ? "s" : ""}`
                : `📅 Llegada: ${fmtKey(selectStart)} — elige también tu fecha de salida`}
            </div>

            <Field label="NOMBRE COMPLETO">
              <Input
                value={nombre}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                type="text"
              />
            </Field>

            <Field label="TELÉFONO / WHATSAPP">
              <Input
                value={telefono}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTelefono(e.target.value)}
                placeholder="+57 300 000 0000"
                type="tel"
              />
            </Field>

            {error && (
              <p style={{ color: "#e07070", fontSize: 13, marginBottom: 12 }}>{error}</p>
            )}

            <button
              onClick={enviarWhatsApp}
              style={{
                width: "100%",
                background: "#c9a96e",
                color: "#111",
                border: "none",
                padding: "16px",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 500,
                cursor: "pointer",
                letterSpacing: "0.04em",
                fontFamily: "inherit",
              }}
            >
              Enviar solicitud de reserva →
            </button>

            <p style={{ fontSize: 12, color: "#555", textAlign: "center", marginTop: 12 }}>
              Te contactaremos por WhatsApp para confirmar disponibilidad y pago.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function NavBtn({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "0.5px solid #3a3a3a",
        color: "#a89070",
        cursor: "pointer",
        borderRadius: "50%",
        width: 32,
        height: 32,
        fontSize: 18,
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
      <label style={{ fontSize: 11, color: "#a89070", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
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
        background: "#252525",
        border: "0.5px solid #3a3a3a",
        color: "#f5f0e8",
        padding: "12px 14px",
        borderRadius: 8,
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
        border: border ? `0.5px solid ${border}` : undefined,
      }} />
      <span style={{ fontSize: 11, color: "#666" }}>{label}</span>
    </div>
  );
}

function getDayStyle(cls: string) {
  const base = {
    textAlign: "center" as const,
    padding: "10px 4px",
    fontSize: 14,
    borderRadius: 6,
    border: "0.5px solid transparent",
    transition: "all 0.15s",
    userSelect: "none" as const,
  };
  switch (cls) {
    case "selected":
      return { ...base, background: "#c9a96e", color: "#111", fontWeight: 500, borderColor: "#c9a96e", cursor: "pointer" };
    case "selected-end":
      return { ...base, background: "#a07840", color: "#f5f0e8", borderColor: "#a07840", cursor: "pointer" };
    case "in-range":
      return { ...base, background: "rgba(201,169,110,0.15)", borderColor: "rgba(201,169,110,0.3)", color: "#c9a96e", cursor: "pointer" };
    case "blocked":
      return { ...base, background: "#2a1a1a", color: "#4a3a3a", cursor: "not-allowed", textDecoration: "line-through" as const };
    case "past":
      return { ...base, color: "#333", cursor: "not-allowed" };
    default:
      return { ...base, color: "#c8c0b0", cursor: "pointer" };
  }
}
