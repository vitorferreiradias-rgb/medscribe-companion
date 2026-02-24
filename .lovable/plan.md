

# Corrigir Links Externos Bloqueados nas Noticias

## Problema

Dois problemas identificados:

1. **URLs da FDA usam `http://`** em vez de `https://` -- o RSS da FDA retorna links com protocolo HTTP, que muitos navegadores bloqueiam ou redirecionam com aviso de seguranca
2. **`window.open()` e bloqueado como popup** -- dentro do iframe de preview do Lovable, o navegador interpreta `window.open()` em handler de click como tentativa de popup e bloqueia

Alem disso, as manchetes da OMS no banco ainda estao em ingles (a traducao nao foi aplicada a elas).

## Mudancas

### 1. `src/components/NewsCard.tsx` e `src/pages/Noticias.tsx`

Substituir `window.open(item.url, "_blank")` por um elemento `<a>` nativo com `target="_blank"` e `rel="noopener noreferrer"`. Links nativos `<a>` nao sao bloqueados pelo navegador como popups.

No `NewsCard.tsx`, envolver o conteudo do item em `<a>` em vez de usar `onClick`:
```text
<a href={item.url} target="_blank" rel="noopener noreferrer">
  ... conteudo do item ...
</a>
```

No `Noticias.tsx`, mesma abordagem no Card de noticia.

### 2. Edge Function `fetch-medical-news/index.ts`

Normalizar URLs para `https://` -- substituir `http://` por `https://` em todas as URLs capturadas dos feeds RSS e scrapers. A FDA redireciona HTTP para HTTPS de qualquer forma, entao usar HTTPS diretamente evita o problema.

Adicionar uma linha simples apos capturar a URL:
```text
url = url.replace(/^http:\/\//i, "https://")
```

## Secao Tecnica

### Por que `<a>` funciona e `window.open()` nao

Navegadores modernos distinguem entre:
- `<a target="_blank">` -- navegacao iniciada pelo usuario, sempre permitida
- `window.open()` em handler de click -- pode ser bloqueado dependendo do contexto (iframe, sandbox, popup blocker)

O iframe de preview do Lovable tem restricoes de sandbox que tornam `window.open()` menos confiavel.

### Normalizacao de URLs

A FDA retorna URLs como `http://www.fda.gov/...` no RSS. Todos os sites governamentais modernos (FDA, WHO, EMA) suportam HTTPS. A normalizacao e segura e evita avisos de "conexao nao segura" no navegador.

