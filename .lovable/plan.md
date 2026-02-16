

# Diferenciacao Visual: Receitas da Consulta vs. Interconsultas

## Resumo
Ao exibir as medicacoes no prontuario unificado, as receitas prescritas **durante a consulta** e as receitas de **interconsultas** (fora da consulta) terao cores distintas para facilitar a identificacao visual.

## Esquema de Cores

| Origem | Cor da borda lateral | Fundo do bloco | Icone/Label |
|--------|---------------------|----------------|-------------|
| Consulta (Conduta) | Azul Primary (`#1F6FEB`) | `bg-primary/5` | "Conduta" em azul |
| Interconsulta | Indigo (`#6366F1`) | `bg-indigo/5` | "Interconsulta" em indigo |

O indigo ja esta definido no sistema de design (`--indigo-light: #6366F1`) e se diferencia claramente do azul primary, mantendo harmonia visual.

## O que sera feito

### 1. Vincular prescricoes a consultas
**Arquivo: `src/types/index.ts`**
- Adicionar `encounterId?: string` e `patientId?: string` a interface `Prescription` (exportada do PrescriptionFlow, sera movida para types)

**Arquivo: `src/components/receita/PrescriptionFlow.tsx`**
- Aceitar prop `encounterId?: string` e `patientId?: string`
- Gravar esses campos em cada prescricao criada

### 2. Funcao auxiliar de formatacao
**Arquivo: `src/lib/format.ts`**
- Criar `formatMedicationsForNote(medications): string` que gera texto formatado com nome, concentracao e posologia de cada medicamento

### 3. Injecao no prontuario com cores distintas
**Arquivo: `src/pages/ConsultaDetalhe.tsx`**
- No `handleSave`, ler prescricoes do localStorage
- Separar em dois grupos:
  - **Conduta**: prescricoes com `encounterId` igual ao encounter atual
  - **Interconsultas**: prescricoes do mesmo paciente sem `encounterId`
- Injetar no texto unificado:
  - Bloco `## Plano / Conduta` com medicacoes da consulta
  - Bloco `## Interconsultas` com medicacoes externas e data
- Renderizar visualmente abaixo do textarea com dois cards coloridos distintos:

```text
+-- borda azul (primary) --------------------------------+
| [icone azul] CONDUTA - Medicacoes desta consulta       |
| - Amoxicilina 500mg - 1cp 8/8h por 7 dias             |
| - Dipirona 1g - 1cp 6/6h se dor                       |
+--------------------------------------------------------+

+-- borda indigo -----------------------------------------+
| [icone indigo] INTERCONSULTAS - Prescricoes externas   |
| - Losartana 50mg - 1cp pela manha (15/02/2026)         |
+--------------------------------------------------------+
```

### 4. Template SOAP atualizado
**Arquivo: `src/lib/soap-template.ts`**
- Adicionar secao `{ id: "interconsultas", title: "Interconsultas", ... }` ao template

### 5. Passagem de props
**Arquivo: `src/pages/ConsultaDetalhe.tsx`**
- Passar `encounterId={enc.id}` e `patientId={enc.patientId}` ao componente `ReceitaPlaceholder` / `PrescriptionFlow` na aba Receita

**Arquivo: `src/components/ReceitaPlaceholder.tsx`**
- Aceitar e repassar as props `encounterId` e `patientId`

