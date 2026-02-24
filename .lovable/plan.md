

# Expandir Fontes de Noticias Medicas -- Vigilancia Sanitaria, Sociedades Medicas e Fontes Estrategicas

## Contexto

O sistema atual busca noticias de ANVISA (geral), Ministerio da Saude, FDA, CONITEC, OMS e PubMed. Faltam fontes importantes como a Vigilancia Sanitaria da ANVISA, as principais sociedades medicas brasileiras e fontes internacionais de novos farmacos/estudos clinicos.

## Novas Fontes a Adicionar

### Nacionais (Prioridade Alta)

| Fonte | URL | Metodo | Categorias |
|-------|-----|--------|------------|
| ANVISA Farmacovigilancia | `https://www.gov.br/anvisa/pt-br/assuntos/farmacovigilancia` | HTML scraping | hoje, medicacoes |
| ANVISA Fiscalizacao/Monitoramento | `https://www.gov.br/anvisa/pt-br/assuntos/fiscalizacao-e-monitoramento` | HTML scraping | hoje, medicacoes |
| CFM (Conselho Federal de Medicina) | `https://portal.cfm.org.br/noticias/` | HTML scraping | hoje, diretrizes |
| SBC (Soc. Brasileira de Cardiologia) | `https://www.portal.cardiol.br/noticias` | HTML scraping | hoje, diretrizes, eventos |
| SBD (Soc. Brasileira de Diabetes) | `https://diabetes.org.br/noticias/` | HTML scraping | hoje, diretrizes |
| SBEM (Soc. Brasileira de Endocrinologia) | `https://www.endocrino.org.br/noticias/` | HTML scraping | hoje, diretrizes |
| FIOCRUZ | `https://portal.fiocruz.br/noticias` | HTML scraping | hoje, diretrizes |
| AMB (Associacao Medica Brasileira) | `https://amb.org.br/noticias/` | HTML scraping | hoje, diretrizes |

### Internacionais (Grandes Noticias)

| Fonte | URL | Metodo | Categorias |
|-------|-----|--------|------------|
| EMA (Agencia Europeia de Medicamentos) | `https://www.ema.europa.eu/en/news` | HTML scraping | medicacoes |
| PubMed -- Novos farmacos | Query: `new drug approval OR novel therapy OR clinical trial results` | API E-Utilities | medicacoes |
| PubMed -- Estudos clinicos recentes | Query: `randomized controlled trial[pt] AND 2026[dp]` | API E-Utilities | diretrizes |

---

## Mudancas Detalhadas

### 1. Edge Function `fetch-medical-news/index.ts`

**Novos termos de alta prioridade** a adicionar ao `HIGH_PRIORITY_TERMS`:
- "vigilancia", "farmacovigilancia", "sanitario", "fiscalizacao", "monitoramento", "interdicao"
- "surveillance", "pharmacovigilance"
- "cfm", "sociedade", "conselho"
- "novo medicamento", "new drug", "clinical trial", "ensaio clinico"

**Novas fontes no `categoryFetchers`**:

```text
hoje: [
  ... fontes existentes (ANVISA RSS, Min. Saude RSS, FDA RSS),
  + scrapeHTML ANVISA Farmacovigilancia
  + scrapeHTML ANVISA Fiscalizacao
  + scrapeHTML CFM Noticias
  + scrapeHTML FIOCRUZ Noticias
  + scrapeHTML AMB Noticias
]

diretrizes: [
  ... fontes existentes (CONITEC, PubMed Guidelines),
  + scrapeHTML CFM
  + scrapeHTML SBC
  + scrapeHTML SBD
  + scrapeHTML SBEM
  + fetchPubMed("randomized controlled trial[pt] AND 2026[dp]")
]

medicacoes: [
  ... fontes existentes (ANVISA RSS, FDA Drugs RSS, PubMed pharmacovigilance),
  + scrapeHTML ANVISA Farmacovigilancia
  + scrapeHTML ANVISA Fiscalizacao
  + scrapeHTML EMA News
  + fetchPubMed("new drug approval OR novel therapy 2026")
]

eventos: [
  ... fontes existentes (PubMed congress, OMS RSS),
  + scrapeHTML SBC (filtrado por eventos)
]
```

**Novos keywords nos filtros de categoria** (`categoryKeywords`):
- `hoje`: permanece sem filtro (mostra tudo)
- `diretrizes`: + "cfm", "sociedade", "ensaio", "trial", "estudo"
- `medicacoes`: + "vigilancia", "farmacovigilancia", "fiscalizacao", "monitoramento", "novo medicamento", "new drug", "clinical trial", "terapia", "therapy"
- `eventos`: + "sociedade", "sbc", "sbd", "sbem", "jornada"

**Logica de prioridade nacional vs internacional**:
- Fontes nacionais (ANVISA, Min. Saude, CFM, SBC, SBD, SBEM, FIOCRUZ, AMB, CONITEC) recebem bonus de +5 na prioridade
- Fontes internacionais (FDA, EMA, PubMed, OMS) mantem pontuacao base
- Isso garante que noticias nacionais aparecem primeiro, mas grandes alertas internacionais (com termos de alta prioridade) ainda sobem ao topo

**Aumento do limite**: `MAX_PER_CATEGORY` de 15 para 20 para acomodar mais fontes

### 2. Frontend -- Sem mudancas necessarias

A pagina `Noticias.tsx` e o hook `useMedicalNews.ts` ja suportam dinamicamente qualquer numero de fontes e exibem o nome da fonte no card. As novas manchetes aparecerao automaticamente com seus respectivos nomes (ex: "CFM", "SBC", "Farmacovigilancia").

---

## Secao Tecnica

### Estrategia de Scraping para Sites .gov.br e Sociedades

Os sites brasileiros seguem padroes semelhantes de HTML. O regex generico para extrair links de noticias:

```text
/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
```

Cada fonte tera seu `baseUrl` para resolver links relativos:
- gov.br: `https://www.gov.br`
- CFM: `https://portal.cfm.org.br`
- SBC: `https://www.portal.cardiol.br`
- FIOCRUZ: `https://portal.fiocruz.br`

### Bonus de Prioridade Nacional

```text
function calcPriority(title, summary, source):
  score = 0
  // Termos de alta prioridade (+10 cada)
  for term in HIGH_PRIORITY_TERMS:
    if text.includes(term): score += 10
  
  // Bonus nacional (+5)
  if source in NATIONAL_SOURCES: score += 5
  
  return score
```

### Gerenciamento de Volume

Com ~15 fontes buscadas em paralelo, o edge function pode demorar mais. Mitigacoes:
- Timeout por fonte: 8 segundos (ja implementado)
- `Promise.allSettled` garante que fontes lentas nao bloqueiam as rapidas
- Deduplicacao por titulo (primeiros 60 caracteres) remove repeticoes entre fontes
- Limite final de 20 manchetes por categoria

### Tratamento de Erros

Cada fonte continua independente com try/catch. Se ANVISA, CFM ou qualquer fonte estiver fora do ar, as demais continuam normalmente. O cache stale serve como ultimo recurso.

