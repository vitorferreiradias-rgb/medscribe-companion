

# Tornar a classificação de receita visualmente automática e clara

## Problema
O sistema já classifica automaticamente o tipo de receita (simples/antimicrobiano/controle especial) com base no medicamento. Porém, na UI do preview, isso aparece como um dropdown genérico sem destaque — o médico não percebe que a classificação foi automática. Além disso, quando o medicamento não está no banco local, a receita silenciosamente vira "simples".

## Solução

### 1. Destacar a classificação automática no preview
No `SmartPrescriptionPreview.tsx`:
- Adicionar um badge/label ao lado do dropdown indicando "Classificado automaticamente" (verde) quando a medicação foi encontrada no banco
- Quando a medicação NÃO foi encontrada, mostrar um alerta amarelo mais visível explicando que o tipo precisa ser confirmado manualmente
- Manter o dropdown como override, mas visualmente secundário

### 2. Adicionar mais antimicrobianos e controlados ao banco de conhecimento
No `medication-knowledge.ts`, adicionar medicamentos comuns que faltam:
- **Antimicrobianos**: Azitromicina, Ciprofloxacino, Cefalexina, Metronidazol, Levofloxacino, Sulfametoxazol+Trimetoprima
- **Controlados**: Clonazepam, Alprazolam, Fluoxetina, Sertralina, Escitalopram, Ritalina (metilfenidato), Zolpidem

### 3. Melhorar o `ComplianceResult` com flag de confiança
No `compliance-router.ts`:
- Adicionar campo `autoClassified: boolean` ao resultado — `true` quando todos os itens foram encontrados no banco, `false` quando algum é desconhecido
- O preview usa esse campo para decidir se mostra "Classificado automaticamente" ou "Confirme o tipo"

## Arquivos modificados
- `src/lib/medication-knowledge.ts` — adicionar medicamentos
- `src/lib/compliance-router.ts` — adicionar flag `autoClassified`
- `src/components/smart-prescription/SmartPrescriptionPreview.tsx` — UI de classificação automática

