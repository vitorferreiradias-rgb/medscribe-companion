import { getData } from "./store";

export interface ParsedIntent {
  intent: "agendar" | "remarcar" | "cancelar" | "nota" | "prescrever" | "buscar" | "navegar" | "desconhecido";
  patientName?: string;
  patientId?: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:MM
  freeText?: string;
  rawInput: string;
}

// --- Intent detection ---

const INTENT_PATTERNS: Array<{ intent: ParsedIntent["intent"]; pattern: RegExp }> = [
  { intent: "agendar", pattern: /\b(agendar|marcar\s+consulta|agendar\s+consulta|marcar\b(?!.*\bcomo\b))/i },
  { intent: "remarcar", pattern: /\b(remarcar|reagendar|mudar\s+hor[aá]rio|trocar\s+hor[aá]rio)/i },
  { intent: "cancelar", pattern: /\b(cancelar|desmarcar|cancelar\s+consulta)/i },
  { intent: "nota", pattern: /\b(anotar|anota|nota|lembrar|lembrete|lembrar\s+de)/i },
  { intent: "prescrever", pattern: /\b(prescrever|receita|renovar|suspender|prescri[çc][ãa]o)/i },
  { intent: "buscar", pattern: /\b(quando\s+[eé]|buscar|pesquisar|data\s+d[oea]|qual\s+evento|procurar)/i },
  { intent: "navegar", pattern: /\b(abrir|ir\s+para|mostrar|ver\s+|acessar)/i },
];

// --- Date extraction ---

function extractDate(text: string): string | undefined {
  const today = new Date();

  // "hoje"
  if (/\bhoje\b/i.test(text)) return fmt(today);

  // "amanhã" / "amanha"
  if (/\bamanh[ãa]\b/i.test(text)) return fmt(addDays(today, 1));

  // "depois de amanhã"
  if (/\bdepois\s+de\s+amanh[ãa]\b/i.test(text)) return fmt(addDays(today, 2));

  // Day of week
  const weekdays: Record<string, number> = {
    "domingo": 0, "segunda": 1, "terça": 2, "terca": 2, "quarta": 3,
    "quinta": 4, "sexta": 5, "sábado": 6, "sabado": 6,
  };
  for (const [name, dow] of Object.entries(weekdays)) {
    if (text.toLowerCase().includes(name)) {
      const diff = (dow - today.getDay() + 7) % 7 || 7;
      return fmt(addDays(today, diff));
    }
  }

  // "dia 15" or "dia 15/03"
  const diaMatch = text.match(/\bdia\s+(\d{1,2})(?:\/(\d{1,2}))?\b/i);
  if (diaMatch) {
    const day = parseInt(diaMatch[1]);
    const month = diaMatch[2] ? parseInt(diaMatch[2]) - 1 : today.getMonth();
    const d = new Date(today.getFullYear(), month, day);
    if (d < today) d.setFullYear(d.getFullYear() + 1);
    return fmt(d);
  }

  // "15/03" standalone
  const slashMatch = text.match(/\b(\d{1,2})\/(\d{1,2})\b/);
  if (slashMatch) {
    const day = parseInt(slashMatch[1]);
    const month = parseInt(slashMatch[2]) - 1;
    const d = new Date(today.getFullYear(), month, day);
    if (d < today) d.setFullYear(d.getFullYear() + 1);
    return fmt(d);
  }

  return undefined;
}

// --- Time extraction ---

function extractTime(text: string): string | undefined {
  // "14h" / "14h30" / "14 horas"
  let m = text.match(/\b(\d{1,2})\s*h\s*(\d{2})?\b/i);
  if (m) return `${m[1].padStart(2, "0")}:${m[2] || "00"}`;

  // "14:00" / "14:30"
  m = text.match(/\b(\d{1,2}):(\d{2})\b/);
  if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;

  // "às 14" / "as 14"
  m = text.match(/\b[àa]s?\s+(\d{1,2})\b/i);
  if (m) return `${m[1].padStart(2, "0")}:00`;

  return undefined;
}

// --- Patient matching ---

function matchPatient(text: string): { name: string; id: string } | undefined {
  const data = getData();
  const lower = text.toLowerCase();

  // Try exact match first, then partial (first name, last name)
  let best: { name: string; id: string; score: number } | undefined;

  for (const p of data.patients) {
    if (p.archived) continue;
    const pLower = p.name.toLowerCase();

    // Full name match
    if (lower.includes(pLower)) {
      return { name: p.name, id: p.id };
    }

    // First name match
    const firstName = pLower.split(" ")[0];
    if (firstName.length >= 3 && lower.includes(firstName)) {
      const score = firstName.length;
      if (!best || score > best.score) {
        best = { name: p.name, id: p.id, score };
      }
    }
  }

  return best;
}

// --- Navigation routes ---

const NAV_ROUTES: Record<string, string> = {
  "agenda": "/agenda",
  "consultas": "/consultas",
  "pacientes": "/pacientes",
  "noticias": "/noticias",
  "notícias": "/noticias",
  "perfil": "/perfil",
  "inicio": "/agenda",
  "início": "/agenda",
  "home": "/agenda",
};

function extractRoute(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const [keyword, route] of Object.entries(NAV_ROUTES)) {
    if (lower.includes(keyword)) return route;
  }
  return undefined;
}

// --- Free text extraction ---

function extractFreeText(text: string, intent: string): string {
  // For notes: grab everything after the trigger word
  if (intent === "nota") {
    const m = text.match(/\b(?:anotar|anota|nota|lembrar|lembrete)[:\s]+(.+)/i);
    if (m) return m[1].trim();
  }
  // For search: grab the query
  if (intent === "buscar") {
    const m = text.match(/\b(?:quando\s+[eé]|buscar|pesquisar|data\s+d[oea]|qual\s+evento|procurar)[:\s]+(.+)/i);
    if (m) return m[1].trim();
    // fallback: return everything after intent keyword
    return text;
  }
  return text;
}

// --- Main parser ---

export function parseIntent(text: string): ParsedIntent {
  const trimmed = text.trim();
  if (!trimmed) return { intent: "desconhecido", rawInput: text };

  // Detect intent
  let detectedIntent: ParsedIntent["intent"] = "desconhecido";
  for (const { intent, pattern } of INTENT_PATTERNS) {
    if (pattern.test(trimmed)) {
      detectedIntent = intent;
      break;
    }
  }

  const result: ParsedIntent = {
    intent: detectedIntent,
    rawInput: text,
  };

  // Extract entities
  const patient = matchPatient(trimmed);
  if (patient) {
    result.patientName = patient.name;
    result.patientId = patient.id;
  }

  result.date = extractDate(trimmed);
  result.time = extractTime(trimmed);

  if (detectedIntent === "nota" || detectedIntent === "buscar") {
    result.freeText = extractFreeText(trimmed, detectedIntent);
  }

  if (detectedIntent === "navegar") {
    const route = extractRoute(trimmed);
    if (route) result.freeText = route;
  }

  // If no date specified for scheduling, default to today
  if ((detectedIntent === "agendar" || detectedIntent === "cancelar") && !result.date) {
    result.date = fmt(new Date());
  }

  return result;
}

// --- Helpers ---

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
