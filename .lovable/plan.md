

# Reorganizacao da Home (/agenda) - "Central do Dia"

## Resumo

Reorganizar a pagina /agenda para eliminar duplicacao de CTAs, criar um padrao de acoes rapidas limpo (menu "+" e Command Bar), e abrir espaco para conteudo util como Noticias, Pendencias e Alertas. Nenhuma funcionalidade sera removida; apenas reorganizada.

## Mudancas na Topbar

### Substituir os 3 botoes individuais por:

1. **CTA principal "Nova consulta"** - botao visivel com texto (variante default/primary)
2. **Botao "+" (Quick Actions)** - abre um DropdownMenu com:
   - Nova consulta (n)
   - Novo agendamento (a)
   - Novo paciente
   - Colar transcricao
3. **Command Bar (Ctrl/Cmd+K)** - CommandDialog com busca + mesmas acoes rapidas

O atalho "/" continua focando a busca. Atalhos "n" e "a" continuam funcionando. Novo atalho Cmd+K abre o Command Bar.

## Nova Estrutura da Home (3 zonas)

```text
+---------------------------------------------------------------------+
| TOPBAR: Sidebar | Busca | <Hoje> data | "Nova consulta" | [+] menu  |
+---------------------------------------------------------------------+
| ESQUERDA (3 col)   | CENTRO (5-6 col)     | DIREITA (3-4 col)       |
| - Mini Calendario  | - Chips filtro       | - Painel paciente sel.  |
| - Resumo do dia    |   (Todos/Pendentes/  |   (dados + CTAs fluxo)  |
|   (chips: total,   |    Em atend.)        | - Notas rapidas         |
|   pendentes, etc.) | - Timeline/lista     | - Pendencias            |
| - Filtros rapidos  |   com acoes context. | - Noticias (card tabs)  |
|                    |   e marcador "Agora" |                         |
|                    |   + destaque proximo |                         |
+---------------------------------------------------------------------+
```

### Zona Esquerda (lg:col-span-3)
- Mini Calendario (ja existente, manter)
- Card "Resumo do dia" com chips: total agendamentos, pendentes, em atendimento, concluidos, rascunhos
- Chips de filtro clicaveis: "Todos", "Pendentes", "Em atendimento"

### Zona Centro (lg:col-span-5)
- Barra de chips/filtros acima da timeline
- Timeline de horarios do dia (mesma logica atual, simplificada)
- Acoes contextuais por item via icones + tooltip (Iniciar, Abrir, Finalizar, Remarcar) - sem repetir "Nova consulta" em cada card
- Marcador "Agora" (ja existente)
- Destaque visual no proximo paciente (borda/glow sutil)
- Empty state com CTA "Criar agendamento" e "Carregar seed"

### Zona Direita (lg:col-span-4)
- Painel do paciente selecionado (ja existente, manter com CTAs de fluxo)
- Notas rapidas (ja existente)
- Pendencias do paciente (ja existente)
- **Novo: Card "Noticias"** (abaixo das pendencias)
- **Novo: Card "Alertas do dia"** (pacientes em atraso, faltas)

## Remocao da faixa de agenda duplicada

A faixa horizontal de cards de pacientes no topo (linhas 236-301 do Agenda.tsx) sera removida, pois a timeline central ja exibe os mesmos dados. Isso libera espaco vertical significativo.

## Modulo de Noticias (mock)

### Card na coluna direita
- Titulo "Noticias" com icone Newspaper
- Tabs: "Hoje", "Diretrizes", "Medicacoes", "Eventos"
- Lista de 5-7 itens mock com: titulo, fonte, data
- Skeleton/loading simulado ao trocar de tab
- Botao "Ver todas" que abre a rota /noticias

### Pagina /noticias (nova rota)
- Pagina placeholder com lista maior de itens mock (15-20)
- Layout simples com busca e filtros por categoria
- Sem backend, dados hardcoded

## Card "Alertas do dia"
- Lista compacta com icones de alerta
- Itens mock: "2 pacientes em atraso", "1 falta registrada", "3 rascunhos pendentes"
- Dados derivados dos scheduleEvents e encounters existentes

## Secao Tecnica

### Arquivos novos
- **`src/components/CommandBar.tsx`** - CommandDialog com busca global + acoes rapidas (Nova consulta, Novo agendamento, Novo paciente, Colar transcricao). Atalho Cmd/Ctrl+K.
- **`src/components/QuickActionsMenu.tsx`** - DropdownMenu para o botao "+" na Topbar.
- **`src/components/NewsCard.tsx`** - Card de noticias com tabs e itens mock. Inclui dados hardcoded e skeleton loading.
- **`src/components/AlertsCard.tsx`** - Card de alertas do dia, recebe scheduleEvents e encounters como props.
- **`src/components/DaySummaryCard.tsx`** - Card de resumo do dia com chips de metricas.
- **`src/pages/Noticias.tsx`** - Pagina placeholder com lista expandida de noticias mock.

### Arquivos modificados
- **`src/components/Topbar.tsx`** - Remover 3 botoes individuais. Adicionar CTA "Nova consulta" (botao com texto), botao "+" que abre QuickActionsMenu, e atalho Cmd+K para CommandBar. Adicionar prop `onPasteTranscript`.
- **`src/components/AppLayout.tsx`** - Montar CommandBar no layout global. Adicionar rota callback para "Colar transcricao".
- **`src/pages/Agenda.tsx`** - Reestruturar para layout de 3 colunas (3+5+4). Remover faixa horizontal de cards duplicada. Adicionar estado de filtro (todos/pendentes/em atendimento). Integrar NewsCard, AlertsCard e DaySummaryCard. Melhorar empty state com "Carregar seed".
- **`src/App.tsx`** - Adicionar rota `/noticias` para a pagina placeholder.

### Fluxo de interacao
1. Usuario abre /agenda e ve layout em 3 colunas com mini calendario a esquerda, timeline ao centro e painel do paciente a direita
2. "Nova consulta" aparece 1 vez como CTA na Topbar; "+" abre menu com todas as acoes
3. Cmd+K abre Command Bar com busca e acoes
4. Chips de filtro permitem ver apenas pendentes ou em atendimento
5. Noticias aparecem no painel direito com tabs; "Ver todas" navega para /noticias
6. Alertas mostram pendencias reais derivadas dos dados existentes

