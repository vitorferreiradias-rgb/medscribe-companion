

# Corrigir timezone na extração de datas

## Problema

A função `fmt()` em `intent-parser.ts` usa `d.toISOString().slice(0, 10)` para formatar datas. O `toISOString()` converte para **UTC**, não para o horário local do usuário. 

No Brasil (UTC-3), isso causa um deslocamento: se são 22h do dia 22 em São Paulo, o UTC já é 01h do dia 23. Resultado: "hoje" vira dia 23 e "amanhã" vira dia 24, quando o usuário esperava 22 e 23 respectivamente.

O mesmo problema existe em `src/lib/holidays.ts` que tem a mesma função `fmt`.

## Solução

Trocar `toISOString()` por formatação local usando `getFullYear()`, `getMonth()`, `getDate()`:

```
function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
```

## Detalhes Tecnicos

### Arquivo: `src/lib/intent-parser.ts`

Alterar a função `fmt` (linha 267-269) para usar componentes locais em vez de `toISOString()`:

**Antes:**
```typescript
function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}
```

**Depois:**
```typescript
function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
```

Isso garante que a data retornada corresponde ao fuso horário do navegador do usuário (America/Sao_Paulo ou qualquer outro), não ao UTC.

