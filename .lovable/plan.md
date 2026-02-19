

# Botao para Pagina Inicial na Nova Consulta

## Resumo

Adicionar um botao no header da pagina `/consultas/nova` que leva o usuario diretamente para a pagina inicial (`/agenda`).

## O que muda

No header sticky da pagina `NovaConsulta.tsx` (linha 581), sera adicionado um botao com icone de "Home" ao lado do botao de voltar existente. Ao clicar, navega para `/agenda`.

## Detalhes tecnicos

### Arquivo: `src/pages/NovaConsulta.tsx`

1. Importar o icone `Home` do lucide-react (linha 25-30)
2. No header (linha 581-598), adicionar um botao apos o botao ArrowLeft:

```
<Button variant="ghost" size="icon" onClick={() => navigate("/agenda")} aria-label="Inicio">
  <Home className="h-5 w-5" />
</Button>
```

O botao ArrowLeft continua funcionando como antes (volta ao step 1 ou pagina anterior). O novo botao Home sempre leva para `/agenda`.

