
# Prontuario Longitudinal e Historico de Consultas

## Objetivo
Corrigir o detalhe do paciente (`/pacientes/:id`) para exibir um prontuario longitudinal completo com abas, e garantir que `/consultas/:id` sempre mostre a consulta correta (nao a ultima).

## O que ja existe e sera mantido
- Card "Identificacao e Contato" com todos os campos
- Card "Familia", "Origem", "Saude" (diagnosticos e alergias)
- Observacoes
- Header do paciente com avatar, nome, badge ativo/arquivado
- Modo edicao/visualizacao com persistencia
- Toda a logica de store, tipos e seed data
- ConsultaDetalhe.tsx ja funciona corretamente (busca por `id` do params)

## O que sera alterado

### 1. PacienteDetalhe.tsx - Reestruturacao com Tabs

Reorganizar a pagina inteira em abas, mantendo header e card de identificacao:

**Header** (mantido como esta - avatar, nome, badge, botoes editar/salvar)

**Alerta de alergias** (novo): banner vermelho no topo se o paciente tiver alergias cadastradas, visivel em todas as abas.

**Sistema de Tabs com 5 abas:**

**A) Tab "Resumo"**
- Card Diagnosticos (lista resumida de chips, read-only aqui)
- Card Alergias (lista resumida com destaque vermelho, read-only aqui)
- Card "Ultima consulta" - busca o encounter mais recente do paciente, exibe data, queixa principal e primeira linha do prontuario
- Card "Proxima consulta" - busca no scheduleEvents o proximo agendamento futuro
- Botao "Nova consulta" que abre o NewEncounterDialog pre-selecionando o paciente
- Empty state se nao houver consultas

**B) Tab "Consultas"**
- Lista/timeline de TODAS as consultas do paciente (filtradas de `data.encounters`)
- Cada item mostra: data/hora, status (StatusBadge), queixa principal, resumo curto
- Filtros: periodo (7d/30d/todas), status (draft/final), busca texto
- Acoes: Abrir (navega para `/consultas/:encounterId`), Duplicar (cria novo encounter copiando dados), Deletar (com confirmacao)
- Empty state + CTA "Criar primeira consulta"

**C) Tab "Diagnosticos"**
- Lista editavel de chips (reutiliza a logica que ja existe no card "Saude")
- Adicionar/remover diagnosticos sem precisar entrar em modo edicao geral

**D) Tab "Alergias"**
- Lista editavel de chips com destaque vermelho
- Adicionar/remover alergias sem precisar entrar em modo edicao geral

**E) Tab "Documentos/Exames"**
- Placeholder com lista vazia
- CTA "Adicionar exame (mock)"
- Formulario simples: nome do documento, data, tipo (exame/laudo/imagem)
- Salva metadados em array no Patient (novo campo `documents`)
- Sem upload real, apenas metadados

### 2. ConsultaDetalhe.tsx - Ajustes menores

- Adicionar link no nome do paciente que navega para `/pacientes/:patientId`
- Exibir banner de alergias do paciente no cabecalho (se existirem)
- A logica de busca por `enc.id === id` ja esta correta, nao precisa mudar

### 3. Modelo de dados (types/index.ts)

- Adicionar campo `documents` opcional ao Patient:
```
documents?: PatientDocument[];
```
- Adicionar interface `PatientDocument`:
```
interface PatientDocument {
  id: string;
  name: string;
  date: string;
  type: "exame" | "laudo" | "imagem" | "outro";
}
```

### 4. Store (store.ts)

- Adicionar funcao `duplicateEncounter(encId)` que copia os dados de um encounter existente, criando novo id, data atual e status "draft"

### 5. NewEncounterDialog.tsx

- Aceitar prop opcional `defaultPatientId?: string` para pre-selecionar o paciente quando aberto a partir da pagina do paciente

## Arquivos modificados
1. `src/types/index.ts` - adicionar PatientDocument e campo documents
2. `src/lib/store.ts` - adicionar duplicateEncounter
3. `src/pages/PacienteDetalhe.tsx` - reestruturar com Tabs (maior mudanca)
4. `src/pages/ConsultaDetalhe.tsx` - link no paciente + banner alergias
5. `src/components/NewEncounterDialog.tsx` - prop defaultPatientId

## O que NAO sera alterado
- Layout geral, sidebar, topbar
- Pagina de listagem de consultas (`Consultas.tsx`)
- Store, seed data, parser, format
- Nenhuma dependencia nova necessaria (Tabs ja esta disponivel via Radix)
