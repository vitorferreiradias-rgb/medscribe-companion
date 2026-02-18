
# Redesenhar aba "Historico" com Timeline de Consultas do Paciente

## Resumo

Substituir a timeline atual (que mostra edições de seções) por uma timeline completa do paciente, listando todas as consultas e prescrições salvas, com separação visual e ícones para visualizar resumo e medicações.

## O que muda visualmente

```text
HISTÓRICO DO PACIENTE
─────────────────────
● 15/02/2026 — Consulta (revisado)        [📋 Resumo] [💊 Medicações]
  Queixa: dor lombar
─────────────────────────────────────────
● 10/02/2026 — Consulta (final)            [📋 Resumo] [💊 Medicações]
  Queixa: cefaleia
─────────────────────────────────────────
◆ 08/02/2026 — Interconsulta               [💊 Medicações]
  (cor índigo, prescrição sem consulta)
─────────────────────────────────────────
● 01/02/2026 — Consulta (draft)            [📋 Resumo]
  Queixa: acompanhamento
```

- Consultas aparecem com bolinha azul (primary) e cards brancos
- Interconsultas (prescrições sem `encounterId`) aparecem com bolinha índigo e fundo índigo claro
- Cada item é separado por uma linha horizontal (`Separator`)
- Não aparece mais "seção X editada" — somente consultas e prescrições salvas
- Ícones de olho/clipboard para expandir resumo e medicações inline

## Comportamento dos ícones

- **Resumo** (ícone `FileText`): ao clicar, expande/colapsa mostrando o conteúdo das seções do prontuário daquela consulta
- **Medicações** (ícone `Pill`): ao clicar, expande/colapsa mostrando a lista de medicamentos prescritos naquela consulta
- Se não houver prontuário ou medicações, o ícone correspondente não aparece

## Seção técnica

### 1. Reescrever `src/components/ConsultaTimeline.tsx`

**Nova interface de props:**
```tsx
interface Props {
  patientId: string;
  currentEncounterId: string;
  encounters: Encounter[];
  notes: Note[];
  prescriptions: Prescription[];
}
```

**Lógica:**
- Filtrar `encounters` pelo `patientId`, excluindo a consulta atual
- Filtrar `prescriptions` pelo `patientId` sem `encounterId` (interconsultas)
- Montar array unificado ordenado por data decrescente (mais recente primeiro)
- Cada item tem tipo `"consulta"` ou `"interconsulta"`
- Estado local `expandedId` para controlar qual item está expandido (resumo ou meds)

**Renderização:**
- Para cada consulta: data, status badge, queixa, botões de expandir resumo/medicações
- Para cada interconsulta: data, lista de medicamentos, cor índigo
- `Separator` entre cada item
- Consulta atual destacada ou omitida (já visível no prontuário principal)

### 2. Atualizar `src/pages/ConsultaDetalhe.tsx`

- Passar as novas props ao componente `ConsultaTimeline`
- Passar `allPrescriptions` (já carregado no componente) como prop
- Passar `data.encounters`, `data.notes`, `enc.patientId` e `enc.id`

**Alteração na linha 461:**
```tsx
// De:
<ConsultaTimeline createdAt={enc.startedAt} sections={note?.sections ?? []} />

// Para:
<ConsultaTimeline
  patientId={enc.patientId}
  currentEncounterId={enc.id}
  encounters={data.encounters}
  notes={data.notes}
  prescriptions={allPrescriptions}
/>
```

### 3. Imports necessários no ConsultaTimeline

- `FileText`, `Pill`, `Eye`, `ChevronDown` de `lucide-react`
- `StatusBadge` para exibir status
- `Separator` de `@/components/ui/separator`
- `formatDateTimeBR` de `@/lib/format`
- `Button` de `@/components/ui/button`
- Tipos `Encounter`, `Note`, `Prescription` (usar o tipo existente de PrescriptionFlow)
