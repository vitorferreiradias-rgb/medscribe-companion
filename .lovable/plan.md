

# Impressao de Receita com Carimbo do Medico

## Resumo

Adicionar botao "Imprimir" na area de prescricao com duas opcoes: imprimir sem assinatura digital ou com assinatura digital. A impressao inclui carimbo do medico prescritor centralizado na margem inferior, com formato diferente para receita simples vs. especial.

## O que muda visualmente

Na secao de Assinatura Digital do PrescriptionFlow, um novo botao **"Imprimir"** (icone Printer) aparece ao lado dos botoes existentes. Ao clicar, abre um Dialog com duas opcoes:

- **Imprimir sem assinatura** — gera a pagina de impressao sem selo digital
- **Imprimir com assinatura digital** — gera a pagina com selo de assinatura (mock)

A pagina de impressao (via `window.print()`) mostra:

```text
+------------------------------------------+
|                                          |
|   [Conteudo da prescricao]               |
|   [Lista de medicamentos]                |
|                                          |
|   Data: 18 de fevereiro de 2026          |
|                                          |
|   [Selo de assinatura digital - se       |
|    opcao com assinatura selecionada]     |
|                                          |
|                                          |
|------------------------------------------|
|        CARIMBO (centralizado)            |
|                                          |
|  Receita Simples:                        |
|  Dr. Vitor Ferreira Dias                 |
|  CRM 23311/DF                            |
|                                          |
|  Receita Especial:                       |
|  Dr. Vitor Ferreira Dias                 |
|  CRM 23311/DF                            |
|  CPF: 123.456.789-00                     |
|  Clinica Exemplo - SQN 123, Brasilia-DF  |
+------------------------------------------+
```

## Dados necessarios no tipo Clinician

O tipo `Clinician` atual tem `name`, `specialty`, `crm`. Para o carimbo especial precisamos adicionar:

- `cpf?: string` — CPF do medico
- `clinicAddress?: string` — endereco da clinica

Os dados seed serao atualizados para incluir esses campos.

## Secao tecnica

### 1. Atualizar `src/types/index.ts` — tipo Clinician

Adicionar campos opcionais `cpf` e `clinicAddress`.

### 2. Atualizar `src/lib/seed.ts` — dados mock

Preencher `cpf` e `clinicAddress` nos clinicians existentes para que o carimbo funcione.

### 3. Atualizar `src/components/receita/PrescriptionFlow.tsx`

**Novas props:**
- `clinicianName?: string`
- `clinicianCrm?: string`
- `clinicianCpf?: string`
- `clinicAddress?: string`
- `patientName?: string`

**Novo estado:**
- `showPrintDialog` — controla o dialog de opcoes de impressao

**Novo botao "Imprimir"** na area de acoes (ao lado de "Assinar esta" e "Assinar todas"):
- Icone `Printer`
- Abre dialog com duas opcoes

**Nova funcao `handlePrint(withSignature: boolean)`:**
1. Monta HTML da receita em uma nova janela (`window.open`)
2. Conteudo: texto da prescricao + lista de medicamentos formatada
3. Data formatada
4. Se `withSignature` e receita ja assinada: exibe selo de assinatura digital (mock)
5. Rodape fixo na margem inferior com carimbo:
   - **Simples**: nome completo + CRM com estado (ex: "Dr. Vitor Ferreira Dias — CRM 23311/DF")
   - **Especial**: nome completo + CRM + CPF + endereco da clinica
6. CSS `@media print` para centralizar carimbo e garantir layout correto
7. Chama `window.print()` automaticamente

### 4. Atualizar `src/pages/ConsultaDetalhe.tsx`

Passar os dados do clinician como props ao PrescriptionFlow:
- `clinicianName={clinician?.name}`
- `clinicianCrm={clinician?.crm}`
- `clinicianCpf={clinician?.cpf}`
- `clinicAddress={clinician?.clinicAddress}`
- `patientName={patient?.name}`

### 5. Formato do CRM no carimbo

O campo `crm` do seed ja tem formato "CRM/SP 123456". Para o carimbo, sera exibido como esta armazenado. Se o usuario quiser formato "CRM 23311/DF", os dados seed serao ajustados.

## Arquivos impactados

| Arquivo | Acao |
|---------|------|
| `src/types/index.ts` | Adicionar `cpf` e `clinicAddress` ao Clinician |
| `src/lib/seed.ts` | Preencher novos campos nos clinicians mock |
| `src/components/receita/PrescriptionFlow.tsx` | Botao imprimir + dialog + funcao de impressao com carimbo |
| `src/pages/ConsultaDetalhe.tsx` | Passar dados do clinician ao PrescriptionFlow |

