

## Análise: Abordagem mais fluida

O caminho mais simples é trabalhar na tabela `evolution_photos`, que já tem a coluna `angle`. Não precisa duplicar informação na `avaliacoes_corporais`.

### O que já existe

- `evolution_photos.angle` — já armazena o ângulo de cada foto (valores atuais: frontal, posterior, lateral_direito, lateral_esquerdo, outro)
- `avaliacoes_corporais.photo_paths` — array que referencia as fotos usadas na avaliação
- `avaliacoes_corporais.angles` — array paralelo (redundante com o angle da foto individual)

### Proposta

**1. Adicionar `sessao_id` na tabela `evolution_photos`**

Uma coluna `sessao_id UUID DEFAULT gen_random_uuid()` que agrupa fotos enviadas juntas. Quando o médico faz upload de 3 fotos de uma vez, todas recebem o mesmo `sessao_id`. Isso permite:
- Agrupar visualmente por sessão na aba Evolução
- No seletor de "Nova Avaliação", mostrar fotos agrupadas por sessão em vez de uma lista solta

**2. Padronizar os valores de `angle` existentes**

Manter a coluna `angle` que já existe em `evolution_photos`, mas padronizar para os 3 valores principais: `frente`, `perfil`, `costas` (além de `outro`). O formulário de upload já pede o ângulo — basta atualizar as opções.

**3. Não alterar `avaliacoes_corporais`**

A tabela de avaliações já funciona bem. Ela referencia `photo_paths` e pode buscar o ângulo de cada foto via `evolution_photos.angle` quando necessário. A coluna `angles` existente pode ser preenchida automaticamente a partir dos dados das fotos selecionadas.

### Mudanças

| Onde | O quê |
|------|-------|
| Migration | `ALTER TABLE evolution_photos ADD COLUMN sessao_id uuid DEFAULT gen_random_uuid()` |
| `useAddEvolutionPhoto` | Aceitar `sessao_id` opcional no insert |
| Upload de fotos | Gerar um `sessao_id` compartilhado quando múltiplas fotos são enviadas juntas |
| `EvolutionPhotoSelector` | Agrupar fotos por `sessao_id` ou `date` para facilitar seleção |
| Opções de ângulo no form | Atualizar para: Frente, Perfil, Costas, Outro |

### Resultado

O fluxo fica: Upload de fotos (com ângulo + agrupamento automático por sessão) → Seletor agrupa por sessão → Nova Avaliação usa as fotos existentes. Sem redundância de dados entre tabelas.

