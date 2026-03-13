

# Avaliação Comparativa de Lesões Focais

## Problema atual
Quando uma sessão tem 2+ fotos focais (ex: mesma mancha em datas diferentes, ou dois ângulos da mesma lesão), cada foto é analisada **isoladamente**. O médico quer um botão que envie **ambas as fotos juntas** para obter uma conclusão comparativa unificada — mantendo os diagnósticos diferenciais e a caracterização, mas **somando** as informações das duas imagens.

## Solução

### 1. Backend — Atualizar `evolution-compare` Edge Function
Adicionar suporte a um terceiro modo: quando `afterImagePath` é fornecido **e** o contexto contém `FOCO DA ANÁLISE`, usar o **MODO DE ANÁLISE FOCAL COMPARATIVA**:
- Caracterizar a lesão em cada foto (ANTES e DEPOIS)
- Comparar evolução (tamanho, bordas, cor, textura)
- Fornecer diagnósticos diferenciais consolidados considerando ambas as fotos
- Score de evolução focal

O prompt focal comparativo já existe parcialmente (linhas 218-237 do edge function), mas precisa ser reforçado para que, no modo 2 fotos + focal, a IA gere a conclusão combinada com diagnósticos unificados.

### 2. Frontend — Botão "Comparar Lesões com IA" em `PacienteDetalhe.tsx`
Quando uma sessão tiver **2+ fotos focais** (angle === "outro"), exibir um botão adicional:
- **"Comparar lesões com IA"** (ícone GitCompareArrows ou similar)
- Envia as duas fotos focais juntas via `handleAiCompare` (ou nova função similar) com `patientContext` incluindo o foco
- Exibe resultado unificado abaixo, com mesmos controles (editar, salvar, imprimir)

Se houver exatamente 2 fotos focais na sessão, o botão aparece automaticamente. Se houver mais, permitir selecionar quais 2 comparar.

### Arquivos a editar
- **`supabase/functions/evolution-compare/index.ts`** — Ajustar prompt no modo focal + 2 fotos para gerar conclusão comparativa consolidada com diagnósticos unificados
- **`src/pages/PacienteDetalhe.tsx`** — Adicionar botão de comparação focal e lógica de invocação

### Fluxo do usuário
1. Cria sessão com 2 fotos focais (ex: "mancha no braço" antes e depois)
2. Pode avaliar cada uma individualmente (já funciona)
3. **Novo**: Botão "Comparar lesões com IA" aparece quando há 2+ fotos focais
4. Clica → IA recebe ambas as fotos → gera relatório comparativo com diagnósticos combinados
5. Resultado aparece com opções de editar, salvar e imprimir

