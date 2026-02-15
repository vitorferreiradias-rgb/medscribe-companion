
# Melhorias de UI — MedScribe (sem Dashboard)

Tres blocos de trabalho: refinamento visual global, redesign da pagina de detalhe da consulta, e melhorias no fluxo de nova consulta.

---

## 1. Refinamento Visual e Design

Melhorar a aparencia geral do app para ficar mais profissional e polido.

**O que muda:**
- Cards com fundo semi-transparente e backdrop-blur sutil (efeito glassmorphism leve)
- Badges de status com cores mais distintas: verde para finalizado, amarelo/outline para rascunho, azul para revisado, vermelho com animacao pulsante para gravando
- Linhas de tabela com hover state mais visivel
- Animacoes de entrada nos cards (stagger com framer-motion)
- Header do layout com titulo da pagina atual via breadcrumb dinamico
- Empty states mais elaborados com icones maiores e CTAs claros
- Espacamento mais consistente entre secoes

**Arquivos modificados:**
- `src/index.css` — ajustes de variaveis CSS para badges e glassmorphism
- `src/components/AppLayout.tsx` — header com breadcrumbs dinamicos
- `src/pages/Consultas.tsx` — visual dos KPI cards, hover na tabela, badges coloridos
- `src/pages/Pacientes.tsx` — hover na tabela, espacamento
- `src/pages/Perfil.tsx` — cards com visual refinado

---

## 2. Redesign da Pagina de Detalhe da Consulta

Transformar a pagina de prontuario em uma experiencia mais intuitiva e visualmente rica.

**O que muda:**
- Header redesenhado: card com info do paciente (nome grande, queixa, data, medico, duracao, status) em destaque
- Secoes SOAP: cards individuais com indicador colorido lateral (barra fina na esquerda) para "auto" (azul) vs "editado" (verde)
- Transcricao estilo chat: bolhas alinhadas (medico a direita com cor primaria, paciente a esquerda com cor muted), com botao "Inserir" em cada bolha para copiar trecho
- Checklist interativo: checkboxes reais com barra de progresso no topo mostrando % preenchido
- Historico com timeline visual: linha vertical com pontos e datas
- Barra de acoes sticky no topo ao rolar (salvar, revisar, finalizar ficam visiveis sempre)

**Arquivos modificados:**
- `src/pages/ConsultaDetalhe.tsx` — redesign completo do layout

**Arquivo novo:**
- `src/components/ConsultaTimeline.tsx` — componente de timeline para aba historico

---

## 3. Melhorias no Fluxo de Nova Consulta

Tornar o dialog de criacao de consulta mais guiado e com feedback visual melhor.

**O que muda:**
- Indicador de etapas visual no topo do dialog (Step 1 / Step 2 com barra de progresso)
- Campo de busca rapida no select de paciente (filtragem por digitacao)
- Botao "Criar novo paciente" inline no Step 1 que expande um mini-formulario (nome + telefone) sem sair do dialog
- Timer com anel circular animado (SVG) em vez de borda pulsante simples
- Transcricao ao vivo com visual de bolhas (igual ao detalhe)
- Loading skeleton de 400ms ao finalizar, simulando geracao do prontuario
- Alerta se a transcricao for muito curta (menos de 3 utterances) antes de finalizar

**Arquivos modificados:**
- `src/components/NewEncounterDialog.tsx` — redesign do dialog

---

## Ordem de implementacao

1. Refinamento visual global (CSS, layout, badges, hover states)
2. Redesign da pagina de detalhe da consulta
3. Melhorias no fluxo de nova consulta

Todas as bibliotecas necessarias ja estao instaladas (framer-motion, recharts, lucide-react, shadcn/ui).
