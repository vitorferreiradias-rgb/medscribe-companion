

# Simplificar fluxo de salvamento da Nova Consulta

## O que muda

Remover o botao "Salvar rascunho" e o "Descartar rascunho". Manter apenas um botao principal de salvamento que, ao clicar, salva a consulta completa e redireciona automaticamente para a tela de visualizacao do prontuario (`/consultas/:id`), onde o usuario ja pode editar se necessario.

## Comportamento apos a mudanca

1. Usuario preenche a identificacao (Etapa 1) e escreve no editor (Etapa 2)
2. Clica em "Salvar consulta" (sem IA) ou "Finalizar e gerar prontuario" (com IA)
3. O sistema salva o encounter + note e redireciona para `/consultas/:id`
4. Na tela de detalhe, o usuario ja tem os botoes "Salvar", "Revisado", "Finalizar" e pode editar o texto livremente

## Secao tecnica

**Arquivo: `src/pages/NovaConsulta.tsx`**

- Remover a funcao `handleSaveDraft` (linhas 260-273)
- Remover a funcao `handleDiscard` (linha 275)
- No footer (linhas 676-721):
  - Remover o DropdownMenu com "Cancelar consulta" e "Descartar rascunho"
  - Substituir por um simples botao "Cancelar" (variant ghost) que faz `navigate(-1)`
  - Manter os botoes de salvamento como estao (ja redirecionam para `/consultas/:id` via `handleMergeAndSave`)
- No atalho de teclado Ctrl+S (linha 101): trocar `handleSaveDraft` por `handleMergeAndSave`

O `handleMergeAndSave` ja faz `navigate(\`/consultas/\${enc.id}\`)`, entao o redirecionamento ja funciona. A tela `ConsultaDetalhe.tsx` ja possui os botoes de edicao, revisao e finalizacao.

