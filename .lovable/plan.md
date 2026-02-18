

# Nova Consulta em Tela Cheia

## Resumo

Substituir o dialog modal de "Nova Consulta" por uma pagina full-screen dedicada na rota `/consultas/nova`. O prontuario fica visivel imediatamente apos selecionar o paciente, gravacao e opcional e nao bloqueia a escrita, e o botao "Finalizar" fica sempre visivel numa barra sticky no rodape.

## Layout da nova tela

```text
+----------------------------------------------------------+
| [<- Voltar]   Nova Consulta        [Badge: Rascunho]     |  <- sticky top
+----------------------------------------------------------+
|                                                          |
|  COLUNA ESQUERDA (65%)      |  COLUNA DIREITA (35%)      |
|                             |                            |
|  Paciente: [select]         |  [Iniciar gravacao] (mic)  |
|  Medico: [select]           |                            |
|  Queixa: [input]            |  Timer circular            |
|  Local: [input]             |  Pausar | Parar            |
|                             |                            |
|  --- Anamnese / Obs ---     |  --- Transcricao ---       |
|  [   textarea grande   ]    |  [chat bubbles scroll]     |
|                             |                            |
|  --- Secoes SOAP ---        |  [Colar transcricao]       |
|  > QP  [editavel]           |                            |
|  > HDA [editavel]           |  [Ocultar gravacao]        |
|  > AP  [editavel]           |                            |
|  > ... (colapsaveis)        |                            |
|                             |                            |
+----------------------------------------------------------+
| [Salvar rascunho]    [...] | [Finalizar e gerar pront.]  |  <- sticky bottom
+----------------------------------------------------------+
```

No mobile: Tabs "Prontuario" e "Gravacao" substituem as 2 colunas.

## Mudancas por arquivo

### 1. `src/pages/NovaConsulta.tsx` (NOVO)

Pagina full-screen (sem AppLayout), dividida em:

**Header sticky (top):**
- Botao "Voltar" (navega para pagina anterior)
- Titulo "Nova Consulta"
- Badge "Rascunho" ou "Gravando..." (condicional)

**Corpo - layout unico (sem fases separadas):**
- Formulario de identificacao (paciente, medico, queixa, local) fica no topo da coluna esquerda, sempre acessivel
- Abaixo do formulario: textarea "Anamnese / Observacoes" (min-h-[200px])
- Abaixo: secoes SOAP do template como textareas menores colapsaveis (Collapsible do shadcn), pre-preenchidas com placeholder "(revise e edite)"
- Coluna direita: painel de gravacao (botao "Iniciar gravacao", timer SVG circular, controles play/pause/stop, transcricao ao vivo em chat bubbles, campo "colar transcricao")
- Botao "Ocultar gravacao" colapsa a coluna direita, dando 100% ao prontuario
- Mobile: componente Tabs do shadcn com 2 abas

**Footer sticky (bottom):**
- "Salvar rascunho" (Button variant="secondary") - cria encounter com status "draft"
- "Finalizar consulta e gerar prontuario" (Button primario) - sempre visivel
- Menu "..." (DropdownMenu) com "Cancelar consulta" e "Descartar rascunho"
- Toast em cada acao

**Atalhos:**
- Esc: navega de volta
- Ctrl/Cmd+S: salva rascunho

**Ao finalizar:**
- Cria encounter, transcript, note (mesma logica do handleFinish existente)
- Mostra skeleton de geracao brevemente
- Navega para `/consultas/:id` com prontuario completo

Reutiliza: `useSpeechRecognition`, `parseTranscriptToSections`, `addEncounter`, `addTranscript`, `addNote`, `updateEncounter`, `formatTimer`, `soapTemplate`, Collapsible e Tabs do shadcn.

### 2. `src/App.tsx`

- Importar `NovaConsulta`
- Adicionar rota FORA do bloco `<Route element={<AppLayout />}>`:

```
<Route path="/consultas/nova" element={<NovaConsulta />} />
```

Posicionar antes do bloco AppLayout para que nao herde sidebar/topbar.

### 3. `src/components/AppLayout.tsx`

- Importar `useNavigate`
- Alterar `onNewConsulta` para fazer `navigate("/consultas/nova")` em vez de `setShowNewConsulta(true)`
- Remover o state `showNewConsulta` e o componente `<NewEncounterDialog>`
- Remover imports nao usados (NewEncounterDialog)

### 4. `src/components/CommandBar.tsx`

- Verificar se `onNewConsulta` callback funciona (ja recebe do AppLayout, deve funcionar automaticamente com a mudanca no passo 3)

## O que NAO muda

- `ConsultaDetalhe` (visualizacao pos-finalizacao)
- Store, tipos, parser, soap-template
- Sidebar, Topbar, demais paginas
- Dialog de novo paciente (continua separado no AppLayout)
- `NewEncounterDialog.tsx` permanece no disco mas nao e mais importado pelo AppLayout

