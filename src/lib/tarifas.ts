// Lógica de mapeo fecha → tipo_tarifa para Chalets Suculento.
//
// Reglas (en orden de precedencia):
//   1. Sábado                        → "sabado"
//   2. Viernes                       → "viernes"
//   3. Noche cuya MAÑANA SIGUIENTE   → "previa_festivo"
//      cae en un festivo colombiano
//      (y no es viernes/sábado)
//   4. Resto (domingo–jueves)        → "domingo_jueves"
//
// El "tipo_tarifa" representa la NOCHE que se cobra. Una noche del jueves
// previo a un viernes festivo cuenta como "previa_festivo"; el viernes festivo
// en sí sigue siendo "viernes" por la regla 2 (ya tiene su propia tarifa).
//
// Festivos colombianos: fijos + Ley Emiliani (se trasladan al lunes siguiente)
// + festivos móviles derivados de la Pascua.

export type TipoTarifa = "domingo_jueves" | "viernes" | "sabado" | "previa_festivo";

// ---------- utilidades de fecha (locales, sin TZ) ----------

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function dateFromYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function ymdFromDate(dt: Date): string {
  return ymd(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

function addDays(dt: Date, n: number): Date {
  const c = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  c.setDate(c.getDate() + n);
  return c;
}

// Traslada una fecha al lunes siguiente si no cae ya en lunes (Ley Emiliani).
function moveToNextMonday(dt: Date): Date {
  const dow = dt.getDay(); // 0=dom, 1=lun, ...
  const delta = dow === 1 ? 0 : (8 - dow) % 7;
  return addDays(dt, delta);
}

// ---------- Pascua (algoritmo gregoriano anónimo) ----------

function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=mar, 4=abr
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// ---------- festivos por año ----------

const _cache = new Map<number, Set<string>>();

export function colombianHolidays(year: number): Set<string> {
  const cached = _cache.get(year);
  if (cached) return cached;

  const set = new Set<string>();
  const add = (dt: Date) => set.add(ymdFromDate(dt));

  // Fijos (no se mueven)
  add(new Date(year, 0, 1));   // Año Nuevo
  add(new Date(year, 4, 1));   // Día del Trabajo
  add(new Date(year, 6, 20));  // Independencia
  add(new Date(year, 7, 7));   // Batalla de Boyacá
  add(new Date(year, 11, 8));  // Inmaculada Concepción
  add(new Date(year, 11, 25)); // Navidad

  // Ley Emiliani: se trasladan al lunes siguiente
  const emiliani = [
    new Date(year, 0, 6),   // Reyes Magos
    new Date(year, 2, 19),  // San José
    new Date(year, 5, 29),  // San Pedro y San Pablo
    new Date(year, 7, 15),  // Asunción de la Virgen
    new Date(year, 9, 12),  // Día de la Raza
    new Date(year, 10, 1),  // Todos los Santos
    new Date(year, 10, 11), // Independencia de Cartagena
  ];
  emiliani.forEach((d) => add(moveToNextMonday(d)));

  // Móviles basados en la Pascua
  const easter = easterSunday(year);
  add(addDays(easter, -3)); // Jueves Santo (fijo)
  add(addDays(easter, -2)); // Viernes Santo (fijo)
  add(moveToNextMonday(addDays(easter, 39))); // Ascensión del Señor
  add(moveToNextMonday(addDays(easter, 60))); // Corpus Christi
  add(moveToNextMonday(addDays(easter, 68))); // Sagrado Corazón

  _cache.set(year, set);
  return set;
}

export function isColombianHoliday(date: Date | string): boolean {
  const dt = typeof date === "string" ? dateFromYmd(date) : date;
  return colombianHolidays(dt.getFullYear()).has(ymdFromDate(dt));
}

// ---------- mapeo principal ----------

/**
 * Devuelve el tipo_tarifa correspondiente a una noche.
 * `date` es la fecha de la noche (la noche que se cobra, no la del check-out).
 */
export function getTipoTarifa(date: Date | string): TipoTarifa {
  const dt = typeof date === "string" ? dateFromYmd(date) : date;
  const dow = dt.getDay(); // 0=dom .. 6=sáb

  if (dow === 6) return "sabado";
  if (dow === 5) return "viernes";

  // Previa de festivo: la mañana siguiente cae en festivo colombiano
  // (y la noche no es viernes ni sábado, ya filtrados arriba).
  if (isColombianHoliday(addDays(dt, 1))) return "previa_festivo";

  return "domingo_jueves";
}

/**
 * Calcula el tipo_tarifa para cada noche entre check-in (incluido) y
 * check-out (excluido). Útil para sumar el precio total de una reserva.
 */
export function tarifasPorNoche(
  checkIn: Date | string,
  checkOut: Date | string,
): Array<{ fecha: string; tipo: TipoTarifa }> {
  const start = typeof checkIn === "string" ? dateFromYmd(checkIn) : checkIn;
  const end = typeof checkOut === "string" ? dateFromYmd(checkOut) : checkOut;
  const out: Array<{ fecha: string; tipo: TipoTarifa }> = [];
  for (let d = new Date(start.getFullYear(), start.getMonth(), start.getDate()); d < end; d = addDays(d, 1)) {
    out.push({ fecha: ymdFromDate(d), tipo: getTipoTarifa(d) });
  }
  return out;
}
