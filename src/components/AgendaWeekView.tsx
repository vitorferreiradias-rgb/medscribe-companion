import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppData } from "@/hooks/useAppData";
import { ScheduleEvent, TimeBlock } from "@/types";
import { getTimeBlocksForDate } from "@/lib/store";
import { Lock } from "lucide-react";
import { toLocalDateStr } from "@/lib/format";

interface Props {
  currentDate: Date;
  onSelectDay: (date: Date) => void;
}

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const statusColors: Record<string, string> = {
  scheduled: "bg-secondary",
  confirmed: "bg-primary/10",
  in_progress: "bg-primary/20",
  done: "bg-success/10",
  no_show: "bg-destructive/10",
  rescheduled: "bg-warning/10",
};

export function AgendaWeekView({ currentDate, onSelectDay }: Props) {
  const data = useAppData();

  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    start.setDate(start.getDate() - day + 1); // Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const todayStr = toLocalDateStr();

  return (
    <Card className="glass-card rounded-xl overflow-hidden">
      <CardContent className="p-0">
        <div className="grid grid-cols-7 divide-x divide-border/30">
          {weekDays.map((day, i) => {
            const dateStr = toLocalDateStr(day);
            const isToday = dateStr === todayStr;
            const events = (data.scheduleEvents ?? []).filter((e) => e.date === dateStr).sort((a, b) => a.startTime.localeCompare(b.startTime));
            const blocks = getTimeBlocksForDate(dateStr);

            return (
              <motion.div
                key={dateStr}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`min-h-[320px] cursor-pointer hover:bg-secondary/30 transition-colors ${isToday ? "bg-primary/[0.03]" : ""}`}
                onClick={() => onSelectDay(day)}
              >
                <div className={`px-2 py-2 text-center border-b border-border/30 ${isToday ? "bg-primary/10" : ""}`}>
                  <div className="text-[11px] font-medium text-muted-foreground uppercase">{DAY_NAMES[(i + 1) % 7]}</div>
                  <div className={`text-sm font-semibold ${isToday ? "text-primary" : ""}`}>{day.getDate()}</div>
                </div>
                <div className="p-1 space-y-0.5">
                  {blocks.map((b) => (
                    <div key={b.id} className="flex items-center gap-1 px-1.5 py-1 rounded bg-muted/60 text-[10px] text-muted-foreground">
                      <Lock className="h-2.5 w-2.5" />
                      <span className="truncate">{b.startTime}-{b.endTime}</span>
                    </div>
                  ))}
                  {events.map((evt) => {
                    const pat = data.patients.find((p) => p.id === evt.patientId);
                    return (
                      <div key={evt.id} className={`flex items-center gap-1 px-1.5 py-1 rounded text-[10px] ${statusColors[evt.status] ?? "bg-secondary"}`}>
                        <Avatar className="h-4 w-4">
                          <AvatarFallback className="text-[7px] bg-primary/10 text-primary">{pat?.name?.charAt(0) ?? "?"}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <span className="font-medium truncate block">{evt.startTime}</span>
                          <span className="truncate block text-muted-foreground">{pat?.name?.split(" ")[0] ?? "—"}</span>
                        </div>
                      </div>
                    );
                  })}
                  {events.length === 0 && blocks.length === 0 && (
                    <p className="text-[10px] text-muted-foreground text-center mt-4">—</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
