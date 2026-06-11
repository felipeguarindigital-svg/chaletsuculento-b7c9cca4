import { useState, useEffect, type ReactNode } from "react";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzRJzjQzJJEBdohrhSN-bkhRcwW9JmxOrK-WuMXtp8Ndbc3WcWOyR7Gjb8oaAvUMEOxXA/exec";

const WHATSAPP_NUMBER = "573013060013";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const MONTH_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// Cream/light palette tokens (aligned with site brand)
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
};

type Props = { chaletName?: string };

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

export default function ReservasSuculento({ chaletName = "Suculento" }: Props) {
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
    if (s && e && s > e) { const t = s; s = e; e = t; }
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
    if (ed && sd > ed) { const t = sd; sd = ed; ed = t; s = dateToKey(sd); e = dateToKey(ed); }
    let msg = `Hola, quiero reservar el chalet ${chaletName} 🌿\n\n`;
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
  if (startD && endD && startD > endD) { const t = startD; startD = endD; endD = t; }
  const nights = startD && endD ? Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const showForm = !!selectStart;

  return (
    <div style={{ fontFamily: "inherit" }}>
      {/* Calendar card */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 20,
        padding: "1.5rem",
        marginBottom: "1.25rem",
        boxShadow: "0 10px 40px -20px rgba(131,105,83,0.25)",
      }}>
        {/* Nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <NavBtn onClick={() => changeMonth(-1)}>‹</NavBtn>
          <span style={{ fontSize: 16, fontWeight: 500, color: C.text, fontFamily: "'Playfair Display', serif" }}>
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <NavBtn onClick={() => changeMonth(1)}>›</NavBtn>
        </div>

        {/* Weekdays */}
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
              const key = toKey(viewYear, viewMonth, d);
              const cls = getDayClass(key, viewYear, viewMonth, d);
              return (
                <div
                  key={key}
                  onClick={() => { if (cls !== "past" && cls !== "blocked") handleDayClick(key); }}
                  title={cls === "blocked" ? "No disponible" : undefined}
                  style={getDayStyle(cls)}
                >
                  {d}
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div style={{ display: "flex", gap: "1.25rem", marginTop: 18, flexWrap: "wrap" }}>
          <LegendItem color={C.gold} label="Seleccionado" />
          <LegendItem color={C.blockedBg} border={C.blockedText} label="No disponible" />
          <LegendItem color="rgba(197,164,109,0.18)" border="rgba(197,164,109,0.4)" label="Rango" />
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: "1.5rem",
          boxShadow: "0 10px 40px -20px rgba(131,105,83,0.25)",
        }}>
          <div style={{
            background: C.surfaceAlt,
            border: `1px solid ${C.borderSoft}`,
            borderRadius: 12,
            padding: "14px 16px",
            textAlign: "center",
            color: C.text,
            fontSize: 14,
            marginBottom: "1.5rem",
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
          }}>
            {selectEnd
              ? `${fmtKey(dateToKey(startD!))} → ${fmtKey(dateToKey(endD!))} · ${nights} noche${nights !== 1 ? "s" : ""}`
              : `Llegada: ${fmtKey(selectStart)} — elige también tu fecha de salida`}
          </div>

          <Field label="NOMBRE COMPLETO">
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" type="text" />
          </Field>

          <Field label="TELÉFONO / WHATSAPP">
            <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+57 300 000 0000" type="tel" />
          </Field>

          {error && (
            <p style={{ color: C.error, fontSize: 13, marginBottom: 12 }}>{error}</p>
          )}

          <button
            onClick={enviarWhatsApp}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.goldDark)}
            onMouseLeave={(e) => (e.currentTarget.style.background = C.gold)}
            style={{
              width: "100%",
              background: C.gold,
              color: C.text,
              border: "none",
              padding: "16px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontFamily: "inherit",
              transition: "background 0.2s",
            }}
          >
            Enviar solicitud por WhatsApp
          </button>

          <p style={{ fontSize: 12, color: C.textMuted, textAlign: "center", marginTop: 12 }}>
            Te contactaremos por WhatsApp para confirmar disponibilidad y pago.
          </p>
        </div>
      )}
    </div>
  );
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
    case "blocked":
      return { ...base, background: C.blockedBg, color: C.blockedText, cursor: "not-allowed", textDecoration: "line-through" };
    case "past":
      return { ...base, color: "#c8c0b0", cursor: "not-allowed" };
    default:
      return { ...base, color: C.text, cursor: "pointer", background: C.surfaceAlt };
  }
}
