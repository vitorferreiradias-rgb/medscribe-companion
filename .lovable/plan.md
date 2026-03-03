

# Bug: "One Click" crasha ao processar comando

## Problema

O `intent-parser.ts` chama `getData()` na função `matchPatient` (linha 161), mas `getData()` sempre retorna `null` desde a migração para Cloud (linha 18 do `store.ts`). Isso causa o erro `Cannot read properties of null (reading 'patients')` e impede qualquer comando que tente identificar um paciente.

O botão "Processar" provavelmente não fica clicável porque o crash acontece durante o parsing e bloqueia a execução.

## Solução

Modificar `matchPatient` no `intent-parser.ts` para aceitar uma lista de pacientes como parâmetro opcional, e atualizar `parseIntent` para receber pacientes externamente. No `SmartAssistantDialog.tsx`, passar os pacientes do `useAppData` para o parser.

### Mudanças

1. **`src/lib/intent-parser.ts`**
   - `matchPatient(text)` passa a aceitar segundo parâmetro `patients?: Patient[]`
   - Se não receber pacientes, tenta `getData()` com fallback para array vazio (sem crash)
   - `parseIntent(text)` recebe segundo parâmetro opcional `patients?: Patient[]` e repassa para `matchPatient`

2. **`src/components/SmartAssistantDialog.tsx`**
   - Na chamada `parseIntent(fullText)`, passar `data.patients` (do useAppData) como segundo argumento
   - Garantir que o botão de processar fique habilitado quando há texto

