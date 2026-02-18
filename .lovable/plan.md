
# Nova Consulta -- Prontuario Manual + Prontuario IA lado a lado

## Resumo

Reformular a tela de Nova Consulta para que o medico tenha duas areas distintas: um **editor manual rico** (esquerda) onde escreve livremente com barra de ferramentas e pode inserir modelos SOAP ou modelos personalizados salvos, e um **prontuario gerado pela IA** (direita) montado automaticamente a partir da transcricao de audio pelo Cloud (Gemini). Ao final, o medico pode unir ambos num unico prontuario. A transcricao bruta e arquivada separadamente com data e nome do paciente.

## Fluxo do usuario

```text
1. Medico abre "Nova Consulta"
2. Preenche identificacao (paciente, medico, queixa, local)
3. Escreve manualmente no editor da esquerda (com toolbar)
   - Pode inserir modelo SOAP padrao ou modelo salvo por ele
4. Opcionalmente grava audio (painel inferior ou tab mobile)
5. Clica "Finalizar e gerar prontuario"
   - Transcricao e enviada ao Cloud (Gemini) que retorna SOAP estruturado
   - Resultado aparece na coluna DIREITA
   - Transcricao bruta e salva em arquivo separado (localStorage)
6. Medico revisa os dois lados e clica "Unir prontuarios"
   - O conteudo da IA e mesclado ao texto manual
   - Resultado final e salvo como prontuario da consulta
7. Navega para /consultas/:id com o documento final
```

## Layout da tela (apos finalizar)

```text
+------------------------------------------------------------------+
| [<- Voltar]   Nova Consulta               [Badge: Rascunho]      |
+------------------------------------------------------------------+
|                                                                  |
|  ESQUERDA (50%)                  |  DIREITA (50%)                |
|  Prontuario Manual               |  Prontuario IA (Cloud)        |
|                                  |                               |
|  [B] [I] [H1] [H2] [Lista] ...  |  (aparece apos finalizar)     |
|  +----------------------------+  |  +-------------------------+  |
|  | Editor com toolbar         |  |  | SOAP gerado pela IA    |  |
|  | (texto livre ou modelo)    |  |  | (stream em tempo real)  |  |
|  |                            |  |  |                         |  |
|  +----------------------------+  |  +-------------------------+  |
|                                  |                               |
|  [Inserir modelo v]              |  [Copiar] [Inserir no manual] |
|   - SOAP padrao                  |                               |
|   - Meus modelos salvos          |                               |
|   - Salvar modelo atual          |                               |
|                                  |                               |
|  === Gravacao (colapsavel) ===   |                               |
|  [Iniciar gravacao] Timer        |                               |
|  Transcricao ao vivo             |                               |
|                                  |                               |
+------------------------------------------------------------------+
| [Salvar rascunho]  [...] | [Unir prontuarios] [Finalizar e gerar]|
+------------------------------------------------------------------+
```

No mobile: 3 tabs -- "Editor Manual", "Prontuario IA", "Gravacao"

## Mudancas por arquivo

### 1. `supabase/functions/generate-soap/index.ts` (NOVO)

Nova edge function que recebe a transcricao bruta e gera prontuario SOAP completo usando Gemini.

- Recebe: `{ transcription: string, patientName: string, chiefComplaint: string }`
- System prompt instrui a IA a gerar SOAP completo (QP, HDA, AP, Medicamentos, Alergias, Exame Fisico, Hipoteses, Plano, Prescricoes, Orientacoes, CID)
- Streaming SSE (mesmo padrao do clinical-summary existente)
- Trata erros 429/402

### 2. `supabase/config.toml`

Adicionar:
```
[functions.generate-soap]
verify_jwt = false
```

### 3. `src/lib/ai-soap.ts` (NOVO)

Cliente frontend para chamar a edge function `generate-soap` com streaming, no mesmo padrao de `ai-summary.ts`.

### 4. `src/lib/transcript-archive.ts` (NOVO)

Modulo para salvar e listar transcricoes brutas no localStorage:
- Chave: `medscribe_transcriptions`
- Cada registro: `{ id, date, patientName, patientId, encounterId, content: string }`
- Funcoes: `saveTranscription(...)`, `listTranscriptions()`, `getTranscription(id)`

### 5. `src/lib/note-templates.ts` (NOVO)

Modulo para gerenciar modelos de prontuario personalizados:
- Chave: `medscribe_note_templates`
- Cada modelo: `{ id, name, content: string, createdAt: string }`
- Funcoes: `saveTemplate(name, content)`, `listTemplates()`, `deleteTemplate(id)`
- Modelo SOAP padrao ja disponivel como opcao fixa (gerado a partir do soap-template existente)

### 6. `src/pages/NovaConsulta.tsx` (REESCREVER)

Mudancas principais:

**Editor manual (esquerda):**
- Substituir a textarea simples por uma textarea com barra de ferramentas (Markdown shortcuts):
  - Botoes: Negrito (Ctrl+B), Italico (Ctrl+I), Titulo H2, Lista, Separador
  - Cada botao insere marcacao Markdown na posicao do cursor
- Dropdown "Inserir modelo" com opcoes:
  - "Modelo SOAP padrao" -- insere todas as secoes SOAP como headers `## Secao`
  - Modelos salvos pelo usuario (listados do localStorage)
  - "Salvar modelo atual" -- salva o conteudo corrente como modelo reutilizavel
- Remover as secoes SOAP colapsaveis individuais (substituidas pelo editor unificado)

**Gravacao (abaixo do editor manual, colapsavel):**
- Mover gravacao para um painel colapsavel ABAIXO do editor manual (nao mais na coluna direita)
- Mesma funcionalidade: mic, timer, transcricao ao vivo, colar texto

**Coluna direita (prontuario IA):**
- Inicialmente vazia com placeholder "O prontuario gerado pela IA aparecera aqui apos finalizar"
- Apos clicar "Finalizar e gerar":
  1. Transcricao bruta e salva no arquivo (transcript-archive)
  2. Transcricao e enviada para `generate-soap` edge function
  3. Resposta aparece em streaming no painel direito (texto SOAP formatado)
- Botoes no rodape do painel IA:
  - "Copiar" -- copia o SOAP gerado
  - "Inserir no editor" -- concatena o texto gerado ao editor manual

**Footer sticky:**
- "Salvar rascunho" (secundario)
- "Finalizar e gerar prontuario" -- envia transcricao ao Cloud, mostra resultado na direita
- "Unir e salvar" (aparece apos IA gerar) -- mescla esquerda + direita e salva como prontuario final
- Menu "..." com cancelar/descartar

**Fluxo de finalizacao:**
- "Finalizar e gerar" chama a edge function com a transcricao
- Transcricao bruta e salva no archive com data + nome do paciente
- Resultado IA aparece na direita em streaming
- "Unir e salvar" combina o texto manual + texto IA, cria o encounter/note e navega para `/consultas/:id`

### 7. `src/types/index.ts`

Adicionar tipos:
```typescript
export interface TranscriptArchive {
  id: string;
  date: string;
  patientName: string;
  patientId: string;
  encounterId?: string;
  content: string; // texto bruto da transcricao
}

export interface CustomNoteTemplate {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}
```

## O que NAO muda

- ConsultaDetalhe (pagina de visualizacao pos-finalizacao)
- clinical-summary edge function (resumo GenAI separado, continua funcionando)
- Store, tipos existentes, parser (mantido como fallback)
- Sidebar, Topbar, demais paginas
- Fluxo de prescricoes

## Secao tecnica

### Edge function generate-soap

O system prompt vai instruir a IA a receber a transcricao bruta medico-paciente e produzir um prontuario SOAP completo com os mesmos headers do template existente. Streaming SSE para feedback instantaneo.

### Barra de ferramentas do editor

Implementada com botoes que manipulam a textarea via `selectionStart`/`selectionEnd`, inserindo marcacao Markdown (ex: `**texto**` para negrito, `## ` para titulo). Nao requer bibliotecas de rich text editor -- mantemos simplicidade com Markdown.

### Arquivo de transcricoes

Persistido em `localStorage` com chave propria (`medscribe_transcriptions`), separado dos dados principais do app. Cada entrada contem a data, nome do paciente e texto integral da transcricao para consulta futura.

### Modelos de prontuario

O modelo SOAP padrao e gerado programaticamente a partir do `soapTemplate` existente. Modelos personalizados sao salvos pelo usuario a partir do conteudo atual do editor, armazenados em localStorage com chave `medscribe_note_templates`.
