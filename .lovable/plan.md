

## Problema

Dois problemas independentes causam a falha:

### 1. Sessao IDs diferentes para cada foto
O código em `PacienteDetalhe.tsx` (linha 330-331) fecha o formulário e regenera o `currentSessaoId` **após cada foto individual**. Resultado: 3 fotos da "mesma sessão" ficam com 3 `sessao_id` diferentes no banco.

### 2. Detecção rígida no seletor
O `detectAction` em `EvolutionPhotoSelector.tsx` exige `sessaoIds.size === 1` para composição. Com sessao_ids diferentes, nunca reconhece as 3 fotos como uma sessão, mesmo tendo os 3 ângulos corretos.

### Dados existentes no banco
As fotos já salvas têm sessao_ids diferentes. Corrigir só o upload não resolve fotos existentes.

---

## Plano de correção

### 1. Relaxar a detecção de composição no `EvolutionPhotoSelector.tsx`
Na função `detectAction`, para o caso "composition" (3 fotos com F+P+C), remover a exigência de `sessaoIds.size === 1`. Basta ter 3 fotos com os 3 ângulos obrigatórios e a **mesma data**. Isso resolve tanto fotos existentes quanto futuras.

```
// Antes: sessaoIds.size === 1 && angles match
// Depois: 3 fotos, mesma data, angles F+P+C
```

### 2. Corrigir o reset do sessao_id no `PacienteDetalhe.tsx`
Mover `setCurrentSessaoId(crypto.randomUUID())` para fora do handler de upload individual. O reset deve acontecer apenas quando o formulário é explicitamente **reaberto** (ex: ao clicar "Nova Foto" de novo após fechar), não após cada foto salva. Ou melhor, não resetar ao fechar — resetar apenas ao **abrir** o formulário.

### Arquivos modificados
- `src/components/EvolutionPhotoSelector.tsx` — relaxar `detectAction` para composição (mesma data + 3 ângulos)
- `src/pages/PacienteDetalhe.tsx` — mover reset do `sessaoId` para quando o formulário abre, não quando fecha

