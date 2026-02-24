

# Notícias Médicas -- Migração para Fontes Gratuitas (sem Google CSE)

## Problema Atual
O sistema usa Google Custom Search Engine (CSE), que tem limite de 100 consultas/dia no plano gratuito. Ao atingir esse limite, retorna erro 429 e a funcionalidade para de funcionar.

## Solução Proposta
Substituir o Google CSE por scraping direto de fontes oficiais gratuitas + API PubMed (gratuita, sem chave). Isso elimina completamente a dependencia de API keys pagas e limites de cota.

---

## Fontes de Dados por Categoria

| Categoria | Fontes | Metodo |
|-----------|--------|--------|
| Hoje | ANVISA RSS, Min. Saude RSS, FDA RSS | RSS/Atom feed parsing |
| Diretrizes | CONITEC (scraping HTML), PubMed E-Utilities (Practice Guidelines) | HTTP fetch + regex parsing |
| Medicacoes | ANVISA RSS (filtrado), FDA Drug News RSS, EMA RSS | RSS feed parsing |
| Eventos | PubMed (filtro), EMA Events RSS | RSS + API |

URLs das fontes:
- ANVISA: `https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/RSS`
- Min. Saude: `https://www.gov.br/saude/pt-br/assuntos/noticias/RSS`
- FDA: `https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds` (Drug News)
- EMA: `https://www.ema.europa.eu/en/news-events/whats-new` (HTML scraping)
- PubMed E-Utilities: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi` + `efetch.fcgi`
- CONITEC: `https://www.gov.br/conitec/pt-br/assuntos/avaliacao-de-tecnologias-em-saude/protocolos-clinicos-e-diretrizes-terapeuticas` (HTML scraping)

## Arquitetura

```text
+------------------+     +------------------------+     +----------------+
|  Frontend React  | --> | Edge Function           | --> | medical_news   |
|  (useMedicalNews)|     | fetch-medical-news      |     | (tabela cache) |
+------------------+     +------------------------+     +----------------+
                              |
                    +---------+---------+
                    |         |         |
                  RSS     Scraping   PubMed
                 feeds     HTML     E-Utils
```

---

## Mudancas Detalhadas

### 1. Edge Function `fetch-medical-news/index.ts` (reescrever)

**Remover**: toda a logica do Google CSE (API key, CX, chamada customsearch).

**Adicionar**:
- Funcao `fetchRSS(url)`: faz fetch da URL, parseia XML com regex para extrair `<title>`, `<link>`, `<pubDate>`, `<description>`
- Funcao `scrapeHTML(url, selectors)`: faz fetch de paginas HTML e extrai manchetes via regex
- Funcao `fetchPubMed(query)`: usa E-Utilities para buscar artigos recentes tipo "Practice Guideline"
- Mapa de fontes por categoria:
  - `hoje`: RSS ANVISA + RSS Min. Saude + RSS FDA
  - `diretrizes`: scrape CONITEC + PubMed Practice Guidelines
  - `medicacoes`: RSS ANVISA (filtrado por palavras-chave de medicacao) + RSS FDA Drug News
  - `eventos`: scrape EMA events + PubMed conferences
- Logica de relevancia: priorizar manchetes com termos de alta importancia ('Aprovacao', 'Recall', 'Urgente', 'Falsificacao') no topo
- Limite de 15 manchetes por categoria (atualmente sao 5)
- Manter cache de 6 horas (reduzido de 24h para dados mais frescos)
- Fallback robusto: se uma fonte falhar, continuar com as outras

### 2. Hook `useMedicalNews.ts` (ajustar)

- Aumentar `.limit(5)` para `.limit(15)` no cache query
- Manter a mesma interface `MedicalNewsItem`
- Adicionar campo `priority` opcional para ordenacao

### 3. Pagina `Noticias.tsx` (melhorar)

- Cards clicaveis que abrem a URL original em nova aba (`window.open(url, '_blank')`)
- Exibir ate 15 manchetes por categoria
- Indicador visual para manchetes prioritarias (ex: badge "Urgente")
- Manter busca e filtros existentes

### 4. Componente `NewsCard.tsx` (ajustar)

- Click no card abre URL diretamente (remover logica de double-click)
- Mostrar ate 5 items no card resumido (manter)

### 5. Secrets (limpeza)

- `GOOGLE_CSE_API_KEY` e `GOOGLE_CSE_CX` nao serao mais necessarias (podem ser removidas futuramente)
- Nenhuma nova API key necessaria -- PubMed E-Utilities e gratuito sem chave

---

## Secao Tecnica

### RSS Parser (sem dependencias externas)
```text
Regex-based XML parsing dentro do Deno edge function:
- Extrair <item> blocks
- De cada <item>: <title>, <link>, <pubDate>, <description>
- Converter pubDate para formato pt-BR
```

### PubMed E-Utilities
```text
GET https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi
  ?db=pubmed&term=Practice+Guideline[pt]&retmax=10&sort=date&retmode=json

GET https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi
  ?db=pubmed&id=ID1,ID2,...&retmode=json
```

### Prioridade de Manchetes
```text
Palavras de alta prioridade (score +10):
  'Aprovação', 'Falsificação', 'Recall', 'Urgente', 'Emergência',
  'Approval', 'FDA', 'Recall', 'Alert', 'Emergency'

Manchetes com esses termos aparecem primeiro dentro de cada categoria.
```

### Tratamento de Erros
- Cada fonte e buscada independentemente com try/catch
- Se uma fonte falhar, as outras continuam
- Se todas falharem, retorna cache stale (mantendo comportamento atual)
- Timeout de 8 segundos por fonte para evitar edge function timeout

