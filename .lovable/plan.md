

# Card "Notas Rapidas" com Liquid Glass Laranja

## Resumo
Criar um card de notas rapidas com efeito glass laranja elegante na pagina da Agenda, com textarea auto-expansivel e persistencia em localStorage.

## Onde sera posicionado
Na pagina `src/pages/Agenda.tsx`, abaixo do card de timeline e acima do card de Calendario+Noticias (ou entre eles, conforme melhor fluxo visual).

## Implementacao

### 1. Novo componente: `src/components/QuickNotesCard.tsx`

**Visual (glass laranja):**
- Background: `rgba(255,255,255,0.55)` com `backdrop-filter: blur(20px) saturate(180%)`
- Borda: `1px solid rgba(255,140,80,0.35)`
- Highlight interno: `inset 0 1px 0 rgba(255,255,255,0.85)`
- Sombra: `0 14px 30px rgba(15,23,42,0.10)`
- Glow laranja sutil: `0 0 0 1px rgba(255,140,80,0.35), 0 10px 30px rgba(255,140,80,0.18)`
- Ao focar textarea: intensificar glow em ~15%

**Conteudo:**
- Titulo "Notas rapidas" (texto pequeno, muted)
- Textarea com:
  - `min-height: 44px` (1 linha)
  - Auto-grow via JS (ajusta height ao scrollHeight)
  - `max-height: 260px`, depois scroll interno
  - Placeholder: "Digite aqui lembretes, tarefas e compromissos rapidos..."
  - Background transparente, sem borda visivel (integrado ao card)

**Checklist inline (opcional mas incluso):**
- Linhas iniciadas com `"- "` sao renderizadas como itens de checklist
- Ao clicar, alterna entre concluido (line-through) e pendente
- Estado salvo no mesmo campo de texto (prefixo `"- [x] "` para concluidos)

**Persistencia:**
- localStorage key: `notes_quick_v1`
- Debounce de 400ms no save
- Carrega valor ao montar

**Acessibilidade:**
- `aria-label="Notas rapidas"` no textarea
- Focus visible com ring laranja

### 2. CSS: `src/index.css`
- Adicionar classe `.glass-card-orange` com os tokens de glow laranja
- Variante focus: `.glass-card-orange:focus-within` com glow intensificado

### 3. Integracao: `src/pages/Agenda.tsx`
- Importar e renderizar `<QuickNotesCard />` entre o card de timeline e o card de calendario+noticias

## Arquivos modificados
1. `src/components/QuickNotesCard.tsx` (novo)
2. `src/index.css` (adicionar classe glass-card-orange)
3. `src/pages/Agenda.tsx` (importar e posicionar o card)

## O que NAO sera alterado
- Nenhum componente existente modificado (alem do import na Agenda)
- Layout geral, sidebar, topbar
- Store principal, tipos, seed data
