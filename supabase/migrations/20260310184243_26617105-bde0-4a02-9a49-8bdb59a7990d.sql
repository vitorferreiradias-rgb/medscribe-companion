
CREATE TABLE public.avaliacoes_corporais (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  photo_paths text[] NOT NULL DEFAULT '{}',
  angles text[] DEFAULT '{}',
  resultado_analise_ia text,
  status text NOT NULL DEFAULT 'pending',
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.avaliacoes_corporais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access own avaliacoes_corporais"
  ON public.avaliacoes_corporais
  FOR ALL
  TO authenticated
  USING (
    patient_id IN (
      SELECT p.id FROM patients p
      JOIN clinicians c ON c.id = p.clinician_id
      WHERE c.user_id = auth.uid()
    )
  );
