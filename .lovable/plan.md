

# Proximos Passos — Redesign Completo MedScribe

O passo 1 (Tokens + Layout base) ja foi implementado. Restam 3 blocos de trabalho para completar o redesign descrito no prompt.

---

## Passo 2: Redesign da Agenda (Home)

Reformular a pagina `/agenda` para seguir o grid 12-colunas e as proporcoes do prompt (Timeline 5-6 cols, OneClick 4-5 cols).

**Mudancas:**
- KPI cards redesenhados: icone + titulo + valor + indicador de tendencia (seta micro animada), usando glass-card com hover de elevacao
- Timeline do dia com indicador visual do horario atual (linha horizontal colorida que marca "agora")
- Items da timeline com avatar/inicial do paciente, badges de status discretos (usando as classes .status-*), tipo de consulta como chip sutil
- Painel OneClick com card do paciente mais elaborado (avatar circular, nome grande, badges de idade/sexo/tipo, clinico)
- Grid 2x2 de CTAs com icones maiores (48px touch target), labels claros, bordas glass
- Card "Notas rapidas" com autosave visual (indicador "salvo" discreto)
- Card "Pendencias" com lista compacta e status colorido
- Transicoes suaves (150ms ease-out hover, 250ms ease-in-out ao trocar paciente selecionado)
- Empty state com ilustracao e CTA unico
- Skeleton de 300ms ao trocar de dia

**Arquivos:**
- `src/pages/Agenda.tsx` — rewrite do layout e componentes internos

---

## Passo 3: Redesign do Prontuario + Receita + Dieta

Reformular `/consultas/:id` para incluir receita medica (placeholder) e area de dieta.

**Mudancas:**
- Header do paciente com glass-card refinado, acoes sticky com glass-topbar
- Editor SOAP com accordions + barra lateral colorida (azul auto, verde editado) — ja existe, refinar visualmente
- Aba "Receita" nova nas tabs laterais: formulario com campos de medicamento, dosagem, instrucoes, validade, e secao "Certificado Digital" com status visual (selo, badge "Valido/Invalido", botao "Assinar" desabilitado com tooltip explicativo)
- Aba "Dieta" nova: placeholder elegante com icone, titulo, texto explicativo e area de texto para rascunho
- Transcricao chat: refinar bolhas com radius mais suave, sombra micro, hover para copiar
- Checklist com barra de progresso refinada
- Timeline/historico mantido como esta

**Arquivos:**
- `src/pages/ConsultaDetalhe.tsx` — adicionar abas Receita e Dieta, refinar visual
- `src/components/ReceitaPlaceholder.tsx` — novo componente para a aba de receita
- `src/components/DietaPlaceholder.tsx` — novo componente para a aba de dieta

---

## Passo 4: Refinamento das Paginas Secundarias + NewEncounterDialog

Aplicar o visual glass e as proporcoes do prompt nas demais paginas.

**Mudancas:**
- `/consultas` (lista): KPI cards com glass refinado, tabela com hover states visiveis, filtros em linha com dropdowns glass
- `/pacientes`: mesma abordagem de tabela, botoes de acao por linha (editar, excluir, historico, agendar consulta, iniciar consulta)
- `/perfil`: cards glass com espacamento 16-24px, visual de formulario mais polido
- `NewEncounterDialog`: refinar o step indicator (barra de progresso glass), timer SVG com cores mais suaves, bolhas de transcricao com radius 16px, skeleton de geracao mais elaborado
- Microinteracoes: hover 150ms ease-out em todos os botoes, transicoes de pagina 250ms ease-in-out

**Arquivos:**
- `src/pages/Consultas.tsx` — refinamento visual
- `src/pages/Pacientes.tsx` — refinamento + acoes extras por linha
- `src/pages/Perfil.tsx` — refinamento glass
- `src/components/NewEncounterDialog.tsx` — polish visual

---

## Ordem sugerida

| Passo | Escopo | Complexidade |
|-------|--------|-------------|
| 2 | Agenda (Home) | Media-Alta |
| 3 | Prontuario + Receita + Dieta | Media |
| 4 | Paginas secundarias + Dialog | Media |

Cada passo pode ser implementado independentemente. Recomendo seguir na ordem 2 > 3 > 4.

---

## Detalhes tecnicos

- Todos os componentes usam shadcn/ui, framer-motion para animacoes, lucide-react para icones
- Glass effects via classes utilitarias ja criadas (.glass-card, .glass-surface, .glass-topbar)
- Cores de status via classes .status-* ja definidas no CSS
- Modelo de dados nao muda — Receita e Dieta sao placeholders visuais sem novo tipo no localStorage
- Tipografia Inter ja configurada com escala h1/h2/h3/body
- Container max 1440px ja definido no layout

