

# Orientação de Uso dos Medicamentos e Recomendações da Consulta

## O que é
Um documento clínico gerado por IA, voltado ao **paciente**, com linguagem acessível, contendo:
1. Como tomar cada medicamento prescrito (horários, doses, cuidados)
2. Recomendações gerais da consulta (dieta, repouso, sinais de alerta, retorno)

Diferente do "Resumo GenAI" que é técnico e para o médico, este documento é para **entregar ao paciente**.

## Fluxo proposto

1. Botão **"Orientações ao Paciente"** na área de ações do prontuário (ao lado do "Gerar Resumo GenAI"), com ícone de FileHeart ou similar
2. Ao clicar, a IA recebe: medicações prescritas (conduta + interconsultas), conteúdo do prontuário, queixa principal e nome do paciente
3. Gera um texto em **linguagem leiga** com:
   - Tabela simplificada de medicamentos (nome, dose, quando tomar, por quanto tempo, cuidados)
   - Sinais de alerta para procurar atendimento
   - Recomendações de seguimento (dieta, atividade, retorno)
4. O médico pode **editar** antes de imprimir/entregar
5. Botão de **imprimir** e **copiar**

## Sugestão de melhoria no fluxo

Em vez de ser apenas um botão solto, adicionar como uma **nova aba** "Orientações" no painel lateral (junto com Transcrição, Receita, Dieta, Checklist, Histórico). Isso porque:
- É um artefato da consulta que o médico pode querer revisar depois
- Fica organizado junto com os outros documentos
- Pode ser persistido no banco para consultas futuras

## Implementação técnica

### 1. Nova Edge Function `patient-instructions`
- Prompt em linguagem acessível, evitando termos técnicos
- Recebe: medicações, prontuário, queixa, nome do paciente
- Retorna stream de texto em Markdown com tabela de medicamentos e recomendações
- Modelo: `google/gemini-3-flash-preview`

### 2. Frontend — Nova aba "Orientações" em `ConsultaDetalhe.tsx`
- Adicionar aba no TabsList (6 colunas: Transcrição, Receita, Dieta, Checklist, Histórico, **Orientações**)
- Conteúdo: botão "Gerar Orientações", área de preview com Markdown renderizado
- Botões: Imprimir, Copiar, Editar (textarea toggle)

### 3. Streaming helper `src/lib/ai-instructions.ts`
- Similar ao `ai-summary.ts`, chama a edge function com streaming

### Arquivos
- **Criar**: `supabase/functions/patient-instructions/index.ts`
- **Criar**: `src/lib/ai-instructions.ts`
- **Editar**: `src/pages/ConsultaDetalhe.tsx` — nova aba "Orientações"

