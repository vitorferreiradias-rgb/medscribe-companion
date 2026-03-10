

# Editar/Trocar Fotos de Sessões de Evolução

## Objetivo
Permitir trocar a imagem de uma foto individual dentro de uma sessão existente, sem precisar excluir e recriar.

## O que será feito

### 1. Hook `useReplaceEvolutionPhoto` (`src/hooks/useSupabaseData.tsx`)
Nova mutation que:
- Recebe `id` (do registro), `patientId`, `oldImagePath` e `newFile`
- Deleta o arquivo antigo do storage
- Faz upload do novo arquivo no storage
- Atualiza o campo `image_path` no banco com o novo caminho

### 2. Botão "Trocar foto" na timeline (`src/pages/PacienteDetalhe.tsx`)
- Em cada foto individual da sessão (na grid de fotos), adicionar um botão de câmera/troca no canto (ao lado do badge de ângulo ou como overlay no hover)
- Ao clicar, abre um `<input type="file">` oculto para selecionar nova imagem
- Ao selecionar, chama o hook `useReplaceEvolutionPhoto` para substituir a imagem no storage e atualizar o registro
- Mostrar loading enquanto troca

### 3. Fluxo
1. Usuário vê a sessão na timeline com as fotos
2. Passa o mouse sobre uma foto → aparece ícone de "trocar" (câmera com setas)
3. Clica → seleciona nova foto do dispositivo
4. Sistema substitui no storage e atualiza o registro
5. Toast de confirmação

## Arquivos modificados
- `src/hooks/useSupabaseData.tsx` — novo hook `useReplaceEvolutionPhoto`
- `src/pages/PacienteDetalhe.tsx` — botão de troca em cada foto da sessão + input file oculto + handler

