import { useState, useEffect, useRef, useCallback } from "react";
import { StickyNote } from "lucide-react";

const LS_KEY = "notes_quick_v1";

export function QuickNotesCard() {
  const [text, setText] = useState(() => {
    try { return localStorage.getItem(LS_KEY) ?? ""; } catch { return ""; }
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const autoGrow = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 260) + "px";
  }, []);

  useEffect(() => { autoGrow(); }, [text, autoGrow]);

  const handleChange = (val: string) => {
    setText(val);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(LS_KEY, val); } catch {}
    }, 400);
  };

  // Checklist toggle: click on a line toggles "- " <-> "- [x] "
  const handleChecklistClick = (lineIndex: number) => {
    const lines = text.split("\n");
    const line = lines[lineIndex];
    if (line.startsWith("- [x] ")) {
      lines[lineIndex] = "- " + line.slice(6);
    } else if (line.startsWith("- ")) {
      lines[lineIndex] = "- [x] " + line.slice(2);
    }
    handleChange(lines.join("\n"));
  };

  const lines = text.split("\n");
  const hasChecklist = lines.some((l) => l.startsWith("- "));

  return (
    <div className="glass-card-orange rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <StickyNote className="h-3.5 w-3.5 text-primary/70" />
        <span className="text-xs font-medium text-muted-foreground">Notas rápidas</span>
      </div>

      {hasChecklist ? (
        <div className="space-y-0">
          {lines.map((line, i) => {
            const isDone = line.startsWith("- [x] ");
            const isItem = line.startsWith("- ") || isDone;
            if (!isItem) return null;
            const label = isDone ? line.slice(6) : line.slice(2);
            return (
              <button
                key={i}
                onClick={() => handleChecklistClick(i)}
                className={`flex items-center gap-2 w-full text-left text-sm py-1 px-1 rounded hover:bg-black/[0.03] transition-colors ${
                  isDone ? "line-through text-muted-foreground/60" : "text-foreground"
                }`}
              >
                <span className={`h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 ${
                  isDone ? "bg-primary/80 border-primary" : "border-primary/40"
                }`}>
                  {isDone && <span className="text-white text-[10px]">✓</span>}
                </span>
                {label}
              </button>
            );
          })}
        </div>
      ) : null}

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Digite aqui lembretes, tarefas e compromissos rápidos..."
        aria-label="Notas rápidas"
        className="w-full bg-transparent border-0 outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 focus:ring-0"
        style={{ minHeight: 44, maxHeight: 260 }}
      />
    </div>
  );
}
