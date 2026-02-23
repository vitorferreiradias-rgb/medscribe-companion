

# Assistente Inteligente Universal — Comando por Voz e Texto

## Resumo

Transformar o atual "Prescricao Inteligente" em um **Assistente Inteligente** universal que interpreta comandos de texto ou voz e executa acoes em todo o sistema: agendar, remarcar, cancelar consultas, adicionar notas rapidas, buscar noticias/eventos, prescrever medicamentos, e navegar pelo app. Tudo feito localmente (client-side com regex) agora, com estrutura pronta para substituir por IA no backend depois.

---

## O que o assistente vai saber fazer

| Intencao | Exemplo de comando | Acao no sistema |
|----------|-------------------|-----------------|
| Agendar | "Agendar Maria Silva amanha as 14h" | Abre NewScheduleDialog pre-preenchido com paciente e horario |
| Remarcar | "Remarcar consulta da Maria para sexta 10h" | Abre NewScheduleDialog em modo edicao com novo horario |
| Cancelar | "Cancelar consulta do Joao hoje" | Atualiza status do agendamento para "no_show" com confirmacao |
| Nota rapida | "Anotar: ligar para laboratorio amanha" | Adiciona texto nas Notas Rapidas (QuickNotesCard) |
| Prescrever | "Prescrever Amoxicilina 500mg para Maria" | Abre o fluxo de prescricao inteligente (ja existente) |
| Buscar noticia | "Quando e o congresso de clinica medica?" | Navega para /noticias e abre o item correspondente |
| Navegar | "Abrir agenda" / "Ir para pacientes" | Navega para a rota correspondente |

---

## Arquitetura

```text
Entrada (texto/voz)
       |
       v
  IntentParser (regex, client-side)
       |
       v
  Identifica intencao + entidades (paciente, data, hora, texto)
       |
       v
  ActionExecutor (switch por intencao)
       |
       +---> "agendar"    --> pre-preenche e abre NewScheduleDialog
       +---> "remarcar"   --> encontra evento, abre em modo edicao
       +---> "cancelar"   --> confirma e atualiza status
       +---> "nota"       --> salva em QuickNotes (localStorage)
       +---> "prescrever" --> abre SmartPrescriptionDialog (fluxo existente)
       +---> "buscar"     --> pesquisa em noticias e abre resultado
       +---> "navegar"    --> navigate() para rota
       +---> nao entendeu --> mostra mensagem "Nao entendi, tente..."
```

No futuro, o `IntentParser` sera substituido por uma chamada ao backend (Lovable AI) que retorna JSON estruturado com intencao + entidades. A interface e o executor permanecem iguais.

---

## Arquivos Novos

| Arquivo | Descricao |
|---------|-----------|
| `src/lib/intent-parser.ts` | Parser de intencoes com regex — extrai intencao, paciente, data, hora, texto livre |
| `src/components/SmartAssistantDialog.tsx` | Novo dialog universal que substitui o SmartPrescriptionDialog como ponto de entrada global |

## Arquivos Modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/components/AppLayout.tsx` | Substituir SmartPrescriptionDialog pelo SmartAssistantDialog; adicionar callbacks para agendar, notas, etc. |
| `src/components/Topbar.tsx` | Renomear prop para `onSmartAssistant` |
| `src/components/QuickActionsMenu.tsx` | Renomear item para "Assistente inteligente" |
| `src/components/CommandBar.tsx` | Conectar ao novo assistente |
| `src/pages/Agenda.tsx` | Renomear botao para "Assistente" |
| `src/pages/AgendaPage.tsx` | Atualizar contexto do Outlet |
| `src/components/QuickNotesCard.tsx` | Exportar funcao `addQuickNote()` para uso externo |

---

## Detalhamento Tecnico

### 1. IntentParser (`src/lib/intent-parser.ts`)

```text
interface ParsedIntent {
  intent: "agendar" | "remarcar" | "cancelar" | "nota" | "prescrever" | "buscar" | "navegar" | "desconhecido"
  patientName?: string        // nome extraido do texto
  date?: string               // YYYY-MM-DD
  time?: string               // HH:MM
  freeText?: string           // texto livre (nota, busca)
  rawInput: string
}

function parseIntent(text: string): ParsedIntent
```

Regex patterns:
- `agendar|marcar|agendar consulta` --> intent "agendar"
- `remarcar|reagendar|mudar horario` --> intent "remarcar"
- `cancelar|desmarcar` --> intent "cancelar"
- `anotar|nota|lembrar|lembrete` --> intent "nota"
- `prescrever|receita|renovar|suspender` --> intent "prescrever"
- `quando|buscar|pesquisar|data do|qual evento` --> intent "buscar"
- `abrir|ir para|mostrar` --> intent "navegar"

Extrator de entidades:
- Paciente: fuzzy match contra lista de nomes conhecidos
- Data: "hoje", "amanha", "segunda", "dia 15", "15/03"
- Hora: "14h", "14:00", "as 14", "14 horas"

### 2. SmartAssistantDialog (`src/components/SmartAssistantDialog.tsx`)

Dialog com:
- Input de texto/voz (reutiliza `useSpeechRecognition`)
- Botao "Parar e processar" durante gravacao
- Chips de exemplos variados (nao apenas prescricao)
- Ao processar: chama `parseIntent()` e executa a acao correspondente
- Feedback visual: mostra o que foi entendido antes de executar

Para cada intencao, o dialog:

**Agendar**: Fecha o dialog e abre `NewScheduleDialog` com `defaultDate`, paciente pre-selecionado (via novo prop `defaultPatientId`) e horario pre-preenchido (via novos props `defaultStartTime`/`defaultEndTime`).

**Remarcar**: Busca o proximo evento do paciente, fecha o dialog e abre `NewScheduleDialog` em modo edicao com o evento encontrado.

**Cancelar**: Mostra mini-confirmacao inline ("Cancelar consulta de Maria Silva hoje as 14h?") com botoes [Confirmar] [Voltar]. Ao confirmar, atualiza o status para "no_show".

**Nota**: Salva diretamente no localStorage das QuickNotes e mostra toast de confirmacao. Fecha o dialog.

**Prescrever**: Abre o `SmartPrescriptionDialog` existente com o texto pre-preenchido (reutiliza todo o fluxo atual).

**Buscar noticia**: Pesquisa no array de noticias mock por titulo/resumo. Se encontrar, navega para `/noticias` (no futuro, pode abrir inline).

**Navegar**: Executa `navigate()` para a rota correspondente ("agenda" -> "/agenda", "pacientes" -> "/pacientes", etc).

**Desconhecido**: Mostra mensagem amigavel com sugestoes de comandos validos.

### 3. NewScheduleDialog — Novos props opcionais

```text
interface Props {
  // ... existentes
  defaultPatientId?: string;    // NOVO: pre-seleciona paciente
  defaultStartTime?: string;    // NOVO: pre-preenche horario inicio
  defaultEndTime?: string;      // NOVO: pre-preenche horario fim
}
```

### 4. QuickNotesCard — Funcao exportada

```text
// Nova funcao exportada para uso externo
export function addQuickNoteExternal(text: string) {
  const LS_KEY = "notes_quick_v1";
  const data = loadData();
  const id = Date.now().toString(36);
  data.items.push({ id, text, done: false });
  localStorage.setItem(LS_KEY, JSON.stringify(data));
  // dispara evento para que o componente reaja
  window.dispatchEvent(new CustomEvent("quick-notes-updated"));
}
```

O componente QuickNotesCard escuta esse evento para atualizar seu estado.

### 5. AppLayout — Orquestracao

```text
// Substituir:
const [showSmartPrescription, ...] --> const [showAssistant, setShowAssistant]

// Novos estados para pre-preenchimento do agendamento:
const [scheduleDefaults, setScheduleDefaults] = useState<{
  patientId?: string;
  startTime?: string;
  date?: string;
} | null>(null);

// O SmartAssistantDialog recebe callbacks:
<SmartAssistantDialog
  open={showAssistant}
  onOpenChange={setShowAssistant}
  onSchedule={(defaults) => {
    setScheduleDefaults(defaults);
    setShowNewSchedule(true);
  }}
  onReschedule={(eventId) => onReschedule(eventId)}
  onPrescription={(text) => {
    setShowSmartPrescription(true);
    setSmartPrescriptionText(text);
  }}
  onNavigate={(path) => navigate(path)}
/>
```

### 6. Exemplos no dialog

```text
const EXAMPLES = [
  "Agendar Maria amanhã às 14h",
  "Remarcar João para sexta 10h",
  "Cancelar consulta da Ana hoje",
  "Anotar: pedir exames do Carlos",
  "Prescrever Amoxicilina 500mg",
  "Quando é o congresso de clínica médica?",
  "Abrir pacientes",
];
```

---

## Preparacao para Backend (futuro)

A estrutura `ParsedIntent` e identica ao que uma IA retornaria via tool calling. Quando o backend estiver pronto:

1. Criar edge function `parse-intent` que recebe texto e retorna `ParsedIntent` via Lovable AI
2. Substituir a chamada local `parseIntent()` pela chamada ao backend
3. O `SmartAssistantDialog` e os executores permanecem identicos

---

## Ordem de Implementacao

1. `src/lib/intent-parser.ts` — parser de intencoes
2. `src/components/QuickNotesCard.tsx` — exportar funcao + escutar evento
3. `src/components/SmartAssistantDialog.tsx` — dialog universal
4. `src/components/NewScheduleDialog.tsx` — novos props de pre-preenchimento
5. `src/components/AppLayout.tsx` — orquestracao central
6. `src/components/Topbar.tsx` — renomear prop
7. `src/components/QuickActionsMenu.tsx` — renomear item
8. `src/components/CommandBar.tsx` — conectar ao assistente
9. `src/pages/Agenda.tsx` — renomear botao
10. `src/pages/AgendaPage.tsx` — atualizar contexto

