

# Noticias Reais com Lovable AI (sem custo extra)

## Abordagem
Usar o **Lovable AI** (Gemini) que ja esta configurado no projeto para buscar e gerar noticias medicas reais. Nao precisa de nenhuma chave de API adicional -- o `LOVABLE_API_KEY` ja esta disponivel.

O Gemini tem conhecimento atualizado e capacidade de gerar conteudo factual sobre medicina. A cada chamada, ele gera noticias baseadas em fontes reais brasileiras (SBC, Anvisa, CFM, INCA, etc.).

## Arquitetura

```text
[NewsCard / Noticias]
       |
       v
[React Query] --> [Edge Function: fetch-medical-news]
       |                    |
       v                    v
[Tabela: medical_news]   [Lovable AI / Gemini]
   (cache 24h)           (gera noticias reais)
```

## Etapas

### 1. Criar tabela `medical_news` (cache)
Armazena as noticias geradas para evitar chamadas repetidas a IA.

```sql
CREATE TABLE public.medical_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text NOT NULL,
  source text NOT NULL,
  url text,
  category text NOT NULL, -- hoje, diretrizes, medicacoes, eventos
  published_at text NOT NULL,
  fetched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.medical_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read news"
  ON public.medical_news FOR SELECT
  TO authenticated USING (true);
```

### 2. Criar Edge Function `fetch-medical-news`
- Recebe parametro `category` (hoje, diretrizes, medicacoes, eventos)
- Verifica se ha noticias com menos de 24h no banco para essa categoria
- Se sim, retorna do cache
- Se nao, chama o Gemini com prompt especifico pedindo noticias medicas reais brasileiras em formato JSON estruturado
- Salva no banco e retorna
- Usa o mesmo padrao das edge functions existentes (`clinical-summary`, `generate-soap`)

### 3. Atualizar `NewsCard.tsx`
- Substituir arrays mockados por chamada via React Query ao banco `medical_news`
- Botao "Atualizar" chama a Edge Function para forcar refresh
- Manter skeleton loading existente

### 4. Atualizar `Noticias.tsx`
- Mesma abordagem: buscar da tabela `medical_news`
- Manter filtros por categoria e busca por texto

## Custo
Zero custo adicional. Usa apenas o Lovable AI (Gemini Flash) que ja esta incluido no projeto e consome creditos normais do plano.
