

# Detecção Automática de Ângulo/Perfil nas Fotos de Evolução

## Situação Atual

O prompt atual assume que todas as fotos são frontais. Ele lista 10 regiões para analisar, mas **não instrui a IA a identificar o ângulo da foto** (frente, costas, lateral). Isso causa dois problemas:

1. Se a foto for de costas, a IA tenta analisar "Rosto e Pescoço" e "Abdômen" que não são visíveis — gerando texto inútil
2. Regiões específicas de costas (escápulas, coluna, gordura infra-escapular, glúteos posteriores) não são analisadas

## O que muda

O Gemini 2.5 Pro consegue identificar perfeitamente o ângulo da foto. A solução é adicionar uma **etapa de identificação de ângulo** no início do prompt e adaptar as regiões analisadas conforme o que é visível.

## Mudança

### `supabase/functions/evolution-compare/index.ts`

Atualizar o `systemPrompt` para:

1. **Passo inicial obrigatório**: Antes de analisar, a IA deve identificar o ângulo de cada foto (frontal, posterior, lateral direito, lateral esquerdo, ¾) e declarar no relatório

2. **Regiões adaptadas por ângulo**:

| Região | Frontal | Posterior | Lateral |
|---|---|---|---|
| Rosto e Pescoço | Sim | Não | Parcial |
| Braços | Sim | Sim | Parcial |
| Tronco/Peito | Sim | Não | Parcial |
| Costas e Escápulas | Não | **Sim** | Parcial |
| Coluna (alinhamento) | Não | **Sim** | **Sim** |
| Abdômen | Sim | Não | Parcial |
| Cintura/Flancos | Sim | Sim | **Sim** |
| Quadril e Glúteos | Parcial | **Sim** | Parcial |
| Pernas | Sim | Sim | Parcial |
| Postura | Sim | Sim | **Sim** |
| Pele | Sim | Sim | Sim |

3. **Nova seção "Costas e Coluna"** adicionada à lista de regiões (seção 3.5), analisando: definição muscular dorsal, escápulas, gordura infra-escapular, alinhamento da coluna, escoliose

4. **Instrução clara**: "Analise APENAS as regiões visíveis no ângulo identificado. Para regiões não visíveis, marque como 'Não visível neste ângulo' na tabela resumo"

5. **Ângulos diferentes entre ANTES e DEPOIS**: Se as fotos forem de ângulos diferentes, a IA deve alertar que a comparação é limitada e analisar apenas as regiões visíveis em ambas

### Seção técnica

Apenas mudança no texto do `systemPrompt` dentro da edge function. Sem alterações no frontend, banco de dados, API ou formato de resposta. A IA automaticamente adapta o relatório com base no que detecta nas fotos.

