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
      return `Você é um especialista em composição corporal, antropometria clínica e raciocínio clínico integrativo. Analise estas fotos (Frente, Perfil, Costas) como um conjunto único, combinando avaliação visual com dados antropométricos quando fornecidos.

Gere o relatório seguindo EXATAMENTE esta estrutura em Markdown. IMPORTANTE: Seja DETALHADO e DESCRITIVO em cada seção. O relatório deve ser rico, informativo e clinicamente fundamentado.

---

## 1. DESCRIÇÃO MORFOLÓGICA VISUAL

### Painel de Indicadores

| Indicador | Estimativa | Margem |
|---|---|---|
| IMC | valor | — |
| % Gordura Corporal | valor% | ± X% |
| Massa Gorda | valor kg | ± X kg |
| Taxa Metabólica Basal | valor kcal/dia | ± X kcal |
| Gordura Visceral | nível | — |

> **Classificação:** [Atleta/Fitness/Normal/Sobrepeso/Obesidade] • **Score:** [X/10] — [justificativa em uma frase]

### Análise Regional

| Região | Observações | Status |
|---|---|---|
| Rosto e Pescoço | descrição detalhada (formato, simetria, depósito de gordura submentoniana) | 🟢/🟡/🔴 |
| Braços | descrição detalhada (tônus, simetria, volume, depósito de gordura) | 🟢/🟡/🔴 |
| Tronco e Peito | descrição detalhada (proporção, massa muscular, definição, largura ombros) | 🟢/🟡/🔴 |
| Costas e Coluna | descrição detalhada (alinhamento, escápulas, distribuição de gordura dorsal) | 🟢/🟡/🔴 |
| Abdômen | descrição detalhada (distensão, gordura subcutânea, diástase aparente) | 🟢/🟡/🔴 |
| Cintura/Flancos | descrição detalhada (depósito lateral, proporção cintura-quadril) | 🟢/🟡/🔴 |
| Quadril e Glúteos | descrição detalhada (volume, tônus, simetria, projeção) | 🟢/🟡/🔴 |
| Pernas | descrição detalhada (proporção, tônus, retenção hídrica aparente) | 🟢/🟡/🔴 |

### Análise Postural
Avalie detalhadamente: alinhamento da cabeça e pescoço, projeção de ombros, cifose torácica, lordose lombar, escoliose aparente, inclinação pélvica.

### Avaliação Visual Descritiva
Escreva 2-3 parágrafos sobre:
- **Distribuição de gordura**: padrão (androide/ginoide/misto), áreas de maior acúmulo, simetria
- **Massa muscular**: desenvolvimento por grupo muscular visível, proporção entre membros
- **Proporções corporais**: relação tronco-membros, biótipo aparente
- **Aspectos dermatológicos**: estrias, celulite aparente, flacidez cutânea, alterações de pigmentação

---

## 2. DADOS CLÍNICOS

Quando dados clínicos forem fornecidos no contexto do paciente, organize-os aqui:
- **Idade e Sexo**: ajuste referências de IMC e composição corporal
- **Diagnósticos**: considere condições pré-existentes (hipotireoidismo, síndrome metabólica, etc.)
- **Alergias medicamentosas**: correlacione com achados cutâneos
- **Dados antropométricos reais**: calibre estimativas com os dados fornecidos
- **Objetivo do tratamento**: direcione recomendações (emagrecimento, hipertrofia, reabilitação)

Se nenhum dado clínico foi fornecido, indique quais dados seriam relevantes para refinar a avaliação.

---

## 3. INTEGRAÇÃO CLÍNICA

Integre todos os dados disponíveis (achados visuais + dados antropométricos + contexto clínico).

**Perguntas de validação** (responda cada uma):
- ✅ Os achados visuais são consistentes com os dados antropométricos fornecidos?
- ✅ A distribuição de gordura observada é compatível com o perfil do paciente?
- ✅ Existe algum achado visual que sugira investigação adicional?
- ✅ Os indicadores estimados são coerentes entre si?

---

## 4. CORRELAÇÕES METABÓLICAS E FUNCIONAIS

Explique de forma educativa e acessível como os achados visuais se relacionam com saúde, metabolismo e estilo de vida. Esta seção deve usar linguagem que o médico possa compartilhar diretamente com o paciente.

Liste 3-5 correlações relevantes, como:
- 🔬 **Gordura abdominal e risco metabólico**: Como o acúmulo de gordura visceral se relaciona com resistência insulínica, síndrome metabólica e risco cardiovascular
- 🔬 **Alterações posturais e funcionalidade**: Como desvios posturais observados podem impactar a biomecânica, gerar dor crônica e limitar a funcionalidade
- 🔬 **Edema e processos sistêmicos**: Como sinais de retenção hídrica podem indicar alterações renais, cardíacas, hormonais ou nutricionais
- 🔬 **Distribuição de gordura e perfil hormonal**: Como o padrão de distribuição (androide vs ginoide) reflete influências hormonais (cortisol, estrogênio, testosterona)
- 🔬 **Alterações cutâneas e saúde metabólica**: Como estrias, acantose nigricans, ou ressecamento podem sinalizar resistência insulínica, disfunção tireoidiana ou deficiências nutricionais
- 🔬 **Composição corporal e gasto energético**: Como a proporção massa magra/gordura impacta o metabolismo basal e a eficiência energética

Selecione apenas as correlações que forem relevantes para os achados deste paciente. Explique o "porquê" de cada achado de forma clara e didática.

---

## 5. OBSERVAÇÕES CLÍNICAS E ALERTAS

Liste pontos de atenção clínica relevantes:
- ⚠️ [ponto de atenção] — [explicação clínica do significado e relevância]
- ⚠️ [ponto de atenção] — [explicação clínica]

### Alertas Cutâneos
Observe e alerte sobre: eritema, estrias (novas vs atenuadas), lesões pigmentadas suspeitas, sinais de edema, flacidez acentuada, cicatrizes. Se o paciente possui alergias informadas, correlacione com achados cutâneos → 🚨 ALERTA.

### Critérios de Gravidade
Sinais que indicam necessidade de atenção médica:
- 🚨 [critério de gravidade, se aplicável]

---

## 5. RECOMENDAÇÕES E CONDUTA

Liste recomendações detalhadas e fundamentadas:
- 🎯 **[título da recomendação]**: [descrição detalhada com justificativa clínica e sugestões práticas]
- 🎯 **[título da recomendação]**: [descrição detalhada com justificativa clínica]

### Exames Complementares Sugeridos
Se achados visuais sugerirem investigação:
1. **[exame]**: [justificativa baseada nos achados]

### Necessidade de Encaminhamento
Se aplicável, indique especialidades (endocrinologia, ortopedia, dermatologia) com urgência.

---

## Conclusão

Escreva um parágrafo final integrando todos os achados, com uma visão holística do estado do paciente e prioridades para acompanhamento.

REGRAS:
- Seja objetivo, preciso e use linguagem médica adequada, mas também acessível.
- NÃO faça diagnósticos definitivos — descreva achados visuais e estimativas.
- SEMPRE forneça estimativas com margem de erro na tabela de indicadores.
- Quando dados antropométricos reais forem fornecidos (peso, altura, circunferência), USE-OS para calibrar as estimativas — não estime por cima dos dados reais.
- Calcule IMC e relação cintura/altura quando os dados permitirem.
- Use a fórmula de Mifflin-St Jeor para estimar TMB quando peso e altura forem fornecidos.
- Use EXATAMENTE os emojis 🟢 (bom), 🟡 (atenção), 🔴 (crítico) na coluna Status.
- Use ⚠️ para observações, 🎯 para recomendações, 🚨 para alertas de gravidade.
- Responda TODAS as perguntas de validação da Integração Clínica.
- SEJA DETALHADO — cada seção deve ter conteúdo rico. Evite respostas telegráficas.
- O relatório completo deve ter no mínimo 800 palavras.`;

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
      return `Você é um especialista em composição corporal e antropometria clínica. Você receberá 2 grupos de fotos (3 fotos de cada data: Frente, Perfil e Costas) e dados antropométricos de cada sessão.

IMPORTANTE — MÉTODO DE ANÁLISE EM 2 ETAPAS:

**ETAPA 1 — Análise Individual de Cada Sessão (OBRIGATÓRIA)**
Antes de comparar, analise CADA sessão separadamente com a mesma profundidade que faria numa avaliação de composição corporal isolada:
- Use os dados antropométricos reais fornecidos para CADA sessão (peso, altura, circunferência, % gordura)
- Calcule IMC real quando peso e altura forem fornecidos (IMC = peso / (altura_m)²)
- Calcule TMB pela fórmula de Mifflin-St Jeor quando peso e altura forem disponíveis
- Estime massa gorda (peso × %gordura) quando os dados permitirem
- Calibre as estimativas visuais com os dados numéricos reais de CADA sessão
- NÃO estime valores quando dados reais foram fornecidos — USE os dados reais

**ETAPA 2 — Comparação Evolutiva**
Somente após analisar cada sessão individualmente, compare os resultados entre elas.

Gere o relatório seguindo EXATAMENTE esta estrutura em Markdown:

## Análise Individual — Sessão 1 (ANTES)

| Indicador | Valor | Fonte |
|---|---|---|
| Peso | valor kg | Real/Estimado |
| IMC | valor | Calculado/Estimado |
| % Gordura Corporal | valor% | Real/Estimado |
| Massa Gorda | valor kg | Calculado/Estimado |
| Taxa Metabólica Basal | valor kcal/dia | Calculado/Estimado |
| Gordura Visceral | nível | Estimado |

> **Classificação:** [classificação] • **Score:** [X/10]

Breve descrição da composição corporal nesta sessão.

---

## Análise Individual — Sessão 2 (DEPOIS)

| Indicador | Valor | Fonte |
|---|---|---|
| Peso | valor kg | Real/Estimado |
| IMC | valor | Calculado/Estimado |
| % Gordura Corporal | valor% | Real/Estimado |
| Massa Gorda | valor kg | Calculado/Estimado |
| Taxa Metabólica Basal | valor kcal/dia | Calculado/Estimado |
| Gordura Visceral | nível | Estimado |

> **Classificação:** [classificação] • **Score:** [X/10]

Breve descrição da composição corporal nesta sessão.

---

## Dados Antropométricos Comparativos

| Parâmetro | Sessão 1 | Sessão 2 | Variação | Variação % |
|---|---|---|---|---|
| Peso (kg) | ... | ... | ... | ... |
| IMC | ... | ... | ... | ... |
| % Gordura Corporal | ... | ... | ... | ... |
| Circunferência Abdominal (cm) | ... | ... | ... | ... |
| Massa Gorda Estimada (kg) | ... | ... | ... | ... |
| Taxa Metabólica Basal (kcal/dia) | ... | ... | ... | ... |

> **Intervalo entre sessões:** [X dias] • **Classificação da Evolução:** [Regressão/Estável/Progresso Leve/Progresso Moderado/Progresso Significativo]

---

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

### Score de Evolução
Nota de 1 a 10 para a evolução entre sessões e justificativa.

### Conclusão e Recomendações
Resumo clínico com próximos passos sugeridos.

REGRAS CRÍTICAS:
- SEMPRE analise cada sessão INDIVIDUALMENTE primeiro, com a mesma profundidade de uma avaliação de composição corporal.
- Quando dados antropométricos reais forem fornecidos para uma sessão, USE-OS EXATAMENTE — não arredonde, não estime por cima das fotos.
- Calcule variações absolutas e percentuais na tabela comparativa.
- Marque na coluna "Fonte" se o valor é "Real" (dado fornecido) ou "Estimado" (inferido das fotos).
- Quando dados não forem informados, estime a partir das imagens e marque com "~" (estimativa).
- SEMPRE mencione o intervalo de tempo entre as sessões.
- Use a fórmula de Mifflin-St Jeor para TMB quando peso e altura forem disponíveis.
- Seja objetivo e use linguagem médica. NÃO faça diagnósticos definitivos.`;
  }
}

function getUserPrompt(action: Action, numPhotos: number, patientContext?: string, anthropometrics?: Anthropometrics, sessionData?: SessionData, previousAnalysis?: string): string {
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
    case "evolution": {
      let evolutionDetails = "";
      if (sessionData) {
        const fmtAnthro = (a?: Anthropometrics) => {
          if (!a) return "Não informados";
          const parts: string[] = [];
          if (a.weight) parts.push(`Peso: ${a.weight}kg`);
          if (a.height) parts.push(`Altura: ${a.height}cm`);
          if (a.waistCircumference) parts.push(`Circunferência abdominal: ${a.waistCircumference}cm`);
          if (a.bodyFatPercentage) parts.push(`% Gordura: ${a.bodyFatPercentage}%`);
          return parts.length > 0 ? parts.join(", ") : "Não informados";
        };
        const s1Date = sessionData.session1?.date || "desconhecida";
        const s2Date = sessionData.session2?.date || "desconhecida";
        evolutionDetails += `\n\n--- DADOS DAS SESSÕES ---`;
        evolutionDetails += `\nSessão 1 (${s1Date}): ${fmtAnthro(sessionData.session1?.anthropometrics)}`;
        evolutionDetails += `\nSessão 2 (${s2Date}): ${fmtAnthro(sessionData.session2?.anthropometrics)}`;
        if (sessionData.intervalDays !== undefined) {
          evolutionDetails += `\nIntervalo entre sessões: ${sessionData.intervalDays} dias`;
        }
        evolutionDetails += `\n\nINCLUA estes dados numéricos reais no laudo: monte uma tabela comparativa com os valores da Sessão 1 e Sessão 2 (peso, % gordura, circunferência, IMC calculado). Destaque as variações absolutas e percentuais. Mencione o intervalo de tempo entre as sessões no resumo.`;
      }

      // If we have a previous analysis for session 1, include it as context
      let prevAnalysisText = "";
      if (previousAnalysis) {
        prevAnalysisText = `\n\n--- RELATÓRIO JÁ EXISTENTE DA SESSÃO 1 (ANTES) ---\nO relatório abaixo já foi gerado anteriormente para a Sessão 1. USE EXATAMENTE os dados e conclusões deste relatório para a Sessão 1. NÃO re-analise as fotos da Sessão 1 — apenas analise as fotos da Sessão 2 (DEPOIS) que estão sendo enviadas agora.\n\n${previousAnalysis}\n\n--- FIM DO RELATÓRIO DA SESSÃO 1 ---\n\nAs imagens enviadas são APENAS da Sessão 2 (DEPOIS). Analise-as com a mesma profundidade do relatório da Sessão 1, depois compare ambas.`;
      }

      return `Analise ${previousAnalysis ? "estas fotos da Sessão 2 (DEPOIS)" : `estes 2 grupos de fotos (${numPhotos} fotos total)`} e gere um laudo de evolução comparativa.${ctx}${anthroText}${evolutionDetails}${prevAnalysisText}`;
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { avaliacaoId, photoPaths, action = "composition", patientContext, anthropometrics, sessionData, previousAnalysis } = await req.json();

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
    const userText = getUserPrompt(action as Action, signedUrls.length, patientContext, anthropometrics as Anthropometrics | undefined, sessionData as SessionData | undefined, previousAnalysis as string | undefined);

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
