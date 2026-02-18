import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um assistente médico especializado em gerar prontuários clínicos estruturados no formato SOAP a partir de transcrições de consultas médico-paciente.

REGRAS OBRIGATÓRIAS:
- Use linguagem médica formal, objetiva e concisa.
- Baseie-se EXCLUSIVAMENTE nas informações presentes na transcrição.
- NÃO invente dados, diagnósticos ou condutas que não foram mencionados.
- Se alguma informação não foi abordada na consulta, escreva "Não abordado nesta consulta."
- Organize o prontuário usando EXATAMENTE os subtítulos abaixo em Markdown.
- Cada seção deve conter texto corrido ou listas com marcadores (- item).

FORMATO DE SAÍDA (use exatamente estes subtítulos):

## Queixa Principal (QP)
Motivo principal que levou o paciente à consulta, em uma frase.

## História da Doença Atual (HDA)
Narrativa cronológica dos sintomas: início, duração, fatores de piora/melhora, intensidade, caráter, irradiação, sintomas associados.

## Antecedentes Pessoais (AP)
Doenças prévias, cirurgias, internações, condições crônicas mencionadas.

## Medicamentos em Uso
Lista de medicamentos que o paciente relata usar atualmente, com doses se mencionadas.

## Alergias
Alergias medicamentosas ou de outra natureza. Se o paciente nega alergias, registrar "Nega alergias medicamentosas."

## Revisão de Sistemas
Sintomas em outros sistemas mencionados durante a consulta.

## Exame Físico
Achados do exame físico mencionados pelo médico (sinais vitais, ausculta, palpação, etc.).

## Hipóteses / Avaliação
Diagnósticos ou hipóteses diagnósticas formuladas pelo médico.

## Plano / Conduta
Tratamento proposto, ajustes de medicação, orientações terapêuticas.

## Prescrições / Solicitações
Exames solicitados, prescrições de medicamentos, encaminhamentos.

## Orientações ao Paciente
Instruções dadas ao paciente (repouso, dieta, sinais de alerta, prazo de retorno).

## CID (opcional)
Código CID se mencionado explicitamente na consulta.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcription, patientName, chiefComplaint } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!transcription || typeof transcription !== "string" || transcription.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Transcrição muito curta ou ausente." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = `Gere o prontuário SOAP completo a partir da seguinte transcrição de consulta médica.

**Paciente:** ${patientName || "Não identificado"}
**Queixa Principal informada:** ${chiefComplaint || "Não informada"}

**Transcrição da consulta:**
${transcription}

Gere agora o prontuário SOAP completo seguindo o formato especificado.`;

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
    console.error("generate-soap error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
