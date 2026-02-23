

# Melhorar extração de horário no Assistente Inteligente

## Problema

O reconhecimento de voz transcreve horários em formatos que o parser atual não reconhece. Por exemplo:
- "14 horas" — o regex falha porque espera "14h" (sem espaço antes do "h" seguido de letras)
- "duas da tarde" / "três da manhã" — números por extenso não são tratados
- "meio-dia" / "meia-noite" — expressões comuns ignoradas
- "2 da tarde" — formato com período do dia não reconhecido

## Solução

Expandir a função `extractTime` em `src/lib/intent-parser.ts` para cobrir todos os formatos comuns de fala em português:

### Novos padrões a reconhecer

| Formato falado | Exemplo | Resultado |
|----------------|---------|-----------|
| "N horas" | "14 horas" | 14:00 |
| "N e meia" | "3 e meia" | 03:30 |
| "N e N" | "14 e 30" | 14:30 |
| "N da tarde" | "2 da tarde" | 14:00 |
| "N da manhã" | "8 da manhã" | 08:00 |
| "N da noite" | "8 da noite" | 20:00 |
| "meio-dia" | "meio-dia" | 12:00 |
| "meia-noite" | "meia-noite" | 00:00 |
| Números por extenso | "duas", "catorze" | 02:00, 14:00 |

### Tambem: adicionar log de debug

Para facilitar diagnóstico futuro, adicionar um `console.debug` temporário mostrando o texto recebido e o resultado do parsing (intent, date, time, patient).

---

## Detalhes Tecnicos

### Arquivo: `src/lib/intent-parser.ts`

Reescrever a funcao `extractTime` com a seguinte logica (em ordem de prioridade):

1. "meio-dia" / "meio dia" retorna "12:00"
2. "meia-noite" / "meia noite" retorna "00:00"
3. Mapa de numeros por extenso (uma, duas, tres... doze, treze, catorze, quinze... vinte e uma) para converter para digitos
4. Normalizar o texto substituindo numeros por extenso antes de aplicar os regex
5. `(\d{1,2})\s*h\s*(\d{2})?` — "14h", "14h30" (ja existe)
6. `(\d{1,2})\s*horas?` — "14 horas" (NOVO)
7. `(\d{1,2})\s*e\s*meia` — "3 e meia" = X:30 (NOVO)
8. `(\d{1,2})\s*e\s*(\d{1,2})` — "14 e 30" (NOVO)
9. `(\d{1,2}):(\d{2})` — "14:00" (ja existe)
10. `[àa]s?\s+(\d{1,2})` — "as 14" (ja existe)
11. `(\d{1,2})\s*da\s*(tarde|noite|manhã|manha)` — aplica +12 para tarde/noite se < 13 (NOVO)

Adicionar tambem um `console.debug("[intent-parser]", { text, intent, date, time, patient })` no final de `parseIntent` para facilitar debug.

### Arquivo: `src/components/SmartAssistantDialog.tsx`

Adicionar endTime automatico (startTime + 30min) quando o assistente passa um horario, para que o `NewScheduleDialog` receba ambos os campos preenchidos.

