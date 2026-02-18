
# Notas Rapidas / Compromissos - Novo Layout

## Resumo
Reestruturar o QuickNotesCard para ter um campo de texto de apenas 1 linha no topo, trocar o titulo para "Notas rapidas / compromissos" com um botao "+" ao lado, e ao clicar no "+" adicionar novos itens de compromisso abaixo (cada um com bullet circular).

## O que muda

### QuickNotesCard.tsx - Reescrita do componente

**Titulo:** Trocar de "Notas rapidas" para "Notas rapidas / compromissos" com um botao "+" clicavel ao lado direito do titulo.

**Campo de texto principal:**
- Reduzir para altura de 1 linha fixa (sem auto-grow)
- Serve como campo de anotacao rapida simples
- Persistido no localStorage como antes

**Lista de compromissos (novo):**
- Ao clicar no "+", um novo item aparece abaixo com:
  - Um circulo (bullet) no inicio da linha
  - Um input de texto editavel ao lado para o usuario digitar o compromisso
  - Foco automatico no novo input
- O usuario pode adicionar quantos itens quiser clicando "+" repetidamente
- Cada item pode ser removido (botao X ao hover) ou marcado como concluido (clicando no circulo, que fica preenchido e o texto fica riscado)
- Tudo persistido no localStorage (nota + array de compromissos)

**Estrutura de dados no localStorage:**
```
{
  "note": "texto da nota rapida",
  "items": [
    { "id": "...", "text": "compromisso 1", "done": false },
    { "id": "...", "text": "compromisso 2", "done": true }
  ]
}
```
Key continua `notes_quick_v1` mas o formato muda de string para JSON. Ao carregar, se o valor antigo for string pura, migra automaticamente para o novo formato (coloca como `note`).

## Arquivo modificado
1. `src/components/QuickNotesCard.tsx` - Reescrita com novo layout

## O que NAO muda
- CSS do glass-card-orange (mantem igual)
- Posicao na Agenda (mantem igual)
- Nenhum outro arquivo
