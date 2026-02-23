
# Adicionar botao de limpar nota e funcao de alarme nas Notas Rapidas

## Resumo

Duas novas funcionalidades no `QuickNotesCard`:

1. **Botao de limpar** a nota rapida (campo de texto do topo) -- um "X" discreto que aparece quando ha texto digitado.
2. **Alarme por item** -- cada compromisso pode ter um horario de alarme. Quando o horario chega, uma notificacao toast (sonner) avisa o usuario.

---

## 1. Botao de limpar a nota rapida

Adicionar um botao "X" dentro do campo de nota (linha 112-120) que so aparece quando `data.note` tem conteudo. Ao clicar, limpa o texto.

Visual: icone `X` pequeno, cinza discreto, aparece com fade ao lado direito do input.

---

## 2. Alarme nos compromissos

### Modelo de dados

Adicionar campo opcional `alarm` ao `NoteItem`:

```
interface NoteItem {
  id: string;
  text: string;
  done: boolean;
  alarm?: string; // formato "HH:mm" — horario do alarme para hoje
}
```

### Interacao do usuario

- Cada item ganha um botao de sino (`Bell` / `BellRing`) ao lado do "X" de remover, visivel no hover.
- Ao clicar no sino, aparece um pequeno input `time` inline para o usuario definir o horario.
- Se ja tem alarme definido, o sino fica preenchido (`BellRing`) com a cor ambar (`text-ai`) e mostra o horario ao lado.
- Para remover o alarme, o usuario clica no sino novamente.

### Disparo do alarme

- Um `useEffect` com `setInterval` (a cada 30 segundos) verifica se algum item nao-concluido tem `alarm` igual ao horario atual (`HH:mm`).
- Ao disparar, exibe um toast via `sonner` com o texto do compromisso.
- Apos disparar, o alarme e removido do item para nao repetir.

### Visual

- Sino sem alarme: icone `Bell` cinza, aparece no hover (como o "X" de remover).
- Sino com alarme: icone `BellRing` ambar (`text-ai`), sempre visivel + badge pequeno com o horario.
- Input de horario: aparece inline, estilo minimalista, com fundo transparente.

---

## Detalhes Tecnicos

### Arquivo: `src/components/QuickNotesCard.tsx`

**Imports adicionais**: `Bell`, `BellRing`, `Trash2` de lucide-react; `toast` de sonner.

**Interface NoteItem**: adicionar `alarm?: string`.

**QuickNotesCard (componente principal)**:
- Adicionar funcao `setAlarm(id, time)` e `clearAlarm(id)`.
- Adicionar `useEffect` com intervalo de 30s para verificar alarmes e disparar toasts.
- No campo de nota (input do topo): envolver em div relativa e adicionar botao "X" condicional.

**ItemRow (componente interno)**:
- Receber props `alarm`, `onSetAlarm`, `onClearAlarm`.
- Adicionar estado local `showTimePicker` para exibir/esconder o input de horario.
- Renderizar botao do sino e input de horario condicional.

### Nenhum outro arquivo precisa ser alterado.

Persistencia continua em localStorage com o mesmo key `notes_quick_v1`, compativel com dados existentes (campo `alarm` e opcional).
