
CREATE TABLE public.tipos_receita (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome text NOT NULL UNIQUE,
  cor text NOT NULL,
  descricao text NOT NULL,
  validade_dias integer NOT NULL,
  vias integer NOT NULL,
  uso text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tipos_receita ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read tipos_receita"
  ON public.tipos_receita FOR SELECT TO authenticated
  USING (true);

CREATE TRIGGER update_tipos_receita_updated_at
  BEFORE UPDATE ON public.tipos_receita
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
