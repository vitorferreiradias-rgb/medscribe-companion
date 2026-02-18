
# Corrigir navegacao para Nova Consulta

## Problema

A pagina full-screen `/consultas/nova` ja existe e funciona, porem dois arquivos ainda usam o dialog modal antigo (`NewEncounterDialog`):

1. **`src/pages/Consultas.tsx`** - botao "Nova consulta" abre o dialog antigo
2. **`src/pages/PacienteDetalhe.tsx`** - botao "Nova consulta" abre o dialog antigo

O `AppLayout.tsx` ja foi corrigido anteriormente e navega para `/consultas/nova`.

## Correcoes

### 1. `src/pages/Consultas.tsx`

- Remover import de `NewEncounterDialog`
- Remover state `showNew` e os dois componentes `<NewEncounterDialog>`
- Adicionar `useNavigate`
- Alterar os botoes "Nova consulta" para `navigate("/consultas/nova")`

### 2. `src/pages/PacienteDetalhe.tsx`

- Remover import de `NewEncounterDialog`
- Remover state `newEncounterOpen` e o componente `<NewEncounterDialog>`
- Adicionar `navigate` (ja deve existir)
- Alterar botao "Nova consulta" para `navigate("/consultas/nova?paciente=" + patient.id)`
- Na pagina `NovaConsulta.tsx`, ler o query param `paciente` e pre-selecionar o paciente automaticamente

### 3. `src/pages/NovaConsulta.tsx` (pequeno ajuste)

- Ler query param `paciente` da URL via `useSearchParams`
- Se presente, setar `patientId` com o valor recebido (pre-seleciona o paciente)

## Resultado

Todos os pontos de entrada para "Nova Consulta" vao navegar para a tela full-screen `/consultas/nova`, eliminando completamente o uso do dialog modal antigo.
