

# Extrair Aprovações Individuais de Medicamentos da FDA

## Problema Atual

O sistema usa o RSS genérico da FDA (`/rss-feeds/drugs/rss.xml`), que retorna links para páginas institucionais como "Novel Drug Approvals 2026". O usuário quer ver **cada medicamento aprovado como uma manchete separada**, ex:
- "Loargys (pegzilarginase-nbln) aprovado para hiperarginemia"
- "Bysanti (milsaperidona) aprovado para esquizofrenia"

## Solução

Criar um scraper dedicado que extrai a **tabela de aprovações** da página `https://www.fda.gov/drugs/novel-drug-approvals-fda/novel-drug-approvals-2026` e gera uma manchete por medicamento.

## Mudanças

### 1. Edge Function `fetch-medical-news/index.ts`

**Nova função `fetchFDADrugApprovals`** que:

1. Faz fetch da página HTML de aprovações da FDA
2. Extrai as linhas da tabela usando regex (colunas: Numero, Nome, Ingrediente Ativo, Data, Uso Aprovado)
3. Gera uma manchete por medicamento no formato:
   - Titulo: `"FDA aprova [Nome] ([ingrediente]) para [uso]"`
   - Resumo: `"Aprovado em [data]. [uso aprovado completo]"`
   - URL: link direto para a pagina da FDA daquele medicamento (se disponível) ou a página geral
   - Source: `"FDA Drugs"`

**Substituir** o fetcher RSS genérico da FDA Drugs por este scraper nos `categoryFetchers`:

```text
medicacoes: [
  ... fontes existentes,
  - fetchRSS(".../drugs/rss.xml", "FDA Drugs")    // REMOVER
  + fetchFDADrugApprovals()                         // ADICIONAR
]
```

**Manter** o RSS geral da FDA em "hoje" (press releases continuam relevantes).

### 2. Nenhuma mudança no frontend

As manchetes individuais aparecem automaticamente com titulo traduzido (a tradução já existe) e link correto.

## Seção Técnica

### Estrutura da Tabela FDA

A tabela na página tem a seguinte estrutura HTML:

```text
<table>
  <tr>
    <td>4.</td>
    <td><a href="/drugs/...">Loargys</a></td>
    <td>pegzilarginase-nbln</td>
    <td>23/02/2026</td>
    <td>Para tratar a hiperarginemia...</td>
  </tr>
</table>
```

O regex para extrair linhas da tabela:

```text
/<tr[^>]*>\s*<td[^>]*>\s*(\d+)\.\s*<\/td>\s*<td[^>]*>(?:<a[^>]+href=["']([^"']+)["'][^>]*>)?\s*([\s\S]*?)\s*(?:<\/a>)?\s*<\/td>\s*<td[^>]*>\s*([\s\S]*?)\s*<\/td>\s*<td[^>]*>\s*([\s\S]*?)\s*<\/td>\s*<td[^>]*>\s*([\s\S]*?)\s*<\/td>/gi
```

### Formato da Manchete Gerada

```text
title: "Loargys (pegzilarginase-nbln) — aprovação FDA"
summary: "Aprovado em 23/02/2026. Para tratar a hiperarginemia em adultos e pacientes pediátricos..."
url: "https://www.fda.gov/drugs/..." (link individual) ou página geral
source: "FDA Drugs"
```

### Tradução

Como "FDA Drugs" já está em `INTERNATIONAL_SOURCES`, os títulos serão automaticamente traduzidos pela função `translateHeadlines` existente. Porém, como estamos gerando os títulos já em português ("aprovação FDA"), a tradução pode ser redundante para esses itens. Para evitar re-tradução desnecessária, o título será gerado diretamente em português.

### Sugestões de Melhoria Adicionais

Além da correção da FDA, sugiro:

1. **Indicar a fonte com ícone/badge colorido**: Diferenciar visualmente fontes nacionais (verde) de internacionais (azul) nos cards de notícia
2. **Adicionar categoria "Novos Medicamentos"**: Um filtro dedicado que agrupa FDA approvals + ANVISA registros + EMA approvals
3. **Data relativa**: Mostrar "há 2 dias" em vez de "24/02/2026" para notícias recentes

Essas melhorias podem ser feitas em um próximo passo.
