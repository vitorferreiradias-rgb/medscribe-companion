import { formatDateTimeBR } from "@/lib/format";
import type { NoteSection } from "@/types";

interface TimelineEvent {
  label: string;
  date: string;
}

interface Props {
  createdAt: string;
  sections: NoteSection[];
}

export function ConsultaTimeline({ createdAt, sections }: Props) {
  const events: TimelineEvent[] = [
    { label: "Consulta criada", date: createdAt },
    ...sections
      .filter((s) => s.lastEditedAt)
      .map((s) => ({ label: `${s.title} editado`, date: s.lastEditedAt! }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  ];

  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
      <div className="space-y-4">
        {events.map((ev, i) => (
          <div key={i} className="relative">
            <div className="absolute -left-4 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-primary bg-background" />
            <p className="text-sm font-medium">{ev.label}</p>
            <p className="text-xs text-muted-foreground">{formatDateTimeBR(ev.date)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
