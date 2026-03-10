

## Problema

Na aba Evolução existem **dois botões** para upload de fotos:
1. **"Adicionar registro de evolução"** — upload de foto individual com ângulo e notas
2. **"Nova Avaliação"** — upload múltiplo para análise consolidada com IA

Isso confunde o usuário. A ideia é manter apenas o botão **"Nova Avaliação"** que já faz upload de múltiplas fotos de uma vez e envia para análise IA.

## Plano

### 1. Remover o botão "Adicionar registro de evolução" e seu formulário

- Remover o botão "Adicionar registro de evolução" (linha 1453-1455)
- Remover o formulário de foto individual (`showPhotoForm` e todo o bloco de angle select, notes input, "Selecionar foto") — linhas ~1407-1443
- Simplificar a lógica condicional: quando não está em modo de upload, mostrar apenas o botão "Nova Avaliação"

### 2. Limpar estado e handlers não utilizados

- Remover states: `showPhotoForm`, `photoAngle`, `photoFocus`, `photoNotes` (se ficarem sem uso)
- Remover handler `handleAddEvolutionPhoto` (se ficar sem uso)
- Manter imports de `useAddEvolutionPhoto` apenas se ainda for usado em outro lugar

### 3. Resultado

A aba Evolução terá apenas um botão de upload ("Nova Avaliação") que abre o `MultiPhotoUploader` para envio em lote + análise IA.

### Arquivos editados
- `src/pages/PacienteDetalhe.tsx`

