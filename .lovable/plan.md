

# Prescricao Inteligente — Plano de Implementacao

## Resumo

Implementar um fluxo completo de "Prescricao Inteligente" na tela de consulta (`/consultas/:id`), acionavel por texto livre ou voz, com roteamento regulatorio automatico (ComplianceRouter), geracao de posologia padrao, confirmacao de divergencias, preview da receita e assinatura eletronica simulada. Tudo local (localStorage), mas estruturado para integracao futura com backend.

---

## Arquitetura Geral

O sistema sera composto por 4 modulos principais:

1. **SmartPrescriptionDialog** — Dialog/Sheet principal para entrada hibrida (texto/voz)
2. **ComplianceRouter** — Classificador regulatorio plugavel (mock agora, backend depois)
3. **MedicationKnowledgeMock** — Base de conhecimento local de medicamentos (posologia, variantes, alertas)
4. **SmartPrescriptionPreview** — Preview da receita gerada com confirmacao e assinatura

```text
Entrada (texto/voz)
       |
       v
  NLP Parser local (regex)
       |
       v
  MedicationKnowledgeMock --> posologia padrao / variantes
       |
       v
  ComplianceRouter --> tipo de receita + requirements + warnings
       |
       v
  Confirmacao de divergencia (se necessario)
       |
       v
  SmartPrescriptionPreview --> revisao + assinatura
       |
       v
  Persistencia (localStorage) --> MedicationEvent + ClinicalDocument
```

---

## Arquivos Novos

| Arquivo | Descricao |
|---------|-----------|
| `src/lib/compliance-router.ts` | ComplianceRouter + RegulatoryMockDB |
| `src/lib/medication-knowledge.ts` | MedicationKnowledgeMock (20 medicamentos) |
| `src/lib/smart-prescription-parser.ts` | Parser de texto livre para extrair medicamento, concentracao, posologia |
| `src/components/smart-prescription/SmartPrescriptionDialog.tsx` | Dialog principal com input hibrido (texto/voz) + chips de exemplo |
| `src/components/smart-prescription/DivergenceConfirmation.tsx` | UI de confirmacao quando posologia diverge do padrao |
| `src/components/smart-prescription/VariantSelector.tsx` | Cards de selecao de esquema terapeutico |
| `src/components/smart-prescription/SmartPrescriptionPreview.tsx` | Preview completo da receita com header, corpo, rodape e botao assinar |
| `src/components/smart-prescription/PosologyPrompt.tsx` | Prompt simples para pedir posologia quando nao reconhecida |

## Arquivos Modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/ConsultaDetalhe.tsx` | Adicionar botao "Prescricao inteligente" + integracao com o fluxo |
| `src/types/index.ts` | Expandir `ClinicalDocument` com campos de compliance e recipeType |
| `src/lib/clinical-documents.ts` | Suportar novos campos no addDocument |
| `src/components/CommandBar.tsx` | Detectar intencao de prescricao e acionar o fluxo |

---

## Detalhamento Tecnico

### 1. Parser de Texto Livre (`smart-prescription-parser.ts`)

Funcao `parsePrescriptionInput(text: string)` que retorna:

```text
{
  medicationName: string | null
  concentration: string | null
  dosage: string | null        // posologia ditada pelo medico
  duration: string | null
  quantity: string | null
  action: "prescrever" | "renovar" | "suspender" | "continuar"
  rawText: string
}
```

Usa regex para extrair padroes como:
- "prescrever Mounjaro 2,5 mg" -> medicationName="Mounjaro", concentration="2,5 mg"
- "1 cp 2x ao dia por 30 dias" -> dosage="1 cp 2x ao dia", duration="30 dias"
- "suspender Mounjaro porque atingiu a meta" -> action="suspender", note="atingiu a meta"
- "renovar ultima prescricao" -> action="renovar"

### 2. MedicationKnowledgeMock (`medication-knowledge.ts`)

Base local com 15-20 medicamentos incluindo:

```text
interface MedicationKnowledge {
  name: string
  aliases: string[]           // nomes alternativos
  category: "simples" | "antimicrobiano" | "controlado"
  defaultDosePatterns: DosePattern[]
  commonForms: string[]
  cautions: string[]
  variants?: DoseVariant[]
}

interface DosePattern {
  concentration: string
  dosage: string              // ex: "1 cp 1x ao dia"
  duration?: string
  quantity?: string
}

interface DoseVariant {
  label: string               // ex: "Esquema padrao"
  description: string
  dosage: string
}
```

Medicamentos incluidos:
- Simples: Paracetamol, Ibuprofeno, Omeprazol, Losartana, Metformina, Atorvastatina, AAS, Dipirona
- Antimicrobianos: Amoxicilina, Azitromicina, Cefalexina
- Controlados: Rivotril (Clonazepam), Fluoxetina, Sertralina, Ritalina
- Com variantes: Mounjaro (tirzepatida), Ozempic (semaglutida), Contrave

### 3. ComplianceRouter (`compliance-router.ts`)

```text
interface ComplianceInput {
  items: ParsedPrescriptionItem[]
  patient: { id: string; name: string }
  prescriber: { name: string; crm: string }
}

interface ComplianceResult {
  recipeType: "simples" | "antimicrobiano" | "controle_especial"
  requirements: string[]
  warnings: string[]
  needsConfirmation: boolean
  suggestedTemplateId: string
  regulatorySource: string
}

function classifyPrescription(input: ComplianceInput): ComplianceResult
```

Logica:
- Busca cada item no RegulatoryMockDB
- Se encontrar "controlado" -> `controle_especial` + Portaria_344_98
- Se encontrar "antimicrobiano" -> `antimicrobiano` + RDC_471_2021
- Senao -> `simples` + Geral
- Se nao reconhecer -> default "simples" + warning

### 4. SmartPrescriptionDialog

Dialog com:
- Input principal com placeholder "Digite ou fale a prescricao..."
- Botao de microfone (usa `useSpeechRecognition` existente)
- Chips de exemplos clicaveis
- Ao submeter: parser -> knowledge lookup -> compliance -> divergence check -> preview

### 5. Fluxo de Divergencia

Se o medico ditar posologia diferente do padrao do mock:
- Mostrar card de confirmacao com 3 botoes: [Manter como ditado] [Ajustar para padrao] [Editar manualmente]
- Registrar decisao com `confirmedByDoctor: true/false` e timestamp

### 6. Selecao de Variantes

Se o MedicationKnowledgeMock tiver `variants` e o medico nao especificar esquema:
- Mostrar 2-3 cards com resumo de cada variante
- Medico seleciona e segue para preview

### 7. SmartPrescriptionPreview

Preview completo com:
- Cabecalho: paciente, data, tipo de receita (Select editavel), badge regulatorio (mock)
- Corpo: itens prescritos com todos os detalhes
- Para controle especial: banner informativo sobre integracao futura SNCR
- Rodape: area de assinatura
- Botoes: [Assinar agora] [Revisar] [Cancelar]

### 8. Assinatura e Persistencia

"Assinar agora":
- Cria `ClinicalDocument` com status "signed", signedAt, signedBy
- Cria `MedicationEvent` para cada item (status "prescrito" ou "suspenso")
- Bloqueia edicao do documento assinado
- Audit trail local com `confirmedByDoctor` e timestamp

### 9. Expansao do Tipo ClinicalDocument

Adicionar campos opcionais ao tipo existente:

```text
// Novos campos em ClinicalDocument
recipeType?: "simples" | "antimicrobiano" | "controle_especial"
compliance?: {
  regulatorySource: string
  requirements: string[]
  warnings: string[]
  needsConfirmation: boolean
  confirmedByDoctor?: boolean
}
```

### 10. Integracao com ConsultaDetalhe

Na aba "Receita" da consulta:
- Botao primario "Prescricao inteligente" (icone sparkles) acima do PrescriptionFlow existente
- Ao clicar, abre SmartPrescriptionDialog
- Ao finalizar, o documento gerado aparece na lista de prescricoes e no historico

### 11. Integracao com CommandBar

Adicionar deteccao de intencao no CommandBar:
- Se o texto digitado contiver "prescrever", "receita", "renovar", "suspender", "continuar"
- Mostrar opcao "Prescricao inteligente" que abre o dialog com o texto pre-preenchido

### 12. Historico e Ultimos Documentos

Ja existem (`MedicationHistorySheet` e `LastDocumentsSheet`). Integrar:
- Icone de historico de medicacoes ja esta no header da consulta
- Botao "Ultimos documentos" ja existe no PrescriptionFlow
- Adicionar link para "Ultimos documentos" tambem dentro do SmartPrescriptionPreview

---

## Ordem de Implementacao

1. Tipos expandidos (`types/index.ts`)
2. `medication-knowledge.ts` — base de dados mock
3. `smart-prescription-parser.ts` — parser de texto livre
4. `compliance-router.ts` — roteador regulatorio
5. `PosologyPrompt.tsx` — prompt de posologia
6. `DivergenceConfirmation.tsx` — confirmacao de divergencia
7. `VariantSelector.tsx` — selecao de esquema
8. `SmartPrescriptionPreview.tsx` — preview da receita
9. `SmartPrescriptionDialog.tsx` — dialog principal orquestrando todo o fluxo
10. `ConsultaDetalhe.tsx` — integracao do botao e fluxo
11. `CommandBar.tsx` — deteccao de intencao de prescricao
12. `clinical-documents.ts` — suporte aos novos campos

