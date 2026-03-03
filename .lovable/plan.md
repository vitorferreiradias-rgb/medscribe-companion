

# Migrar MedicationHistory de localStorage para banco de dados

## O que precisa ser feito

### 1. Criar tabela `medication_events` no banco
Nova tabela com colunas: `id`, `patient_id`, `clinician_id`, `medication_name`, `date`, `status`, `note`, `encounter_id`, `created_at`. RLS baseada em `clinician_id` (mesmo padrão das outras tabelas).

### 2. Atualizar `medication-history.ts`
Substituir as funções localStorage por versões async que usam o Supabase client:
- `addMedicationEvent(event, clinicianId)` → `supabase.from("medication_events").insert()`
- `getMedicationHistoryForPatient(patientId)` → `supabase.from("medication_events").select().eq("patient_id", patientId)`

### 3. Atualizar `MedicationHistorySheet.tsx`
- Carregar eventos via `useEffect` async em vez de `useState` com initializer síncrono
- `handleAddEvent` passa a ser async com insert no Supabase
- Receber `clinicianId` como prop

### 4. Atualizar `PrescriptionFlow.tsx`
- Trocar chamada `addMedicationEvent()` síncrona por versão async com `clinicianId`

### 5. Atualizar `SmartPrescriptionPreview.tsx`
- Mesmo ajuste: chamada async com `clinicianId` (se ainda usa `addMedicationEvent`)

## Arquivos modificados
- **Migração SQL**: criar tabela `medication_events` + RLS
- `src/lib/medication-history.ts` — reescrever para Supabase
- `src/components/MedicationHistorySheet.tsx` — async loading + clinicianId prop
- `src/components/receita/PrescriptionFlow.tsx` — async addMedicationEvent
- Componentes que montam MedicationHistorySheet — passar clinicianId

