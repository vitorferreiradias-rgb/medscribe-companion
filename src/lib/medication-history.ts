import { MedicationEvent } from "@/types";

const STORAGE_KEY = "medscribe_medication_history";

export function loadMedicationHistory(): MedicationEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveMedicationHistory(events: MedicationEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function addMedicationEvent(event: Omit<MedicationEvent, "id">): MedicationEvent {
  const events = loadMedicationHistory();
  const newEvent: MedicationEvent = {
    id: `medhist_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    ...event,
  };
  events.push(newEvent);
  saveMedicationHistory(events);
  return newEvent;
}

export function getMedicationHistoryForPatient(patientId: string): MedicationEvent[] {
  return loadMedicationHistory()
    .filter((e) => e.patientId === patientId)
    .sort((a, b) => b.date.localeCompare(a.date));
}
