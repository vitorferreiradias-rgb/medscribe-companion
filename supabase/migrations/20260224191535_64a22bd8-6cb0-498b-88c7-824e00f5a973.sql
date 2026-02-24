
-- =============================================
-- CLINICIANS
-- =============================================
CREATE TABLE public.clinicians (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL DEFAULT '',
  crm TEXT NOT NULL DEFAULT '',
  cpf TEXT,
  email TEXT,
  clinic_address TEXT,
  clinics JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clinicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clinician profiles"
  ON public.clinicians FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clinician profiles"
  ON public.clinicians FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clinician profiles"
  ON public.clinicians FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- PATIENTS
-- =============================================
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinician_id UUID NOT NULL REFERENCES public.clinicians(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE,
  sex TEXT CHECK (sex IN ('M', 'F', 'O', 'NA')),
  phone TEXT,
  email TEXT,
  notes TEXT,
  archived BOOLEAN DEFAULT false,
  cpf TEXT,
  rg TEXT,
  address_line TEXT,
  cep TEXT,
  children TEXT[] DEFAULT '{}',
  pet_name TEXT,
  referral_source TEXT,
  diagnoses TEXT[] DEFAULT '{}',
  drug_allergies TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinicians can view own patients"
  ON public.patients FOR SELECT
  USING (clinician_id IN (SELECT id FROM public.clinicians WHERE user_id = auth.uid()));
CREATE POLICY "Clinicians can insert own patients"
  ON public.patients FOR INSERT
  WITH CHECK (clinician_id IN (SELECT id FROM public.clinicians WHERE user_id = auth.uid()));
CREATE POLICY "Clinicians can update own patients"
  ON public.patients FOR UPDATE
  USING (clinician_id IN (SELECT id FROM public.clinicians WHERE user_id = auth.uid()));
CREATE POLICY "Clinicians can delete own patients"
  ON public.patients FOR DELETE
  USING (clinician_id IN (SELECT id FROM public.clinicians WHERE user_id = auth.uid()));

-- =============================================
-- PATIENT DOCUMENTS (metadata only)
-- =============================================
CREATE TABLE public.patient_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('exame', 'laudo', 'imagem', 'outro')),
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access own patient documents"
  ON public.patient_documents FOR ALL
  USING (patient_id IN (
    SELECT p.id FROM public.patients p
    JOIN public.clinicians c ON c.id = p.clinician_id
    WHERE c.user_id = auth.uid()
  ));

-- =============================================
-- EVOLUTION PHOTOS
-- =============================================
CREATE TABLE public.evolution_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  label TEXT NOT NULL DEFAULT 'Registro',
  image_path TEXT NOT NULL,
  notes TEXT,
  weight NUMERIC(5,1),
  encounter_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.evolution_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access own evolution photos"
  ON public.evolution_photos FOR ALL
  USING (patient_id IN (
    SELECT p.id FROM public.patients p
    JOIN public.clinicians c ON c.id = p.clinician_id
    WHERE c.user_id = auth.uid()
  ));

-- =============================================
-- ENCOUNTERS
-- =============================================
CREATE TABLE public.encounters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinician_id UUID NOT NULL REFERENCES public.clinicians(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_sec INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('recording', 'draft', 'reviewed', 'final')),
  chief_complaint TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access own encounters"
  ON public.encounters FOR ALL
  USING (clinician_id IN (SELECT id FROM public.clinicians WHERE user_id = auth.uid()));

-- =============================================
-- TRANSCRIPTS
-- =============================================
CREATE TABLE public.transcripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'pasted' CHECK (source IN ('pasted', 'mock')),
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access own transcripts"
  ON public.transcripts FOR ALL
  USING (encounter_id IN (
    SELECT e.id FROM public.encounters e
    JOIN public.clinicians c ON c.id = e.clinician_id
    WHERE c.user_id = auth.uid()
  ));

-- =============================================
-- NOTES (clinical notes / prontuários)
-- =============================================
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL DEFAULT 'default',
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access own notes"
  ON public.notes FOR ALL
  USING (encounter_id IN (
    SELECT e.id FROM public.encounters e
    JOIN public.clinicians c ON c.id = e.clinician_id
    WHERE c.user_id = auth.uid()
  ));

-- =============================================
-- SCHEDULE EVENTS
-- =============================================
CREATE TABLE public.schedule_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinician_id UUID NOT NULL REFERENCES public.clinicians(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'primeira' CHECK (type IN ('primeira', 'retorno', 'procedimento')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'done', 'no_show', 'rescheduled')),
  notes TEXT,
  encounter_id UUID REFERENCES public.encounters(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access own schedule events"
  ON public.schedule_events FOR ALL
  USING (clinician_id IN (SELECT id FROM public.clinicians WHERE user_id = auth.uid()));

-- =============================================
-- TIME BLOCKS
-- =============================================
CREATE TABLE public.time_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  recurrence TEXT NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none', 'daily', 'weekly')),
  clinician_id UUID NOT NULL REFERENCES public.clinicians(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access own time blocks"
  ON public.time_blocks FOR ALL
  USING (clinician_id IN (SELECT id FROM public.clinicians WHERE user_id = auth.uid()));

-- =============================================
-- PRESCRIPTIONS
-- =============================================
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'simple' CHECK (type IN ('simple', 'special')),
  content TEXT NOT NULL DEFAULT '',
  medications JSONB NOT NULL DEFAULT '[]'::jsonb,
  signed BOOLEAN NOT NULL DEFAULT false,
  encounter_id UUID REFERENCES public.encounters(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  clinician_id UUID NOT NULL REFERENCES public.clinicians(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access own prescriptions"
  ON public.prescriptions FOR ALL
  USING (clinician_id IN (SELECT id FROM public.clinicians WHERE user_id = auth.uid()));

-- =============================================
-- CLINICAL DOCUMENTS
-- =============================================
CREATE TABLE public.clinical_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES public.encounters(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('prescricao', 'atestado', 'solicitacao_exames', 'orientacoes', 'outro')),
  title TEXT,
  content TEXT NOT NULL DEFAULT '',
  signed_at TIMESTAMPTZ,
  signed_by TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready_to_sign', 'signed')),
  recipe_type TEXT CHECK (recipe_type IN ('simples', 'antimicrobiano', 'controle_especial')),
  compliance JSONB,
  clinician_id UUID NOT NULL REFERENCES public.clinicians(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clinical_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access own clinical documents"
  ON public.clinical_documents FOR ALL
  USING (clinician_id IN (SELECT id FROM public.clinicians WHERE user_id = auth.uid()));

-- =============================================
-- STORAGE BUCKET for evolution photos
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('evolution-photos', 'evolution-photos', false);

CREATE POLICY "Authenticated users can upload evolution photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'evolution-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view own evolution photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'evolution-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own evolution photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'evolution-photos' AND auth.role() = 'authenticated');

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_clinicians_updated_at BEFORE UPDATE ON public.clinicians FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_encounters_updated_at BEFORE UPDATE ON public.encounters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_schedule_events_updated_at BEFORE UPDATE ON public.schedule_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_patients_clinician ON public.patients(clinician_id);
CREATE INDEX idx_encounters_patient ON public.encounters(patient_id);
CREATE INDEX idx_encounters_clinician ON public.encounters(clinician_id);
CREATE INDEX idx_schedule_events_date ON public.schedule_events(date);
CREATE INDEX idx_schedule_events_clinician ON public.schedule_events(clinician_id);
CREATE INDEX idx_evolution_photos_patient ON public.evolution_photos(patient_id);
CREATE INDEX idx_notes_encounter ON public.notes(encounter_id);
CREATE INDEX idx_transcripts_encounter ON public.transcripts(encounter_id);
