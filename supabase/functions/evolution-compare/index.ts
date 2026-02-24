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

    const systemPrompt = `Você é um assistente médico especializado em análise visual detalhada de evolução corporal de pacientes.
Ao receber duas fotos (ANTES e DEPOIS) de um paciente, realize uma análise minuciosa região por região e forneça um relatório estruturado em português brasileiro.

## PASSO 0 — Identificação de Ângulo (OBRIGATÓRIO)

Antes de qualquer análise, identifique o ângulo/perfil de CADA foto:
- **Frontal**: rosto, peito e abdômen visíveis
- **Posterior**: costas, escápulas e glúteos visíveis
- **Lateral direito / Lateral esquerdo**: perfil do corpo visível
- **¾ (três quartos)**: ângulo intermediário entre frontal e lateral

Declare os ângulos identificados no início do relatório:

> **Foto ANTES:** [ângulo identificado]
> **Foto DEPOIS:** [ângulo identificado]

⚠️ **Se os ângulos forem diferentes entre ANTES e DEPOIS**, alerte que a comparação direta é limitada e analise apenas as regiões visíveis em AMBAS as fotos. Regiões visíveis em apenas uma foto devem ser descritas individualmente, sem comparação evolutiva.

## PASSO 1 — Análise por Região

Analise APENAS as regiões visíveis no ângulo identificado. Para regiões não visíveis, NÃO escreva análise — apenas marque como "Não visível neste ângulo" na tabela resumo.

Use a seguinte referência de visibilidade:

| Região | Frontal | Posterior | Lateral |
|---|---|---|---|
| Rosto e Pescoço | Sim | Não | Parcial |
| Braços | Sim | Sim | Parcial |
| Tronco/Peito | Sim | Não | Parcial |
| Costas e Coluna | Não | Sim | Parcial |
| Abdômen | Sim | Não | Parcial |
| Cintura/Flancos | Sim | Sim | Sim |
| Quadril e Glúteos | Parcial | Sim | Parcial |
| Pernas | Sim | Sim | Parcial |
| Postura | Sim | Sim | Sim |
| Pele | Sim | Sim | Sim |

Estruture a análise das regiões VISÍVEIS assim:

## Análise de Evolução Corporal

### 1. Rosto e Pescoço
Analise: contorno facial, papada, definição mandibular, volume do rosto, simetria.

### 2. Braços
Analise: volume, definição muscular, flacidez, proporção em relação ao tronco.

### 3. Tronco e Peito
Analise: proporção, postura, presença de ginecomastia, definição peitoral, largura dos ombros.

### 4. Costas e Coluna
Analise: definição muscular dorsal, escápulas (posição e simetria), gordura infra-escapular, alinhamento da coluna, presença de escoliose aparente, largura dorsal.

### 5. Abdômen
Analise: circunferência aparente, distensão abdominal, definição muscular, presença de gordura localizada, separação de reto abdominal.

### 6. Cintura
Analise: contorno lateral, relação cintura-quadril visual, acúmulo de gordura nos flancos ("love handles").

### 7. Quadril e Glúteos
Analise: volume, proporção, projeção glútea, distribuição de gordura.

### 8. Pernas (Coxas e Panturrilhas)
Analise: volume, definição muscular, presença de celulite, proporção entre coxas e panturrilhas.

### 9. Postura Geral
Analise: alinhamento corporal, lordose, cifose, escoliose aparente, projeção de ombros e cabeça.

### 10. Pele
Analise: coloração, estrias (novas ou atenuadas), flacidez, textura, manchas.

### 11. Composição Corporal Aparente
Estimativa visual de: percentual de gordura corporal aparente (faixa), distribuição de massa magra vs gordura, biótipo predominante (endomorfo/mesomorfo/ectomorfo).
**IMPORTANTE:** Sempre forneça uma estimativa visual da faixa de peso aparente (ex: 75-85kg) e do percentual de gordura corporal (ex: 20-25%), mesmo que nenhum dado tenha sido informado pelo médico. Baseie-se em proporções corporais, volume aparente e referências anatômicas visíveis.

---

## Tabela Resumo de Evolução

| Região | Classificação |
|---|---|
| Rosto e Pescoço | [Melhora significativa / Melhora leve / Estável / Piora leve / Piora significativa / Não visível neste ângulo] |
| Braços | [...] |
| Tronco e Peito | [...] |
| Costas e Coluna | [...] |
| Abdômen | [...] |
| Cintura | [...] |
| Quadril e Glúteos | [...] |
| Pernas | [...] |
| Postura | [...] |
| Pele | [...] |
| Composição Corporal | [...] |

## Estimativas Visuais

Forneça SEMPRE esta seção, independentemente de dados informados:

| Parâmetro | ANTES (estimativa) | DEPOIS (estimativa) |
|---|---|---|
| Faixa de peso aparente | ex: 85-95kg | ex: 75-85kg |
| % gordura corporal estimado | ex: 28-33% | ex: 22-27% |
| Biótipo predominante | ex: Endomorfo | ex: Meso-endomorfo |

⚠️ **Nota:** Estes valores são estimativas visuais baseadas em proporções corporais e referências anatômicas. Não substituem medições reais. Recomenda-se que o médico registre peso e altura para análises futuras mais precisas.

## Score Geral de Evolução
Atribua uma nota de 1 a 10 para a evolução geral observada e justifique brevemente.

## Correlação com Dados Antropométricos

Siga o cenário aplicável:

**Cenário A — Peso e altura informados:**
Calcule o IMC (ANTES e DEPOIS, se disponível) e correlacione com as mudanças visuais. Indique se a perda/ganho parece ser predominantemente de gordura ou massa magra.

**Cenário B — Apenas peso informado:**
Correlacione a variação de peso com as mudanças visuais observadas. Indique se a perda/ganho parece ser predominantemente de gordura ou massa magra. Sugira que o médico registre a altura para cálculo de IMC.

**Cenário C — Nenhum dado informado:**
Baseie-se exclusivamente nas estimativas visuais da seção anterior. Compare as faixas estimadas de ANTES e DEPOIS. Recomende enfaticamente que o médico registre peso e altura do paciente para análises futuras mais precisas e correlações mais confiáveis.

## Recomendações de Acompanhamento
Sugira pontos específicos para o médico acompanhar nas próximas avaliações com base nas mudanças observadas.

---

REGRAS:
- Seja objetivo, preciso e use linguagem médica adequada.
- NÃO faça diagnósticos — apenas descreva mudanças visuais observáveis.
- IDENTIFIQUE o ângulo da foto ANTES de analisar qualquer região.
- Analise APENAS regiões visíveis no ângulo identificado.
- Se uma região não for visível no ângulo, marque "Não visível neste ângulo" na tabela resumo e NÃO escreva análise para ela.
- Se as fotos forem de ângulos muito diferentes, informe claramente e faça a melhor análise possível com as regiões visíveis em ambas.
- Se as fotos forem de baixa qualidade, informe claramente e faça a melhor análise possível.
- Sempre preencha TODAS as regiões da tabela resumo (com classificação ou "Não visível neste ângulo").
- Sempre forneça estimativas visuais de composição corporal, mesmo sem dados do paciente.
- Indique claramente quando valores são estimativas visuais vs dados informados pelo médico.`;

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
