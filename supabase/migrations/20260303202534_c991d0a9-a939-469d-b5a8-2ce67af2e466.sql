
CREATE TABLE public.medicamentos (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome_comercial text NOT NULL,
  principio_ativo text NOT NULL,
  dosagem_padrao text NOT NULL,
  forma_administracao text NOT NULL,
  apresentacao text,
  indicacoes text,
  contraindicacoes text,
  interacoes text,
  efeitos_colaterais text,
  id_categoria integer NOT NULL REFERENCES public.categorias_medicamentos(id),
  id_tipo_receita integer NOT NULL REFERENCES public.tipos_receita(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_medicamentos_categoria ON public.medicamentos(id_categoria);
CREATE INDEX idx_medicamentos_tipo_receita ON public.medicamentos(id_tipo_receita);
CREATE INDEX idx_medicamentos_nome_comercial ON public.medicamentos(nome_comercial);

ALTER TABLE public.medicamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read medicamentos"
  ON public.medicamentos FOR SELECT TO authenticated
  USING (true);

CREATE TRIGGER update_medicamentos_updated_at
  BEFORE UPDATE ON public.medicamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
