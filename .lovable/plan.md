

# Traduzir Manchetes Internacionais para Portugues

## O que muda

Todas as manchetes vindas de fontes internacionais (FDA, EMA, PubMed, OMS) serao automaticamente traduzidas para portugues antes de serem salvas no cache. As manchetes nacionais nao serao afetadas.

## Abordagem

Usar a API Lovable AI (modelo Gemini Flash -- rapido e barato) para traduzir em lote os titulos e resumos das manchetes internacionais. A traducao acontece na Edge Function, antes de salvar no banco, entao o cache ja armazena tudo em portugues.

## Mudancas

### 1. Edge Function `fetch-medical-news/index.ts`

Adicionar uma funcao `translateHeadlines` que:

1. Filtra apenas manchetes de fontes internacionais (FDA, FDA Drugs, EMA, PubMed, PubMed Estudos, PubMed Novos Farmacos, OMS)
2. Envia os titulos e resumos em um unico prompt para a API Lovable AI (Gemini Flash)
3. Recebe as traducoes e substitui os textos originais
4. Manchetes nacionais passam direto sem modificacao

Logica de deteccao de fonte internacional:

```text
INTERNATIONAL_SOURCES = ["FDA", "FDA Drugs", "EMA", "PubMed", "PubMed Estudos", "PubMed Novos Fármacos", "OMS"]

Se headline.source esta em INTERNATIONAL_SOURCES -> traduzir
Senao -> manter original
```

Prompt de traducao (batch para eficiencia):

```text
"Traduza os seguintes titulos de noticias medicas do ingles para o portugues brasileiro.
Mantenha termos tecnicos medicos reconhecidos. Retorne um JSON array com as traducoes na mesma ordem.

Titulos:
1. "FDA Approves New Drug for Type 2 Diabetes"
2. "Clinical Trial Shows Promising Results for Cancer Therapy"
..."
```

Fluxo atualizado:

```text
Fetch all sources (paralelo)
  -> Collect headlines
  -> Separate international vs national
  -> Translate international batch (1 chamada AI)
  -> Merge back
  -> Filter, deduplicate, sort, limit
  -> Save to cache
```

### 2. Nenhuma mudanca no frontend

As manchetes ja chegam traduzidas do cache -- a pagina `Noticias.tsx` e o `NewsCard.tsx` exibem o que esta no banco sem alteracao.

## Secao Tecnica

### Chamada a API Lovable AI

A Edge Function usara o secret `LOVABLE_API_KEY` (ja configurado) para chamar a API com o modelo `google/gemini-2.5-flash-lite` (mais rapido e barato, ideal para traducao simples).

```text
POST https://ai.lovable.dev/api/v1/chat/completions
Headers:
  Authorization: Bearer LOVABLE_API_KEY
  Content-Type: application/json

Body:
  model: "google/gemini-2.5-flash-lite"
  messages: [{ role: "user", content: "Traduza..." }]
  temperature: 0.1
```

### Performance

- Traducao em batch (todos os titulos internacionais de uma vez) -- 1 unica chamada de AI por refresh
- Modelo flash-lite: latencia baixa (~1-2s para batch de 10-15 titulos)
- Se a traducao falhar, manter o titulo original em ingles (fallback seguro)
- Cache de 6 horas significa que a traducao so acontece a cada 6h por categoria

### Fallback

Se a API de traducao falhar (timeout, erro, etc.), os titulos originais em ingles serao mantidos. A funcionalidade de noticias nunca quebra por causa da traducao -- e um passo opcional.

