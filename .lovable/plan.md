

# Objetivo do tratamento: permitir múltipla seleção

## Problema
O select atual permite apenas um objetivo. Pacientes frequentemente têm objetivos combinados (ex: emagrecimento + hipertrofia).

## Solução
Trocar o `Select` por um grupo de checkboxes que permite marcar múltiplos objetivos. O valor é armazenado como texto separado por vírgula (ex: `"emagrecimento,hipertrofia"`), sem mudança no banco (campo `treatment_goal` continua `text`).

## Opções disponíveis
- Emagrecimento
- Hipertrofia
- Recomposição corporal
- Pós-bariátrica
- Manutenção
- Outro (campo texto livre)

## Mudanças

### 1. `src/pages/PacienteDetalhe.tsx`
- **Formulário de upload (~linha 1121)**: Trocar `<Select>` por grupo de `<Checkbox>` com labels. Estado `photoGoal` passa a ser string com valores separados por vírgula.
- **Formulário de edição inline (~linha 967)**: Mesma troca.
- **Badge de exibição**: Mostrar múltiplos objetivos como badges separados.

### 2. Sem mudança no banco
O campo `treatment_goal` já é `text` — armazena `"emagrecimento,hipertrofia"`. A IA já recebe como texto livre no contexto, então interpreta naturalmente.

