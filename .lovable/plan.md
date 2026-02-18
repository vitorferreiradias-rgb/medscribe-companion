

# Remover botão "Salvar" avulso da barra de ações

## O que muda

**Arquivo:** `src/pages/ConsultaDetalhe.tsx` (linha 231)

Remover o botão "Salvar" (secundário), mantendo apenas:

```text
[Revisado/Salvar]  [Exportar]
```

- **Revisado/Salvar**: salva e marca como revisado (`handleReview()`)
- **Exportar**: abre impressão/exportação (`handlePrint()`)

## Seção técnica

**ConsultaDetalhe.tsx linha 231** — remover a linha:

```tsx
<Button variant="secondary" size="sm" onClick={handleSave}><Save className="mr-1.5 h-3.5 w-3.5" /> Salvar</Button>
```

O import de `Save` pode ser mantido caso seja usado em outro lugar do arquivo, ou removido se não houver mais uso.

