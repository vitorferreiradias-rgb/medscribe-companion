

# Prompt descritivo para a função One Click

O que segue abaixo é o texto para ser adicionado na Knowledge do projeto (Settings → Manage Knowledge), substituindo qualquer instrução anterior sobre o One Click.

---

```text
# Função One Click — Assistente de Comando por Voz/Texto

## Visão Geral
O One Click é o ponto central de produtividade do sistema. Ele recebe um comando por áudio (Web Speech API) ou texto e executa a ação correspondente de forma DIRETA, sem etapas intermediárias de seleção ou confirmação (exceto cancelamento de consulta, que pede confirmação por segurança).

## Princípio Fundamental
O fluxo é: falar/digitar → clicar "Processar" → ação executada. Nenhuma tela de opções, variantes ou escolhas deve ser exibida. O sistema toma as decisões automaticamente com base em regras definidas.

## Intenções Suportadas

### 1. Agendar consulta
- Comando: "Agendar Maria amanhã às 14h"
- Ação: Abre o dialog de novo agendamento com paciente, data e horário pré-preenchidos
- Se não informar data, assume hoje

### 2. Remarcar consulta
- Comando: "Remarcar João para sexta 10h"
- Ação: Busca a próxima consulta futura do paciente e abre o dialog de remarcação

### 3. Cancelar consulta
- Comando: "Cancelar consulta da Ana hoje"
- Ação: Localiza a consulta e pede confirmação antes de cancelar (única exceção ao fluxo direto)

### 4. Adicionar nota rápida
- Comando: "Anotar: pedir exames do Carlos"
- Ação: Adiciona diretamente ao QuickNotesCard, fecha o dialog e mostra toast

### 5. Navegar
- Comando: "Abrir pacientes", "Ir para agenda", "Ver consultas"
- Ação: Navega diretamente para a rota correspondente
- Rotas: agenda, consultas, pacientes, noticias, perfil

### 6. Buscar notícias
- Comando: "Quando é o congresso de clínica médica?"
- Ação: Navega para /noticias

### 7. Prescrever medicação (FLUXO COMPLETO E DIRETO)
- Comando: "Prescrever dipirona 500mg para Maria"
- Fluxo automático:
  a) O parser identifica: medicação, concentração, posologia (se informada), paciente
  b) Se o médico informou a posologia, usa exatamente o que ele disse
  c) Se NÃO informou posologia, o sistema busca automaticamente no banco de conhecimento
     de medicamentos (medication-knowledge.ts) a posologia padrão de bula
     - Ex: "Dipirona 500mg" → "1 comprimido de 6/6 horas se dor ou febre, por 5 dias"
  d) Se a medicação não está no banco local, o sistema deve buscar na internet
     via edge function a posologia padrão e modo de administração
  e) Classificação automática do tipo de receita:
     - Medicação simples → Receita Simples
     - Antimicrobiano → Receita Antimicrobiano (RDC 471/2021)
     - Controlado → Receita Controle Especial (Portaria 344/98)
  f) Se múltiplas medicações forem prescritas juntas e uma delas exigir receita
     especial, TODAS vão na receita de categoria mais alta (prioridade: controle_especial > antimicrobiano > simples)
  g) O resultado final é entregue DIRETAMENTE na tela de preview da receita,
     pronta para assinar, imprimir ou baixar
  h) Após assinatura, o documento é salvo automaticamente no prontuário do paciente
     (tabela clinical_documents)
  i) NÃO mostrar tela de seleção de variantes, NÃO pedir posologia manualmente,
     NÃO mostrar divergência — tudo é resolvido automaticamente
  j) Se o médico disser uma posologia diferente da bula, prevalece a do médico

### 8. Suspender medicação
- Comando: "Suspender Mounjaro porque atingiu a meta"
- Ação: Gera documento de suspensão direto no preview

### 9. Renovar prescrição
- Comando: "Renovar última prescrição"
- Ação: Busca última prescrição do paciente e clona para nova assinatura

## Regras Técnicas

### Parser de Intenções (intent-parser.ts)
- Recebe lista de pacientes como parâmetro (não usa getData())
- Faz matching por nome completo ou primeiro nome
- Extrai data e horário do texto em português natural
- Suporta: hoje, amanhã, depois de amanhã, dias da semana, datas numéricas

### Parser de Prescrição (smart-prescription-parser.ts)
- Extrai: nome da medicação, concentração, posologia, duração, quantidade, ação
- Remove palavras de ação e conectores para isolar o nome do medicamento

### Banco de Medicamentos (medication-knowledge.ts)
- Base local com medicações comuns e suas posologias padrão
- Categorias: simples, antimicrobiano, controlado
- Inclui variantes para medicações com esquemas de titulação (Mounjaro, Ozempic, Contrave)
- Quando uma medicação não está no banco local, buscar informações na internet

### Classificação Regulatória (compliance-router.ts)
- Determina automaticamente o tipo de receita baseado na categoria da medicação
- Gera lista de requisitos legais (ex: "Receita em 2 vias", "Validade: 10 dias")
- Agrupa múltiplas medicações na receita de maior exigência regulatória

### Componentes Envolvidos
- SmartAssistantDialog.tsx — interface principal do One Click
- SmartPrescriptionDialog.tsx — NÃO deve ser usado no fluxo One Click (é fluxo separado)
- O One Click deve resolver prescrições internamente e navegar direto para o preview

## Interface
- Identidade visual: ícone Sparkles, cor âmbar (ai-*)
- Textarea com botão de microfone
- Botão "Processar comando" sempre visível
- Indicador "🎙️ Ouvindo..." durante captura de áudio
- Botão "Parar e processar" durante gravação
- Resultados de feedback via toast ou tela de resultado inline

## O que NÃO fazer
- NÃO mostrar chips de exemplo abaixo do textarea
- NÃO exibir telas intermediárias de seleção de variantes ou posologia
- NÃO pedir confirmação (exceto cancelamento)
- NÃO usar getData() diretamente — receber dados via props/hooks
- NÃO usar forwardRef no componente (causa crash de HMR)
```

---

Este texto deve ser colado em **Settings → Manage Knowledge** do projeto, substituindo qualquer descrição anterior do One Click. Ele serve como referência para que futuras edições no código respeitem o comportamento esperado da função.

A implementação completa do fluxo de prescrição direto (itens 7-9) requer mudanças significativas no `SmartAssistantDialog.tsx` para integrar o parsing de prescrição, busca de posologia, classificação regulatória e geração do preview — tudo sem passar pelo `SmartPrescriptionDialog`. Se quiser, posso elaborar um plano de implementação separado para essa parte.

