

# Separar "Gerar prontuario IA" de "Finalizar consulta"

## Problema atual

No modo com IA, o botao "Finalizar e gerar prontuario" faz duas coisas ao mesmo tempo: gera a IA e e o unico caminho para encerrar. Depois de gerado, aparecem "Unir e salvar" e "Salvar sem unir" -- duas opcoes de encerramento que confundem.

## Nova logica

Separar em dois botoes com funcoes claras:

- **Gerar prontuario** (secundario): aciona a IA para gerar o SOAP. Nao salva, nao redireciona. O usuario pode gerar, revisar e editar antes de finalizar.
- **Finalizar consulta** (primario): salva tudo (com ou sem uniao do conteudo IA) e redireciona para `/consultas/:id`.

### Footer no modo IA

```text
Antes de gerar:
[Cancelar]              [Gerar prontuario]  [Finalizar consulta]

Gerando:
[Cancelar]              [Gerando...]        [Finalizar consulta]

Apos gerar:
[Cancelar]              [Gerar novamente]   [Finalizar consulta]
```

### Footer sem IA (sem mudanca)

```text
[Cancelar]                                  [Finalizar consulta]
```

O botao "Finalizar consulta" sempre chama `handleMergeAndSave`, que ja salva e redireciona. Se houver conteudo IA gerado, ele une automaticamente. Se nao houver, salva apenas o conteudo manual.

## Secao tecnica

**Arquivo: `src/pages/NovaConsulta.tsx`** (linhas 665-692)

Substituir o bloco de botoes `useAI ? (...)` por:

```tsx
{useAI && (
  <Button
    variant="secondary"
    size="sm"
    onClick={handleGenerateAI}
    disabled={isStreamingAI}
    className="gap-1.5"
  >
    {isStreamingAI ? (
      <><Sparkles className="h-4 w-4 animate-spin" /> Gerando...</>
    ) : aiGenerated ? (
      <><Sparkles className="h-4 w-4" /> Gerar novamente</>
    ) : (
      <><Sparkles className="h-4 w-4" /> Gerar prontuario</>
    )}
  </Button>
)}
<Button onClick={handleMergeAndSave} className="gap-1.5">
  <CheckCircle2 className="h-4 w-4" /> Finalizar consulta
</Button>
```

Remove-se o bloco condicional `aiGenerated` com "Unir e salvar" / "Salvar sem unir". Um unico botao "Finalizar consulta" resolve tudo.

