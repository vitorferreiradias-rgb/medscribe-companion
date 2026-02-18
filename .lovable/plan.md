

# Botao X de remover compromisso em vermelho discreto

## Resumo
Alterar a cor do botao "X" que remove compromissos no QuickNotesCard para vermelho discreto, mantendo a aparencia sutil no hover.

## Implementacao

### Arquivo: `src/components/QuickNotesCard.tsx`

Na linha do botao de remover (dentro do componente `ItemRow`), trocar a classe de cor de `text-muted-foreground` para `text-red-400`, mantendo a opacidade progressiva no hover:

- Estado normal (hover no row): `opacity-0` (invisivel)
- Hover no row: `opacity-60` com cor `text-red-400` (vermelho discreto)
- Hover direto no botao: `opacity-100` com `text-red-500` (vermelho mais visivel)

Apenas 1 linha de classe CSS alterada, nenhum outro arquivo modificado.

