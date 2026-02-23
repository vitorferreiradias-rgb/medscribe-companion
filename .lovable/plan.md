

# Prescricao Inteligente — Acesso Global e Controle de Audio

## O que muda

Hoje a Prescricao Inteligente so funciona dentro de uma consulta aberta (`/consultas/:id`). Este plano faz 3 coisas:

1. **Torna a Prescricao Inteligente acessivel de qualquer lugar** (pagina inicial/agenda, barra de comandos, menu rapido) com selecao de paciente quando nao houver contexto de consulta
2. **Adiciona controle claro de parar/enviar audio** no dialog de voz (botao "Parar e processar")
3. **Garante que prescricoes feitas fora de consulta** sejam salvas no prontuario do paciente (documentos clinicos + historico de medicacoes)

---

## Mudancas Detalhadas

### 1. SmartPrescriptionDialog — Selecao de paciente + controle de audio

**Arquivo:** `src/components/smart-prescription/SmartPrescriptionDialog.tsx`

- Tornar `patient` e `prescriber` opcionais nas props
- Quando `patient` nao for passado, mostrar um passo inicial "Selecionar paciente" com:
  - Campo de busca que filtra a lista de pacientes existentes
  - Ao selecionar, o fluxo segue normalmente
- O `prescriber` sera obtido automaticamente do primeiro clinico disponivel nos dados (ja existe em `useAppData`)
- **Audio**: Quando o usuario clicar no botao de microfone (ja vermelho durante gravacao), adicionar um segundo botao visivel **"Parar e processar"** (icone Send) que para a gravacao E submete o texto automaticamente, em vez de precisar clicar em dois botoes separados
- Ao final (assinatura), a prescricao e salva em `ClinicalDocument` e `MedicationEvent` vinculados ao `patientId` (sem `encounterId` quando feito fora de consulta)

### 2. AppLayout — Estado global do SmartPrescriptionDialog

**Arquivo:** `src/components/AppLayout.tsx`

- Adicionar estado `showSmartPrescription` e `smartPrescriptionInitialText`
- Renderizar `SmartPrescriptionDialog` no nivel do layout (assim funciona em qualquer pagina)
- Passar callbacks para Topbar, CommandBar e QuickActionsMenu

### 3. Topbar / QuickActionsMenu — Botao "Prescricao inteligente"

**Arquivo:** `src/components/QuickActionsMenu.tsx`

- Adicionar item "Prescricao inteligente" com icone Sparkles no dropdown de acoes rapidas

**Arquivo:** `src/components/Topbar.tsx`

- Aceitar nova prop `onSmartPrescription` e repassar ao QuickActionsMenu

### 4. CommandBar — Intencao de prescricao + atalho direto

**Arquivo:** `src/components/CommandBar.tsx`

- O item "Prescricao inteligente" ja existe mas nao esta conectado ao AppLayout
- Conectar via prop `onSmartPrescription` vinda do AppLayout
- Manter a deteccao de intencao (palavras como "prescrever", "receita") para pre-preencher o texto

### 5. Agenda (pagina inicial) — Botao de acesso rapido

**Arquivo:** `src/pages/Agenda.tsx`

- Adicionar um botao "Prescricao inteligente" (Sparkles) na barra de acoes do topo da agenda (ao lado de "Bloquear" e "Agendar")
- Esse botao aciona o dialog global via contexto do Outlet

---

## Fluxo do Usuario

```text
Qualquer pagina
     |
     v
Clica "Prescricao inteligente" (QuickActions / CommandBar / Agenda)
     |
     v
SmartPrescriptionDialog abre
     |
     +--> Se nao tem paciente no contexto:
     |      Mostra campo "Selecionar paciente" (busca + lista)
     |      Usuario seleciona --> segue para input
     |
     +--> Se tem paciente (ex: dentro de /consultas/:id):
     |      Vai direto para input
     |
     v
Input texto/voz
     |
     +--> Microfone: grava --> botao "Parar e processar" --> para + submete
     |
     v
Parser + Compliance + Preview + Assinar
     |
     v
Salva ClinicalDocument + MedicationEvent (com ou sem encounterId)
```

---

## Secao Tecnica

### SmartPrescriptionDialog — Novas props

```text
interface SmartPrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: { id: string; name: string };      // agora opcional
  prescriber?: { name: string; crm: string };   // agora opcional
  encounterId?: string;
  initialText?: string;
}
```

Quando `patient` nao for fornecido, o dialog mostra um passo "select-patient" antes do passo "input". Os dados de pacientes e clinicos sao lidos via `getData()` do store (sem depender do contexto React).

### Controle de audio melhorado

No passo "input", quando `isListening === true`:
- O botao de microfone muda para vermelho (ja existe)
- Aparece um botao adicional "Parar e enviar" (Send + MicOff) que chama `stopListening()` seguido de `handleSubmit()`
- O texto acumulado (inputText + interimText) e consolidado antes do submit

### AppLayout — Orquestracao

```text
// Novos estados no AppLayout:
const [showSmartPrescription, setShowSmartPrescription] = useState(false);
const [smartPrescriptionText, setSmartPrescriptionText] = useState("");

// Callback unificado:
const onSmartPrescription = (text?: string) => {
  setSmartPrescriptionText(text || "");
  setShowSmartPrescription(true);
};

// Renderizar no final do JSX:
<SmartPrescriptionDialog
  open={showSmartPrescription}
  onOpenChange={setShowSmartPrescription}
  initialText={smartPrescriptionText}
/>
```

### Outlet context para Agenda

O contexto do Outlet da agenda sera expandido para incluir `onSmartPrescription`, permitindo que a pagina Agenda acesse o callback.

### Arquivos modificados (resumo)

| Arquivo | Mudanca |
|---------|---------|
| `src/components/smart-prescription/SmartPrescriptionDialog.tsx` | Patient opcional + passo "select-patient" + botao "Parar e processar" |
| `src/components/AppLayout.tsx` | Estado global do dialog + render + props para Topbar/CommandBar |
| `src/components/Topbar.tsx` | Nova prop `onSmartPrescription` |
| `src/components/QuickActionsMenu.tsx` | Item "Prescricao inteligente" |
| `src/components/CommandBar.tsx` | Conectar prop `onSmartPrescription` ao AppLayout |
| `src/pages/Agenda.tsx` | Botao "Prescricao inteligente" na barra de acoes |
| `src/pages/AgendaPage.tsx` | Repassar `onSmartPrescription` do Outlet context |

