import { AlertTriangle, Clock, UserX, FileWarning } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScheduleEvent, Encounter } from "@/types";
import { toLocalDateStr } from "@/lib/format";

interface AlertsCardProps {
  dayEvents: ScheduleEvent[];
  encounters: Encounter[];
}

export function AlertsCard({ dayEvents, encounters }: AlertsCardProps) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isToday = dayEvents.length > 0 && dayEvents[0].date === toLocalDateStr(now);

  const lateCount = isToday
    ? dayEvents.filter((e) => {
        if (e.status !== "scheduled" && e.status !== "confirmed") return false;
        const [h, m] = e.startTime.split(":").map(Number);
        return h * 60 + m < nowMinutes;
      }).length
    : 0;

  const noShowCount = dayEvents.filter((e) => e.status === "no_show").length;
  const draftCount = encounters.filter((e) => e.status === "draft").length;

  const alerts = [
    lateCount > 0 && {
      icon: Clock,
      label: `${lateCount} paciente${lateCount > 1 ? "s" : ""} em atraso`,
      color: "text-warning",
    },
    noShowCount > 0 && {
      icon: UserX,
      label: `${noShowCount} falta${noShowCount > 1 ? "s" : ""} registrada${noShowCount > 1 ? "s" : ""}`,
      color: "text-destructive",
    },
    draftCount > 0 && {
      icon: FileWarning,
      label: `${draftCount} rascunho${draftCount > 1 ? "s" : ""} pendente${draftCount > 1 ? "s" : ""}`,
      color: "text-warning",
    },
  ].filter(Boolean) as Array<{ icon: any; label: string; color: string }>;

  if (alerts.length === 0) return null;

  return (
    <Card className="glass-card rounded-xl">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-caption font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Alertas do dia
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm">
              <alert.icon className={`h-4 w-4 shrink-0 ${alert.color}`} />
              <span className="text-muted-foreground">{alert.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
