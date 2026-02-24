

# Atualizar Evolution Compare para Gemini 2.5 Pro com Análise Corporal Detalhada

## Resumo

Duas mudanças na edge function `evolution-compare`:

1. **Modelo**: `google/gemini-2.5-flash` → `google/gemini-2.5-pro`
2. **Prompt**: Expandir para incluir análise detalhada região por região do corpo

## Mudanças

### `supabase/functions/evolution-compare/index.ts`

**Linha 91** — Trocar o modelo:
```
model: "google/gemini-2.5-pro"
```

**Linhas 49-67** — Substituir o `systemPrompt` por uma versão com análise corporal detalhada:

O novo prompt instruirá a IA a analisar separadamente:
- **Rosto e pescoço** — contorno facial, papada, definição mandibular
- **Braços** — volume, definição muscular, flacidez
- **Tronco/Peito** — proporção, postura, ginecomastia
- **Abdômen** — circunferência aparente, distensão, definição
- **Cintura** — contorno lateral, relação cintura-quadril visual
- **Quadril e glúteos** — volume, proporção
- **Pernas (coxas e panturrilhas)** — volume, definição, celulite
- **Postura geral** — alinhamento, lordose, cifose
- **Pele** — coloração, estrias, flacidez, textura
- **Composição corporal aparente** — estimativa visual de percentual de gordura, distribuição de massa

Incluirá também:
- Tabela resumo com classificação por região (melhora significativa / leve / estável / piora leve / piora significativa)
- Score geral de evolução
- Se peso foi informado no contexto, correlacionar com as mudanças visuais

### Seção técnica

Apenas mudanças na edge function — sem alteração no frontend, banco de dados ou outras funções. A API e formato de resposta permanecem idênticos (campo `analysis` com texto markdown). O Pro pode levar 5-15s para responder (vs 2-5s do Flash), mas o loading state já está implementado no frontend.

