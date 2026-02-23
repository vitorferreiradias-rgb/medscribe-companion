

# Melhorias: Autenticacao, Agenda Avancada e Perfil Editavel

## Resumo

Tres grandes blocos de melhorias mantendo tudo local (localStorage):

1. **Autenticacao simulada aprimorada** com tela de login, protecao de rotas e sessao persistente
2. **Fluxo de agendamento completo** com remarcacao real, visualizacao semanal/mensal e bloqueio de horarios
3. **Perfil do medico editavel** com suporte a multiplas clinicas

---

## 1. Autenticacao Simulada Aprimorada

### O que muda
- Criar pagina `/login` com formulario de email/senha (credenciais fixas: `ricardo@medscribe.app` / `1234`)
- Criar componente `ProtectedRoute` que redireciona para `/login` se nao estiver logado
- Envolver todas as rotas (exceto `/login`) com `ProtectedRoute`
- Atualizar o logout em `Perfil.tsx` para redirecionar a `/login`
- Remover labels "(simulado)" — manter comportamento local mas com UX real

### Arquivos

| Arquivo | Acao |
|---------|------|
| `src/pages/Login.tsx` | Novo — formulario de login com validacao |
| `src/components/ProtectedRoute.tsx` | Novo — wrapper que checa `settings.sessionSimulated.isLoggedIn` |
| `src/App.tsx` | Adicionar rota `/login`, envolver rotas existentes com `ProtectedRoute` |
| `src/pages/Perfil.tsx` | Logout redireciona para `/login` via `navigate()` |

---

## 2. Fluxo de Agendamento

### 2a. Remarcacao real (escolher nova data/hora)

Atualmente o botao "Remarcar" apenas muda o status para `rescheduled`. A melhoria abre o dialogo `NewScheduleDialog` pre-preenchido com os dados do evento, permitindo alterar data e hora.

| Arquivo | Acao |
|---------|------|
| `src/pages/Agenda.tsx` | `handleReschedule` abre `NewScheduleDialog` em modo edicao em vez de apenas mudar status |
| `src/components/NewScheduleDialog.tsx` | Ja suporta modo edicao (`editEvent`), nenhuma mudanca necessaria |

### 2b. Visualizacao semanal e mensal

Adicionar tabs "Dia / Semana / Mes" acima da timeline da agenda.

- **Semana**: Grid com 7 colunas (seg-dom), cada coluna mostrando os eventos do dia com horario e nome do paciente
- **Mes**: Grid de calendario mensal com badges indicando quantidade de consultas por dia; clicar num dia muda para visao diaria

| Arquivo | Acao |
|---------|------|
| `src/components/AgendaWeekView.tsx` | Novo — grid semanal com eventos |
| `src/components/AgendaMonthView.tsx` | Novo — calendario mensal com contadores |
| `src/pages/Agenda.tsx` | Adicionar state `viewMode` (dia/semana/mes), tabs de selecao, renderizar componente correspondente |

### 2c. Bloqueio de horarios

Novo tipo de entidade `TimeBlock` para representar intervalos bloqueados (almoco, ferias, feriados manuais).

- Entidade armazenada em `AppData.timeBlocks`
- Dialogo para criar/editar bloqueios com: data (ou range de datas), horario inicio/fim, motivo, recorrencia (nenhuma, diaria, semanal)
- Na timeline diaria, bloqueios aparecem como faixas cinza com icone de cadeado
- Ao criar agendamento, validar conflito com bloqueios existentes

| Arquivo | Acao |
|---------|------|
| `src/types/index.ts` | Adicionar interface `TimeBlock` e campo `timeBlocks` em `AppData` |
| `src/lib/store.ts` | CRUD para `timeBlocks` (add, update, delete) |
| `src/lib/seed.ts` | Seed com bloqueio de almoco 12:00-13:00 diario |
| `src/components/NewTimeBlockDialog.tsx` | Novo — formulario para criar bloqueio |
| `src/pages/Agenda.tsx` | Renderizar bloqueios na timeline, botao "Bloquear horario" |
| `src/components/NewScheduleDialog.tsx` | Validar conflito com bloqueios ao salvar |

---

## 3. Perfil do Medico Editavel

### O que muda
- Transformar card "Informacoes da Conta" de somente-leitura para editavel
- Campos editaveis: Nome, Especialidade, CRM, CPF, Email
- Secao de Clinicas/Locais: lista de clinicas com nome e endereco, possibilidade de adicionar/remover
- Salvar alteracoes atualizando o clinician no store

| Arquivo | Acao |
|---------|------|
| `src/types/index.ts` | Expandir `Clinician` com campo `clinics: Array<{id, name, address}>` e `email` |
| `src/lib/store.ts` | Adicionar funcao `updateClinician(id, updates)` |
| `src/lib/seed.ts` | Migrar `clinicAddress` para array `clinics` no seed |
| `src/pages/Perfil.tsx` | Formulario editavel com campos do medico e lista de clinicas |

---

## Secao Tecnica Detalhada

### Nova interface TimeBlock

```text
interface TimeBlock {
  id: string
  date: string          // YYYY-MM-DD ou "recurrent"
  startTime: string     // HH:MM
  endTime: string       // HH:MM
  reason: string        // ex: "Almoco", "Ferias"
  recurrence: "none" | "daily" | "weekly"
  clinicianId: string
}
```

### Expansao do Clinician

```text
interface Clinician {
  id: string
  name: string
  specialty: string
  crm: string
  cpf?: string
  email?: string
  clinics?: Array<{ id: string; name: string; address: string }>
}
```

### Fluxo de login

```text
/login  -->  valida credenciais fixas  -->  settings.sessionSimulated.isLoggedIn = true  -->  redireciona /agenda
```

### Ordem de implementacao

1. Tipos e store (TimeBlock, Clinician expandido, updateClinician, CRUD timeBlocks)
2. Login + ProtectedRoute + rotas
3. Perfil editavel
4. Remarcacao real
5. Bloqueio de horarios + dialogo
6. Visualizacao semanal
7. Visualizacao mensal

