

# Ajustar grid da agenda e cores AI (ambar) nos componentes

## 1. Grid da agenda com tamanho variavel

Atualmente o card da timeline tem `min-h-[420px]` fixo (linha 329 de Agenda.tsx). Isso faz o card ficar grande mesmo com poucos agendamentos.

**Mudanca:** Remover o `min-h-[420px]` fixo e deixar o card crescer naturalmente com base no numero de itens. Cada item ocupa ~68px de altura, entao o card se ajusta automaticamente.

### Arquivo: `src/pages/Agenda.tsx`
- Linha 329: trocar `min-h-[420px]` por nenhum min-height (o card cresce conforme os agendamentos)

## 2. Cores ambar no QuickNotesCard

O card ja usa a classe `glass-card-ai` (borda ambar), mas os icones e botoes internos ainda usam `text-primary` (azul). Precisam usar `text-ai` (ambar).

### Arquivo: `src/components/QuickNotesCard.tsx`
- Linha 98: icone StickyNote — trocar `text-primary/70` por `text-ai`
- Linha 105: botao Plus — trocar `text-primary hover:bg-primary/10` por `text-ai hover:bg-ai-soft`
- Linha 172-173: checkbox done — trocar `bg-primary border-primary` por `bg-ai border-ai`
- Linha 174: checkbox undone — trocar `border-primary/40 hover:border-primary/70` por `border-ai/40 hover:border-ai/70`
- Linha 177: checkmark — trocar `text-primary-foreground` por `text-white`

## 3. Botao "One Click" com cor ambar

O botao "One Click" na agenda (linha 253-255) usa `variant="outline"` padrao. Deve ter identidade AI (ambar).

### Arquivo: `src/pages/Agenda.tsx`
- Linha 253-255: adicionar classes ambar ao botao One Click — `border-ai/30 text-ai hover:bg-ai-soft` e trocar icone Sparkles para `text-ai`

## Resumo das mudancas

| Arquivo | O que muda |
|---------|-----------|
| `src/pages/Agenda.tsx` | Remover min-h fixo do card; estilizar botao One Click com ambar |
| `src/components/QuickNotesCard.tsx` | Trocar todas as cores `primary` por `ai` (ambar) nos icones e botoes |

