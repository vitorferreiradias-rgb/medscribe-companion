

# Remover ¾ e adicionar ícones nos seletores de ângulo

## O que muda

- Remove a opção "¾ (Três Quartos)" de todos os seletores de ângulo e do prompt da IA
- Adiciona ícones Lucide ao lado de cada opção de ângulo para tornar visualmente descritivo
- Troca os `<select>` nativos por botões visuais (toggle group) com ícone + texto

## Mudanças

### 1. `src/pages/PacienteDetalhe.tsx`

**3 locais** onde ângulos aparecem:

1. **Formulário de upload** (~linha 1051): trocar `<select>` por grupo de botões visuais com ícones:
   - `User` → Frontal
   - `UserCheck` (ou similar) → Posterior  
   - `ArrowRight` → Lateral Dir.
   - `ArrowLeft` → Lateral Esq.

2. **Formulário de edição inline** (~linha 910): mesma troca

3. **Badge de exibição** (~linha 990): remover referência a `tres_quartos`

4. **Contexto da IA** (~linha 243): remover `tres_quartos` do `angleLabels`

### 2. `supabase/functions/evolution-compare/index.ts`

Remover menção a "¾ (três quartos)" do `systemPrompt` — manter apenas Frontal, Posterior, Lateral direito, Lateral esquerdo.

### Seção técnica

- Ícones Lucide disponíveis: `User`, `PersonStanding`, `ArrowLeft`, `ArrowRight` (ou similares que representem orientação corporal)
- Os botões de ângulo usarão estilo toggle: borda destacada quando selecionado, visual compacto
- Sem mudanças no banco — o campo `angle` continua sendo texto livre, apenas os valores possíveis mudam no frontend

