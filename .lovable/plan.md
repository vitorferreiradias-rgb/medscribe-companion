

# Refinamento Visual Premium — MedScribe

Melhorias visuais focadas em elevar a percepção de qualidade sem alterar a estrutura ou usabilidade existente.

---

## 1. Gradiente de fundo mais rico

Substituir o fundo plano por um gradiente sutil com "mesh" que dá profundidade, similar ao que a Apple usa no macOS Sonoma.

- Fundo atual: cinza plano com gradiente linear simples
- Proposta: adicionar um gradiente radial sutil com toque de cor (azul muito claro) no canto superior, criando sensacao de profundidade

---

## 2. Avatares com gradiente colorido

Em vez do avatar com fallback azul claro uniforme para todos, usar gradientes derivados da inicial do nome. Cada paciente tera um avatar visualmente unico.

- Gerar cor baseada no hash do nome
- Aplicar gradiente sutil (ex: azul -> indigo, teal -> cyan)
- Texto branco com sombra leve para contraste

---

## 3. Cards da agenda com micro-interacoes refinadas

- Adicionar transicao suave de `border-left` colorido (3px) por status ao passar o mouse (hoje so aparece no selecionado)
- Hover com elevacao sutil (shadow + translateY) mais pronunciada
- Separadores entre itens com opacidade mais baixa (quase invisiveis)

---

## 4. Tipografia premium

- Titulos da pagina ("AGENDA DO DIA") com letter-spacing mais aberto e peso mais leve (tracking-widest, font-medium em vez de default)
- Horarios da agenda com fonte monospacada (`font-variant-numeric: tabular-nums`) para alinhamento perfeito
- Badges de status com bordas mais arredondadas (full pill shape)

---

## 5. Sidebar com logo premium

- Logo "M" com gradiente ao inves de cor solida
- Item ativo na sidebar com background gradiente sutil em vez de cor plana
- Icones com stroke-width mais fino (1.5 em vez de 2)

---

## 6. Topbar com separadores visuais

- Adicionar separadores verticais sutis entre grupos de acoes (busca | navegacao de data | botoes)
- Botao "Adicionar paciente" com gradiente sutil no hover
- Sombra inferior da topbar mais difusa e suave

---

## 7. Botoes de acao com hover premium

- Botoes primarios com gradiente sutil (azul 500 -> azul 600) em vez de cor plana
- Transicao de sombra no hover (shadow-md -> shadow-lg com tint azul)
- Botao "One Click" com brilho ambar animado sutil (shimmer effect)

---

## 8. Indicador "AGORA" mais elegante

- Substituir a linha simples por um gradiente que desvanece nas pontas
- Dot pulsante com animacao mais suave (scale + opacity)
- Badge "AGORA" com backdrop-blur

---

## Detalhes Tecnicos

### Arquivos a editar:

1. **`src/index.css`**
   - Adicionar gradiente de fundo mesh (radial-gradient secundario)
   - Adicionar classes utilitarias: `.gradient-avatar`, `.premium-hover`, `.shimmer-ai`
   - Refinar `.glass-card:hover` com shadow mais premium
   - Adicionar keyframe `shimmer` para o botao One Click

2. **`src/components/AppSidebar.tsx`**
   - Logo "M" com `bg-gradient-to-br from-primary to-indigo-DEFAULT`
   - Item ativo com fundo gradiente

3. **`src/pages/Agenda.tsx`**
   - Avatares com funcao de cor baseada no nome
   - Titulo "AGENDA DO DIA" com tracking e peso ajustados
   - Horarios com `tabular-nums`
   - Badges de status pill-shaped (`rounded-full`)
   - Indicador "AGORA" com gradiente
   - Hover dos cards com border-left colorido por status
   - Separadores mais sutis

4. **`src/components/Topbar.tsx`**
   - Separadores verticais entre grupos
   - Botao primario com gradiente
   - Sombra mais difusa

5. **`src/components/ui/button.tsx`**
   - Variante `default` com gradiente sutil
   - Transicao de shadow no hover

6. **`tailwind.config.ts`**
   - Nenhuma alteracao necessaria (tudo ja esta coberto pelas variaveis CSS existentes)

### Principios:
- Zero mudanca estrutural — apenas CSS e classes
- Compativel com o design system Liquid Glass existente
- Performance: apenas CSS (gradientes, shadows, transitions) — sem JS adicional
- Todas as mudancas sao aditivas e nao quebram nada existente

