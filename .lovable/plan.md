

# Fluxo em etapas para Nova Consulta

## Problema atual

A tela de Nova Consulta mostra tudo de uma vez: campos de identificacao (paciente, medico, queixa, local) junto com o editor manual e o painel de IA. O usuario espera um fluxo em dois passos, como era antes:

1. Primeiro: selecionar paciente, medico e local
2. Depois: ver o editor manual (esquerda) e a area de transcricao/IA (direita)

## Solucao

Adicionar um state `step` (1 ou 2) na pagina `NovaConsulta.tsx`:

### Etapa 1 - Identificacao

- Tela centralizada e limpa com os campos: Paciente, Medico, Queixa principal, Local
- Botao "Criar paciente" inline (como ja existe)
- Botao "Continuar" habilitado somente quando paciente e medico estiverem selecionados
- Animacao de transicao suave para a etapa 2

### Etapa 2 - Editor + Transcricao

- Layout atual de duas colunas (desktop) ou tabs (mobile)
- Esquerda: editor manual com toolbar Markdown e modelos
- Direita: painel de IA (placeholder ate gerar)
- Gravacao/transcricao no painel colapsavel abaixo do editor
- Footer sticky com botoes de salvar/gerar/unir

### Mudancas no arquivo

**`src/pages/NovaConsulta.tsx`**

- Adicionar state `step` (1 ou 2), inicializando em 1
- Na etapa 1: renderizar `identificationForm` centralizado num card com botao "Continuar"
- Na etapa 2: renderizar o layout atual (colunas ou tabs) sem o `identificationForm` embutido
- Mover o `identificationForm` para fora do editor pane
- Mostrar resumo compacto do paciente/medico selecionado no header da etapa 2 (nome do paciente e medico como badges)
- Botao "Continuar" desabilitado se `!patientId || !clinicianId`

### Secao tecnica

O state `step` controla qual bloco e renderizado no main content area:

```text
step === 1:
  Card centralizado (max-w-lg mx-auto)
    - identificationForm (paciente, medico, queixa, local)
    - Botao "Continuar" (disabled se falta paciente ou medico)

step === 2:
  Header compacto: "Paciente: Nome | Medico: Nome" (clicavel para voltar ao step 1)
  Layout dual-pane atual (editor esquerda, IA direita)
  Footer sticky com acoes
```

Nenhum arquivo novo sera criado. Apenas `NovaConsulta.tsx` sera modificado.

