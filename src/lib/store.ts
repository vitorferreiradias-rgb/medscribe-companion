import { Encounter, Patient, Transcript, Note, ScheduleEvent, TimeBlock, Clinician } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// ---- Listeners for triggering refresh ----
let _listeners: Array<() => void> = [];

export function subscribe(fn: () => void) {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter((l) => l !== fn); };
}

function notify() {
  _listeners.forEach((fn) => fn());
}

// ---- Compatibility shims ----
export function initStore() { return null; }
export function getData() { return null; }
export function resetToSeed() { console.warn("resetToSeed is deprecated with Cloud"); }
export function clearStorage() { console.warn("clearStorage is deprecated with Cloud"); }
export function updateSettings(_updates: any) { /* no-op */ }

// Helper: get current clinician id
async function getClinicianId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("clinicians").select("id").eq("user_id", user.id).maybeSingle();
  return data?.id ?? null;
}

// --- Patients ---
// Returns a Patient-like object synchronously after fire-and-forget insert
// The real data refresh happens via realtime subscription
export function addPatient(p: Omit<Patient, "id"> & { clinician_id?: string }): Patient {
  const tempId = `pat_${Date.now().toString(36)}`;
  const patient: Patient = { id: tempId, name: p.name, ...p };

  // Fire and forget
  (async () => {
    const clinicianId = p.clinician_id || await getClinicianId();
    if (!clinicianId) return;
    const { error } = await supabase.from("patients").insert({
      clinician_id: clinicianId,
      name: p.name,
      birth_date: p.birthDate || null,
      sex: p.sex || null,
      phone: p.phone || null,
      email: p.email || null,
      notes: p.notes || null,
      cpf: p.cpf || null,
      rg: p.rg || null,
      address_line: p.addressLine || null,
      cep: p.cep || null,
      children: p.children || [],
      pet_name: p.petName || null,
      referral_source: p.referralSource || null,
      diagnoses: p.diagnoses || [],
      drug_allergies: p.drugAllergies || [],
    });
    if (error) console.error("addPatient error:", error);
  })();

  return patient;
}

export function updatePatient(id: string, updates: Partial<Patient>) {
  const dbUpdates: Record<string, any> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.birthDate !== undefined) dbUpdates.birth_date = updates.birthDate || null;
  if (updates.sex !== undefined) dbUpdates.sex = updates.sex || null;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone || null;
  if (updates.email !== undefined) dbUpdates.email = updates.email || null;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
  if (updates.archived !== undefined) dbUpdates.archived = updates.archived;
  if (updates.cpf !== undefined) dbUpdates.cpf = updates.cpf || null;
  if (updates.rg !== undefined) dbUpdates.rg = updates.rg || null;
  if (updates.addressLine !== undefined) dbUpdates.address_line = updates.addressLine || null;
  if (updates.cep !== undefined) dbUpdates.cep = updates.cep || null;
  if (updates.children !== undefined) dbUpdates.children = updates.children || [];
  if (updates.petName !== undefined) dbUpdates.pet_name = updates.petName || null;
  if (updates.referralSource !== undefined) dbUpdates.referral_source = updates.referralSource || null;
  if (updates.diagnoses !== undefined) dbUpdates.diagnoses = updates.diagnoses || [];
  if (updates.drugAllergies !== undefined) dbUpdates.drug_allergies = updates.drugAllergies || [];

  if (Object.keys(dbUpdates).length > 0) {
    supabase.from("patients").update(dbUpdates).eq("id", id).then(({ error }) => {
      if (error) console.error("updatePatient error:", error);
    });
  }
}

export function deletePatient(id: string) {
  supabase.from("patients").delete().eq("id", id).then(({ error }) => {
    if (error) console.error("deletePatient error:", error);
  });
}

// --- Encounters ---
export function addEncounter(e: Omit<Encounter, "id">): Encounter {
  const tempId = `enc_${Date.now().toString(36)}`;
  const enc: Encounter = { id: tempId, ...e };

  // We need the real ID for navigation, so we use a promise-based approach
  // Store a resolver so callers can get the real ID
  const insertPromise = supabase.from("encounters").insert({
    patient_id: e.patientId,
    clinician_id: e.clinicianId,
    started_at: e.startedAt,
    ended_at: e.endedAt || null,
    duration_sec: e.durationSec,
    status: e.status,
    chief_complaint: e.chiefComplaint || null,
    location: e.location || null,
  }).select().single();

  // Attach promise to encounter for callers that need real ID
  (enc as any)._insertPromise = insertPromise;

  return enc;
}

// Async version for callers that need the real ID
export async function addEncounterAsync(e: Omit<Encounter, "id">): Promise<Encounter> {
  const { data, error } = await supabase.from("encounters").insert({
    patient_id: e.patientId,
    clinician_id: e.clinicianId,
    started_at: e.startedAt,
    ended_at: e.endedAt || null,
    duration_sec: e.durationSec,
    status: e.status,
    chief_complaint: e.chiefComplaint || null,
    location: e.location || null,
  }).select().single();

  if (error) console.error("addEncounter error:", error);
  return {
    id: data?.id ?? "",
    ...e,
  };
}

export function updateEncounter(id: string, updates: Partial<Encounter>) {
  const dbUpdates: Record<string, any> = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.endedAt !== undefined) dbUpdates.ended_at = updates.endedAt;
  if (updates.durationSec !== undefined) dbUpdates.duration_sec = updates.durationSec;
  if (updates.chiefComplaint !== undefined) dbUpdates.chief_complaint = updates.chiefComplaint;
  if (updates.location !== undefined) dbUpdates.location = updates.location;

  if (Object.keys(dbUpdates).length > 0) {
    supabase.from("encounters").update(dbUpdates).eq("id", id).then(({ error }) => {
      if (error) console.error("updateEncounter error:", error);
    });
  }
}

export function deleteEncounter(id: string) {
  supabase.from("encounters").delete().eq("id", id).then(({ error }) => {
    if (error) console.error("deleteEncounter error:", error);
  });
}

// --- Transcripts ---
export async function addTranscriptAsync(t: Omit<Transcript, "id">): Promise<Transcript> {
  const { data, error } = await supabase.from("transcripts").insert({
    encounter_id: t.encounterId,
    source: t.source,
    content: t.content as any,
  }).select().single();
  if (error) console.error("addTranscript error:", error);
  return { id: data?.id ?? "", ...t };
}

export function addTranscript(t: Omit<Transcript, "id">): Transcript {
  const tempId = `tr_${Date.now().toString(36)}`;
  supabase.from("transcripts").insert({
    encounter_id: t.encounterId,
    source: t.source,
    content: t.content as any,
  }).then(({ error }) => { if (error) console.error("addTranscript error:", error); });
  return { id: tempId, ...t };
}

// --- Notes ---
export async function addNoteAsync(n: Omit<Note, "id">): Promise<Note> {
  const { data, error } = await supabase.from("notes").insert({
    encounter_id: n.encounterId,
    template_id: n.templateId,
    sections: n.sections as any,
  }).select().single();
  if (error) console.error("addNote error:", error);
  return { id: data?.id ?? "", ...n };
}

export function addNote(n: Omit<Note, "id">): Note {
  const tempId = `note_${Date.now().toString(36)}`;
  supabase.from("notes").insert({
    encounter_id: n.encounterId,
    template_id: n.templateId,
    sections: n.sections as any,
  }).then(({ error }) => { if (error) console.error("addNote error:", error); });
  return { id: tempId, ...n };
}

export function updateNoteSection(noteId: string, sectionId: string, content: string) {
  (async () => {
    const { data: noteRow } = await supabase.from("notes").select("sections").eq("id", noteId).single();
    if (!noteRow) return;
    const sections = (noteRow.sections as any[]).map((s: any) =>
      s.id === sectionId ? { ...s, content, autoGenerated: false, lastEditedAt: new Date().toISOString() } : s
    );
    await supabase.from("notes").update({ sections: sections as any }).eq("id", noteId);
  })();
}

export function updateUnifiedNote(noteId: string, unifiedText: string) {
  (async () => {
    const { data: noteRow } = await supabase.from("notes").select("sections").eq("id", noteId).single();
    if (!noteRow) return;
    const sections = noteRow.sections as any[];
    const blocks = unifiedText.split(/^## /m).filter(Boolean);
    const now = new Date().toISOString();
    blocks.forEach((block) => {
      const newlineIdx = block.indexOf("\n");
      if (newlineIdx === -1) return;
      const title = block.substring(0, newlineIdx).trim();
      const content = block.substring(newlineIdx + 1).trim();
      const sec = sections.find((s: any) => s.title === title);
      if (sec) { sec.content = content; sec.autoGenerated = false; sec.lastEditedAt = now; }
    });
    await supabase.from("notes").update({ sections: sections as any }).eq("id", noteId);
  })();
}

// --- Schedule Events ---
export function addScheduleEvent(e: Omit<ScheduleEvent, "id">): ScheduleEvent {
  const tempId = `sch_${Date.now().toString(36)}`;
  supabase.from("schedule_events").insert({
    date: e.date,
    start_time: e.startTime,
    end_time: e.endTime || null,
    patient_id: e.patientId,
    clinician_id: e.clinicianId,
    type: e.type,
    status: e.status,
    notes: e.notes || null,
    encounter_id: e.encounterId || null,
  }).then(({ error }) => { if (error) console.error("addScheduleEvent error:", error); });
  return { id: tempId, ...e };
}

export function updateScheduleEvent(id: string, updates: Partial<ScheduleEvent>) {
  const dbUpdates: Record<string, any> = {};
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
  if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime || null;
  if (updates.patientId !== undefined) dbUpdates.patient_id = updates.patientId;
  if (updates.clinicianId !== undefined) dbUpdates.clinician_id = updates.clinicianId;
  if (updates.type !== undefined) dbUpdates.type = updates.type;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
  if (updates.encounterId !== undefined) dbUpdates.encounter_id = updates.encounterId || null;

  if (Object.keys(dbUpdates).length > 0) {
    supabase.from("schedule_events").update(dbUpdates).eq("id", id).then(({ error }) => {
      if (error) console.error("updateScheduleEvent error:", error);
    });
  }
}

export function deleteScheduleEvent(id: string) {
  supabase.from("schedule_events").delete().eq("id", id).then(({ error }) => {
    if (error) console.error("deleteScheduleEvent error:", error);
  });
}

// --- Duplicate Encounter (async) ---
export async function duplicateEncounter(encId: string): Promise<Encounter | null> {
  const { data: encRow } = await supabase.from("encounters").select("*").eq("id", encId).single();
  if (!encRow) return null;
  const now = new Date().toISOString();
  const newEnc = await addEncounterAsync({
    patientId: encRow.patient_id,
    clinicianId: encRow.clinician_id,
    startedAt: now,
    durationSec: 0,
    status: "draft",
    chiefComplaint: encRow.chief_complaint,
    location: encRow.location,
  });

  const { data: noteRows } = await supabase.from("notes").select("*").eq("encounter_id", encId);
  if (noteRows && noteRows.length > 0) {
    const original = noteRows[0];
    const sections = (original.sections as any[]).map((s: any) => ({
      ...s, id: `sec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      autoGenerated: false, lastEditedAt: now,
    }));
    await addNoteAsync({ encounterId: newEnc.id, templateId: original.template_id, sections });
  }
  return newEnc;
}

// --- Clinicians ---
export function updateClinician(id: string, updates: Partial<Clinician>) {
  const dbUpdates: Record<string, any> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.specialty !== undefined) dbUpdates.specialty = updates.specialty;
  if (updates.crm !== undefined) dbUpdates.crm = updates.crm;
  if (updates.cpf !== undefined) dbUpdates.cpf = updates.cpf;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.clinicAddress !== undefined) dbUpdates.clinic_address = updates.clinicAddress;
  if (updates.clinics !== undefined) dbUpdates.clinics = updates.clinics;

  if (Object.keys(dbUpdates).length > 0) {
    supabase.from("clinicians").update(dbUpdates).eq("id", id).then(({ error }) => {
      if (error) console.error("updateClinician error:", error);
    });
  }
}

// --- Time Blocks ---
export function addTimeBlock(tb: Omit<TimeBlock, "id">): TimeBlock {
  const tempId = `tb_${Date.now().toString(36)}`;
  supabase.from("time_blocks").insert({
    date: tb.date, start_time: tb.startTime, end_time: tb.endTime,
    reason: tb.reason, recurrence: tb.recurrence, clinician_id: tb.clinicianId,
  }).then(({ error }) => { if (error) console.error("addTimeBlock error:", error); });
  return { id: tempId, ...tb };
}

export function updateTimeBlock(id: string, updates: Partial<TimeBlock>) {
  const dbUpdates: Record<string, any> = {};
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
  if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
  if (updates.reason !== undefined) dbUpdates.reason = updates.reason;
  if (updates.recurrence !== undefined) dbUpdates.recurrence = updates.recurrence;
  if (updates.clinicianId !== undefined) dbUpdates.clinician_id = updates.clinicianId;

  if (Object.keys(dbUpdates).length > 0) {
    supabase.from("time_blocks").update(dbUpdates).eq("id", id).then(({ error }) => {
      if (error) console.error("updateTimeBlock error:", error);
    });
  }
}

export function deleteTimeBlock(id: string) {
  supabase.from("time_blocks").delete().eq("id", id).then(({ error }) => {
    if (error) console.error("deleteTimeBlock error:", error);
  });
}

// Synchronous version that uses pre-fetched data from useAppData
// Pages should use data.timeBlocks directly instead of calling this
export function getTimeBlocksForDate(dateStr: string, _clinicianId?: string): TimeBlock[] {
  // This is now a no-op placeholder. Pages using this should use timeBlocks from useAppData
  // and filter locally. We return empty to avoid breaking anything.
  return [];
}
