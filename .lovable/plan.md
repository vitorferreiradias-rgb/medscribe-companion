

# Corrigir extração de data "amanhã" no Assistente Inteligente

## Problema

Ao dizer "agendar Maria amanhã às 14h", o sistema agenda para **hoje** em vez de amanhã.

**Causa raiz**: O regex `\bamanh[ãa]\b` falha com caracteres acentuados no JavaScript. O `\b` (word boundary) do JS so reconhece `[a-zA-Z0-9_]` como "word characters" -- o `ã` e tratado como non-word, fazendo o `\b` final nao corresponder. Resultado: `extractDate` retorna `undefined`, e o fallback na linha 256 aplica a data de hoje.

O mesmo problema afeta **todos os regex com acentos**: "terça", "sábado", "después de amanhã".

## Solucao

Substituir `\b` por alternativas que funcionem com caracteres acentuados em todos os regex da funcao `extractDate`.

## Detalhes Tecnicos

### Arquivo: `src/lib/intent-parser.ts`

Alterar os regex em `extractDate` para usar `(?:\s|$)` ou `(?![a-zA-ZÀ-ÿ])` no lugar de `\b` no final dos padroes com acentos:

1. **Linha 34** - "amanhã": trocar `\bamanh[ãa]\b` por `\bamanh[ãa](?!\w)`
2. **Linha 37** - "depois de amanhã": trocar `\bdepois\s+de\s+amanh[ãa]\b` por `\bdepois\s+de\s+amanh[ãa](?!\w)`  
3. **Linha 37 deve vir ANTES da linha 34** - "depois de amanhã" precisa ser testado antes de "amanhã", senao "depois de amanhã" casaria com "amanhã" e retornaria D+1 em vez de D+2
4. **Linha 41** - "terça" e "sábado": o matching por `includes()` ja funciona, nao usa `\b`

A correcao mais simples e robusta: trocar o `\b` final por `(?![a-zA-ZÀ-ÿ])` (negative lookahead para letras incluindo acentuadas), garantindo que funciona com qualquer caractere Unicode.

Mudancas concretas:

```
// ANTES (bugado):
if (/\bdepois\s+de\s+amanh[ãa]\b/i.test(text)) ...
if (/\bamanh[ãa]\b/i.test(text)) ...

// DEPOIS (corrigido + ordem trocada):
if (/\bdepois\s+de\s+amanh[ãa](?![a-zA-ZÀ-ÿ])/i.test(text)) ...
if (/\bamanh[ãa](?![a-zA-ZÀ-ÿ])/i.test(text)) ...
```

Tambem corrigir o `\b` final em "hoje" (linha 31) pelo mesmo motivo de consistencia, embora "hoje" nao tenha acentos no final.

