import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Action = "composition" | "compare" | "evolution";

interface Anthropometrics {
  weight?: number;
  height?: number;
  waistCircumference?: number;
  bodyFatPercentage?: number;
}

interface SessionAnthro {
  date?: string;
  anthropometrics?: Anthropometrics;
}

interface SessionData {
  session1?: SessionAnthro;
  session2?: SessionAnthro;
  intervalDays?: number;
}

function getPromptForAction(action: Action): string {
  switch (action) {
    case "composition":
      return `Você é um especialista em composição corporal e antropometria clínica. Analise estas fotos (Frente, Perfil, Costas) como um conjunto único, combinando avaliação visual com dados antropométricos quando fornecidos.

Gere o relatório seguindo EXATAMENTE esta estrutura em Markdown:

## Painel de Indicadores

| Indicador | Estimativa | Margem |
|---|---|---|
| IMC | valor | — |
| % Gordura Corporal | valor% | ± X% |
| Massa Gorda | valor kg | ± X kg |
| Taxa Metabólica Basal | valor kcal/dia | ± X kcal |
| Gordura Visceral | nível | — |

> **Classificação:** [Atleta/Fitness/Normal/Sobrepeso/Obesidade] • **Score:** [X/10] — [justificativa em uma frase]

---

## Análise Regional

| Região | Observações | Status |
|---|---|---|
| Rosto e Pescoço | descrição | 🟢/🟡/🔴 |
| Braços | descrição | 🟢/🟡/🔴 |
| Tronco e Peito | descrição | 🟢/🟡/🔴 |
| Costas e Coluna | descrição | 🟢/🟡/🔴 |
| Abdômen | descrição | 🟢/🟡/🔴 |
| Cintura/Flancos | descrição | 🟢/🟡/🔴 |
| Quadril e Glúteos | descrição | 🟢/🟡/🔴 |
| Pernas | descrição | 🟢/🟡/🔴 |

## Análise Postural

Avalie alinhamento, cifose, lordose, escoliose aparente, projeção de ombros/cabeça. Marque regiões não visíveis como "Não avaliável".

## Avaliação Visual Descritiva

Descrição objetiva da distribuição de gordura e massa muscular observada nas imagens.

## Observações Clínicas

- ⚠️ [ponto de atenção 1]
- ⚠️ [ponto de atenção 2]

## Recomendações

- 🎯 [recomendação 1]
- 🎯 [recomendação 2]
- 🎯 [recomendação 3]

REGRAS:
- Seja objetivo, preciso e use linguagem médica adequada.
- NÃO faça diagnósticos definitivos — descreva achados visuais e estimativas.
- SEMPRE forneça estimativas com margem de erro na tabela de indicadores.
- Quando dados antropométricos reais forem fornecidos (peso, altura, circunferência), USE-OS para calibrar as estimativas.
- Calcule IMC e relação cintura/altura quando os dados permitirem.
- Use a fórmula de Mifflin-St Jeor para estimar TMB quando peso e altura forem fornecidos.
- Use EXATAMENTE os emojis 🟢 (bom), 🟡 (atenção), 🔴 (crítico) na coluna Status da análise regional.
- Use ⚠️ para observações e 🎯 para recomendações.
- A tabela de indicadores DEVE ser a primeira seção do relatório.
- O blockquote com classificação e score deve vir logo após a tabela de indicadores.`;

    case "compare":
      return `Compare estas 2 fotos do mesmo paciente em datas diferentes. Foque exclusivamente na mudança visual entre as duas imagens (ex: redução de volume abdominal, melhora na silhueta). Gere um comentário breve e motivador destacando a evolução.

## COMPARAÇÃO DE EVOLUÇÃO

### Mudanças Observadas
Liste as diferenças visuais identificadas entre as duas fotos.

### Destaques Positivos
Destaque as melhorias mais evidentes de forma motivadora.

### Áreas para Atenção
Regiões que ainda precisam de foco no tratamento.

### Comentário Final
Um parágrafo motivador resumindo a evolução do paciente.

REGRAS:
- Seja motivador e positivo, mas honesto.
- Foque nas diferenças visuais concretas.
- Use linguagem acessível ao paciente.`;

    case "evolution":
      return `Analise estes 2 grupos de fotos (3 fotos de cada data: Frente, Perfil e Costas). Realize uma comparação profunda de evolução corporal. Identifique ganhos de massa muscular, perda de gordura e correções posturais. Gere um laudo de evolução comparativa detalhado.

## LAUDO DE EVOLUÇÃO CORPORAL COMPARATIVA

### Resumo da Evolução
Visão geral das mudanças entre as duas sessões.

### Comparação por Região

| Região | Sessão 1 | Sessão 2 | Evolução |
|---|---|---|---|
| Braços | ... | ... | ↑/↓/= |
| Tronco/Peito | ... | ... | ↑/↓/= |
| Abdômen | ... | ... | ↑/↓/= |
| Costas | ... | ... | ↑/↓/= |
| Cintura/Flancos | ... | ... | ↑/↓/= |
| Quadril/Glúteos | ... | ... | ↑/↓/= |
| Pernas | ... | ... | ↑/↓/= |

### Evolução Postural
Compare a postura entre as duas sessões.

### Composição Corporal Estimada

| Parâmetro | Sessão 1 | Sessão 2 | Variação |
|---|---|---|---|
| % gordura estimado | ... | ... | ... |
| Massa muscular aparente | ... | ... | ... |

### Score de Evolução
Nota de 1 a 10 para a evolução entre sessões e justificativa.

### Conclusão e Recomendações
Resumo clínico com próximos passos sugeridos.

REGRAS:
- Compare sistematicamente cada região nos dois momentos.
- Seja objetivo e use linguagem médica.
- NÃO faça diagnósticos definitivos.
- Destaque as mudanças mais significativas.`;
  }
}

function getUserPrompt(action: Action, numPhotos: number, patientContext?: string, anthropometrics?: Anthropometrics, sessionData?: SessionData): string {
  const ctx = patientContext ? `\n\nContexto do paciente: ${patientContext}` : "";

  let anthroText = "";
  if (anthropometrics && (anthropometrics.weight || anthropometrics.height || anthropometrics.waistCircumference || anthropometrics.bodyFatPercentage)) {
    const parts: string[] = [];
    if (anthropometrics.weight) parts.push(`Peso: ${anthropometrics.weight}kg`);
    if (anthropometrics.height) parts.push(`Altura: ${anthropometrics.height}cm`);
    if (anthropometrics.waistCircumference) parts.push(`Circunferência abdominal: ${anthropometrics.waistCircumference}cm`);
    if (anthropometrics.bodyFatPercentage) parts.push(`Percentual de gordura corporal informado: ${anthropometrics.bodyFatPercentage}%`);
    anthroText = `\n\nDados antropométricos reais: ${parts.join(", ")}`;
  }

  switch (action) {
    case "composition":
      return `Analise estas fotos (Frente, Perfil, Costas) da mesma pessoa e gere um relatório completo de composição corporal com estimativas quantitativas e margem de erro.${ctx}${anthroText}`;
    case "compare":
      return `Compare estas 2 fotos do mesmo paciente em datas diferentes e destaque a evolução.${ctx}${anthroText}`;
    case "evolution":
      return `Analise estes 2 grupos de fotos (${numPhotos} fotos total) de diferentes datas e gere um laudo de evolução comparativa.${ctx}${anthroText}`;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { avaliacaoId, photoPaths, action = "composition", patientContext, anthropometrics } = await req.json();

    if (!avaliacaoId || !photoPaths || photoPaths.length === 0) {
      return new Response(
        JSON.stringify({ error: "avaliacaoId and photoPaths are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const systemPrompt = getPromptForAction(action as Action);
    const userText = getUserPrompt(action as Action, signedUrls.length, patientContext, anthropometrics as Anthropometrics | undefined);

    const imageContent = signedUrls.map((url: string) => ({
      type: "image_url",
      image_url: { url },
    }));

    const userContent = [
      { type: "text", text: userText },
      ...imageContent,
    ];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
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
