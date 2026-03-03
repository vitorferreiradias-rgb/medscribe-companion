

# Modo de análise focal (lesão/região específica)

## Ideia

Adicionar um campo opcional **"Foco da análise"** no formulário de upload e edição de fotos. Quando preenchido, a IA adapta o relatório para focar naquela região/lesão específica em vez de fazer análise corpo inteiro.

## Como funciona para o usuário

1. Ao subir uma foto, o médico vê um campo de texto opcional: **"Foco da análise (ex: mancha no braço direito, lesão no dorso)"**
2. Se preenchido, ao comparar fotos, a IA gera um relatório **dermatológico focado** naquela região em vez do relatório corporal completo
3. Se vazio, comportamento atual (análise corpo inteiro)

## Mudanças

### 1. Banco de dados — migração
Adicionar coluna `analysis_focus` (text, nullable) à tabela `evolution_photos`.

### 2. `src/pages/PacienteDetalhe.tsx`

- **Formulário de upload**: adicionar `<Input>` com placeholder "Foco da análise — ex: mancha no antebraço esquerdo" (opcional)
- **Formulário de edição inline**: mesmo campo
- **Badge na timeline**: se `analysis_focus` preenchido, exibir badge com ícone `Focus` e o texto
- **Contexto da IA** (`handleAiCompare`): se `analysis_focus` estiver preenchido em qualquer uma das fotos, incluir no `patientContext` e sinalizar modo focal

### 3. `src/hooks/useSupabaseData.tsx`
Incluir `analysis_focus` nas mutations de add e update.

### 4. Edge Function `evolution-compare/index.ts`
Adicionar ao `systemPrompt` uma instrução condicional:

> Quando o contexto incluir "FOCO DA ANÁLISE: [região]", concentre o relatório exclusivamente nessa região. Substitua a análise corporal completa por uma análise dermatológica detalhada da área indicada, incluindo: morfologia da lesão, bordas, coloração, textura, simetria, evolução entre as fotos, e classificação ABCDE se aplicável a lesões pigmentadas.

### Seção técnica

- Estado: `photoFocus` / `editFocus` (strings)
- Coluna `analysis_focus` text nullable — sem breaking change
- A IA decide automaticamente o modo (focal vs corpo inteiro) com base na presença do campo no contexto
- Ícone Lucide: `ScanSearch` ou `Focus` para o badge

