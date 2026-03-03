import { supabase } from "@/integrations/supabase/client";

export interface MedicationEventRow {
  id: string;
  patient_id: string;
  clinician_id: string;
  medication_name: string;
  date: string;
  status: string;
  note: string | null;
  encounter_id: string | null;
  created_at: string;
}

export async function addMedicationEvent(event: {
  patientId: string;
  clinicianId: string;
  medicationName: string;
  date: string;
  status: "prescrito" | "suspenso" | "nao_renovado";
  note?: string;
  encounterId?: string;
}): Promise<MedicationEventRow | null> {
  const { data, error } = await supabase
    .from("medication_events" as any)
    .insert({
      patient_id: event.patientId,
      clinician_id: event.clinicianId,
      medication_name: event.medicationName,
      date: event.date,
      status: event.status,
      note: event.note || null,
      encounter_id: event.encounterId || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding medication event:", error);
    return null;
  }
  return data as unknown as MedicationEventRow;
}

export async function getMedicationHistoryForPatient(patientId: string): Promise<MedicationEventRow[]> {
  const { data, error } = await supabase
    .from("medication_events" as any)
    .select("*")
    .eq("patient_id", patientId)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error loading medication history:", error);
    return [];
  }
  return (data || []) as unknown as MedicationEventRow[];
}
