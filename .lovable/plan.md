

# Separar em dois botoes: "Revisado/Salvar" e "Exportar"

## O que muda

**Arquivo:** `src/pages/ConsultaDetalhe.tsx` (linha 231)

Substituir o botao unico "Revisado/Salvar e Exportar" por dois botoes distintos:

```text
[Salvar]  [Revisado/Salvar]  [Exportar]
```

- **Salvar** (secundario): mantem como esta, salva o prontuario sem marcar como revisado
- **Revisado/Salvar**: chama `handleReview()` (que ja salva e marca como revisado)
- **Exportar**: chama `handlePrint()` para abrir a janela de impressao/exportacao

## Secao tecnica

**ConsultaDetalhe.tsx linha 231 — substituir o botao atual por:**

```tsx
<Button size="sm" onClick={handleReview}>
  <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Revisado/Salvar
</Button>
<Button variant="outline" size="sm" onClick={handlePrint}>
  <Printer className="mr-1.5 h-3.5 w-3.5" /> Exportar
</Button>
```

Sera necessario adicionar `Printer` ao import de `lucide-react` caso nao esteja importado.

