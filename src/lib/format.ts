export function toLocalDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDateBR(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTimeBR(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatTimer(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatDateLongBR(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export function formatMedicationsForNote(medications: Array<{
  commercialName: string;
  concentration: string;
  presentation: string;
  isCompounded: boolean;
  compoundedFormula: string;
  usageInstructions: string;
}>): string {
  if (!medications.length) return "";
  return medications.map((m) => {
    if (m.isCompounded) {
      return `- Fórmula Manipulada — ${m.compoundedFormula || "sem descrição"}`;
    }
    const name = [m.commercialName, m.concentration, m.presentation].filter(Boolean).join(" ");
    return `- ${name} — ${m.usageInstructions || "sem posologia"}`;
  }).join("\n");
}
