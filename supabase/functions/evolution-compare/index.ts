import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { beforeImagePath, afterImagePath, patientContext } = await req.json();

    if (!beforeImagePath || !afterImagePath) {
      return new Response(
        JSON.stringify({ error: "beforeImagePath and afterImagePath are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get signed URLs for both images
    const [beforeUrlResult, afterUrlResult] = await Promise.all([
      supabase.storage.from("evolution-photos").createSignedUrl(beforeImagePath, 600),
      supabase.storage.from("evolution-photos").createSignedUrl(afterImagePath, 600),
    ]);

    if (beforeUrlResult.error || afterUrlResult.error) {
      return new Response(
        JSON.stringify({ error: "Failed to access photos" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Você é um assistente médico especializado em análise visual de evolução clínica de pacientes.
Ao receber duas fotos (ANTES e DEPOIS) de um paciente, analise as diferenças visuais observáveis e forneça um relatório estruturado em português brasileiro.

Estruture sua resposta assim:

## Análise de Evolução

### Mudanças Observadas
- Liste as principais diferenças visuais entre as duas imagens
- Foque em aspectos clínicos relevantes (postura, volume, contorno, coloração da pele, etc.)

### Progresso
- Classifique o progresso observado: Melhora significativa / Melhora leve / Estável / Piora leve / Piora significativa

### Observações Clínicas
- Notas adicionais relevantes para o médico

Seja objetivo, preciso e use linguagem médica adequada. Não faça diagnósticos — apenas descreva as mudanças visuais observáveis.
Se não for possível avaliar (fotos de baixa qualidade, ângulos muito diferentes, etc.), informe isso claramente.`;

    const userContent: any[] = [
      {
        type: "text",
        text: `Analise a evolução do paciente comparando as duas fotos a seguir.${patientContext ? `\n\nContexto do paciente: ${patientContext}` : ""}\n\nA primeira imagem é o ANTES e a segunda é o DEPOIS.`,
      },
      {
        type: "image_url",
        image_url: { url: beforeUrlResult.data.signedUrl },
      },
      {
        type: "image_url",
        image_url: { url: afterUrlResult.data.signedUrl },
      },
    ];

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
          { role: "user", content: userContent },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiRes.ok) {
      const status = aiRes.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes para análise com IA." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI error:", status, await aiRes.text());
      return new Response(
        JSON.stringify({ error: "Falha na análise com IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiRes.json();
    const analysis = aiData?.choices?.[0]?.message?.content || "Não foi possível gerar a análise.";

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Evolution compare error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
