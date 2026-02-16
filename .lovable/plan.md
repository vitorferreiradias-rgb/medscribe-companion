

# Reorganizar Home: Remover elementos e reposicionar Noticias

## Resumo

Remover DaySummaryCard, AlertsCard e o botao "Novo agendamento" do estado vazio. Mover o NewsCard para a coluna esquerda (abaixo do MiniCalendar). Adicionar interacao de clique unico para expandir a noticia dentro do card e duplo clique para abrir o site de origem.

## Mudancas

### 1. Remover da Home (`src/pages/Agenda.tsx`)

- **DaySummaryCard** (linhas 257-262): remover componente e import
- **AlertsCard** (linha 652): remover componente e import
- **Botao "Novo agendamento"** no estado vazio do painel direito (linha 643): remover o botao, manter apenas o texto informativo
- **NewsCard** da coluna direita (linha 655): remover daqui

### 2. Mover NewsCard para coluna esquerda

Posicionar o NewsCard logo abaixo do MiniCalendar na coluna esquerda (lg:col-span-3), mantendo o visual atual.

### 3. Expandir noticia ao clicar (`src/components/NewsCard.tsx`)

- Adicionar campo `summary` e `url` aos dados mock de cada noticia
- Adicionar estado `expandedIndex` que controla qual noticia esta expandida
- **Clique unico**: a noticia selecionada ocupa todo o espaco da lista, mostrando titulo completo (sem truncate), summary, fonte e data. Um botao "Voltar" retorna a lista.
- **Duplo clique**: abre `window.open(url, '_blank')` para o site de origem
- A interacao usa `onClick` com timer para distinguir clique simples de duplo clique

### Secao Tecnica

**`src/components/NewsCard.tsx`**
- Atualizar interface `NewsItem` com `summary: string` e `url: string`
- Adicionar dados mock de summary e URLs placeholder para cada item
- Estado `expandedIndex: number | null`
- Logica de clique: usar ref de timer para detectar single vs double click (300ms threshold)
- Single click: `setExpandedIndex(i)` - exibe noticia expandida com summary completo
- Double click: `window.open(item.url, '_blank')`
- Visao expandida: titulo completo, summary, fonte, data, botao "Voltar a lista"

**`src/pages/Agenda.tsx`**
- Remover imports de `DaySummaryCard` e `AlertsCard`
- Remover `DaySummaryCard` da coluna esquerda
- Remover `AlertsCard` e `NewsCard` da coluna direita
- Adicionar `NewsCard` na coluna esquerda abaixo do `MiniCalendar`
- Remover o `Button` "Novo agendamento" do empty state do painel direito
- Remover estado `filter` e `setFilter` (usado apenas pelo DaySummaryCard)
- Simplificar `filteredEvents` para sempre mostrar todos os `dayEvents`

