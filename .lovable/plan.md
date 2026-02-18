

# Historico de Medicacoes + Ultimos Documentos

## Resumo

Duas funcionalidades novas na experiencia de consulta:

**A) Historico de Medicacoes** — Icone no header que abre um Sheet lateral com timeline de eventos por medicamento (prescrito/suspenso/nao renovado), com busca e observacoes livres.

**B) Ultimos Documentos** — Botao na aba Receita para listar documentos anteriores do paciente, com acoes "Repetir e renovar assinatura" e "Editar para assinar".

---

## A) Historico de Medicacoes

### Modelo de dados

Novo tipo `MedicationEvent` e nova chave localStorage `medscribe_medication_history`:

```text
MedicationEvent:
  id: string
  patientId: string
  medicationName: string
  date: string (ISO)
  status: "prescrito" | "suspenso" | "nao_renovado"
  note?: string
  encounterId?: string
```

### Novo arquivo: `src/lib/medication-history.ts`

- Funcoes CRUD: `loadMedicationHistory()`, `saveMedicationHistory()`, `addMedicationEvent()`, `getMedicationHistoryForPatient(patientId)`
- Persistencia em `localStorage` com chave `medscribe_medication_history`

### Novo componente: `src/components/MedicationHistorySheet.tsx`

- Sheet lateral (lado direito)
- Titulo: "Historico de medicacoes e observacoes"
- Campo de busca no topo para filtrar por nome de medicamento
- Lista agrupada por medicamento (usando Collapsible/Accordion)
- Dentro de cada grupo: timeline de eventos ordenada por data desc
- Cada evento mostra: data (dd/mm/aaaa), Badge de status (Prescrito=verde, Suspenso=vermelho, Nao renovado=amarelo), observacao opcional
- Botao para adicionar evento manualmente (suspender, nao renovar, com observacao)

### Integracao em `ConsultaDetalhe.tsx`

- Icone `ClipboardList` (ou `Pill`) no header card do paciente, ao lado das informacoes
- Ao clicar, abre o `MedicationHistorySheet` passando `patientId`

### Auto-registro de eventos

- No `PrescriptionFlow.tsx`, ao assinar uma receita, registrar automaticamente um evento "prescrito" para cada medicamento da receita no historico do paciente

---

## B) Ultimos Documentos

### Modelo de dados

Novo tipo `ClinicalDocument` e nova chave localStorage `medscribe_documents`:

```text
ClinicalDocument:
  id: string
  patientId: string
  encounterId?: string
  type: "prescricao" | "atestado" | "solicitacao_exames" | "orientacoes" | "outro"
  title?: string
  content: string
  createdAt: string (ISO)
  signedAt?: string (ISO)
  signedBy?: string
  status: "draft" | "signed"
```

### Novo arquivo: `src/lib/clinical-documents.ts`

- `loadDocuments()`, `saveDocuments()`, `addDocument()`, `getDocumentsForPatient(patientId)` — ultimos 20, ordenados por `createdAt` desc

### Novo componente: `src/components/LastDocumentsSheet.tsx`

- Sheet lateral ou Dialog
- Titulo: "Ultimos documentos"
- Lista dos documentos do paciente com: tipo (badge), data, preview de 1 linha do conteudo, status (draft/signed)
- Duas acoes por documento:
  - **"Repetir e renovar"**: cria novo documento com novo id, nova data, marca como signed (mock), toast de confirmacao
  - **"Editar para assinar"**: copia conteudo para o editor de prescricao ativo, toast informando

### Integracao em `PrescriptionFlow.tsx`

- Botao "Ultimos documentos" adicionado ao lado do botao "Nova Receita" ou na area de acoes da prescricao
- Ao assinar receita, salvar automaticamente como `ClinicalDocument` do tipo "prescricao"

### Assinatura simulada

- Campos `signedAt` e `signedBy` preenchidos com data atual e nome do clinico mock
- Documento assinado fica travado para edicao (somente duplicar como novo)

---

## Arquivos impactados

| Arquivo | Acao |
|---------|------|
| `src/lib/medication-history.ts` | Novo — CRUD localStorage |
| `src/lib/clinical-documents.ts` | Novo — CRUD localStorage |
| `src/components/MedicationHistorySheet.tsx` | Novo — Sheet com timeline |
| `src/components/LastDocumentsSheet.tsx` | Novo — Sheet com lista de docs |
| `src/pages/ConsultaDetalhe.tsx` | Adicionar icone do historico no header |
| `src/components/receita/PrescriptionFlow.tsx` | Adicionar botao "Ultimos documentos" + auto-registro de eventos ao assinar |
| `src/types/index.ts` | Adicionar tipos `MedicationEvent` e `ClinicalDocument` |

---

## Secao tecnica

### Fluxo de auto-registro ao assinar

No `PrescriptionFlow.tsx`, na funcao `signPrescriptions`:
1. Para cada medicamento da(s) receita(s) assinada(s), chamar `addMedicationEvent({ patientId, medicationName, date: now, status: "prescrito", encounterId })`
2. Criar um `ClinicalDocument` com `type: "prescricao"`, `content` = texto da receita, `status: "signed"`, `signedAt` e `signedBy` preenchidos

### Fluxo "Repetir e renovar"

1. Clonar documento selecionado com novo `id`, nova `createdAt`, `signedAt = now`, `signedBy = "Dr. Mock"`, `encounterId = consulta atual`
2. Salvar no localStorage
3. Toast: "Documento repetido e renovado com sucesso."

### Fluxo "Editar para assinar"

1. Copiar `content` do documento selecionado para o `content` da prescricao ativa no `PrescriptionFlow`
2. Fechar o Sheet
3. Toast: "Conteudo carregado para edicao."
4. Medico edita e assina normalmente pelo fluxo existente

