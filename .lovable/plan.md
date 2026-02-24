

# Migrar de Gemini para Google CSE + Gemini (busca real + resumo)

## Problema atual
A Edge Function `fetch-medical-news` usa apenas o Gemini, que "alucina" URLs e fontes. Os links retornados podem nao existir. Alem disso, a chave atual esta com erro 429 (quota excedida, limite 0 -- a chave pode estar em um projeto sem billing ou com restricoes).

## Nova arquitetura

```text
[Frontend] --> [Edge Function: fetch-medical-news]
                    |
                    v
              [Google CSE API]  -- busca noticias reais com URLs verificaveis
                    |
                    v
              [Gemini API]  -- (opcional) resume/formata os resultados
                    |
                    v
              [Tabela: medical_news]  -- cache 24h
```

## O que e o Google CSE
Google Custom Search Engine (CSE) e uma API gratuita do Google que retorna resultados de busca reais (titulo, URL, snippet) de sites indexados. Voce pode restringir a busca a dominios especificos como anvisa.gov.br, sbc.org.br, cfm.org.br, etc.

## Pre-requisitos (voce precisa fazer)

### 1. Criar um Custom Search Engine
1. Acesse https://programmablesearchengine.google.com/controlpanel/all
2. Clique em "Add" (Adicionar)
3. Em "Sites to search", adicione os dominios medicos:
   - `anvisa.gov.br`
   - `gov.br/saude`
   - `portal.cfm.org.br`
   - `sbc.org.br`
   - `inca.gov.br`
   - `sbp.com.br`
   - `pebmed.com.br`
   - `medscape.com`
4. De um nome (ex: "Noticias Medicas Brasil")
5. Clique em "Create"
6. Copie o **Search Engine ID** (cx) gerado

### 2. Obter uma API Key para o Custom Search
1. Acesse https://console.cloud.google.com/apis/credentials
2. Clique em "Create Credentials" > "API Key"
3. (Recomendado) Restrinja a chave apenas para "Custom Search API"
4. Copie a chave gerada

### 3. Habilitar a Custom Search API
1. Acesse https://console.cloud.google.com/apis/library/customsearch.googleapis.com
2. Clique em "Enable"

**Limite gratuito**: 100 buscas/dia (mais que suficiente com cache de 24h -- maximo 4 buscas/dia, uma por categoria).

## Etapas de implementacao

### 1. Configurar novos secrets
- `GOOGLE_CSE_API_KEY` -- chave da API do Custom Search
- `GOOGLE_CSE_CX` -- ID do Search Engine criado

### 2. Atualizar Edge Function `fetch-medical-news`
Substituir a chamada ao Gemini por:

```text
Fluxo:
1. Recebe categoria (hoje, diretrizes, medicacoes, eventos)
2. Verifica cache 24h no banco
3. Se expirado:
   a. Monta query de busca por categoria:
      - hoje: "noticias medicina saude Brasil"
      - diretrizes: "diretrizes clinicas medicina Brasil 2026"
      - medicacoes: "medicamentos aprovados Anvisa Brasil"
      - eventos: "congressos medicina Brasil 2026"
   b. Chama Google CSE API:
      GET https://www.googleapis.com/customsearch/v1
        ?key=GOOGLE_CSE_API_KEY
        &cx=GOOGLE_CSE_CX
        &q={query}
        &num=5
        &dateRestrict=m1  (ultimo mes)
   c. Extrai titulo, snippet e URL reais dos resultados
   d. (Opcional) Chama Gemini para gerar resumos mais limpos
   e. Salva no banco e retorna
```

### 3. Frontend (sem mudancas)
Os componentes `NewsCard.tsx`, `Noticias.tsx` e o hook `useMedicalNews.ts` permanecem identicos -- a interface de dados e a mesma (title, summary, source, url, category, published_at).

## Custo
Zero. O Google CSE oferece 100 buscas gratuitas por dia. Com cache de 24h, o consumo sera no maximo 4 buscas/dia.

## Vantagens vs. abordagem anterior
- URLs reais e verificaveis (nao alucinadas)
- Titulos e snippets extraidos de paginas reais indexadas pelo Google
- Fontes confiaveis (restrito aos dominios configurados)
- Gemini usado apenas como complemento opcional para melhorar resumos

## Detalhes tecnicos

### Chamada ao Google CSE (dentro da Edge Function)
```text
const response = await fetch(
  `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}&num=5&dateRestrict=m1`
);
const data = await response.json();
// data.items[] contem: title, snippet, link, pagemap.metatags
```

### Mapeamento de categorias para queries
```text
hoje       -> "noticias medicina saude Brasil 2026"
diretrizes -> "novas diretrizes clinicas protocolos medicina Brasil"
medicacoes -> "medicamentos aprovados Anvisa alertas farmacologicos"
eventos    -> "congressos simposios medicina Brasil 2026"
```

### Extracao de fonte (source)
O dominio da URL e extraido automaticamente para gerar a sigla:
- `anvisa.gov.br` -> "Anvisa"
- `sbc.org.br` -> "SBC"
- `portal.cfm.org.br` -> "CFM"
- Outros -> usa o dominio limpo

