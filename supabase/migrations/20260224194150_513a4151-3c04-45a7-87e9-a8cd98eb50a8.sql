
-- Create medical_news table for caching AI-generated news
CREATE TABLE public.medical_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text NOT NULL,
  source text NOT NULL,
  url text,
  category text NOT NULL,
  published_at text NOT NULL,
  fetched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_news ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read news
CREATE POLICY "Authenticated users can read news"
  ON public.medical_news FOR SELECT
  TO authenticated USING (true);

-- Allow service role to manage news (edge function uses service role)
CREATE POLICY "Service role can manage news"
  ON public.medical_news FOR ALL
  TO service_role USING (true);

-- Index for cache lookups
CREATE INDEX idx_medical_news_category_fetched ON public.medical_news (category, fetched_at DESC);
