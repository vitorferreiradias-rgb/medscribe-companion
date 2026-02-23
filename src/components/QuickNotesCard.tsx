import { useState, useEffect, useRef, useCallback } from "react";
import { StickyNote, Plus, X, Bell, BellRing } from "lucide-react";
import { toast } from "sonner";

const LS_KEY = "notes_quick_v1";

interface NoteItem {
  id: string;
  text: string;
  done: boolean;
  alarm?: string; // "HH:mm"
}

interface NoteData {
  note: string;
  items: NoteItem[];
}

function loadData(): NoteData {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { note: "", items: [] };
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.note === "string") return parsed;
    } catch {
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

function currentHHMM() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function QuickNotesCard() {
  const [data, setData] = useState<NoteData>(loadData);

  useEffect(() => {
    const handler = () => setData(loadData());
    window.addEventListener("quick-notes-updated", handler);
    return () => window.removeEventListener("quick-notes-updated", handler);
  }, []);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const newItemRef = useRef<string | null>(null);
  const firedRef = useRef<Set<string>>(new Set());

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

  // Alarm checker
  useEffect(() => {
    const check = () => {
      const now = currentHHMM();
      setData(prev => {
        const toFire = prev.items.filter(i => !i.done && i.alarm === now && !firedRef.current.has(i.id));
        if (toFire.length === 0) return prev;
        toFire.forEach(i => {
          firedRef.current.add(i.id);
          toast("⏰ Lembrete", { description: i.text || "Compromisso sem título" });
        });
        const next = {
          ...prev,
          items: prev.items.map(i => toFire.some(f => f.id === i.id) ? { ...i, alarm: undefined } : i),
        };
        persist(next);
        return next;
      });
    };
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
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

  const setAlarm = (id: string, time: string) => {
    firedRef.current.delete(id);
    update(d => ({
      ...d,
      items: d.items.map(i => i.id === id ? { ...i, alarm: time } : i),
    }));
  };

  const clearAlarm = (id: string) => {
    update(d => ({
      ...d,
      items: d.items.map(i => i.id === id ? { ...i, alarm: undefined } : i),
    }));
  };

  return (
    <div className="glass-card-ai rounded-xl p-4 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="h-3.5 w-3.5 text-ai" />
          <span className="text-xs font-medium text-muted-foreground">
            Notas rápidas / compromissos
          </span>
        </div>
        <button
          onClick={addItem}
          className="h-5 w-5 rounded-full flex items-center justify-center text-ai hover:bg-ai-soft transition-colors"
          aria-label="Adicionar compromisso"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Single-line note with clear button */}
      <div className="relative">
        <input
          type="text"
          value={data.note}
          onChange={e => update(d => ({ ...d, note: e.target.value }))}
          placeholder="Anotação rápida..."
          aria-label="Nota rápida"
          className="w-full bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground/60 focus:ring-0 h-8 pr-6"
        />
        {data.note && (
          <button
            onClick={() => update(d => ({ ...d, note: "" }))}
            className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            aria-label="Limpar nota"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

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
              onSetAlarm={time => setAlarm(item.id, time)}
              onClearAlarm={() => clearAlarm(item.id)}
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
  onSetAlarm,
  onClearAlarm,
}: {
  item: NoteItem;
  autoFocus: boolean;
  onClearAutoFocus: () => void;
  onToggle: () => void;
  onRemove: () => void;
  onChange: (t: string) => void;
  onSetAlarm: (time: string) => void;
  onClearAlarm: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      onClearAutoFocus();
    }
  }, [autoFocus, onClearAutoFocus]);

  const hasAlarm = !!item.alarm;

  const handleBellClick = () => {
    if (hasAlarm) {
      onClearAlarm();
      setShowTimePicker(false);
    } else {
      setShowTimePicker(prev => !prev);
    }
  };

  return (
    <div className="group flex items-center gap-2 py-1 px-1 rounded hover:bg-black/[0.03] transition-colors">
      <button
        onClick={onToggle}
        className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
          item.done
            ? "bg-ai border-ai"
            : "border-ai/40 hover:border-ai/70"
        }`}
        aria-label={item.done ? "Desmarcar" : "Marcar como concluído"}
      >
        {item.done && <span className="text-white text-[8px]">✓</span>}
      </button>

      <input
        ref={inputRef}
        type="text"
        value={item.text}
        onChange={e => onChange(e.target.value)}
        placeholder="Compromisso..."
        className={`flex-1 bg-transparent border-0 outline-none text-sm focus:ring-0 min-w-0 ${
          item.done ? "line-through text-muted-foreground/60" : "text-foreground"
        }`}
      />

      {/* Alarm badge */}
      {hasAlarm && (
        <span className="text-[10px] text-ai font-medium shrink-0">{item.alarm}</span>
      )}

      {/* Time picker inline */}
      {showTimePicker && !hasAlarm && (
        <input
          type="time"
          className="h-5 w-[72px] text-[10px] bg-transparent border border-border/40 rounded px-1 outline-none focus:border-ai/60 shrink-0"
          autoFocus
          onChange={e => {
            if (e.target.value) {
              onSetAlarm(e.target.value);
              setShowTimePicker(false);
            }
          }}
        />
      )}

      {/* Bell button */}
      <button
        onClick={handleBellClick}
        className={`h-4 w-4 rounded flex items-center justify-center shrink-0 transition-all ${
          hasAlarm
            ? "text-ai opacity-100"
            : "opacity-0 group-hover:opacity-60 hover:!opacity-100 text-muted-foreground"
        }`}
        aria-label={hasAlarm ? "Remover alarme" : "Definir alarme"}
      >
        {hasAlarm ? <BellRing className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
      </button>

      <button
        onClick={onRemove}
        className="h-4 w-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-60 hover:!opacity-100 text-red-400 hover:text-red-500 transition-all shrink-0"
        aria-label="Remover"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
