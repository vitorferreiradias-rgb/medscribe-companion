

# Marcação visual na foto para análise focal

## Ideia

Quando o campo "Foco da análise" estiver preenchido, permitir que o médico clique na foto para colocar um marcador (pin/círculo) indicando a localização exata da lesão/região. As coordenadas (percentuais x,y) são salvas no banco e enviadas à IA como contexto adicional, além de serem exibidas visualmente na timeline.

## Como funciona

1. Ao preencher "Foco da análise" no upload ou edição, aparece um botão "Marcar na foto"
2. Ao clicar, a foto abre em modo de marcação — o médico clica no ponto desejado
3. Um marcador vermelho pulsante aparece no local clicado (coordenadas relativas em %)
4. O marcador é salvo e exibido na timeline sobre a foto
5. Na comparação IA, as coordenadas são incluídas no contexto (ex: "Localização: 35% da esquerda, 60% do topo")

## Mudanças

### 1. Banco de dados — migração
Adicionar colunas `focus_x` (numeric, nullable) e `focus_y` (numeric, nullable) à tabela `evolution_photos` — coordenadas percentuais (0-100).

### 2. `src/pages/PacienteDetalhe.tsx`
- Novos estados: `photoFocusX/Y`, `editFocusX/Y`
- **Upload form**: quando `photoFocus` preenchido, mostrar preview da foto com overlay clicável para definir o ponto. Exibir marcador no ponto clicado.
- **Edição inline**: mesmo comportamento
- **Timeline**: renderizar marcador sobre a foto quando `focus_x/y` existirem
- **handleAiCompare**: incluir coordenadas no contexto enviado à IA

### 3. `src/hooks/useSupabaseData.tsx`
Incluir `focus_x` e `focus_y` nas mutations de add e update.

### 4. `src/components/EvolutionPhotoImage.tsx`
Adicionar prop opcional `marker?: { x: number; y: number }` que renderiza um ponto vermelho pulsante na posição indicada (CSS absolute com left/top em %).

### 5. Edge Function — sem mudança no código
O contexto textual já é passado via `patientContext`. As coordenadas serão adicionadas como texto descritivo.

### Seção técnica

- Coordenadas armazenadas como percentuais (0-100) para independência de resolução
- Marcador: div absolute com `left: ${x}%`, `top: ${y}%`, transform translate -50% para centralizar
- Animação: `animate-ping` do Tailwind para efeito pulsante
- Click handler: `(e.nativeEvent.offsetX / e.target.width) * 100` para calcular posição relativa
- Sem dependências externas — apenas CSS e eventos nativos

