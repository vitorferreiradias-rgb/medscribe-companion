import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

// =============================================
// CLINICIAN
// =============================================
export function useClinician() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["clinician", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("clinicians")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// =============================================
// PATIENTS
// =============================================
export function usePatients() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["patients", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function usePatient(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });
}

export function useAddPatient() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (patient: {
      clinician_id: string;
      name: string;
      birth_date?: string | null;
      sex?: string | null;
      phone?: string | null;
      email?: string | null;
      notes?: string | null;
      cpf?: string | null;
      rg?: string | null;
      address_line?: string | null;
      cep?: string | null;
      children?: string[];
      pet_name?: string | null;
      referral_source?: string | null;
      diagnoses?: string[];
      drug_allergies?: string[];
    }) => {
      const { data, error } = await supabase.from("patients").insert(patient).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      toast({ title: "Paciente adicionado com sucesso." });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao adicionar paciente", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("patients").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patient", variables.id] });
    },
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("patients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      toast({ title: "Paciente excluído." });
    },
  });
}

// =============================================
// ENCOUNTERS
// =============================================
export function useEncounters(patientId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["encounters", patientId ?? "all"],
    queryFn: async () => {
      let query = supabase.from("encounters").select("*").order("started_at", { ascending: false });
      if (patientId) query = query.eq("patient_id", patientId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useAddEncounter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (encounter: {
      patient_id: string;
      clinician_id: string;
      started_at?: string;
      duration_sec?: number;
      status?: string;
      chief_complaint?: string;
      location?: string;
    }) => {
      const { data, error } = await supabase.from("encounters").insert(encounter).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["encounters"] });
    },
  });
}

export function useUpdateEncounter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("encounters").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["encounters"] });
    },
  });
}

export function useDeleteEncounter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("encounters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["encounters"] });
    },
  });
}

// =============================================
// NOTES
// =============================================
export function useNotes(encounterId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notes", encounterId ?? "all"],
    queryFn: async () => {
      let query = supabase.from("notes").select("*");
      if (encounterId) query = query.eq("encounter_id", encounterId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useAddNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (note: { encounter_id: string; template_id: string; sections: any }) => {
      const { data, error } = await supabase.from("notes").insert(note).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("notes").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

// =============================================
// TRANSCRIPTS
// =============================================
export function useTranscripts(encounterId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["transcripts", encounterId ?? "all"],
    queryFn: async () => {
      let query = supabase.from("transcripts").select("*");
      if (encounterId) query = query.eq("encounter_id", encounterId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useAddTranscript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (transcript: { encounter_id: string; source: string; content: any }) => {
      const { data, error } = await supabase.from("transcripts").insert(transcript).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transcripts"] });
    },
  });
}

// =============================================
// SCHEDULE EVENTS
// =============================================
export function useScheduleEvents(date?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["schedule_events", date ?? "all"],
    queryFn: async () => {
      let query = supabase.from("schedule_events").select("*").order("date").order("start_time");
      if (date) query = query.eq("date", date);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useAddScheduleEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (event: {
      date: string;
      start_time: string;
      end_time?: string | null;
      patient_id: string;
      clinician_id: string;
      type: string;
      status?: string;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase.from("schedule_events").insert(event).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedule_events"] });
    },
  });
}

export function useUpdateScheduleEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("schedule_events").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedule_events"] });
    },
  });
}

export function useDeleteScheduleEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedule_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedule_events"] });
    },
  });
}

// =============================================
// TIME BLOCKS
// =============================================
export function useTimeBlocks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["time_blocks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("time_blocks").select("*");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useAddTimeBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (block: {
      date: string;
      start_time: string;
      end_time: string;
      reason: string;
      recurrence: string;
      clinician_id: string;
    }) => {
      const { data, error } = await supabase.from("time_blocks").insert(block).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["time_blocks"] });
    },
  });
}

export function useDeleteTimeBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("time_blocks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["time_blocks"] });
    },
  });
}

// =============================================
// EVOLUTION PHOTOS
// =============================================
export function useEvolutionPhotos(patientId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["evolution_photos", patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const { data, error } = await supabase
        .from("evolution_photos")
        .select("*")
        .eq("patient_id", patientId)
        .order("date");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!patientId,
  });
}

export function useAddEvolutionPhoto() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({
      patientId,
      file,
      label,
      date,
      notes,
      weight,
    }: {
      patientId: string;
      file: File;
      label: string;
      date: string;
      notes?: string;
      weight?: number;
    }) => {
      // Upload file to storage
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${patientId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("evolution-photos")
        .upload(filePath, file, { upsert: false });
      if (uploadError) throw uploadError;

      // Insert record
      const { data, error } = await supabase.from("evolution_photos").insert({
        patient_id: patientId,
        date,
        label,
        image_path: filePath,
        notes: notes || null,
        weight: weight || null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["evolution_photos", variables.patientId] });
      toast({ title: "Foto de evolução adicionada." });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao adicionar foto", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteEvolutionPhoto() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, imagePath, patientId }: { id: string; imagePath: string; patientId: string }) => {
      // Delete from storage
      await supabase.storage.from("evolution-photos").remove([imagePath]);
      // Delete record
      const { error } = await supabase.from("evolution_photos").delete().eq("id", id);
      if (error) throw error;
      return patientId;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["evolution_photos", variables.patientId] });
      toast({ title: "Foto removida." });
    },
  });
}

// =============================================
// PRESCRIPTIONS
// =============================================
export function usePrescriptions(patientId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["prescriptions", patientId ?? "all"],
    queryFn: async () => {
      let query = supabase.from("prescriptions").select("*").order("created_at", { ascending: false });
      if (patientId) query = query.eq("patient_id", patientId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

// =============================================
// HELPER: Get signed URL for evolution photo
// =============================================
export function useEvolutionPhotoUrl(imagePath: string | undefined) {
  return useQuery({
    queryKey: ["evolution_photo_url", imagePath],
    queryFn: async () => {
      if (!imagePath) return null;
      const { data, error } = await supabase.storage
        .from("evolution-photos")
        .createSignedUrl(imagePath, 3600); // 1 hour
      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!imagePath,
    staleTime: 30 * 60 * 1000, // 30 min
  });
}
