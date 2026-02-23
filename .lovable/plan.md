
# Adicionar botoes "Remover" e "Adicionar" na agenda

## O que muda

1. **Botao "Remover da agenda"** (icone de lixeira/Trash2) -- aparece nos botoes de acao ao selecionar qualquer card com status `scheduled` ou `confirmed`. Ao clicar, remove o agendamento da lista usando `deleteScheduleEvent` que ja existe em `store.ts`.

2. **Botao "Adicionar consulta"** (icone de PlusCircle) -- aparece apenas no ultimo card da lista do dia, ao ser selecionado. Ao clicar, abre o dialog de novo agendamento (`onNewSchedule`).

## Detalhes Tecnicos

### Arquivo: `src/pages/Agenda.tsx`

**Imports**: Adicionar `Trash2` e `PlusCircle` do lucide-react, e `deleteScheduleEvent` do store.

**Handler novo** `handleRemove`:
```typescript
const handleRemove = (evt: ScheduleEvent) => {
  deleteScheduleEvent(evt.id);
  setSelectedId(null);
  toast({ title: "Agendamento removido." });
};
```

**Botao Remover**: Dentro do bloco de acoes para status `scheduled`/`confirmed` (linhas 403-429), adicionar apos o botao "Marcar falta":
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon" className="h-7 w-7"
      onClick={(e) => { e.stopPropagation(); handleRemove(evt); }}>
      <Trash2 className="h-3.5 w-3.5 text-destructive" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Remover da agenda</TooltipContent>
</Tooltip>
```

**Botao Adicionar**: Apos o fechamento do bloco de acoes contextuais (linha 461), adicionar condicional para o ultimo item:
```tsx
{isSelected && i === filteredEvents.length - 1 && (
  <motion.div className="flex gap-1 mt-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs"
          onClick={(e) => { e.stopPropagation(); onNewSchedule(); }}>
          <PlusCircle className="h-3.5 w-3.5 text-primary" /> Agendar
        </Button>
      </TooltipTrigger>
      <TooltipContent>Adicionar consulta</TooltipContent>
    </Tooltip>
  </motion.div>
)}
```

Resultado: 4 botoes para agendamentos pendentes (Iniciar, Remarcar, Falta, Remover) e um botao extra "Agendar" no ultimo card.
