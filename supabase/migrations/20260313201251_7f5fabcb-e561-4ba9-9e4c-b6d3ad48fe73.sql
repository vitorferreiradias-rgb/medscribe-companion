
CREATE TABLE public.patient_lab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  type text NOT NULL DEFAULT 'laboratorial',
  name text NOT NULL,
  result text NOT NULL,
  reference_range text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_lab_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access own patient lab results"
ON public.patient_lab_results
FOR ALL
TO authenticated
USING (
  patient_id IN (
    SELECT p.id FROM patients p
    JOIN clinicians c ON c.id = p.clinician_id
    WHERE c.user_id = auth.uid()
  )
);
