

# Adicionar botões de Excluir Foto Individual e Excluir Laudo

## O que será feito

Dois novos botões na timeline de evolução:

1. **Excluir foto individual** — botão Trash no hover de cada miniatura de foto (ao lado do botão de trocar foto já existente), que remove aquela foto específica da sessão
2. **Excluir laudo** — botão Trash ao lado do botão "Editar" no resultado de análise focal e no resultado da comparação consolidada, que limpa o laudo exibido

## Arquivo a editar

**`src/pages/PacienteDetalhe.tsx`**

### 1. Botão de excluir foto individual (por miniatura)
- Adicionar um segundo botão no overlay de hover de cada foto (linhas ~1387-1400), ao lado do botão "Trocar foto" (Camera)
- Ícone `Trash2`, cor destructive, com confirmação simples (ou direto com toast)
- Chama `handleRemoveEvolutionPhoto(photo.id, photo.image_path)` que já existe

### 2. Botão de excluir laudo focal individual
- Na barra de ações do resultado da análise focal (linhas ~1486-1503), adicionar botão Trash2 que limpa `singleAnalysisResult[focalPhoto.id]` do state
- Se o laudo já foi salvo no prontuário (`ai_analysis`), também chamar `updateEvolutionPhotoMutation` para limpar o campo `ai_analysis` no banco

### 3. Botão de excluir laudo comparativo consolidado
- No bloco do `focalCompareResult[sessaoId]` (linhas ~1559-1568), adicionar botão Trash2 no header que limpa `focalCompareResult[sessaoId]` do state

