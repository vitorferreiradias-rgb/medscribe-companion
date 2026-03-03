
CREATE TABLE public.medication_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinician_id uuid NOT NULL REFERENCES public.clinicians(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  date timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'prescrito',
  note text,
  encounter_id uuid REFERENCES public.encounters(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medication_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access own medication events"
  ON public.medication_events
  FOR ALL
  TO authenticated
  USING (clinician_id IN (
    SELECT clinicians.id FROM clinicians WHERE clinicians.user_id = auth.uid()
  ));
