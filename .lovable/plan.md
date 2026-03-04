

## Problema

O botão "Parar e processar" captura o **texto interim** (provisório) do reconhecimento de voz — que é impreciso (ex: "prescrever" vira "escrever"). Quando `stop()` é chamado, ele **mata o recognition imediatamente** (`recognitionRef.current = null`, `setInterimText("")`), impedindo que o navegador finalize o áudio pendente e emita o resultado final correto.

O "Processar comando" funciona porque nesse momento o texto já foi finalizado pelo navegador e está no `inputText`.

## Solução

Adicionar um método `stopAndWait()` ao hook `useSpeechRecognition` que:
1. Para o reconhecimento chamando `recognition.stop()` (sem destruir o handler `onresult`)
2. Aguarda o navegador emitir o resultado final via `onresult` + `onend`
3. Só então resolve a Promise — nesse ponto o `inputText` já contém o texto correto

### Mudanças

**`src/hooks/useSpeechRecognition.ts`**
- Adicionar método `stopAndWait(): Promise<void>` que:
  - Seta `shouldRestartRef.current = false` (evita auto-restart)
  - Chama `recognition.stop()` mantendo `onresult` ativo (para o resultado final chegar)
  - Retorna uma Promise que resolve no `onend`
  - Seta `isListening = false` e limpa interim após resolver
  - Timeout de 1.5s como fallback caso `onend` não dispare
- Exportar `stopAndWait` no retorno do hook

**`src/components/SmartAssistantDialog.tsx`**
- Desestruturar `stopAndWait` do hook
- Alterar `handleStopAndProcess` para:
  ```
  async () => {
    await stopAndWait();
    // Após await, inputText já tem o texto final correto
    handleSubmit();
  }
  ```
- Remover lógica de snapshot com refs (`interimTextRef`) — não é mais necessária

**`src/components/smart-prescription/SmartPrescriptionDialog.tsx`**
- Aplicar a mesma correção: usar `stopAndWait()` + `handleSubmit()` sem snapshot

