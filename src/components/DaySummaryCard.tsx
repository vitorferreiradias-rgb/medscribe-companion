import { CalendarDays, Clock, Stethoscope, CheckCircle2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScheduleEvent, Encounter } from "@/types";

interface DaySummaryCardProps {
  dayEvents: ScheduleEvent[];
  encounters: Encounter[];
  filter: string;
  onFilterChange: (f: string) => void;
}

export function DaySummaryCard({ dayEvents, encounters, filter, onFilterChange }: DaySummaryCardProps) {
  const total = dayEvents.length;
  const pending = dayEvents.filter((e) => e.status === "scheduled" || e.status === "confirmed").length;
  const inProgress = dayEvents.filter((e) => e.status === "in_progress").length;
  const done = dayEvents.filter((e) => e.status === "done").length;
  const drafts = encounters.filter((e) => e.status === "draft").length;

  const chips = [
    { key: "all", label: "Todos", count: total, icon: CalendarDays },
    { key: "pending", label: "Pendentes", count: pending, icon: Clock },
    { key: "in_progress", label: "Em atend.", count: inProgress, icon: Stethoscope },
    { key: "done", label: "Concluídos", count: done, icon: CheckCircle2 },
    { key: "drafts", label: "Rascunhos", count: drafts, icon: FileText },
  ];

  return (
    <Card className="glass-card rounded-xl">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-caption font-medium">Resumo do dia</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => onFilterChange(chip.key === filter ? "all" : chip.key)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                filter === chip.key
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
              }`}
            >
              <chip.icon className="h-3 w-3" />
              {chip.label}
              <Badge variant="secondary" className="h-4 min-w-[16px] px-1 text-[10px] font-semibold ml-0.5">
                {chip.count}
              </Badge>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
