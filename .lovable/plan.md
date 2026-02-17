

# Detalhe do Paciente — Visualizacao e Edicao completa

## Resumo

Criar uma nova pagina `/pacientes/:id` com visualizacao e edicao completa do paciente, seguindo o padrao de rotas do app (como `/consultas/:id`). Expandir o modelo `Patient` com novos campos (CPF, RG, endereco, CEP, filhos, animal, origem, diagnosticos, alergias). Na tabela de pacientes, o clique no nome navega para a pagina de detalhe.

## Mudancas

### 1. Expandir tipo Patient (`src/types/index.ts`)

Adicionar campos ao interface Patient:
- `cpf?: string`
- `rg?: string`
- `addressLine?: string`
- `cep?: string`
- `children?: string[]`
- `petName?: string`
- `referralSource?: string`
- `diagnoses?: string[]`
- `drugAllergies?: string[]`

### 2. Adicionar rota (`src/App.tsx`)

Adicionar rota `/pacientes/:id` apontando para novo componente `PacienteDetalhe`, dentro do grupo `AppLayout`, ao lado da rota `/pacientes`.

### 3. Tornar nome clicavel na tabela (`src/pages/Pacientes.tsx`)

Na celula do nome do paciente (linha 142-148), envolver o nome em um elemento clicavel que navega para `/pacientes/${p.id}`. Usar `cursor-pointer` e `hover:underline` para indicar interatividade.

### 4. Criar pagina PacienteDetalhe (`src/pages/PacienteDetalhe.tsx`)

Pagina completa com as seguintes caracteristicas:

**Header:**
- Botao voltar para `/pacientes`
- Avatar com inicial + nome em destaque
- Badge "Ativo" / "Arquivado"
- Botoes: "Editar" (habilita edicao), "Salvar" (persiste), "Cancelar" (descarta)
- Menu "..." com opcao "Excluir" (AlertDialog de confirmacao)

**Modo visualizacao vs edicao:**
- Estado `editing: boolean` (default false)
- Campos exibidos como texto em modo visualizacao
- Campos editaveis quando `editing = true`
- Estado local `draft` clonado do paciente ao entrar em edicao
- "Cancelar" reseta draft e sai de edicao
- "Salvar" chama `updatePatient()`, mostra toast, sai de edicao

**Secoes (Cards com glass-card):**

A) Identificacao:
- Nome (obrigatorio)
- Data de nascimento (date picker com Calendar/Popover, formato pt-BR)
- Sexo (Select existente)
- CPF (input com mascara `###.###.###-##`)
- RG (input com mascara simples)

B) Contato e Endereco:
- Telefone (existente)
- Endereco (input texto)
- CEP (input com mascara `#####-###`)

C) Familia:
- Lista dinamica de filhos: array de inputs com botao "+ Adicionar filho(a)" e icone trash para remover
- Animal de estimacao (input texto)

D) Origem (Marketing):
- "Como conheceu a clinica?" — Select com opcoes: Instagram, Google, Indicacao, Evento, Retorno, Outros

E) Saude:
- Diagnosticos: input + botao adicionar, exibidos como badges/chips removiveis
- Alergias medicamentosas: input + botao adicionar, exibidos como badges com outline destrutivo removiveis

**Validacoes:**
- Nome obrigatorio (desabilita salvar se vazio)
- CPF: mascara automatica e validacao de formato (11 digitos)
- CEP: mascara automatica e validacao de formato (8 digitos)
- Data de nascimento: validacao de data valida

**Mascaras (funcoes utilitarias inline):**
- `maskCPF(value)`: aplica `###.###.###-##`
- `maskCEP(value)`: aplica `#####-###`
- Implementadas como funcoes simples no proprio arquivo, sem dependencia externa

**Paciente nao encontrado:**
- Exibir mensagem "Paciente nao encontrado" com botao voltar (mesmo padrao de ConsultaDetalhe)

## Secao Tecnica

### `src/types/index.ts`
- Adicionar 9 campos opcionais ao `Patient`

### `src/App.tsx`
- Import `PacienteDetalhe`
- Nova Route: `<Route path="/pacientes/:id" element={<PacienteDetalhe />} />`

### `src/pages/Pacientes.tsx`
- Linha 147: envolver `{p.name}` em `<button onClick={() => navigate(`/pacientes/${p.id}`)} className="hover:underline hover:text-primary text-left">{p.name}</button>`

### `src/pages/PacienteDetalhe.tsx` (novo arquivo)
- Imports: useParams, useNavigate, useState, useAppData, updatePatient, deletePatient, componentes shadcn
- useParams para obter id, buscar paciente em data.patients
- Estado: `editing`, `draft` (copia dos campos do paciente), `deleteConfirm`
- Estado para chips: `newDiagnosis`, `newAllergy` (inputs temporarios)
- Funcoes: `handleSave`, `handleCancel`, `handleDelete`, `addChild`, `removeChild`, `addDiagnosis`, `removeDiagnosis`, `addAllergy`, `removeAllergy`
- Layout: header + 5 cards empilhados verticalmente
- Usa Card, CardContent, CardHeader, CardTitle, Input, Label, Select, Badge, Button, AlertDialog, Calendar, Popover

