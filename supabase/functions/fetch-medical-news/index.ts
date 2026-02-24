import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_HOURS = 24;

const categoryPrompts: Record<string, string> = {
  hoje: `Você é um assistente médico especializado em notícias de saúde do Brasil. Gere 5 notícias médicas REAIS e RECENTES do Brasil, baseadas em fontes como SBC, Anvisa, CFM, Ministério da Saúde, INCA, Lancet. As notícias devem ser factuais, sobre eventos e publicações reais de 2025-2026. Categoria: notícias do dia / destaques gerais.

Retorne um JSON array com exatamente 5 objetos, cada um com:
- title: título da notícia (máximo 80 caracteres)
- summary: resumo de 1-2 frases (máximo 200 caracteres)
- source: sigla da fonte (ex: SBC, Anvisa, CFM, MS)
- url: URL real da instituição fonte
- published_at: data no formato DD/MM/YYYY`,

  diretrizes: `Você é um assistente médico. Gere 5 notícias sobre DIRETRIZES CLÍNICAS recentes no Brasil, baseadas em publicações reais de sociedades médicas como SBC, ABN, INCA, SBP, SBPT, CFM. Foque em atualizações de protocolos e guidelines de 2025-2026.

Retorne um JSON array com exatamente 5 objetos, cada um com:
- title: título (máximo 80 caracteres)
- summary: resumo de 1-2 frases (máximo 200 caracteres)
- source: sigla da fonte
- url: URL real da instituição
- published_at: data no formato DD/MM/YYYY`,

  medicacoes: `Você é um assistente médico. Gere 5 notícias sobre MEDICAÇÕES no Brasil: aprovações da Anvisa, recalls, novas indicações, alertas de interações medicamentosas, genéricos aprovados. Baseie-se em informações factuais de 2025-2026.

Retorne um JSON array com exatamente 5 objetos, cada um com:
- title: título (máximo 80 caracteres)
- summary: resumo de 1-2 frases (máximo 200 caracteres)
- source: sigla da fonte (ex: Anvisa, FDA, CFF)
- url: URL real da instituição
- published_at: data no formato DD/MM/YYYY`,

  eventos: `Você é um assistente médico. Gere 5 notícias sobre EVENTOS MÉDICOS no Brasil: congressos, simpósios, jornadas, workshops de 2025-2026. Inclua eventos de sociedades como SBCM, SBMFC, SOCESP, CBIS, SBC.

Retorne um JSON array com exatamente 5 objetos, cada um com:
- title: título do evento (máximo 80 caracteres)
- summary: resumo de 1-2 frases (máximo 200 caracteres)
- source: sigla da organização
- url: URL real da instituição
- published_at: data do evento no formato DD/MM/YYYY`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, force } = await req.json();

    if (!category || !categoryPrompts[category]) {
      return new Response(
        JSON.stringify({ error: "Invalid category. Use: hoje, diretrizes, medicacoes, eventos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache unless force refresh
    if (!force) {
      const cacheThreshold = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000).toISOString();
      const { data: cached } = await supabase
        .from("medical_news")
        .select("*")
        .eq("category", category)
        .gte("fetched_at", cacheThreshold)
        .order("fetched_at", { ascending: false })
        .limit(5);

      if (cached && cached.length > 0) {
        return new Response(JSON.stringify({ news: cached, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Call Google Gemini API
    const googleApiKey = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!googleApiKey) {
      return new Response(
        JSON.stringify({ error: "GOOGLE_AI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": googleApiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: categoryPrompts[category] }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API error:", errText);
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${geminiResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiResponse.json();
    const textContent = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      return new Response(
        JSON.stringify({ error: "Empty response from Gemini" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let newsItems: Array<{ title: string; summary: string; source: string; url: string; published_at: string }>;
    try {
      newsItems = JSON.parse(textContent);
    } catch {
      console.error("Failed to parse Gemini response:", textContent);
      return new Response(
        JSON.stringify({ error: "Invalid JSON from Gemini" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete old news for this category and insert new ones
    await supabase.from("medical_news").delete().eq("category", category);

    const rows = newsItems.map((item) => ({
      title: item.title,
      summary: item.summary,
      source: item.source,
      url: item.url || "",
      category,
      published_at: item.published_at,
      fetched_at: new Date().toISOString(),
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("medical_news")
      .insert(rows)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to cache news" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ news: inserted, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
