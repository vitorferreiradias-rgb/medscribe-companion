
# Adicionar botao "Remover" para pacientes com falta (no_show)

## Problema

Ao selecionar um card com status `no_show`, nenhuma acao contextual aparece porque o codigo so trata os status `scheduled`, `confirmed`, `in_progress` e `done`. Nao ha bloco para `no_show`.

## Solucao

Adicionar um bloco condicional para `evt.status === "no_show"` com um botao "Remover da agenda" (icone Trash2), usando o mesmo `handleRemove` que ja existe.

## Detalhe Tecnico

### Arquivo: `src/pages/Agenda.tsx`

Apos o bloco de `evt.status === "done"` (linha 474), adicionar:

```tsx
{evt.status === "no_show" && (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon" className="h-7 w-7"
        onClick={(e) => { e.stopPropagation(); handleRemove(evt); }}>
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Remover da agenda</TooltipContent>
  </Tooltip>
)}
```

Tambem seria adicionado o status `rescheduled` com o mesmo botao, ja que pacientes remarcados tambem nao tem acoes hoje.

Nenhum outro arquivo precisa ser alterado.
