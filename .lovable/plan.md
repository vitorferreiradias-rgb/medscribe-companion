

# Corrigir timezone em todo o projeto

## Problema

O bug de timezone que corrigimos em `intent-parser.ts` e `holidays.ts` existe em **mais 9 arquivos**. Todas as chamadas a `toISOString().slice(0, 10)` convertem para UTC, causando deslocamento de data para usuarios no Brasil (UTC-3).

Isso afeta:
- A data exibida na agenda (o dia "hoje" pode estar errado)
- A data usada ao criar agendamentos (cai no dia errado)
- A comparacao "isToday" (pode falhar a noite)
- A seed de dados de exemplo

## Solucao

Criar uma funcao utilitaria `toLocalDateStr(d: Date)` em `src/lib/format.ts` e substituir todas as ocorrencias de `toISOString().slice(0, 10)` por essa funcao.

## Arquivos a alterar

### 1. `src/lib/format.ts` — adicionar funcao utilitaria

```typescript
export function toLocalDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
```

### 2. Substituir em todos os arquivos

| Arquivo | Ocorrencias | O que muda |
|---------|-------------|------------|
| `src/pages/Agenda.tsx` | 3 | `dateStr`, `prevDateRef`, `isToday` |
| `src/components/AppLayout.tsx` | 2 | `defaultDate` para dialogs |
| `src/components/NewScheduleDialog.tsx` | 2 | Estado inicial e reset de `date` |
| `src/components/NewTimeBlockDialog.tsx` | 2 | Estado inicial e reset de `date` |
| `src/components/SmartAssistantDialog.tsx` | 2 | Busca de eventos para remarcar/cancelar |
| `src/components/AgendaWeekView.tsx` | 2 | `todayStr` e `dateStr` por dia |
| `src/components/AgendaMonthView.tsx` | 2 | `todayStr` e `dateStr` por dia |
| `src/components/AlertsCard.tsx` | 1 | Comparacao `isToday` |
| `src/lib/seed.ts` | 2 | `todayStr()` e `offsetDate()` |

Cada substituicao segue o mesmo padrao:
- `new Date().toISOString().slice(0, 10)` vira `toLocalDateStr()`
- `someDate.toISOString().slice(0, 10)` vira `toLocalDateStr(someDate)`
- Adicionar `import { toLocalDateStr } from "@/lib/format"` no topo

Total: **18 ocorrencias** em 9 arquivos, todas substituidas pela mesma funcao centralizada.

