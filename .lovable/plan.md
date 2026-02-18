
# Ajustes de nomenclatura e fluxo NovaConsulta + ConsultaDetalhe

## Resumo das alteracoes

### 1. Renomear "Finalizar consulta" para "Finalizar anamnese"
**Arquivo:** `src/pages/NovaConsulta.tsx` (linha 684)
- Trocar o texto do botao primario de "Finalizar consulta" para "Finalizar anamnese"

### 2. Corrigir texto placeholder do painel IA
**Arquivo:** `src/pages/NovaConsulta.tsx` (linha 535)
- Texto atual: `O prontuário gerado pela IA aparecerá aqui após clicar em "Finalizar e gerar"`
- Novo texto: `A anamnese gerada pela IA aparecerá aqui após clicar em "Gerar prontuário IA"`

### 3. Simplificar barra de acoes na pagina de detalhe (ConsultaDetalhe)
**Arquivo:** `src/pages/ConsultaDetalhe.tsx` (linhas 229-236)

Substituir os tres botoes atuais:

```text
[Salvar]  [Revisado]  [Finalizar]  [Exportar]
```

Por apenas dois:

```text
[Salvar]  [Revisado e exportar]
```

- **Salvar**: mantem o comportamento atual (salva o prontuario)
- **Revisado e exportar**: marca como revisado, salva, e abre a janela de impressao/exportacao (combina `handleReview` + `handlePrint`)
- Remove o botao "Finalizar" (Lock) separado

A pagina de detalhe (`/consultas/:id`) ja possui na coluna lateral as abas: Transcricao, Receita, Dieta, Checklist e Historico -- entao ao finalizar a anamnese e ser redirecionado para la, o usuario ja tera acesso a todas essas funcionalidades para dar sequencia a consulta (gerar resumo IA, prescrever, dieta, etc).

## Secao tecnica

**NovaConsulta.tsx linha 535:**
```
"A anamnese gerada pela IA aparecerá aqui após clicar em \"Gerar prontuário IA\""
```

**NovaConsulta.tsx linha 684:**
```
<CheckCircle2 className="h-4 w-4" /> Finalizar anamnese
```

**ConsultaDetalhe.tsx linhas 229-236:**
Remover os botoes Revisado e Finalizar separados. Manter Salvar e adicionar "Revisado e exportar":
```tsx
<Button variant="secondary" size="sm" onClick={handleSave}>
  <Save className="mr-1.5 h-3.5 w-3.5" /> Salvar
</Button>
<Button size="sm" onClick={() => { handleReview(); handlePrint(); }}>
  <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Revisado e exportar
</Button>
```
