

# Implementar fluxo completo de prescrição direto no One Click

## Situacao Atual
Quando o usuario diz "prescrever dipirona 500mg para Maria" no One Click, o sistema fecha o dialog e abre o `SmartPrescriptionDialog` — que tem telas intermediarias (selecao de paciente, variantes, divergencia de posologia). Isso viola o principio do One Click.

## O que sera feito

### 1. Integrar logica de prescricao diretamente no SmartAssistantDialog
Em vez de delegar para `SmartPrescriptionDialog`, o One Click vai:
- Parsear a medicacao com `parsePrescriptionInput()`
- Buscar no banco local com `findMedication()` + `findDosePattern()`
- Se o medico informou posologia, usar a dele (prioridade medico)
- Se nao informou, usar posologia padrao da bula
- Para medicacoes com variantes (Mounjaro, Ozempic), usar a primeira variante (esquema inicial) automaticamente
- Classificar com `classifyPrescription()`
- Mostrar o preview inline no proprio dialog (novo step "prescription-preview")

### 2. Adicionar step de preview no SmartAssistantDialog
Novo `DialogStep`: `"prescription-preview"`. Vai renderizar o `SmartPrescriptionPreview` diretamente dentro do One Click, sem abrir outro dialog.

### 3. Extrair paciente do comando de voz
O intent-parser ja extrai o paciente. Vamos passar `patientId` + `patientName` do intent para o fluxo de prescricao, eliminando a tela de selecao de paciente.

### 4. Fluxo de suspensao e renovacao
- **Suspender**: gera documento de suspensao direto no preview
- **Renovar**: busca ultima prescricao do paciente (funcionalidade placeholder por enquanto)

## Arquivos modificados
- `src/components/SmartAssistantDialog.tsx` — logica principal de prescricao inline + novo step de preview
- `src/components/AppLayout.tsx` — remover `onPrescription` callback (nao mais necessario, One Click resolve internamente)

## Logica de decisao automatica (sem telas intermediarias)

```text
Comando → Parser extrai medicacao + concentracao + posologia
  ├── Medico informou posologia? → usa a do medico
  ├── Nao informou?
  │     ├── Medicacao no banco local? → usa posologia padrao
  │     └── Nao encontrou? → usa texto generico "conforme orientacao medica"
  ├── Tem variantes (Mounjaro etc)? → usa primeira variante automaticamente
  └── Classifica tipo de receita → preview direto
```

Nenhuma tela de selecao de variantes, divergencia ou posologia manual sera mostrada.

