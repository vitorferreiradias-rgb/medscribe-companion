
# Botao Home Global + Campos Faltantes no Cadastro de Paciente

## Resumo

Duas correcoes:
1. Adicionar botao "Inicio" (Home) na Topbar para que esteja disponivel em todas as telas do sistema.
2. Restaurar campos faltantes no dialogo de "Novo Paciente": nome do pet, nomes dos filhos e origem (como conheceu a clinica).

---

## 1. Botao Home na Topbar

### Situacao atual
- A pagina "Nova Consulta" (`/consultas/nova`) ja tem um botao Home proprio (adicionado recentemente).
- Todas as outras paginas (Agenda, Pacientes, Consultas, Perfil, etc.) compartilham a `Topbar` via `AppLayout`, mas nao tem botao Home.

### Mudanca
- Adicionar um botao com icone `Home` na Topbar, ao lado do `SidebarTrigger`, que navega para `/agenda`.

### Arquivo: `src/components/Topbar.tsx`
- Importar icone `Home` do lucide-react
- Adicionar botao entre o `SidebarTrigger` e a barra de busca

---

## 2. Campos faltantes no dialogo "Novo Paciente"

### Situacao atual
O dialogo em `AppLayout.tsx` tem: Nome, Nascimento, Sexo, CPF, RG, Telefone, E-mail, CEP, Endereco, Observacoes.

Faltam: **Nome do pet**, **Filhos** e **Origem/Referral**.

A tela de detalhe do paciente (`PacienteDetalhe.tsx`) ja suporta esses campos em modo edicao e exibicao. O tipo `Patient` ja tem os campos `petName`, `children` e `referralSource`.

### Mudanca
Adicionar ao dialogo de novo paciente:
- Campo "Animal de estimacao" (texto simples)
- Campo "Filhos" (lista dinamica com botao "Adicionar filho(a)")
- Campo "Como conheceu a clinica?" (select com opcoes: Instagram, Google, Indicacao, Evento, Retorno, Outros)

### Arquivo: `src/components/AppLayout.tsx`
- Adicionar estados: `patPetName`, `patChildren`, `patReferral`
- Adicionar campos no formulario do dialogo
- Incluir esses dados na chamada `addPatient(...)`
- Limpar valores no `resetPatientForm()`

---

## Secao tecnica

### Arquivos impactados

| Arquivo | Acao |
|---------|------|
| `src/components/Topbar.tsx` | Importar `Home`, adicionar botao que navega para `/agenda` |
| `src/components/AppLayout.tsx` | Adicionar estados e campos para petName, children e referralSource no dialogo de novo paciente |
