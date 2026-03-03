

# Corrigir persistencia da receita: localStorage para Supabase

## Problema
A receita esta sendo gerada e exibida corretamente no preview (confirmado pelo session replay - o usuario conseguiu selecionar "Receita Controle Especial"). Porem, ao assinar, o documento e salvo em **localStorage** (`src/lib/clinical-documents.ts`) em vez de ser inserido na tabela `clinical_documents` do banco de dados. Resultado: a receita "desaparece" ao recarregar e nao aparece no prontuario do paciente.

O mesmo problema afeta o historico de medicacoes (`medication-history.ts`), tambem em localStorage.

## Solucao

### 1. Atualizar SmartPrescriptionPreview para salvar no Supabase
- Substituir `addDocument()` (localStorage) por `supabase.from("clinical_documents").insert()`
- Substituir `addMedicationEvent()` (localStorage) por insert na tabela de prescriptions ou clinical_documents
- Passar `clinicianId` como prop (necessario pela tabela e RLS)
- A tabela `clinical_documents` ja existe com as colunas: `id`, `patient_id`, `clinician_id`, `type`, `title`, `content`, `status`, `recipe_type`, `compliance` (jsonb), `signed_at`, `signed_by`, `encounter_id`, `created_at`

### 2. Atualizar SmartAssistantDialog
- Passar `clinicianId` para o `PrescriptionPreviewData` e para o componente `SmartPrescriptionPreview`

### 3. Arquivos modificados
- `src/components/smart-prescription/SmartPrescriptionPreview.tsx` — trocar localStorage por Supabase client
- `src/components/SmartAssistantDialog.tsx` — passar clinicianId ao preview

### 4. Nao precisa de migracao
A tabela `clinical_documents` ja existe com RLS configurada. So precisa usar o client Supabase em vez do localStorage.

