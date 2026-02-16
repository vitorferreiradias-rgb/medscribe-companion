

# Prontuario Unificado - Caixa Unica de Edicao

## Problema Atual
O prontuario gerado pela consulta separa cada secao SOAP (Queixa Principal, HDA, Antecedentes, etc.) em accordions individuais, cada um com sua propria caixa de texto e botao de copiar. Isso fragmenta a leitura e dificulta a revisao do documento como um todo.

## Solucao Proposta
Substituir os multiplos accordions por um **unico editor de texto** que consolida todas as secoes em um documento continuo, com formatacao por titulos de secao, pronto para revisao e edicao.

### Como vai funcionar

1. **Editor unico**: Uma unica area de texto (textarea grande) contendo todas as secoes formatadas com seus titulos como marcadores (ex: `## Queixa Principal`, `## HDA`, etc.)

2. **Barra de indicador**: Manter o indicador azul (auto-gerado) ou verde (editado) como uma unica faixa lateral no card do editor

3. **Acoes**: Um unico botao "Copiar tudo" no rodape do editor, em vez de um por secao

4. **Preservar dados**: Ao carregar, o conteudo de todas as secoes do `note.sections` sera concatenado em um texto unico formatado. Ao editar, o texto sera salvo como uma secao unificada.

### Detalhes Tecnicos

**Arquivo: `src/pages/ConsultaDetalhe.tsx`**

- Remover o bloco `<Accordion>` (linhas 120-156) que renderiza cada secao separadamente
- Substituir por um unico `<Card>` contendo:
  - Um `<Textarea>` grande (ou o `PrescriptionEditor` para formatacao rica) com todo o conteudo consolidado
  - Funcao auxiliar `buildUnifiedContent(sections)` que concatena as secoes com titulos formatados
  - Um unico botao "Copiar" no rodape
- Ao editar, salvar o conteudo completo de volta (como secao unica ou atualizando as secoes individualmente via parsing)

**Arquivo: `src/lib/store.ts`** (se necessario)
- Adicionar funcao para salvar o conteudo unificado de volta nas secoes individuais do note

### Resultado Visual

Em vez de 14 accordions separados, o usuario vera:

```text
+-----------------------------------------------+
| [barra azul lateral]                           |
|                                                |
|  Identificacao                                 |
|  Paciente: Joao / Medico: Dra. Ana / Data: ...  |
|                                                |
|  Queixa Principal (QP)                         |
|  Dor de cabeca intensa ha 3 dias.              |
|                                                |
|  Historia da Doenca Atual (HDA)                |
|  Paciente relata inicio ha 3 dias...           |
|                                                |
|  ... (demais secoes)                           |
|                                                |
|                        [Copiar tudo]           |
+-----------------------------------------------+
```

Um documento unico, fluido, editavel e copiavel de uma vez.
