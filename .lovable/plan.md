

# Passo 4: Refinamento das Paginas Secundarias + NewEncounterDialog

Ultimo bloco de trabalho do redesign. Aplica o visual "Liquid Glass" e as proporcoes do prompt nas paginas restantes.

---

## 4.1 — Lista de Consultas (`src/pages/Consultas.tsx`)

- KPI cards no topo com `.glass-card`, icones e indicadores de tendencia
- Tabela/lista com hover states visiveis (elevacao suave, borda accent)
- Filtros em linha com dropdowns glass
- Botao "+Nova Consulta" com destaque primario

## 4.2 — Pacientes (`src/pages/Pacientes.tsx`)

- Mesma abordagem de tabela glass com hover refinado
- Acoes por linha expandidas: editar, excluir, historico, agendar consulta, iniciar consulta
- Busca e filtros com visual glass consistente

## 4.3 — Perfil (`src/pages/Perfil.tsx`)

- Cards glass com espacamento 16-24px
- Formularios mais polidos com labels e inputs refinados
- Secoes visuais separadas por glass-cards

## 4.4 — NewEncounterDialog (`src/components/NewEncounterDialog.tsx`)

- Step indicator com barra de progresso glass (backdrop-blur)
- Timer SVG circular com cores mais suaves (primary ao inves de destructive puro)
- Bolhas de transcricao com radius 16px e sombra micro
- Skeleton de geracao mais elaborado (pulso suave, mais linhas)
- Transicoes entre passos com framer-motion (slide/fade 250ms)

## 4.5 — Microinteracoes globais

- Hover 150ms ease-out em todos os botoes interativos
- Transicoes de pagina 250ms ease-in-out onde aplicavel

---

## Arquivos a editar

| Arquivo | Escopo |
|---------|--------|
| `src/pages/Consultas.tsx` | KPIs glass, tabela refinada, filtros |
| `src/pages/Pacientes.tsx` | Tabela glass, acoes extras por linha |
| `src/pages/Perfil.tsx` | Cards glass, formulario polido |
| `src/components/NewEncounterDialog.tsx` | Progress glass, timer suave, bolhas 16px |

---

## Complexidade

Media — sao refinamentos visuais sobre componentes ja existentes, sem mudanca de modelo de dados.

