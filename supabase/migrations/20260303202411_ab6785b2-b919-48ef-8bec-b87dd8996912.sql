
CREATE TABLE public.categorias_medicamentos (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categorias_medicamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read categorias_medicamentos"
  ON public.categorias_medicamentos FOR SELECT TO authenticated
  USING (true);

CREATE TRIGGER update_categorias_medicamentos_updated_at
  BEFORE UPDATE ON public.categorias_medicamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
