import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/hooks/useAppData";

interface Props {
  currentDate: Date;
  onSelectDay: (date: Date) => void;
}

const DAY_HEADERS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function AgendaMonthView({ currentDate, onSelectDay }: Props) {
  const data = useAppData();

  const { weeks, monthLabel } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Monday = 0
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const days: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    while (days.length % 7 !== 0) days.push(null);

    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

    const monthLabel = firstDay.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    return { weeks, monthLabel };
  }, [currentDate]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const eventCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (data.scheduleEvents ?? []).forEach((e) => {
      counts[e.date] = (counts[e.date] || 0) + 1;
    });
    return counts;
  }, [data.scheduleEvents]);

  return (
    <Card className="glass-card rounded-xl overflow-hidden">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-center capitalize mb-3">{monthLabel}</h3>
        <div className="grid grid-cols-7 gap-px">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">{d}</div>
          ))}
          {weeks.flat().map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="h-12" />;
            const dateStr = day.toISOString().slice(0, 10);
            const isToday = dateStr === todayStr;
            const count = eventCounts[dateStr] || 0;
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();

            return (
              <motion.div
                key={dateStr}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.005 }}
                onClick={() => onSelectDay(day)}
                className={`h-12 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-colors hover:bg-secondary/50 ${
                  isToday ? "bg-primary/10 ring-1 ring-primary/20" : ""
                } ${!isCurrentMonth ? "opacity-40" : ""}`}
              >
                <span className={`text-sm ${isToday ? "font-bold text-primary" : "font-medium"}`}>{day.getDate()}</span>
                {count > 0 && (
                  <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5 mt-0.5 min-w-[16px] justify-center">
                    {count}
                  </Badge>
                )}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
