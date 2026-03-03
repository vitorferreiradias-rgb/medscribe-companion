

# Ângulo "Outro" com análise focal integrada

## Ideia

Adicionar a opção **"Outro"** no select de Ângulo. Ao selecionar "Outro", aparece um campo de texto para descrever o que está sendo fotografado (ex: "mancha no braço direito", "lesão no dorso"). Isso substitui o campo separado "Foco da análise" — fica tudo integrado no fluxo do ângulo, mais simples e intuitivo.

O campo **Observações** já existe e serve para o médico descrever sintomas (ex: "paciente sente ardor, queimação e febre há 3 dias"). Quando o ângulo for "Outro", a IA recebe tanto a descrição do foco quanto as observações e gera um relatório dermatológico/focal com sugestão diagnóstica.

## Como funciona

1. Médico seleciona **Ângulo → Outro**
2. Aparece campo: "O que está sendo fotografado? (ex: mancha no braço direito)"
3. Médico preenche **Observações**: "ardor, queimação e febre há 3 dias"
4. Sobe a foto
5. Ao comparar com IA, o sistema detecta ângulo "outro" e ativa modo focal automaticamente — gera relatório dermatológico com sugestão diagnóstica

## Mudanças

### 1. `src/pages/PacienteDetalhe.tsx`

- **Select de Ângulo** (upload e edição): adicionar `<SelectItem value="outro">Outro</SelectItem>`
- **Campo condicional**: quando `photoAngle === "outro"`, mostrar `<Input>` com placeholder "O que está sendo fotografado? Ex: mancha no braço direito" — o valor vai para `analysis_focus`
- **Remover** o campo separado "Foco da análise (opcional)" que existe hoje — fica redundante
- **`handleAiCompare`**: quando ângulo for "outro", montar contexto focal automaticamente usando `analysis_focus` + `notes` (observações)
- **Timeline badge**: quando ângulo for "outro" e `analysis_focus` preenchido, exibir badge com ícone `ScanSearch` e o texto do foco

### 2. Edge Function `evolution-compare/index.ts`

- O prompt já tem o modo focal implementado (detecta "FOCO DA ANÁLISE:")
- Adicionar instrução para que, no modo focal, a IA também **sugira diagnósticos diferenciais** com base na imagem e nas observações clínicas fornecidas, deixando claro que são sugestões e não diagnósticos definitivos

### 3. Sem mudança no banco
- Coluna `analysis_focus` já existe
- Coluna `angle` já aceita texto livre

### Seção técnica

- Estado `photoFocus` / `editFocus` já existem — reutilizados
- Quando `photoAngle === "outro"`, campo `analysis_focus` fica obrigatório (validar antes do upload)
- Quando `photoAngle !== "outro"`, `analysis_focus` é limpo automaticamente
- O `angleLabels` no contexto da IA recebe `outro: "Outro (focal)"`

