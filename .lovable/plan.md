

# Relatório Premium — Layout Visual e Prompt Redesign

## Objetivo
Transformar a apresentação dos relatórios de composição corporal e resumo em uma experiência visual premium, com hierarquia clara, dados facilmente escaneáveis e estética profissional — usando apenas dados já gerados pela IA.

## O que muda

### 1. MarkdownRenderer premium (`src/components/MarkdownRenderer.tsx`)
Substituir o renderer genérico por componentes React customizados via `react-markdown` components prop:
- **Tabelas**: bordas arredondadas, header com gradiente azul/teal sutil, linhas zebradas, padding generoso, font `tabular-nums`
- **H2 (seções)**: borda lateral colorida (4px accent), background translúcido, ícone decorativo
- **H3 (subseções)**: tipografia com `tracking-wide`, cor accent
- **Listas**: bullet points com ícones coloridos (check verde para positivos, alerta amber para atenção)
- **Negrito**: destaque com cor primária
- **Blockquotes**: card glassmorphism com borda amber (para scores/classificações)
- **Horizontal rules**: separador com gradiente fade

### 2. Modal redesenhado (`src/components/AnalysisResultModal.tsx`)
- Header com gradiente mesh sutil (consistente com o design system do app)
- Badge de tipo com gradiente e ícone (Activity para composição, TrendingUp para evolução)
- Cabeçalho do paciente mais destacado com avatar colorido
- Footer com botões em estilo premium (gradiente nos primários)
- Largura expandida para `max-w-3xl` para dar respiro ao conteúdo

### 3. Prompt da IA reestruturado (Edge Functions)
Ajustar os prompts para que a IA gere o markdown já otimizado para o layout premium:

**Composição (`consolidated-analysis`):**
- Começar com um bloco de "Painel de Indicadores" — tabela compacta com os 6 números-chave no topo (IMC, % gordura, massa magra, massa gorda, TMB, gordura visceral)
- Score e Classificação logo abaixo como blockquote destacado
- Análise regional em tabela com emojis indicadores (🟢 🟡 🔴)
- Seções de Observações e Recomendações no final, com bullet points diretos

**Resumo (`summarize-analysis`):**
- Mesma estrutura de "Painel de Indicadores" no topo
- Classificação + Score em uma linha
- 3-5 highlights com prefixo ✅ ou ⚠️
- Recomendações com prefixo 🎯

### 4. CSS de impressão atualizado
Manter o estilo premium na versão impressa: tabelas com bordas, headers coloridos (versão print-friendly), tipografia refinada.

## Arquivos modificados
- `src/components/MarkdownRenderer.tsx` — componentes custom para tabelas, headings, listas
- `src/components/AnalysisResultModal.tsx` — modal premium com header/footer redesenhados
- `supabase/functions/consolidated-analysis/index.ts` — prompt reestruturado para layout premium
- `supabase/functions/summarize-analysis/index.ts` — prompt reestruturado para resumo premium

## Resultado esperado
Relatórios com aparência de laudo profissional premium — dados-chave escaneáveis em 3 segundos, hierarquia visual clara, e identidade visual consistente com o design "liquid glass" do app.

