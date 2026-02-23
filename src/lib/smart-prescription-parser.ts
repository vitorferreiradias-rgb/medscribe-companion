// Smart Prescription Parser — extracts medication info from free text
// Designed to be replaced by an NLP API in the future

export type PrescriptionAction = "prescrever" | "renovar" | "suspender" | "continuar";

export interface ParsedPrescription {
  medicationName: string | null;
  concentration: string | null;
  dosage: string | null;
  duration: string | null;
  quantity: string | null;
  action: PrescriptionAction;
  note: string | null;
  rawText: string;
}

const ACTION_PATTERNS: { regex: RegExp; action: PrescriptionAction }[] = [
  { regex: /\b(suspender|suspend[aeo]|parar|retirar)\b/i, action: "suspender" },
  { regex: /\b(renovar|renova[rção]|repetir)\b/i, action: "renovar" },
  { regex: /\b(continuar|manter|mantenha)\b/i, action: "continuar" },
  { regex: /\b(prescrever|receitar|prescrev[aeo]|receit[aeo]|iniciar)\b/i, action: "prescrever" },
];

// Match concentration like "2,5 mg", "500mg", "0,25 mg/ml", "8/90 mg"
const CONCENTRATION_REGEX = /(\d+[.,\/]?\d*\s*(?:mg|g|ml|mcg|ui|mg\/ml|%)\b(?:\s*\/\s*\d+[.,]?\d*\s*(?:mg|g|ml))?)/i;

// Match dosage patterns like "1 cp 2x ao dia", "de 8/8 horas", "1x por semana"
const DOSAGE_REGEX = /(\d+\s*(?:cp|comp(?:rimido)?s?|cáp(?:sula)?s?|gota?s?|ml|aplicaç[ãõ]?(?:es)?)\s+(?:de\s+)?\d+[x\/]\s*(?:ao\s+dia|por\s+dia|por\s+semana|\/dia|\/semana|(?:em|a cada)\s+\d+\s*(?:horas?|h)))/i;

// Alternative dosage: "de 8/8 horas", "de 12/12 horas"
const DOSAGE_INTERVAL_REGEX = /(?:de\s+)?(\d+\/\d+\s*(?:horas?|h))/i;

// Match "1x ao dia", "2x ao dia", "1x por semana", "semanal"
const FREQUENCY_REGEX = /(\d+\s*[xX]\s*(?:ao\s+dia|por\s+dia|por\s+semana|\/dia|\/semana|semanal|diário))/i;

// Duration: "por 30 dias", "por 7 dias", "por 3 meses", "uso contínuo"
const DURATION_REGEX = /(?:por\s+)?(\d+\s*(?:dias?|semanas?|meses?|mes))|(\buso\s+cont[ií]nuo\b)/i;

// Quantity: "30 comprimidos", "21 cápsulas"
const QUANTITY_REGEX = /(\d+\s*(?:comprimidos?|cápsulas?|canetas?|frascos?|ampolas?|caixas?))/i;

// "porque X", "motivo: X", "pois X"
const NOTE_REGEX = /(?:porque|pois|motivo:?\s*)(.*)/i;

/**
 * Parse free-text prescription input into structured data
 * Pluggable: replace with NLP API in the future
 */
export function parsePrescriptionInput(text: string): ParsedPrescription {
  const raw = text.trim();

  // Detect action
  let action: PrescriptionAction = "prescrever";
  for (const ap of ACTION_PATTERNS) {
    if (ap.regex.test(raw)) {
      action = ap.action;
      break;
    }
  }

  // Extract concentration
  const concMatch = raw.match(CONCENTRATION_REGEX);
  const concentration = concMatch ? concMatch[1].trim() : null;

  // Extract dosage (full pattern or interval or frequency)
  const dosageMatch = raw.match(DOSAGE_REGEX);
  const intervalMatch = raw.match(DOSAGE_INTERVAL_REGEX);
  const freqMatch = raw.match(FREQUENCY_REGEX);
  const dosage = dosageMatch?.[1]?.trim() || intervalMatch?.[1]?.trim() || freqMatch?.[1]?.trim() || null;

  // Extract duration
  const durMatch = raw.match(DURATION_REGEX);
  const duration = durMatch ? (durMatch[2] || durMatch[1])?.trim() || null : null;

  // Extract quantity
  const qtyMatch = raw.match(QUANTITY_REGEX);
  const quantity = qtyMatch ? qtyMatch[1].trim() : null;

  // Extract note
  const noteMatch = raw.match(NOTE_REGEX);
  const note = noteMatch ? noteMatch[1].trim() : null;

  // Extract medication name — what's left after removing known patterns
  let nameCandidate = raw;
  // Remove action words
  for (const ap of ACTION_PATTERNS) {
    nameCandidate = nameCandidate.replace(ap.regex, "");
  }
  // Remove matched patterns
  if (concMatch) nameCandidate = nameCandidate.replace(concMatch[0], "");
  if (dosageMatch) nameCandidate = nameCandidate.replace(dosageMatch[0], "");
  if (intervalMatch && !dosageMatch) nameCandidate = nameCandidate.replace(intervalMatch[0], "");
  if (freqMatch && !dosageMatch) nameCandidate = nameCandidate.replace(freqMatch[0], "");
  if (durMatch) nameCandidate = nameCandidate.replace(durMatch[0], "");
  if (qtyMatch) nameCandidate = nameCandidate.replace(qtyMatch[0], "");
  if (noteMatch) nameCandidate = nameCandidate.replace(noteMatch[0], "");

  // Clean up
  nameCandidate = nameCandidate
    .replace(/\b(de|por|ao|para|com|em|se|do|da|na|no|uma?|o|a|e|ou)\b/gi, "")
    .replace(/[,;.!?()]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const medicationName = nameCandidate.length >= 2 ? nameCandidate : null;

  return {
    medicationName,
    concentration,
    dosage,
    duration,
    quantity,
    action,
    note,
    rawText: raw,
  };
}

/**
 * Detect if text contains prescription intent (for CommandBar)
 */
export function hasPrescriptionIntent(text: string): boolean {
  return /\b(prescrever|prescrição|receita|receitar|renovar|suspender|continuar\s+(?:com|uso))\b/i.test(text);
}
