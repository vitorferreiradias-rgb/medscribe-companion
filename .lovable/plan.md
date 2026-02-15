
# Refatoracao do Modal de Medicamentos

## Problema atual
O modal de adicionar medicamento mistura os dois tipos (industrial e manipulado) num unico formulario com checkbox. O usuario precisa preencher "Nome comercial" mesmo para formula manipulada, e nao ha campo de "Formula de uso" (posologia) para medicamentos industriais.

## Mudancas

### 1. Modal com duas abas separadas (Tabs)
No topo do modal, dois botoes/tabs:
- **Medicamento** (icone Pill) — para medicamentos industriais pre-cadastrados
- **Formula Manipulada** (icone FlaskConical) — para formulas manipuladas

### 2. Aba "Medicamento" (industrial)
Campos:
- Nome comercial (obrigatorio)
- Composto ativo
- Concentracao
- Apresentacao
- **Formula de uso** (novo campo Textarea) — ex: "Tomar 1 comprimido de 8/8h por 7 dias"

### 3. Aba "Formula Manipulada"
Campos (sem nome comercial):
- Descricao/nome da formula (campo de texto livre, obrigatorio)
- **Formula de uso** (Textarea) — posologia/instrucoes de uso

### 4. Interface Medication atualizada
Adicionar campo `usageInstructions: string` ao tipo `Medication`. A tabela exibe a formula de uso ao clicar na linha (expand), junto com a formula manipulada quando aplicavel.

### 5. Tabela — coluna "Formula de uso"
Ao selecionar uma linha, exibir a formula de uso no painel expandido (mesmo local onde hoje aparece a formula manipulada), para ambos os tipos.

---

## Detalhes tecnicos

**Arquivo:** `src/components/receita/MedicationsTable.tsx`

- Adicionar `usageInstructions: string` na interface `Medication`
- Substituir o checkbox `isCompounded` por um state `medType: "industrial" | "compounded"` no modal
- Renderizar campos condicionalmente conforme a aba selecionada
- Validacao: industrial exige `commercialName`, manipulado exige `compoundedFormula`
- Painel expandido mostra `usageInstructions` para ambos os tipos e `compoundedFormula` so para manipulados
