

## Plano: Avaliação Antropométrica com Estimativas e Margens de Erro

### Contexto

O prompt atual de "composition" faz uma análise visual genérica. Faltam dois elementos:
1. **Dados antropométricos reais** (peso, altura, circunferência) não são passados para a edge function — o prompt da IA não recebe esses valores
2. **O prompt não pede estimativas quantitativas** com margem de erro (% gordura, massa magra, TMB, etc.)

### Alterações

#### 1. Passar dados antropométricos para a edge function (`src/pages/PacienteDetalhe.tsx`)

Ao disparar a análise de composição, buscar os dados antropométricos mais recentes das `evolution_photos` selecionadas (weight, height, waist_circumference) e incluí-los no body da chamada:

```typescript
body: {
  avaliacaoId,
  photoPaths,
  action,
  patientContext: ...,
  anthropometrics: { weight, height, waistCircumference }  // novo
}
```

#### 2. Atualizar o prompt de composição na edge function (`supabase/functions/consolidated-analysis/index.ts`)

Substituir o prompt do case "composition" pelo novo prompt completo que inclui:

- Avaliação visual por região (mantém o existente)
- Cálculos antropométricos baseados em IMC, relação cintura/altura
- Estimativas com margem de erro: % gordura, massa gorda (kg), massa magra (kg), massa muscular (kg), TMB (kcal/dia), gordura visceral
- Classificação corporal (atleta, fitness, normal, sobrepeso, obesidade)
- Formato de resposta estruturado conforme especificado pelo usuário

O `getUserPrompt` para "composition" também será atualizado para incluir os dados antropométricos quando disponíveis:

```
Dados antropométricos: Peso: 85kg, Altura: 1.75m, Circunferência abdominal: 92cm
```

#### 3. Atualizar o user prompt (`getUserPrompt`)

Receber o objeto `anthropometrics` e incluí-lo no prompt do usuário para que o modelo use os dados reais nos cálculos.

### Arquivos modificados
- `src/pages/PacienteDetalhe.tsx` — extrair e enviar dados antropométricos
- `supabase/functions/consolidated-analysis/index.ts` — novo prompt de composição + receber anthropometrics

