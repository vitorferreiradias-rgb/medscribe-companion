

# Corrigir: nome do paciente vazando para o nome do medicamento

## Problema

Quando o usuario digita algo como "Prescrever Amoxicilina 500 mg para Maria", o parser remove as palavras comuns ("para") mas deixa o nome do paciente ("Maria") no texto. O resultado e que o nome do medicamento fica "Amoxicilina Maria", que nao e encontrado no banco de dados, e o sistema pede posologia manual em vez de preencher automaticamente.

## Causa raiz

O parser (`smart-prescription-parser.ts`) nao tem conhecimento do paciente selecionado. Ele so remove palavras de acao (prescrever, suspender...) e stop words (de, por, para...), mas nomes proprios ficam no texto residual.

## Solucao

No `SmartPrescriptionDialog.tsx`, logo apos o parse, remover o nome do paciente selecionado do `medicationName` retornado. Isso resolve o problema sem alterar o parser generico.

---

## Detalhe tecnico

### Arquivo: `src/components/smart-prescription/SmartPrescriptionDialog.tsx`

Apos a linha 147 (`const medName = parsed.medicationName;`), adicionar logica para limpar o nome do paciente:

```typescript
const medName = parsed.medicationName;

// Remove patient name from medication name (parser residue)
let cleanMedName = medName;
if (patient?.name) {
  const patientWords = patient.name.toLowerCase().split(/\s+/);
  cleanMedName = medName
    .split(/\s+/)
    .filter(w => !patientWords.includes(w.toLowerCase()))
    .join(" ")
    .trim() || medName;
}
```

Em seguida, usar `cleanMedName` em vez de `medName` em todas as referencias subsequentes (setParsedMedName, findMedication, etc.).

### Nenhum outro arquivo precisa ser alterado.

A correcao e minima e cirurgica: apenas 6 linhas no fluxo de submit.

