const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fullAnalysis } = await req.json();

    if (!fullAnalysis) {
      return new Response(
        JSON.stringify({ error: "fullAnalysis is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Você é um especialista em composição corporal. Receba o relatório completo de avaliação corporal abaixo e gere uma versão RESUMIDA e OBJETIVA contendo:

## Formato do Resumo

### Dados Principais
Tabela com os números-chave: % gordura, massa gorda, massa magra, TMB, IMC, gordura visceral — apenas os valores estimados (sem margem de erro).

### Classificação
Uma linha com a classificação corporal e o score.

### Destaques
3-5 bullet points com os achados mais relevantes (positivos e pontos de atenção).

### Recomendações
2-3 recomendações prioritárias em bullet points.

REGRAS:
- Seja extremamente conciso — no máximo 1/3 do tamanho do relatório original.
- Mantenha apenas dados quantitativos e observações críticas.
- Use linguagem direta e profissional.
- Formate em Markdown com tabelas onde aplicável.
- NÃO repita a análise por região detalhada.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Gere o resumo objetivo do seguinte relatório:\n\n${fullAnalysis}` },
        ],
        temperature: 0.2,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      return new Response(
        JSON.stringify({ error: "Falha ao gerar resumo" }),
        { status: aiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiRes.json();
    const summary = aiData?.choices?.[0]?.message?.content || "Não foi possível gerar o resumo.";

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Summarize error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
