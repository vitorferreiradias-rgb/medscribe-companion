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
    const { avaliacaoId, photoPaths, patientContext } = await req.json();

    if (!avaliacaoId || !photoPaths || photoPaths.length === 0) {
      return new Response(
        JSON.stringify({ error: "avaliacaoId and photoPaths are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update status to analyzing
    await supabase
      .from("avaliacoes_corporais")
      .update({ status: "analyzing" })
      .eq("id", avaliacaoId);

    // Get signed URLs for all photos
    const signedUrlResults = await Promise.all(
      photoPaths.map((path: string) =>
        supabase.storage.from("evolution-photos").createSignedUrl(path, 600)
      )
    );

    const failedUrls = signedUrlResults.filter((r) => r.error);
    if (failedUrls.length > 0) {
      await supabase
        .from("avaliacoes_corporais")
        .update({ status: "error", resultado_analise_ia: "Falha ao acessar fotos no storage." })
        .eq("id", avaliacaoId);

      return new Response(
        JSON.stringify({ error: "Failed to access one or more photos" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const signedUrls = signedUrlResults.map((r) => r.data!.signedUrl);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      await supabase
        .from("avaliacoes_corporais")
        .update({ status: "error", resultado_analise_ia: "IA não configurada." })
        .eq("id", avaliacaoId);

      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Você é um especialista em composição corporal. Analise estas fotos de diferentes ângulos da mesma pessoa como um conjunto único. Identifique padrões de gordura localizada, postura e evolução. Gere um relatório técnico consolidado.

Você receberá múltiplas fotos de DIFERENTES ÂNGULOS da MESMA pessoa, tiradas na MESMA data.

## INSTRUÇÕES

1. Identifique o ângulo de CADA foto (Frontal, Posterior, Lateral Direito, Lateral Esquerdo).
2. Combine as informações de TODOS os ângulos para gerar uma avaliação mais precisa.
3. Estruture o relatório conforme abaixo.

## RELATÓRIO TÉCNICO CONSOLIDADO

### Ângulos Identificados
Liste cada foto e seu ângulo.

### Análise por Região (consolidando todos os ângulos)

| Região | Observações |
|---|---|
| Rosto e Pescoço | ... |
| Braços | ... |
| Tronco e Peito | ... |
| Costas e Coluna | ... |
| Abdômen | ... |
| Cintura/Flancos | ... |
| Quadril e Glúteos | ... |
| Pernas | ... |
| Postura Geral | ... |
| Pele | ... |

### Padrões de Gordura Localizada
Identifique regiões com acúmulo de gordura, distribuição e padrão (androide/ginoide).

### Análise Postural
Avalie alinhamento, cifose, lordose, escoliose aparente, projeção de ombros/cabeça.

### Composição Corporal Estimada

| Parâmetro | Estimativa |
|---|---|
| Faixa de peso aparente | ex: 75-85kg |
| % gordura corporal estimado | ex: 20-25% |
| Biótipo predominante | ex: Mesomorfo |

### Score de Avaliação
Nota de 1 a 10 para a condição física geral e justificativa.

### Observações Clínicas
Pontos de atenção para o médico acompanhar.

### Recomendações
Sugestões baseadas nos achados visuais.

---

REGRAS:
- Seja objetivo, preciso e use linguagem médica adequada.
- NÃO faça diagnósticos definitivos — descreva achados visuais.
- Sempre forneça estimativas visuais de composição corporal.
- Combine dados de TODOS os ângulos disponíveis para maior precisão.
- Marque regiões não visíveis em nenhum ângulo como "Não avaliável".`;

    const imageContent = signedUrls.map((url: string) => ({
      type: "image_url",
      image_url: { url },
    }));

    const userContent = [
      {
        type: "text",
        text: `Analise estas ${signedUrls.length} fotos de diferentes ângulos da mesma pessoa e gere um relatório de composição corporal consolidado.${patientContext ? `\n\nContexto do paciente: ${patientContext}` : ""}`,
      },
      ...imageContent,
    ];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiRes.ok) {
      const status = aiRes.status;
      let errorMsg = "Falha na análise com IA";
      if (status === 429) errorMsg = "Limite de requisições excedido. Tente novamente em alguns minutos.";
      if (status === 402) errorMsg = "Créditos insuficientes para análise com IA.";

      console.error("AI error:", status, await aiRes.text());

      await supabase
        .from("avaliacoes_corporais")
        .update({ status: "error", resultado_analise_ia: errorMsg })
        .eq("id", avaliacaoId);

      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiRes.json();
    const analysis = aiData?.choices?.[0]?.message?.content || "Não foi possível gerar a análise.";

    // Save result
    await supabase
      .from("avaliacoes_corporais")
      .update({
        status: "completed",
        resultado_analise_ia: analysis,
        updated_at: new Date().toISOString(),
      })
      .eq("id", avaliacaoId);

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Consolidated analysis error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
