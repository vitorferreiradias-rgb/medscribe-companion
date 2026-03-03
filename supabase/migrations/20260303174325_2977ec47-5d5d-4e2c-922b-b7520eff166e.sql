ALTER TABLE public.evolution_photos
  ADD COLUMN IF NOT EXISTS height numeric NULL,
  ADD COLUMN IF NOT EXISTS waist_circumference numeric NULL,
  ADD COLUMN IF NOT EXISTS treatment_goal text NULL;