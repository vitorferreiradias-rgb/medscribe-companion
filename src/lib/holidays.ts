export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  type: "national" | "municipal";
}

/** Gauss algorithm for Easter Sunday */
function computeEaster(year: number): Date {
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
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

const municipalHolidays: Record<string, Array<{ month: number; day: number; name: string }>> = {
  "sao_paulo": [
    { month: 1, day: 25, name: "Aniversário de São Paulo" },
    { month: 7, day: 9, name: "Revolução Constitucionalista" },
    { month: 11, day: 20, name: "Consciência Negra" },
  ],
};

export function getHolidays(year: number, city: string = "sao_paulo"): Holiday[] {
  const easter = computeEaster(year);
  const holidays: Holiday[] = [
    // Fixed national
    { date: `${year}-01-01`, name: "Confraternização Universal", type: "national" },
    { date: `${year}-04-21`, name: "Tiradentes", type: "national" },
    { date: `${year}-05-01`, name: "Dia do Trabalho", type: "national" },
    { date: `${year}-09-07`, name: "Independência do Brasil", type: "national" },
    { date: `${year}-10-12`, name: "Nossa Senhora Aparecida", type: "national" },
    { date: `${year}-11-02`, name: "Finados", type: "national" },
    { date: `${year}-11-15`, name: "Proclamação da República", type: "national" },
    { date: `${year}-12-25`, name: "Natal", type: "national" },
    // Moveable
    { date: fmt(addDays(easter, -47)), name: "Carnaval", type: "national" },
    { date: fmt(addDays(easter, -2)), name: "Sexta-feira Santa", type: "national" },
    { date: fmt(easter), name: "Páscoa", type: "national" },
    { date: fmt(addDays(easter, 60)), name: "Corpus Christi", type: "national" },
  ];

  // Municipal
  const mun = municipalHolidays[city] ?? [];
  for (const h of mun) {
    const mm = String(h.month).padStart(2, "0");
    const dd = String(h.day).padStart(2, "0");
    holidays.push({ date: `${year}-${mm}-${dd}`, name: h.name, type: "municipal" });
  }

  return holidays.sort((a, b) => a.date.localeCompare(b.date));
}

/** Check if a date string is a holiday */
export function isHoliday(dateStr: string, holidays: Holiday[]): Holiday | undefined {
  return holidays.find((h) => h.date === dateStr);
}

/** Get holidays for a specific month */
export function getMonthHolidays(year: number, month: number, city?: string): Holiday[] {
  const mm = String(month + 1).padStart(2, "0");
  return getHolidays(year, city).filter((h) => h.date.startsWith(`${year}-${mm}`));
}
