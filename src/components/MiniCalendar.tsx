import { useState, useMemo } from "react";
import { format, isSameDay, isSameMonth, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, MapPin, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getHolidays, getMonthHolidays, type Holiday } from "@/lib/holidays";
import { ScheduleEvent } from "@/types";

interface MiniCalendarProps {
  currentDate: Date;
  onDateSelect?: (date: Date) => void;
  onSchedule?: (dateStr: string) => void;
  scheduleEvents: ScheduleEvent[];
}

export function MiniCalendar({ currentDate, onDateSelect, onSchedule, scheduleEvents }: MiniCalendarProps) {
  const [expanded, setExpanded] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(currentDate));

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const holidays = useMemo(() => getHolidays(year), [year]);
  const monthHolidays = useMemo(() => getMonthHolidays(year, month), [year, month]);

  // Dates with appointments
  const eventDates = useMemo(() => {
    const set = new Set<string>();
    scheduleEvents.forEach((e) => set.add(e.date));
    return set;
  }, [scheduleEvents]);

  const holidayDates = useMemo(() => {
    const set = new Set<string>();
    holidays.forEach((h) => set.add(h.date));
    return set;
  }, [holidays]);

  const handleDayClick = (day: Date | undefined) => {
    if (!day) return;
    onDateSelect?.(day);
    if (expanded) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (day >= today) {
        const dateStr = format(day, "yyyy-MM-dd");
        onSchedule?.(dateStr);
      }
    }
  };

  // Custom day modifiers
  const modifiers = useMemo(() => {
    const hasEvent: Date[] = [];
    const isHolidayDay: Date[] = [];
    
    eventDates.forEach((d) => {
      const [y, m, dd] = d.split("-").map(Number);
      const date = new Date(y, m - 1, dd);
      if (isSameMonth(date, viewMonth)) hasEvent.push(date);
    });

    holidayDates.forEach((d) => {
      const [y, m, dd] = d.split("-").map(Number);
      const date = new Date(y, m - 1, dd);
      if (isSameMonth(date, viewMonth)) isHolidayDay.push(date);
    });

    return { hasEvent, isHolidayDay };
  }, [eventDates, holidayDates, viewMonth]);

  const modifiersStyles = {
    hasEvent: {
      position: "relative" as const,
    },
    isHolidayDay: {
      color: "hsl(var(--accent-light, 170 66% 40%))",
      fontWeight: 600,
    },
  };

  const compactCalendar = (
    <div className="glass-card rounded-xl p-3 cursor-pointer transition-all hover:shadow-md" onClick={() => setExpanded(true)}>
      <div className="flex items-center gap-2 mb-2">
        <CalendarDays className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">
          {format(viewMonth, "MMMM yyyy", { locale: ptBR })}
        </span>
      </div>
      <Calendar
        mode="single"
        selected={currentDate}
        month={viewMonth}
        onMonthChange={setViewMonth}
        onSelect={handleDayClick}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        className={cn("p-0 pointer-events-none text-[10px] [&_.rdp-caption]:hidden [&_.rdp-head_cell]:w-6 [&_.rdp-head_cell]:text-[9px] [&_.rdp-cell]:w-6 [&_.rdp-cell]:h-6 [&_.rdp-day]:w-6 [&_.rdp-day]:h-6 [&_.rdp-day]:text-[10px] [&_.rdp-row]:mt-0.5")}
        showOutsideDays={false}
      />
    </div>
  );

  return (
    <Popover open={expanded} onOpenChange={setExpanded}>
      <PopoverTrigger asChild>
        {compactCalendar}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 glass-card rounded-xl border-0 shadow-xl" align="end" sideOffset={8}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold">
              {format(viewMonth, "MMMM yyyy", { locale: ptBR })}
            </h3>
          </div>

          <Calendar
            mode="single"
            selected={currentDate}
            month={viewMonth}
            onMonthChange={setViewMonth}
            onSelect={handleDayClick}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className={cn("p-0 pointer-events-auto")}
            showOutsideDays={false}
          />

          {/* Legend */}
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground px-1">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Agendamentos
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Feriados
            </span>
          </div>

          {/* Month holidays */}
          {monthHolidays.length > 0 && (
            <div className="border-t border-border/50 pt-2 space-y-1.5">
              <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Star className="h-3 w-3" /> Feriados do mês
              </p>
              {monthHolidays.map((h) => (
                <div key={h.date} className="flex items-center gap-2 text-[11px]">
                  <span className="font-medium text-foreground w-5 text-right">
                    {h.date.slice(8)}
                  </span>
                  <span className="text-muted-foreground flex-1">{h.name}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] px-1 py-0 h-4",
                      h.type === "national"
                        ? "border-primary/30 text-primary"
                        : "border-accent/30 text-accent"
                    )}
                  >
                    {h.type === "national" ? "Nacional" : "Municipal"}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <p className="text-[10px] text-muted-foreground text-center pt-1">
            Clique em um dia para agendar
          </p>
        </motion.div>
      </PopoverContent>
    </Popover>
  );
}
