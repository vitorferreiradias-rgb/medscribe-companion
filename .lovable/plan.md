

# Raciocínio Clínico Integrativo — Plano de Implementação

## Análise

O framework proposto é excelente e eleva significativamente a qualidade dos laudos. Ele transforma a IA de um "descritor visual" para um **assistente de raciocínio clínico estruturado**, com hierarquia de evidências e diagnósticos diferenciais probabilísticos.

## Onde aplicar

O framework se encaixa em **dois contextos distintos** no sistema atual:

| Contexto | Edge Function | Aplicação |
|---|---|---|
| **Análise Focal** (lesões, manchas) | `evolution-compare` | Aplicação **completa** — todos os 7 passos fazem sentido (diagnóstico diferencial, conduta, exames) |
| **Composição Corporal** (F/P/C) | `consolidated-analysis` | Aplicação **parcial** — passos 1, 2, 4, 7 são relevantes; diagnóstico diferencial (passo 5) é menos aplicável a avaliação de composição |

## Proposta de implementação

### 1. Análise Focal (`evolution-compare/index.ts`)
Reescrever o prompt para seguir **exatamente** a sequência de 7 passos proposta. A IA receberá as fotos focais e gerará o laudo com:
- Descrição morfológica detalhada (formato, bordas, coloração, textura, simetria, sinais inflamatórios)
- Integração com contexto clínico do paciente (quando fornecido via `patientContext`)
- Hierarquia de evidência explícita
- Diagnósticos diferenciais classificados por probabilidade
- Diagnóstico mais provável com justificativa estruturada (por que este, por que não os outros)
- Conduta sugerida com exames e critérios de gravidade

### 2. Composição Corporal (`consolidated-analysis/index.ts`)
Incorporar os passos aplicáveis ao prompt existente:
- Passo 1 (descrição morfológica) — já existe, reforçar com os critérios de alterações de pele, postura e proporções
- Passo 2 (dados clínicos) — integrar melhor quando `patientContext` e `anthropometrics` forem fornecidos
- Passo 4 (integração clínica) — adicionar as perguntas obrigatórias de validação
- Passo 7 (conduta) — já existe como "Recomendações", manter mas enriquecer com critérios de gravidade

### 3. Ajuste no frontend
Nenhuma mudança no frontend é necessária — o `MarkdownRenderer` já renderiza a estrutura proposta (headers, listas, tabelas). Os laudos continuarão sendo exibidos no mesmo modal/timeline.

## Resumo das alterações

| Arquivo | Mudança |
|---|---|
| `supabase/functions/evolution-compare/index.ts` | Reescrever prompt focal com os 7 passos completos |
| `supabase/functions/consolidated-analysis/index.ts` | Enriquecer prompt de composição com passos 1, 2, 4, 7 adaptados |

