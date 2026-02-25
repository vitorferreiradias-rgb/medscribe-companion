

# Adicionar edição de dados nas fotos de evolução

## O que muda

Cada foto na timeline de evolução terá um botão de editar (icone de lápis) que abre um formulário inline para alterar descrição, data, peso, ângulo e observações — sem precisar excluir e recriar a foto.

## Mudanças

### 1. Hook de atualização (`src/hooks/useSupabaseData.tsx`)

Criar `useUpdateEvolutionPhoto` — uma mutation que faz `UPDATE` na tabela `evolution_photos` pelos campos editáveis (`label`, `date`, `weight`, `angle`, `notes`) e invalida o cache.

### 2. UI de edição inline (`src/pages/PacienteDetalhe.tsx`)

- Adicionar estado `editingPhotoId` para controlar qual foto está em modo de edição
- Adicionar um botão de editar (icone `Pencil`) ao lado dos botões existentes (Comparar, Ampliar, Excluir)
- Quando ativo, substituir o header e metadata da foto por inputs editáveis:
  - Input para descrição (label)
  - Input date para data
  - Input number para peso
  - Select para ângulo (mesmas opções do formulário de upload)
  - Input para observações
- Botões "Salvar" e "Cancelar" no rodapé do formulário de edição
- Ao salvar, chamar `useUpdateEvolutionPhoto` e sair do modo de edição

### Seção técnica

- Nenhuma migração de banco necessária — os campos já existem na tabela
- Nenhuma mudança em RLS — a policy `ALL` existente já cobre `UPDATE`
- O hook segue o mesmo padrão dos outros `useUpdate*` já existentes no arquivo
- Estados temporários de edição: `editingPhotoId`, `editLabel`, `editDate`, `editWeight`, `editAngle`, `editNotes`

