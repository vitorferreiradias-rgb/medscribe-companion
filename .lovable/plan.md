

## Plano: Edge Function com 3 modos + Modal de resultado com PDF

### 1. Edge Function `consolidated-analysis/index.ts`

Atualizar para:
- Receber o campo `action` do body (`composition` | `compare` | `evolution`)
- Selecionar o prompt correto com base na action
- Usar modelo `google/gemini-3-pro-image-preview` (Nano Banana Pro) em vez de `gemini-2.5-pro`
- Salvar resultado no campo `resultado_analise_ia` (já existente na tabela `avaliacoes_corporais`)

Prompts por ação:

| Action | Prompt |
|--------|--------|
| `composition` | Especialista em composição corporal. 3 fotos (F+P+C), relatório técnico estruturado |
| `compare` | Comparação de 2 fotos de datas diferentes, comentário breve e motivador |
| `evolution` | 2 grupos de 3 fotos, laudo de evolução comparativa detalhado |

### 2. Modal de resultado com impressão

Criar `src/components/AnalysisResultModal.tsx`:
- Dialog elegante que recebe o texto do resultado e metadata (data, tipo de análise, nome do paciente)
- Exibe o relatório formatado com `whitespace-pre-wrap`
- Botão "Imprimir Relatório" que usa `window.print()` com CSS `@media print` para gerar PDF limpo
- Botões: Editar, Imprimir, Fechar

### 3. Integração no `PacienteDetalhe.tsx`

- Após a análise concluir com sucesso, abrir o modal automaticamente com o resultado
- Também permitir abrir o modal a partir do `AvaliacoesCorporaisCard` ao clicar em uma avaliação concluída

### 4. Integração no `AvaliacoesCorporaisCard.tsx`

- Ao expandir uma avaliação concluída, adicionar botão "Imprimir Relatório" ao lado do botão "Editar"
- Alternativamente, abrir o modal ao clicar (para ter a experiência de impressão)

### Arquivos editados
- `supabase/functions/consolidated-analysis/index.ts` — prompts por action + modelo Nano Banana Pro
- `src/components/AnalysisResultModal.tsx` — novo componente modal com impressão
- `src/pages/PacienteDetalhe.tsx` — abrir modal após análise
- `src/components/AvaliacoesCorporaisCard.tsx` — botão imprimir no card

