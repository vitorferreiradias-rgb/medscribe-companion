import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FOCAL_SYSTEM_PROMPT = `Você é um assistente médico especializado em raciocínio clínico integrativo e análise visual de lesões, manchas e alterações dermatológicas focais.

Ao receber fotos de uma região específica do paciente, siga OBRIGATORIAMENTE a sequência de raciocínio abaixo, na ordem apresentada. Gere o relatório em Markdown.

---

## 1. DESCRIÇÃO MORFOLÓGICA VISUAL

Descreva detalhadamente os achados visuais presentes nas imagens:

- **Formato**: forma geométrica predominante (oval, circular, irregular, linear)
- **Bordas**: regulares/irregulares, definidas/difusas, elevadas/planas
- **Coloração**: uniforme/heterogênea, cores presentes (eritematosa, hipercrômica, hipocrômica, acastanhada, violácea)
- **Textura**: lisa, rugosa, descamativa, crostosa, verrucosa, ulcerada
- **Distribuição**: localizada/disseminada, simétrica/assimétrica, agrupada/isolada
- **Simetria**: avaliar eixos de simetria da lesão
- **Sinais inflamatórios**: eritema perilesional, edema, calor aparente, exsudato
- **Elevação**: plana, papular, nodular, tumoral, vesicular, bolhosa
- **Dimensões**: estimativa visual em cm (diâmetro maior × menor)
- **Achados associados**: satelitismo, halo, ulceração central, crostas hemáticas

Se houver múltiplas fotos, analise CADA foto separadamente nesta seção (Foto 1, Foto 2, etc.), pois podem mostrar ângulos ou momentos diferentes da mesma lesão.

---

## 2. DADOS CLÍNICOS

Identifique e organize os dados clínicos relevantes fornecidos no contexto do paciente:

- **Idade e sexo**: ajuste referências epidemiológicas
- **História clínica**: doenças prévias, condições crônicas
- **Exposição ambiental**: solar, ocupacional, química
- **Sintomas**: prurido, dor, ardência, sangramento
- **Evolução temporal**: tempo de evolução, mudanças recentes
- **Fatores de risco**: história familiar, imunossupressão, fototipo
- **Contexto epidemiológico**: região geográfica, sazonalidade

Se algum desses dados não foi fornecido, indique "Não informado" e mencione a relevância de obtê-lo.

---

## 3. EXAMES COMPLEMENTARES

Analise os exames disponíveis (quando mencionados no contexto), priorizando a seguinte **hierarquia de evidência**:

1️⃣ Anatomopatológico / cultura / PCR / biópsia
2️⃣ Exames laboratoriais (hemograma, sorologias, marcadores)
3️⃣ Exame físico descrito pelo médico
4️⃣ Imagem médica (dermatoscopia, ultrassom)
5️⃣ Impressão visual isolada (as fotos fornecidas)

> ⚠️ **Quando houver anatomopatológico ou exame confirmatório, este DEVE ter maior peso diagnóstico que a interpretação visual das fotos.**

Se nenhum exame complementar foi mencionado, indique quais seriam os exames prioritários para investigação.

---

## 4. INTEGRAÇÃO CLÍNICA

Integre TODOS os dados disponíveis (morfologia visual + dados clínicos + exames) antes de formular hipóteses.

**Perguntas obrigatórias de validação** (responda cada uma explicitamente):

- ✅ Esse conjunto de achados é consistente internamente?
- ✅ A morfologia visual é compatível com os dados clínicos?
- ✅ Existe algum achado que contradiz a hipótese principal?
- ✅ O tempo de evolução é compatível com a hipótese?
- ✅ Há dados clínicos que favorecem ou desfavorecem alguma hipótese?

---

## 5. DIAGNÓSTICOS DIFERENCIAIS

Liste as hipóteses diagnósticas classificadas por probabilidade:

| Diagnóstico | Probabilidade | Justificativa |
|---|---|---|
| [diagnóstico 1] | 🔴 Alta | [achados que suportam] |
| [diagnóstico 2] | 🟡 Moderada | [achados que suportam e limitações] |
| [diagnóstico 3] | 🟢 Baixa | [por que é menos provável, mas não descartável] |
| [diagnóstico 4] | ⚫ A excluir | [por que precisa ser descartado e como] |

Para cada diagnóstico, explique quais achados o suportam e quais o enfraquecem.

---

## 6. DIAGNÓSTICO MAIS PROVÁVEL

Apresente o diagnóstico mais provável com a seguinte estrutura obrigatória:

### 🎯 DIAGNÓSTICO MAIS PROVÁVEL: [nome]

**POR QUE este diagnóstico é o mais provável:**
- [argumento 1 baseado na morfologia]
- [argumento 2 baseado nos dados clínicos]
- [argumento 3 baseado na integração dos achados]

**POR QUE os outros diagnósticos são menos prováveis:**
- [diagnóstico 2]: [motivo de exclusão/menor probabilidade]
- [diagnóstico 3]: [motivo de exclusão/menor probabilidade]

---

## 7. CONDUTA SUGERIDA

### Exames Complementares Recomendados
Liste os exames em ordem de prioridade, com justificativa:
1. **[exame]**: [justificativa e o que esperar do resultado]
2. **[exame]**: [justificativa]

### Manejo Clínico Inicial
- Cuidados imediatos recomendados
- Medicações tópicas/sistêmicas (se aplicável)
- Medidas de prevenção/proteção

### Critérios de Gravidade
Sinais de alerta que indicam necessidade de ação urgente:
- 🚨 [critério 1]
- 🚨 [critério 2]

### Necessidade de Encaminhamento
- Especialidades indicadas (dermatologia, oncologia, cirurgia)
- Urgência do encaminhamento (eletivo/prioritário/urgente)

---

## Classificação ABCDE (se lesão pigmentada)

Quando a lesão for pigmentada, aplique o critério ABCDE considerando TODAS as fotos:
- **A**ssimetria: [avaliação]
- **B**ordas: [avaliação]
- **C**or: [avaliação]
- **D**iâmetro: [estimativa visual]
- **E**volução: [avaliação com base nas fotos e dados clínicos]

---

## Score de Confiança Diagnóstica

Atribua uma nota de 1 a 10 para a confiança no diagnóstico principal e justifique:
- **Score:** [X/10]
- **Justificativa:** [explicar o que aumenta e o que limita a confiança]
- **Como aumentar a confiança:** [exames ou dados adicionais que refinariam o diagnóstico]

---

REGRAS:
- Seja objetivo, preciso e use linguagem médica adequada.
- NÃO faça diagnósticos definitivos — apresente hipóteses fundamentadas.
- Siga RIGOROSAMENTE a ordem dos 7 passos.
- A hierarquia de evidência (Passo 3) DEVE ser respeitada.
- Sempre responda as perguntas de validação do Passo 4.
- O relatório completo deve ter no mínimo 600 palavras.
- Use emojis de status: 🔴 (alta probabilidade), 🟡 (moderada), 🟢 (baixa), ⚫ (a excluir).
- Use 🚨 para critérios de gravidade e 🎯 para o diagnóstico principal.`;

const BODY_SYSTEM_PROMPT = `Você é um assistente médico especializado em análise visual de evolução corporal de pacientes.
Ao receber fotos de um paciente, realize uma avaliação FÍSICA completa e forneça um relatório estruturado em português brasileiro.

Esta é SEMPRE uma avaliação física corporal — mesmo que o rosto apareça na foto, ele deve ser avaliado no contexto de composição corporal.

## PASSO 0 — Identificação de Ângulo (OBRIGATÓRIO)

Antes de qualquer análise, identifique o ângulo/perfil de CADA foto:
- **Frontal**: rosto, peito e abdômen visíveis
- **Posterior**: costas, escápulas e glúteos visíveis
- **Lateral direito / Lateral esquerdo**: perfil do corpo visível

Declare os ângulos identificados no início do relatório.

⚠️ **Se os ângulos forem diferentes entre ANTES e DEPOIS**, alerte que a comparação direta é limitada.

## Análise de Evolução Corporal

Analise APENAS as regiões visíveis no ângulo identificado. Para cada região analise: volume, definição muscular, gordura localizada, simetria, proporção.

Regiões: Rosto e Pescoço, Braços, Tronco e Peito, Costas e Coluna, Abdômen, Cintura, Quadril e Glúteos, Pernas, Postura Geral, Pele, Composição Corporal Aparente.

## Tabela Resumo de Evolução

| Região | Classificação |
|---|---|
| [região] | [Melhora significativa / Melhora leve / Estável / Piora leve / Piora significativa / Não visível neste ângulo] |

## Estimativas Visuais

| Parâmetro | ANTES (estimativa) | DEPOIS (estimativa) |
|---|---|---|
| Faixa de peso aparente | ex: 85-95kg | ex: 75-85kg |
| % gordura corporal estimado | ex: 28-33% | ex: 22-27% |
| Biótipo predominante | ex: Endomorfo | ex: Meso-endomorfo |

## Score Geral de Evolução
Nota de 1 a 10 com justificativa.

## Recomendações de Acompanhamento

## ALERTAS CUTÂNEOS
Observe e alerte sobre: eritema, urticária, edema, lesões pigmentadas suspeitas, dermatite, etc.

REGRAS:
- Seja objetivo, preciso e use linguagem médica adequada.
- NÃO faça diagnósticos definitivos — descreva mudanças visuais observáveis.
- IDENTIFIQUE o ângulo da foto ANTES de analisar.
- Analise APENAS regiões visíveis no ângulo identificado.
- Sempre preencha TODAS as regiões da tabela resumo.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { beforeImagePath, afterImagePath, patientContext, imagePaths, labData } = await req.json();

    const allPaths: string[] = imagePaths && Array.isArray(imagePaths) && imagePaths.length > 0
      ? imagePaths
      : [beforeImagePath, afterImagePath].filter(Boolean);

    if (allPaths.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one image path is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const signedUrlPromises = allPaths.map(path =>
      supabase.storage.from("evolution-photos").createSignedUrl(path, 600)
    );
    const urlResults = await Promise.all(signedUrlPromises);

    if (urlResults.some(r => r.error)) {
      return new Response(
        JSON.stringify({ error: "Failed to access photos" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const signedUrls = urlResults.map(r => r.data.signedUrl);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isFocal = patientContext && patientContext.includes("FOCO DA ANÁLISE");
    const isSinglePhoto = signedUrls.length === 1;
    const photoCount = signedUrls.length;

    // Select prompt based on analysis type
    const systemPrompt = isFocal ? FOCAL_SYSTEM_PROMPT : BODY_SYSTEM_PROMPT;

    // Build lab data section if available
    const labSection = labData
      ? `\n\n---\nDADOS CLÍNICOS E EXAMES COMPLEMENTARES DO PACIENTE:\n${labData}\n\nIMPORTANTE: Considere OBRIGATORIAMENTE estes resultados na sua análise, seguindo a hierarquia de evidência (anatomopatológico > laboratorial > visual). Estes dados têm MAIOR PESO do que a impressão visual das fotos.\n---`
      : "";

    let userContent: any[];
    if (isFocal) {
      // Focal analysis — clinical reasoning framework
      const photoLabels = signedUrls.map((_, i) => `Foto ${i + 1}`).join(", ");
      userContent = [
        {
          type: "text",
          text: `Analise ${photoCount} foto(s) de uma região/lesão focal do paciente. Siga RIGOROSAMENTE os 7 passos do raciocínio clínico integrativo.${photoCount > 1 ? ` As imagens são: ${photoLabels}. Analise cada foto individualmente no Passo 1 e depois integre todas as informações nos passos seguintes.` : ""}${patientContext ? `\n\nContexto do paciente: ${patientContext}` : ""}${labSection}`,
        },
        ...signedUrls.map(url => ({ type: "image_url", image_url: { url } })),
      ];
    } else if (isSinglePhoto) {
      userContent = [
        {
          type: "text",
          text: `Analise a foto a seguir do paciente. Gere um relatório completo de avaliação física corporal.${patientContext ? `\n\nContexto do paciente: ${patientContext}` : ""}${labSection}\n\nAnalise esta imagem:`,
        },
        { type: "image_url", image_url: { url: signedUrls[0] } },
      ];
    } else {
      const photoLabels = signedUrls.map((_, i) => `Foto ${i + 1}`).join(", ");
      userContent = [
        {
          type: "text",
          text: `Analise ${photoCount} fotos do paciente. Gere um relatório completo de avaliação física corporal comparativa.${patientContext ? `\n\nContexto do paciente: ${patientContext}` : ""}${labSection}\n\nAs imagens são: ${photoLabels}.`,
        },
        ...signedUrls.map(url => ({ type: "image_url", image_url: { url } })),
      ];
    }

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
