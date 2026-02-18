

# Melhorias no Formulario de Paciente e Fluxo de Nova Consulta

## Problema 1: Formulario de novo paciente incompleto

O dialog "Novo Paciente" no `AppLayout.tsx` so tem 4 campos (nome, nascimento, sexo, telefone). Faltam todos os campos que ja existem no detalhe do paciente.

### Solucao

Expandir o dialog de novo paciente em `AppLayout.tsx` para incluir todos os campos disponiveis:

- Nome (obrigatorio)
- Sexo
- Data de nascimento (com date picker)
- CPF (com mascara)
- RG
- Telefone
- E-mail
- CEP (com mascara)
- Endereco
- Observacoes

O dialog sera um pouco maior (`sm:max-w-lg`) com scroll se necessario, organizado em grid de 2 colunas igual ao detalhe do paciente.

**Arquivo:** `src/components/AppLayout.tsx`

## Problema 2: Botao principal da Topbar

Trocar o botao CTA principal da Topbar de "Nova consulta" para "Adicionar paciente".

**Arquivo:** `src/components/Topbar.tsx`
- Trocar o texto do botao de "Nova consulta" para "Adicionar paciente"
- Trocar o icone de `Stethoscope` para `UserPlus`
- Trocar o onClick de `onNewConsulta` para `onNewPaciente`

## Problema 3: Fluxo da nova consulta (step 2)

Atualmente, ao clicar "Continuar" na nova consulta, o step 2 mostra apenas a gravacao de audio. O usuario quer ver o prontuario (editor de texto) como elemento principal, com a gravacao como opcao secundaria.

### Solucao

Reestruturar o step 2 do `NewEncounterDialog.tsx`:

**Layout novo do step 2:**
1. **Area principal**: Textarea grande para anamnese/observacoes (campo de texto livre onde o medico escreve diretamente)
   - Placeholder: "Descreva a anamnese, exame fisico, hipoteses e plano..."
   - min-height de 200px, redimensionavel
   - Esse texto sera salvo como conteudo inicial do prontuario

2. **Botao "Gravar audio"**: Botao secundario que expande/recolhe a area de gravacao
   - Ao clicar, mostra o timer circular e controles de gravacao (o que existe hoje)
   - O audio transcrito e a digitacao coexistem: o texto da transcricao e concatenado ao texto digitado

3. **Area de colagem**: Manter o campo "Colar transcricao" como opcao alternativa (ja existe)

4. **Botao "Finalizar"**: Cria o encounter e gera o prontuario com:
   - O texto digitado manualmente como base
   - A transcricao (se houver) como complemento
   - Navega para `/consultas/:id` com o prontuario completo

**Arquivo:** `src/components/NewEncounterDialog.tsx`

## Arquivos modificados

1. `src/components/AppLayout.tsx` - Expandir formulario de novo paciente com todos os campos
2. `src/components/Topbar.tsx` - Trocar CTA de "Nova consulta" para "Adicionar paciente"
3. `src/components/NewEncounterDialog.tsx` - Reestruturar step 2 com editor de texto principal + gravacao opcional

## O que NAO sera alterado

- Nenhuma pagina existente (PacienteDetalhe, ConsultaDetalhe, etc.)
- Store, tipos, seed data
- QuickActionsMenu (mantem todas as opcoes no dropdown +)
- CommandBar
- Layout geral, sidebar

