import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um assistente clínico especializado em medicina. Seu papel é analisar os dados de uma consulta médica e gerar um resumo estruturado para orientar a conduta da próxima consulta.

REGRAS:
- Use linguagem médica formal e objetiva.
- Organize o resumo nos subtítulos abaixo, cada um com texto explicativo breve.
- Não invente informações; baseie-se exclusivamente nos dados fornecidos.
- Se alguma informação estiver ausente, indique "Não informado".
- O texto deve ser conciso e direto, pronto para ser inserido no prontuário.

FORMATO DE SAÍDA (use exatamente estes subtítulos em Markdown):

## Resumo da Consulta Atual
Síntese breve do motivo da consulta, queixas principais e achados relevantes.

## Diagnósticos e Hipóteses
Lista dos diagnósticos confirmados ou hipóteses levantadas.

## Condutas Realizadas
Prescrições, solicitações de exames, orientações e encaminhamentos feitos nesta consulta.

## Medicações em Uso
Lista atualizada de todas as medicações (incluindo prescrições desta consulta e interconsultas).

## Pontos de Atenção para Próxima Consulta
Itens que devem ser reavaliados, exames pendentes, sinais de alerta e prazos de retorno.

## Orientações de Seguimento
Recomendações para acompanhamento entre as consultas (dieta, atividade física, monitoramento).`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { noteContent, patientName, chiefComplaint, medications, interconsultaMedications } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userPrompt = `Analise os seguintes dados da consulta e gere o resumo estruturado:

**Paciente:** ${patientName || "Não informado"}
**Queixa Principal:** ${chiefComplaint || "Não informado"}

**Conteúdo do Prontuário:**
${noteContent || "Sem prontuário disponível."}

**Medicações Prescritas nesta Consulta:**
${medications && medications.length > 0 ? medications.join("\n") : "Nenhuma."}

**Medicações de Interconsultas:**
${interconsultaMedications && interconsultaMedications.length > 0 ? interconsultaMedications.join("\n") : "Nenhuma."}

Gere agora o resumo estruturado para condução da próxima consulta.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("clinical-summary error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
