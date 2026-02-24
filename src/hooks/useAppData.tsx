import * as React from "react";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { AppData, Patient, Encounter, Transcript, Note, ScheduleEvent, TimeBlock, Clinician } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const AppDataContext = createContext<AppData | null>(null);
const AppDataRefreshContext = createContext<() => void>(() => {});
const ClinicianIdContext = createContext<string>("");

const defaultSettings = {
  persistLocal: true,
  showSimulatedBanner: false,
  sessionSimulated: { isLoggedIn: true },
};

const emptyData: AppData = {
  clinicians: [],
  patients: [],
  encounters: [],
  transcripts: [],
  notes: [],
  scheduleEvents: [],
  timeBlocks: [],
  settings: defaultSettings,
};

// Map DB rows to app types (snake_case → camelCase)
function mapClinician(row: any): Clinician {
  return {
    id: row.id,
    name: row.name,
    specialty: row.specialty ?? "",
    crm: row.crm ?? "",
    cpf: row.cpf ?? undefined,
    email: row.email ?? undefined,
    clinicAddress: row.clinic_address ?? undefined,
    clinics: row.clinics ?? [],
  };
}

function mapPatient(row: any): Patient {
  return {
    id: row.id,
    name: row.name,
    birthDate: row.birth_date ?? undefined,
    sex: row.sex ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    notes: row.notes ?? undefined,
    archived: row.archived ?? false,
    cpf: row.cpf ?? undefined,
    rg: row.rg ?? undefined,
    addressLine: row.address_line ?? undefined,
    cep: row.cep ?? undefined,
    children: row.children ?? [],
    petName: row.pet_name ?? undefined,
    referralSource: row.referral_source ?? undefined,
    diagnoses: row.diagnoses ?? [],
    drugAllergies: row.drug_allergies ?? [],
    documents: [],
    evolutionPhotos: [],
  };
}

function mapEncounter(row: any): Encounter {
  return {
    id: row.id,
    patientId: row.patient_id,
    clinicianId: row.clinician_id,
    startedAt: row.started_at,
    endedAt: row.ended_at ?? undefined,
    durationSec: row.duration_sec ?? 0,
    status: row.status ?? "draft",
    chiefComplaint: row.chief_complaint ?? undefined,
    location: row.location ?? undefined,
    // noteId and transcriptId resolved below
    noteId: undefined,
    transcriptId: undefined,
  };
}

function mapNote(row: any): Note {
  return {
    id: row.id,
    encounterId: row.encounter_id,
    templateId: row.template_id ?? "default",
    sections: row.sections ?? [],
  };
}

function mapTranscript(row: any): Transcript {
  return {
    id: row.id,
    encounterId: row.encounter_id,
    source: row.source ?? "pasted",
    content: row.content ?? [],
  };
}

function mapScheduleEvent(row: any): ScheduleEvent {
  return {
    id: row.id,
    date: row.date,
    startTime: typeof row.start_time === "string" ? row.start_time.slice(0, 5) : row.start_time,
    endTime: row.end_time ? (typeof row.end_time === "string" ? row.end_time.slice(0, 5) : row.end_time) : undefined,
    patientId: row.patient_id,
    clinicianId: row.clinician_id,
    type: row.type ?? "primeira",
    status: row.status ?? "scheduled",
    notes: row.notes ?? undefined,
    encounterId: row.encounter_id ?? undefined,
  };
}

function mapTimeBlock(row: any): TimeBlock {
  return {
    id: row.id,
    date: row.date,
    startTime: typeof row.start_time === "string" ? row.start_time.slice(0, 5) : row.start_time,
    endTime: typeof row.end_time === "string" ? row.end_time.slice(0, 5) : row.end_time,
    reason: row.reason ?? "",
    recurrence: row.recurrence ?? "none",
    clinicianId: row.clinician_id,
  };
}

async function fetchAllData(userId: string): Promise<AppData> {
  try {
    const [
      { data: clinicians },
      { data: patients },
      { data: encounters },
      { data: notes },
      { data: transcripts },
      { data: scheduleEvents },
      { data: timeBlocks },
    ] = await Promise.all([
      supabase.from("clinicians").select("*").eq("user_id", userId),
      supabase.from("patients").select("*").order("name"),
      supabase.from("encounters").select("*").order("started_at", { ascending: false }),
      supabase.from("notes").select("*"),
      supabase.from("transcripts").select("*"),
      supabase.from("schedule_events").select("*").order("date").order("start_time"),
      supabase.from("time_blocks").select("*"),
    ]);

    const mappedNotes = (notes ?? []).map(mapNote);
    const mappedTranscripts = (transcripts ?? []).map(mapTranscript);

    // Resolve noteId/transcriptId on encounters
    const mappedEncounters = (encounters ?? []).map((row) => {
      const enc = mapEncounter(row);
      const note = mappedNotes.find((n) => n.encounterId === enc.id);
      const tr = mappedTranscripts.find((t) => t.encounterId === enc.id);
      if (note) enc.noteId = note.id;
      if (tr) enc.transcriptId = tr.id;
      return enc;
    });

    return {
      clinicians: (clinicians ?? []).map(mapClinician),
      patients: (patients ?? []).map(mapPatient),
      encounters: mappedEncounters,
      transcripts: mappedTranscripts,
      notes: mappedNotes,
      scheduleEvents: (scheduleEvents ?? []).map(mapScheduleEvent),
      timeBlocks: (timeBlocks ?? []).map(mapTimeBlock),
      settings: defaultSettings,
    };
  } catch (err) {
    console.error("Error fetching data:", err);
    return emptyData;
  }
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(emptyData);
  const [clinicianId, setClinicianId] = useState("");
  const refreshRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!user) { setData(emptyData); return; }
    const id = ++refreshRef.current;
    const fetched = await fetchAllData(user.id);
    if (id === refreshRef.current) {
      setData(fetched);
      if (fetched.clinicians.length > 0) {
        setClinicianId(fetched.clinicians[0].id);
      }
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Subscribe to realtime changes for key tables
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("app-data-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "patients" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "encounters" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "notes" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "schedule_events" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "time_blocks" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "transcripts" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "clinicians" }, () => refresh())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, refresh]);

  return (
    <AppDataContext.Provider value={data}>
      <AppDataRefreshContext.Provider value={refresh}>
        <ClinicianIdContext.Provider value={clinicianId}>
          {children}
        </ClinicianIdContext.Provider>
      </AppDataRefreshContext.Provider>
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) return emptyData;
  return ctx;
}

export function useRefreshData() {
  return useContext(AppDataRefreshContext);
}

export function useClinicianId() {
  return useContext(ClinicianIdContext);
}
