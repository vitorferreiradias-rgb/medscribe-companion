

# Agenda do Dia com Mini Calendario e Feriados

## Resumo

Reorganizar a pagina inicial para exibir a lista de pacientes agendados no topo com status coloridos (agendado, confirmado, reagendado, cancelado), e adicionar um mini calendario interativo no canto superior direito que expande ao clicar, mostra feriados nacionais/municipais e permite agendar consultas clicando em um dia.

## Mudancas Visuais

### 1. Faixa de Agenda do Dia (topo da pagina)

A faixa superior substituira os KPIs atuais, exibindo os pacientes do dia em cards compactos horizontais com cores suaves por status:

| Status | Cor de fundo | Borda lateral | Texto |
|--------|-------------|---------------|-------|
| Agendado | `bg-slate-100/60` | `border-l-slate-400` | Cinza neutro |
| Confirmado | `bg-primary/5` | `border-l-primary` | Azul primary |
| Reagendado | `bg-warning/8` | `border-l-warning` | Ambar |
| Cancelado/Falta | `bg-destructive/5` | `border-l-destructive` | Vermelho suave |
| Em atendimento | `bg-teal-50/60` | `border-l-teal-500` | Teal |
| Concluido | `bg-success/5` | `border-l-success` | Verde suave |

Cada card mostra: horario, nome do paciente, tipo (1a consulta / retorno), e badge de status.

### 2. Mini Calendario (canto superior direito)

- Calendario compacto estilo "widget" posicionado no canto superior direito da pagina, ao lado da faixa de agenda
- Estilo liquid glass (glass-card) com tamanho reduzido (~200px)
- Dias com agendamentos marcados com um ponto azul
- Feriados marcados com cor diferente (teal/accent)
- Ao clicar no mini calendario, ele expande em um popover/dialog maior
- Na versao expandida:
  - Visualizacao completa do mes
  - Feriados listados abaixo do calendario
  - Clicar em um dia abre o dialog de novo agendamento com a data pre-preenchida

### 3. Feriados Brasileiros

Sera criado um arquivo `src/lib/holidays.ts` com:

**Feriados Nacionais fixos:**
- 01/01 - Confraternizacao Universal
- 21/04 - Tiradentes
- 01/05 - Dia do Trabalho
- 07/09 - Independencia
- 12/10 - Nossa Senhora Aparecida
- 02/11 - Finados
- 15/11 - Proclamacao da Republica
- 25/12 - Natal

**Feriados moveis (calculados por ano):**
- Carnaval (47 dias antes da Pascoa)
- Sexta-feira Santa (2 dias antes da Pascoa)
- Pascoa (algoritmo de Gauss)
- Corpus Christi (60 dias apos a Pascoa)

**Feriados municipais (Sao Paulo como padrao, configuravel):**
- 25/01 - Aniversario de Sao Paulo
- 09/07 - Revolucao Constitucionalista
- 20/11 - Consciencia Negra

O sistema usara uma funcao `getHolidays(year: number, city?: string)` que retorna a lista completa.

## Secao Tecnica

### Arquivos novos

**`src/lib/holidays.ts`**
- Funcao `computeEaster(year)` para calcular a Pascoa pelo algoritmo de Gauss
- Funcao `getHolidays(year, city?)` retornando `Array<{date: string, name: string, type: 'national' | 'municipal'}>`
- Feriados municipais configurados para Sao Paulo por padrao

**`src/components/MiniCalendar.tsx`**
- Componente que renderiza um calendario compacto usando o componente Calendar (DayPicker) ja existente
- Estado `expanded` que controla se esta compacto ou expandido (via Popover)
- Props: `currentDate`, `onDateSelect`, `onSchedule(date)`, `scheduleEvents`
- Na versao compacta: mostra mes atual, marca dias com eventos e feriados
- Na versao expandida (Popover): calendario maior + lista de feriados do mes + clique para agendar

### Arquivos modificados

**`src/pages/Agenda.tsx`**
- Reorganizar o layout: remover KPIs do topo, substituir por faixa horizontal de agenda + mini calendario
- Layout do topo: grid com agenda do dia (9-10 colunas) + mini calendario (2-3 colunas)
- Abaixo: manter o layout de duas colunas (timeline detalhada + painel OneClick)
- Integrar `MiniCalendar` com callback para abrir `NewScheduleDialog` com data selecionada
- Adicionar novo status visual "confirmado" ao mapeamento de cores

**`src/types/index.ts`**
- Adicionar `"confirmed"` ao tipo `ScheduleStatus` para suportar o status de confirmado

**`src/index.css`**
- Adicionar classe `.status-confirmed` com cores azuis suaves

**`src/components/NewScheduleDialog.tsx`**
- Nenhuma mudanca estrutural, apenas recebera a data via prop `defaultDate` (ja suportado)

### Fluxo de interacao

1. Usuario abre a pagina inicial e ve a faixa de agenda com todos os pacientes do dia
2. No canto superior direito, ve o mini calendario com pontos nos dias com agendamentos
3. Feriados aparecem destacados no calendario (cor teal)
4. Ao clicar no mini calendario, ele expande mostrando o mes completo
5. Na versao expandida, clicar em um dia:
   - Se for o dia atual ou futuro: abre dialog de novo agendamento
   - Feriados do mes sao listados abaixo do calendario
6. A faixa de agenda atualiza automaticamente ao navegar entre dias (via Topbar)

