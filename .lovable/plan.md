

# Adicionar Massa Muscular Esquelética e Distribuição Muscular ao Relatório

## Objetivo
Integrar a estimativa de massa muscular esquelética com distribuição regional e avaliação abdominal ao relatório de composição corporal, usando o prompt refinado fornecido pelo usuário como base de calibração da IA.

## Mudanças

### 1. Prompt de composição (`supabase/functions/consolidated-analysis/index.ts`)

Adicionar ao template do caso `composition`:

- **Painel de Indicadores**: adicionar linha `Massa Muscular Esquelética Estimada | valor kg | ± X kg`
- **Nova seção "Distribuição Muscular Estimada"** (após Análise Regional):
  ```
  | Região | Nível |
  | Membros Superiores | baixo/moderado/alto |
  | Tronco | baixo/moderado/alto |
  | Membros Inferiores | baixo/moderado/alto |
  ```
- **Nova seção "Avaliação Abdominal"** (após Distribuição Muscular):
  ```
  | Parâmetro | Nível |
  | Adiposidade Abdominal | baixa/moderada/alta |
  | Risco de Gordura Visceral | baixo/moderado/alto |
  ```
- **Nova seção "Confiabilidade da Estimativa"**: nível (baixa/moderada/alta) e margem de erro em kg

Nas REGRAS, adicionar:
- Usar circunferência abdominal como fator de correção para % gordura e gordura visceral quando disponível
- Derivar massa muscular esquelética a partir da massa livre de gordura ajustada
- Nunca apresentar valores como medição exata

### 2. Prompt de resumo (`supabase/functions/summarize-analysis/index.ts`)

Adicionar `Massa Muscular Esquelética` à tabela de indicadores do resumo e incluir a distribuição muscular resumida nos destaques quando relevante.

### Arquivos modificados
- `supabase/functions/consolidated-analysis/index.ts` — prompt composition expandido
- `supabase/functions/summarize-analysis/index.ts` — indicador adicionado ao resumo

