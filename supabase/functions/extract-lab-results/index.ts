import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um assistente médico especializado em interpretar laudos de exames laboratoriais e biópsias.

Ao receber uma imagem ou texto de um laudo, extraia TODOS os exames encontrados em formato estruturado.

Para cada exame, identifique:
- name: nome do exame (ex: "Hemoglobina glicada", "TSH", "Colesterol total")
- result: valor do resultado (ex: "7.2%", "3.5 mUI/L", "Positivo")
- reference_range: faixa de referência se disponível (ex: "< 5.7%", "0.4-4.0 mUI/L")
- type: "laboratorial" para exames de sangue/urina/etc, "biopsia" para resultados anatomopatológicos
- date: data do exame no formato YYYY-MM-DD se identificável no documento

Se a data não estiver visível, deixe como null.
Se a referência não estiver disponível, deixe como null.
Extraia TODOS os exames do documento, não apenas os principais.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, mimeType, textContent } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userContent: any[] = [
      { type: "text", text: "Extraia todos os exames deste documento de laudo médico." },
    ];

    if (imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` },
      });
    } else if (textContent) {
      userContent.push({ type: "text", text: `Conteúdo do documento:\n\n${textContent}` });
    } else {
      return new Response(JSON.stringify({ error: "Envie imageBase64 ou textContent" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_lab_results",
              description: "Retorna os exames extraídos do documento",
              parameters: {
                type: "object",
                properties: {
                  results: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Nome do exame" },
                        result: { type: "string", description: "Valor do resultado" },
                        reference_range: { type: ["string", "null"], description: "Faixa de referência" },
                        type: { type: "string", enum: ["laboratorial", "biopsia"], description: "Tipo do exame" },
                        date: { type: ["string", "null"], description: "Data no formato YYYY-MM-DD" },
                      },
                      required: ["name", "result", "type"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["results"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_lab_results" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido, tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para processamento de IA." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro ao processar documento" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "Não foi possível extrair exames do documento" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-lab-results error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
