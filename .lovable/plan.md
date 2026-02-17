

# Correcao de Simetria do Calendario

## Problema

O calendario usa celulas com largura fixa (`w-9` = 36px) em linhas `flex`, totalizando 252px para 7 colunas. Como o container e mais largo que isso, sobra espaco vazio a direita, criando assimetria visual.

## Solucao

Trocar larguras fixas por larguras fluidas (`flex-1`) para que as 7 colunas preencham 100% da largura disponivel, mantendo simetria perfeita entre bordas esquerda e direita.

## Mudancas

### 1. `src/components/ui/calendar.tsx` - Grid fluido

Alterar as classNames do DayPicker:

- **`head_row`**: de `"flex"` para `"flex w-full"` (garantir largura total)
- **`head_cell`**: trocar `w-9` por `flex-1 text-center` para distribuir igualmente
- **`row`**: ja tem `"flex w-full"` (manter)
- **`cell`**: trocar `h-9 w-9` por `h-9 flex-1` para ocupar largura proporcional
- **`day`** (botao): trocar `h-9 w-9` por `h-9 w-full` para preencher a celula
- **`caption`**: manter `flex justify-center` com `px-2` para alinhar com o grid
- **`nav_button_previous`**: de `absolute left-1` para `absolute left-0`
- **`nav_button_next`**: de `absolute right-1` para `absolute right-0`

### 2. `src/components/MiniCalendar.tsx` - Ajuste do compact calendar

Atualizar os overrides de classe no compact calendar (linha 101) para refletir as novas classes fluidas:

- Trocar `[&_.rdp-head_cell]:w-6` por `[&_.rdp-head_cell]:flex-1 [&_.rdp-head_cell]:text-center`
- Trocar `[&_.rdp-cell]:w-6` por `[&_.rdp-cell]:flex-1`
- Trocar `[&_.rdp-day]:w-6` por `[&_.rdp-day]:w-full`
- Manter alturas (`h-6`) e tamanhos de fonte

### Secao Tecnica

**`src/components/ui/calendar.tsx`** (6 linhas afetadas):
- Linha 28: `head_cell` - `w-9` -> `flex-1 text-center`
- Linha 31: `cell` - `h-9 w-9` -> `h-9 flex-1`
- Linha 32: `day` - `h-9 w-9` -> `h-9 w-full`
- Linha 25: `nav_button_previous` - `left-1` -> `left-0`
- Linha 26: `nav_button_next` - `right-1` -> `right-0`

**`src/components/MiniCalendar.tsx`** (linha 101):
- Atualizar overrides CSS do compact calendar para usar `flex-1` e `w-full` em vez de larguras fixas (`w-6`)

