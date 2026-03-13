

# Extração automática de exames a partir de arquivos (PDF/imagem)

## Problema
O formulário atual de exames exige preenchimento manual de cada campo (nome, resultado, referência, data, tipo). O usuário quer fazer upload de um laudo (PDF ou imagem) e ter os dados extraídos automaticamente.

## Solução

Criar um fluxo de "importar exames via arquivo" que:
1. Aceita upload de PDF ou imagem (foto de laudo)
2. Envia o conteúdo para uma Edge Function que usa IA para extrair os dados estruturados
3. Apresenta os resultados extraídos para revisão/edição antes de salvar

### Mudanças

**1. Nova Edge Function `extract-lab-results`**
- Recebe imagem (base64) ou texto extraído de PDF
- Usa modelo Gemini (suportado pelo Lovable AI, sem API key extra) para extrair dados estruturados: array de `{ name, result, reference_range, type, date }`
- Prompt instruído a identificar nome do exame, valor, faixa de referência, data e tipo (laboratorial/biópsia/imagem)

**2. UI — Botão "Importar de arquivo" na aba Exames (`PacienteDetalhe.tsx`)**
- Novo botão ao lado do "+ Adicionar" manual
- Aceita PDF ou imagem (JPG/PNG)
- Para imagens: converte para base64 e envia à Edge Function
- Para PDFs: usa `document--parse_document` no client ou envia raw à Edge Function
- Mostra spinner durante processamento
- Após extração: exibe tabela de preview com os resultados extraídos, permitindo editar/remover antes de confirmar
- Ao confirmar, insere todos os registros via `useAddPatientLabResult`

**3. Fluxo do usuário**
```
[Importar arquivo] → Upload PDF/imagem → IA extrai dados →
Preview editável → [Confirmar] → Registros salvos na tabela
```

### Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `supabase/functions/extract-lab-results/index.ts` | Nova Edge Function para extração via IA |
| `src/pages/PacienteDetalhe.tsx` | Botão "Importar", lógica de upload, preview e confirmação |

