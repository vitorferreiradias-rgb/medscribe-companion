

# Tornar a transcricao com IA opcional

## Situacao atual

Na Etapa 2 da Nova Consulta, o layout sempre mostra dois paineis: editor manual (esquerda) e prontuario IA (direita). O footer sempre exibe o botao "Finalizar e gerar prontuario". O usuario nao tem opcao de usar apenas o editor manual sem a parte de IA.

## Solucao

Adicionar um toggle/switch na Etapa 1 (identificacao) para o usuario escolher se quer usar a IA ou nao. Quando desativado, a Etapa 2 mostra apenas o editor manual em tela cheia, sem o painel de IA nem a secao de gravacao/transcricao.

### Mudancas na Etapa 1

- Novo campo com Switch: "Usar transcricao com IA" (ativado por padrao)
- Descricao breve: "Grave ou cole a transcricao da consulta para gerar o prontuario automaticamente"

### Mudancas na Etapa 2

**Quando IA desativada:**
- Layout de coluna unica: apenas o editor manual ocupando toda a largura
- Sem secao de gravacao/transcricao (collapsible removido)
- Footer simplificado: apenas "Salvar rascunho" e "Salvar consulta" (salva direto sem chamar IA)

**Quando IA ativada:**
- Comportamento atual mantido (duas colunas, gravacao, geracao IA)

### Secao tecnica

Arquivo: `src/pages/NovaConsulta.tsx`

- Novo state: `const [useAI, setUseAI] = useState(true)`
- Na Etapa 1: adicionar componente `Switch` do shadcn abaixo dos campos de identificacao
- Na Etapa 2:
  - Se `!useAI`: renderizar `manualEditorPane` sem o `Collapsible` de gravacao, em largura total
  - Se `useAI`: manter layout atual de duas colunas
- No footer:
  - Se `!useAI`: botao "Salvar consulta" que chama `handleMergeAndSave` diretamente (sem gerar IA)
  - Se `useAI`: botoes atuais mantidos

