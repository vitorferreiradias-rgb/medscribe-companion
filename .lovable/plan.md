

# Onde está a avaliação — problema identificado

## Situação atual

Hoje, para a IA analisar uma foto, é obrigatório **selecionar duas fotos** (ANTES e DEPOIS) e clicar em "Analisar evolução com IA". O botão de análise só aparece no painel de comparação, após selecionar 2 fotos.

Isso faz sentido para evolução corporal, mas **não funciona bem para análise focal** (ângulo "Outro") — um dermatologista pode querer avaliar **uma única foto** de uma lesão sem precisar ter uma segunda foto para comparação.

## Proposta: Análise de foto individual

Adicionar um botão de **análise individual** diretamente em cada card da timeline quando o ângulo for "Outro". Assim o médico pode:

1. Subir uma foto com ângulo "Outro" e descrever o que está sendo fotografado
2. Clicar em **"Avaliar com IA"** direto no card da foto (sem precisar selecionar duas)
3. Receber o relatório dermatológico focal com sugestão diagnóstica

Para fotos com ângulos normais (frontal, posterior, etc.), o fluxo de comparação de duas fotos continua como está.

## Mudanças

### 1. `src/pages/PacienteDetalhe.tsx`
- Adicionar botão **"Avaliar com IA"** (ícone `ScanSearch`) nos cards da timeline quando `photo.angle === "outro"` e `photo.analysis_focus` estiver preenchido
- Criar função `handleSinglePhotoAnalysis(photo)` que invoca a edge function com apenas uma foto
- Exibir o resultado da análise inline no card ou em um dialog/sheet

### 2. Edge Function `evolution-compare/index.ts`
- Tornar `afterImagePath` opcional — quando ausente, analisar foto única
- Ajustar o prompt: se apenas uma imagem for enviada, gerar relatório descritivo/diagnóstico da lesão (sem comparação evolutiva)
- Manter o modo de comparação (duas fotos) funcionando como hoje

### 3. Fluxo completo mantido
- **1 foto + ângulo "Outro"**: botão "Avaliar com IA" no card → análise focal individual
- **2 fotos selecionadas**: botão "Analisar evolução com IA" no painel de comparação → análise comparativa (como hoje)
- **2 fotos + ângulo "Outro"**: comparação focal entre antes e depois da lesão (como hoje)

