

# Correlação Temporal: Exames + Fotos com Datas

## Problema identificado

O `buildPatientContext()` atual envia dados como peso, altura e ângulo das fotos, mas **não inclui as datas das fotos**. Se adicionarmos exames laboratoriais com datas, a IA não conseguirá correlacionar temporalmente (ex: "a foto de março mostra melhora compatível com a normalização do TSH em fevereiro").

## Solução: 3 mudanças

### 1. Nova tabela `patient_lab_results` (migration)

Tabela para armazenar exames laboratoriais e biópsias:
- `id`, `patient_id`, `date`, `type` (laboratorial/biopsia), `name`, `result`, `reference_range`, `notes`, `created_at`
- RLS: mesmo padrão das demais tabelas (acesso via `patients → clinicians → auth.uid()`)

### 2. UI — Seção "Exames" na página do paciente

Em `PacienteDetalhe.tsx`, adicionar:
- Formulário para cadastrar exames (nome, tipo, resultado, referência, data, observações)
- Tabela listando exames ordenados por data
- Botões editar/excluir

### 3. Atualizar `buildPatientContext()` com datas

Modificar a função para incluir:

**a) Datas das fotos:**
```
"Foto ANTES: 15/01/2026 (Frontal, 85kg). Foto DEPOIS: 10/03/2026 (Frontal, 78kg)"
```

**b) Exames recentes do paciente (últimos 12 meses):**
```
"Exames laboratoriais: Hemoglobina glicada: 7.2% (ref: <5.7%) em 10/02/2026; TSH: 8.5 mUI/L (ref: 0.4-4.0) em 10/02/2026. Biópsia: Carcinoma basocelular nodular (12/01/2026)."
```

A IA receberá todas as datas juntas e poderá fazer correlações como:
- "A foto de março (após normalização do TSH em fevereiro) mostra redução de edema facial compatível"
- "O resultado da biópsia de janeiro confirma o diagnóstico sugerido pela análise visual"

### Arquivos modificados

| Arquivo | Mudança |
|---|---|
| **Migration SQL** | Criar tabela `patient_lab_results` com RLS |
| **`src/pages/PacienteDetalhe.tsx`** | Seção "Exames" (CRUD) + atualizar `buildPatientContext()` para incluir datas das fotos e exames recentes |
| **`src/hooks/useSupabaseData.tsx`** | Funções para buscar/inserir/deletar exames |

Nenhuma alteração nas Edge Functions — os prompts já instruem a IA a usar dados clínicos e respeitar a hierarquia de evidência (biópsia > lab > visual).

