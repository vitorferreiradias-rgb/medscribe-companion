

# Plano: Upload Múltiplo de Fotos com Análise Consolidada por IA

## Resumo da Funcionalidade

O sistema permitirá o upload de **múltiplas fotos simultaneamente** (diferentes ângulos de uma mesma sessão) e enviará todas juntas para análise consolidada. O resultado será exibido em um novo **Card de Avaliação Consolidada**.

**Importante:** A funcionalidade de análise individual para manchas/lesões (ângulo "Outro") será **mantida** como está.

---

## Arquitetura

```text
┌──────────────────────────────────────────────────────────────────┐
│                     PacienteDetalhe.tsx                          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  [Tab Evolução]                                            │  │
│  │                                                            │  │
│  │  ┌───────────────────┐  ┌─────────────────────────────┐   │  │
│  │  │ Upload Individual │  │ Upload Múltiplo (NOVO)      │   │  │
│  │  │ (foto única)      │  │ • Seleciona 2-5 fotos       │   │  │
│  │  │                   │  │ • Define ângulos de cada    │   │  │
│  │  └───────────────────┘  │ • Campo: objetivo análise   │   │  │
│  │                         └─────────────────────────────┘   │  │
│  │                                    │                       │  │
│  │                                    ▼                       │  │
│  │                    ┌───────────────────────────────┐       │  │
│  │                    │ multiple-photo-analysis       │       │  │
│  │                    │ (Edge Function)               │       │  │
│  │                    │ • Recebe array de image_paths │       │  │
│  │                    │ • Usa Gemini 2.5 Flash        │       │  │
│  │                    └───────────────────────────────┘       │  │
│  │                                    │                       │  │
│  │                                    ▼                       │  │
│  │                    ┌───────────────────────────────┐       │  │
│  │                    │ ConsolidatedAnalysisCard      │       │  │
│  │                    │ • Exibe resultado unificado   │       │  │
│  │                    │ • Miniaturas das fotos        │       │  │
│  │                    │ • Opção de editar/salvar      │       │  │
│  │                    └───────────────────────────────┘       │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Componentes e Arquivos

### 1. Edge Function: `supabase/functions/multiple-photo-analysis/index.ts`
- Recebe: `{ imagePaths: string[], analysisObjective: string, patientContext?: string }`
- Gera signed URLs para cada imagem
- Envia todas as imagens ao Gemini 2.5 Flash
- Prompt consolidado: "Estas fotos são de diferentes ângulos da mesma composição corporal. Analise-as em conjunto para gerar uma avaliação única de [objetivo]"
- Retorna análise textual unificada

**Modelo:** Gemini 2.5 Flash (melhor custo-benefício para multimodal)

### 2. Componente: `src/components/MultiplePhotoUpload.tsx`
- Interface de seleção de múltiplas imagens (input `multiple`)
- Preview das imagens selecionadas com seletor de ângulo para cada
- Campo de texto: "Objetivo da análise" (ex: percentual de gordura, evolução muscular)
- Campos opcionais: peso, altura, circ. abdominal (compartilhados)
- Botão "Analisar com IA" → chama a edge function
- Estados: uploading, analyzing, done

### 3. Componente: `src/components/ConsolidatedAnalysisCard.tsx`
- Exibe o resultado da análise consolidada
- Miniaturas das fotos analisadas (com ângulos)
- Texto da análise com formatação
- Botões: Editar, Salvar no prontuário, Re-analisar
- Badge com data e objetivo

### 4. Tabela: `consolidated_analyses`
```sql
CREATE TABLE consolidated_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  photo_paths TEXT[] NOT NULL,
  angles TEXT[],
  analysis_objective TEXT NOT NULL,
  ai_result TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE consolidated_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access own consolidated analyses"
ON consolidated_analyses FOR ALL TO authenticated
USING (patient_id IN (
  SELECT p.id FROM patients p
  JOIN clinicians c ON c.id = p.clinician_id
  WHERE c.user_id = auth.uid()
));
```

### 5. Hooks: `src/hooks/useConsolidatedAnalysis.ts`
- `useConsolidatedAnalyses(patientId)` — lista análises
- `useAddConsolidatedAnalysis()` — mutation para salvar
- `useDeleteConsolidatedAnalysis()` — mutation para excluir

### 6. Integração: `src/pages/PacienteDetalhe.tsx`
- Nova seção "Análise Consolidada" dentro da tab Evolução
- Botão "Upload múltiplo para análise"
- Lista de análises consolidadas anteriores

---

## Fluxo de Uso

1. Médico clica em "Upload múltiplo para análise"
2. Seleciona 2-5 fotos do paciente
3. Define o ângulo de cada foto (Frontal, Posterior, Lateral)
4. Informa o objetivo: "Percentual de gordura" ou "Avaliação de composição corporal"
5. Opcionalmente informa peso/altura/circ. abdominal
6. Clica em "Analisar com IA"
7. Sistema faz upload das fotos → chama edge function → exibe resultado
8. Médico revisa, edita se necessário, e salva no prontuário

---

## Considerações Técnicas

| Item | Decisão |
|------|---------|
| Modelo de IA | Gemini 2.5 Flash (multimodal, custo-benefício) |
| Máximo de fotos | 5 por análise |
| Tamanho máximo | 5MB por imagem |
| Storage | Bucket existente `evolution-photos` |
| Fluxo de análise individual | **Preservado** (ângulo "Outro" para manchas) |
| Persistência | Tabela `consolidated_analyses` |

---

## Entregáveis

1. Migration SQL para tabela `consolidated_analyses`
2. Edge function `multiple-photo-analysis/index.ts`
3. Componente `MultiplePhotoUpload.tsx`
4. Componente `ConsolidatedAnalysisCard.tsx`
5. Hook `useConsolidatedAnalysis.ts`
6. Integração na página `PacienteDetalhe.tsx`
7. Atualização do `config.toml` para nova edge function

