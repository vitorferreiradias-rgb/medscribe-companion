

## Problema

Atualmente, o fluxo "Adicionar registro de evolução" permite subir **apenas 1 foto por vez**. Para criar uma sessão completa (Frente + Perfil + Costas), o usuário precisa clicar 3 vezes no botão, preencher os campos 3 vezes e selecionar 1 foto de cada vez. Isso é tedioso e causa problemas de agrupamento (sessao_id).

## Solução

Transformar o formulário de "Nova foto de evolução" em um formulário de **sessão multi-foto**. O usuário abre o formulário uma vez, preenche os dados compartilhados (data, peso, altura, etc.), e pode adicionar várias fotos de uma vez, cada uma com seu ângulo. Todas as fotos são salvas com o mesmo `sessao_id`.

## Fluxo proposto

1. Usuário clica "Adicionar registro de evolução"
2. Abre o formulário com campos compartilhados (data, peso, altura, circunferência, objetivo, observações)
3. Área de upload multi-foto com seleção de ângulo por foto (grid com 3 slots: Frente, Perfil, Costas + opção "Outro")
4. Usuário pode arrastar/selecionar até 3+ fotos, cada uma associada a um ângulo
5. Ao clicar "Salvar sessão", todas as fotos são enviadas em lote com o mesmo `sessao_id`

## Alterações

### 1. Novo componente `SessionPhotoUploader.tsx`
- Grid com 3 slots fixos (Frente, Perfil, Costas) + botão para adicionar "Outro"
- Cada slot aceita 1 foto (click ou drag)
- Campos compartilhados da sessão (data, peso, altura, circ. abdominal, objetivo, observações) ficam acima
- Botão "Salvar sessão" fica habilitado quando há pelo menos 1 foto

### 2. Alterar `PacienteDetalhe.tsx`
- Substituir o formulário single-photo (`showPhotoForm`) pelo novo `SessionPhotoUploader`
- No submit, iterar sobre as fotos selecionadas e chamar `addEvolutionPhotoMutation` para cada uma, passando o mesmo `sessao_id` e os mesmos dados compartilhados (data, peso, etc.)
- Remover os states individuais de photo (photoLabel, photoAngle, photoWeight, etc.) que ficam redundantes

### 3. Hook `useAddEvolutionPhoto` (sem alteração)
- O hook já aceita `sessao_id` como parâmetro, então funciona sem mudanças

## Resultado
- 1 clique → 1 formulário → múltiplas fotos → 1 sessão
- Dados antropométricos preenchidos uma única vez
- Todas as fotos agrupadas automaticamente pelo mesmo `sessao_id`

