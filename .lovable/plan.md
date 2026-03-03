

# Enriquecer análise de evolução com dados clínicos + alertas cutâneos + ícones nos ângulos

## Resumo

Adicionar dados clínicos automáticos e manuais ao contexto da IA, reforçar alertas cutâneos no prompt, remover opção ¾, e trocar selects por botões visuais com ícones.

---

## 1. Migração de banco

Adicionar 3 colunas à tabela `evolution_photos`:

- `height` numeric nullable — altura em cm
- `waist_circumference` numeric nullable — circunferência abdominal em cm
- `treatment_goal` text nullable — objetivo do tratamento

---

## 2. Frontend — `src/pages/PacienteDetalhe.tsx`

### 2a. Contexto da IA (~linha 243)

Montar `patientContext` incluindo dados automáticos do prontuário:
- **Idade** (calculada de `patient.birthDate`)
- **Sexo** (`patient.sex`)
- **Diagnósticos** (`patient.diagnoses`)
- **Alergias medicamentosas** (`patient.drugAllergies`)

E dados das fotos:
- Peso, altura, circunferência abdominal, objetivo do tratamento, ângulo, notas

Remover `tres_quartos` do `angleLabels`.

### 2b. Formulário de upload (~linha 1044)

Adicionar inputs para:
- Altura (cm)
- Circunferência abdominal (cm)
- Objetivo do tratamento (select: emagrecimento, hipertrofia, recomposição corporal, pós-bariátrica, outro)

### 2c. Formulário de edição inline (~linha 903)

Adicionar os mesmos 3 campos novos.

### 2d. Seletores de ângulo (upload + edição)

Trocar `<select>` por grupo de botões visuais (ToggleGroup) com ícones Lucide:
- `User` → Frontal
- `UserRound` → Posterior
- `ArrowRight` → Lateral Dir.
- `ArrowLeft` → Lateral Esq.

Remover opção `tres_quartos` de ambos os formulários.

### 2e. Badge de exibição (~linha 990)

Remover referência a `tres_quartos`.

---

## 3. Mutations — `src/hooks/useSupabaseData.tsx`

- `useAddEvolutionPhoto`: aceitar `height`, `waist_circumference`, `treatment_goal` e incluí-los no insert
- `useUpdateEvolutionPhoto`: aceitar os 3 novos campos no objeto `updates`

---

## 4. Edge Function — `supabase/functions/evolution-compare/index.ts`

### 4a. Remover ¾ do prompt

Remover "¾ (três quartos)" do Passo 0 e da tabela de visibilidade.

### 4b. Reforçar alertas cutâneos

Adicionar ao `systemPrompt` uma seção dedicada:

```
## ALERTAS CUTÂNEOS

Ao analisar a seção de Pele, observe e alerte sobre:
- Eritema difuso ou localizado
- Urticária ou pápulas
- Edema visível
- Lesões pigmentadas novas ou alteradas
- Padrões compatíveis com dermatite
- Textura anormal (ressecamento extremo, descamação)
- Cicatrizes não previamente documentadas

Se o paciente possui alergias medicamentosas informadas, correlacione achados cutâneos 
com possíveis reações alérgicas e destaque como ⚠️ ALERTA.
```

### 4c. Instruir IA a usar novos dados

Adicionar instrução para usar idade, sexo, diagnósticos, alergias, altura e circunferência abdominal nas estimativas de composição corporal e na correlação com dados antropométricos.

---

## Seção técnica

- Ícones Lucide: `User`, `UserRound`, `ArrowLeft`, `ArrowRight`
- ToggleGroup já está disponível no projeto (`src/components/ui/toggle-group.tsx`)
- O campo `angle` continua texto livre no banco — sem breaking change
- States para novos campos: `photoHeight`, `photoWaist`, `photoGoal` (upload) e `editHeight`, `editWaist`, `editGoal` (edição)

