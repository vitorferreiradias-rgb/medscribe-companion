import { useState, useEffect, useRef, useCallback } from "react";
import { StickyNote, Plus, X } from "lucide-react";

const LS_KEY = "notes_quick_v1";

interface NoteItem {
  id: string;
  text: string;
  done: boolean;
}

interface NoteData {
  note: string;
  items: NoteItem[];
}

function loadData(): NoteData {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { note: "", items: [] };
    // Migration: old format was plain string
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.note === "string") return parsed;
    } catch {
      // plain string — migrate
      return { note: raw, items: [] };
    }
  } catch {}
  return { note: "", items: [] };
}

// External API for adding notes from other components
export function addQuickNoteExternal(text: string) {
  const data = loadData();
  const id = Date.now().toString(36);
  data.items.push({ id, text, done: false });
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
  window.dispatchEvent(new CustomEvent("quick-notes-updated"));
}

export function QuickNotesCard() {
  const [data, setData] = useState<NoteData>(loadData);

  // Listen for external updates
  useEffect(() => {
    const handler = () => setData(loadData());
    window.addEventListener("quick-notes-updated", handler);
    return () => window.removeEventListener("quick-notes-updated", handler);
  }, []);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const newItemRef = useRef<string | null>(null);

  const persist = useCallback((d: NoteData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch {}
    }, 400);
  }, []);

  const update = useCallback((fn: (prev: NoteData) => NoteData) => {
    setData(prev => {
      const next = fn(prev);
      persist(next);
      return next;
    });
  }, [persist]);

  const addItem = () => {
    const id = Date.now().toString(36);
    newItemRef.current = id;
    update(d => ({ ...d, items: [...d.items, { id, text: "", done: false }] }));
  };

  const toggleItem = (id: string) => {
    update(d => ({
      ...d,
      items: d.items.map(i => i.id === id ? { ...i, done: !i.done } : i),
    }));
  };

  const removeItem = (id: string) => {
    update(d => ({ ...d, items: d.items.filter(i => i.id !== id) }));
  };

  const updateItemText = (id: string, text: string) => {
    update(d => ({
      ...d,
      items: d.items.map(i => i.id === id ? { ...i, text } : i),
    }));
  };

  return (
    <div className="glass-card-orange rounded-xl p-4 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="h-3.5 w-3.5 text-primary/70" />
          <span className="text-xs font-medium text-muted-foreground">
            Notas rápidas / compromissos
          </span>
        </div>
        <button
          onClick={addItem}
          className="h-5 w-5 rounded-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
          aria-label="Adicionar compromisso"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Single-line note */}
      <input
        type="text"
        value={data.note}
        onChange={e => update(d => ({ ...d, note: e.target.value }))}
        placeholder="Anotação rápida..."
        aria-label="Nota rápida"
        className="w-full bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground/60 focus:ring-0 h-8"
      />

      {/* Commitments list */}
      {data.items.length > 0 && (
        <div className="space-y-0.5 pt-1 border-t border-border/30">
          {data.items.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              autoFocus={newItemRef.current === item.id}
              onClearAutoFocus={() => { if (newItemRef.current === item.id) newItemRef.current = null; }}
              onToggle={() => toggleItem(item.id)}
              onRemove={() => removeItem(item.id)}
              onChange={text => updateItemText(item.id, text)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ItemRow({
  item,
  autoFocus,
  onClearAutoFocus,
  onToggle,
  onRemove,
  onChange,
}: {
  item: NoteItem;
  autoFocus: boolean;
  onClearAutoFocus: () => void;
  onToggle: () => void;
  onRemove: () => void;
  onChange: (t: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      onClearAutoFocus();
    }
  }, [autoFocus, onClearAutoFocus]);

  return (
    <div className="group flex items-center gap-2 py-1 px-1 rounded hover:bg-black/[0.03] transition-colors">
      <button
        onClick={onToggle}
        className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
          item.done
            ? "bg-primary border-primary"
            : "border-primary/40 hover:border-primary/70"
        }`}
        aria-label={item.done ? "Desmarcar" : "Marcar como concluído"}
      >
        {item.done && <span className="text-primary-foreground text-[8px]">✓</span>}
      </button>

      <input
        ref={inputRef}
        type="text"
        value={item.text}
        onChange={e => onChange(e.target.value)}
        placeholder="Compromisso..."
        className={`flex-1 bg-transparent border-0 outline-none text-sm focus:ring-0 ${
          item.done ? "line-through text-muted-foreground/60" : "text-foreground"
        }`}
      />

      <button
        onClick={onRemove}
        className="h-4 w-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-60 hover:!opacity-100 text-red-400 hover:text-red-500 transition-all"
        aria-label="Remover"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
