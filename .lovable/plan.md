
# Atualizar tema para "Premium Liquid Glass" com acento AI ambar

## Resumo

Atualizar tokens de cores, adicionar novos acentos (Aqua/Violet), refinar estados, criar tokens exclusivos para o modulo Assistente/IA (ambar sutil), e renomear "Assistente" para "One Click" em toda a interface. Sem mudancas de estrutura de paginas.

## Arquivos a alterar

### 1. `src/index.css` -- Tokens CSS

Atualizar/adicionar variaveis CSS:

- **Novos tokens de cor**:
  - `--primary-soft-bg: 216 100% 96%` (#EAF2FF)
  - `--aqua: 181 77% 35%` (#0EA5A8)
  - `--aqua-light: 187 82% 54%` (#22D3EE)
  - `--violet: 263 70% 50%` (#6D28D9)
  - `--violet-light: 263 70% 58%` (#7C3AED)

- **Estados refinados**:
  - `--success: 142 64% 36%` (#15803D)
  - `--warning: 30 65% 48%` (#C9772A)
  - `--destructive: 347 77% 50%` (#E11D48)

- **Tokens IA exclusivos**:
  - `--ai-accent: 30 80% 72%` (#F2C28B)
  - `--ai-accent-hover: 25 74% 68%` (#E8AE72)
  - `--ai-soft-bg: rgba(242,194,139,0.14)`
  - `--ai-ring: rgba(242,194,139,0.28)`
  - `--ai-bloom: rgba(242,194,139,0.16)`

- Remover `--bloom-warm` e `--bloom-warm-subtle` (substituidos pelos tokens AI)

- **Nova classe `.glass-card-ai`** (substitui `.glass-card-orange`):
  - Border com ai-accent em vez de azul
  - Box-shadow com glow ambar sutil
  - Focus-within com ai-ring

- **Nova classe `.ai-dialog-bloom`**: radial-gradient sutil ambar para dialogs do assistente

- Atualizar `.status-draft` e `.status-rescheduled` para usar a nova cor de warning
- Atualizar `.status-recording` e `.status-no_show` para usar a nova cor destructive

### 2. `tailwind.config.ts` -- Novos tokens Tailwind

Adicionar ao `extend.colors`:
- `primary.soft` com `--primary-soft-bg`
- `aqua.DEFAULT` e `aqua.light`
- `violet.DEFAULT` e `violet.light`
- `ai.DEFAULT`, `ai.hover`, `ai.soft`, `ai.ring`, `ai.bloom`

### 3. `src/components/SmartAssistantDialog.tsx` -- Identidade AI

- Renomear titulo "Assistente Inteligente" para "One Click"
- Trocar cor do icone Sparkles de `text-primary` para `text-ai` (ambar)
- Aplicar classe `ai-dialog-bloom` no DialogContent
- Aplicar `ai-ring` no focus do Textarea (ring ambar)
- Badge de exemplos com hover ambar em vez de azul (`hover:bg-ai-soft`)
- Botao "Processar comando" manter azul (primary) -- e a cor dominante da app

### 4. `src/pages/Agenda.tsx` -- Renomear botao

- Linha 254: trocar texto "Assistente" por "One Click"

### 5. `src/components/QuickActionsMenu.tsx` -- Renomear menu item

- Trocar texto "Assistente inteligente" por "One Click"

### 6. `src/components/CommandBar.tsx` -- Renomear command item

- Trocar texto "Assistente inteligente" por "One Click"

### 7. `src/components/QuickNotesCard.tsx` -- Usar nova classe

- Trocar `glass-card-orange` por `glass-card-ai`

## O que NAO muda

- Estrutura de paginas e rotas
- Sidebar/Topbar continuam glass com neutros frios (sem ambar)
- Botoes primarios continuam azuis
- Dark mode nao sera adicionado
- Tipografia Inter mantida
