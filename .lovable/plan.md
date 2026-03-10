

## Plano: Corrigir fluxo de avaliação corporal

### Problema identificado

A tabela `avaliacoes_corporais` não possui a coluna `analysis_objective`. O insert no `PacienteDetalhe.tsx` (linha 241) tenta inserir esse campo, causando erro no Postgres. A edge function nunca é chamada porque o fluxo para no insert.

### Correção

**Opção 1 (mais limpa):** Adicionar a coluna `analysis_objective` à tabela via migration:
```sql
ALTER TABLE avaliacoes_corporais ADD COLUMN analysis_objective text DEFAULT 'Avaliação corporal consolidada';
```

**Opção 2 (rápida):** Remover `analysis_objective` do insert e guardar no campo `metadata` (jsonb) que já existe.

Recomendo a **Opção 1** — adicionar a coluna — pois o campo é semanticamente útil para filtrar e exibir o tipo de análise.

### Alterações

1. **Migration SQL**: Adicionar coluna `analysis_objective` (text, nullable, default) à tabela `avaliacoes_corporais`
2. **Nenhuma alteração de código** necessária — o insert já passa o valor correto, só falta a coluna no banco

### Arquivos
- Migration SQL (nova)
- Nenhum arquivo `.tsx` precisa mudar

