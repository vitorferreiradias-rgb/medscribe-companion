import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um assistente médico que gera orientações de uso de medicamentos e recomendações pós-consulta para PACIENTES. Use linguagem simples, acessível e acolhedora — evite termos técnicos sempre que possível.

REGRAS:
- Fale diretamente com o paciente usando "você".
- Use linguagem clara e cotidiana. Ex: "tomar 1 comprimido" em vez de "administrar 1 cp VO".
- Organize em seções bem definidas com emojis para facilitar a leitura.
- Se alguma informação não foi fornecida, omita a seção (não escreva "não informado").
- NÃO invente medicações ou doses que não foram fornecidas.

FORMATO DE SAÍDA (Markdown):

## 💊 Seus Medicamentos

| Medicamento | Como tomar | Horário sugerido | Cuidados |
|---|---|---|---|
(preencher com base nas medicações fornecidas)

## ⚠️ Sinais de Alerta
Lista de situações em que o paciente deve procurar atendimento médico imediato, baseadas nos diagnósticos e medicações.

## 📋 Recomendações Gerais
Orientações de dieta, repouso, atividade física e cuidados gerais conforme o contexto da consulta.

## 📅 Retorno
Informações sobre retorno, se mencionadas no prontuário.`;

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

    const userPrompt = `Gere as orientações ao paciente com base nos dados abaixo:

**Paciente:** ${patientName || "Paciente"}
**Queixa Principal:** ${chiefComplaint || "Não especificada"}

**Prontuário da Consulta:**
${noteContent || "Sem prontuário disponível."}

**Medicações Prescritas nesta Consulta:**
${medications && medications.length > 0 ? medications.join("\n") : "Nenhuma."}

**Medicações de Uso Contínuo / Interconsultas:**
${interconsultaMedications && interconsultaMedications.length > 0 ? interconsultaMedications.join("\n") : "Nenhuma."}

Gere agora as orientações em linguagem acessível para o paciente.`;

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
    console.error("patient-instructions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
