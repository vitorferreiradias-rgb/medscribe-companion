import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, FileText, CalendarClock, XCircle, CheckCircle2,
  CalendarDays, Lock, Calendar, LayoutGrid, Sparkles,
  Trash2, PlusCircle,
} from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import {
  addEncounter, addTranscript, addNote, updateEncounter,
  updateScheduleEvent, deleteScheduleEvent, resetToSeed, getTimeBlocksForDate,
} from "@/lib/store";
import { parseTranscriptToSections } from "@/lib/parser";
import { formatDateTimeBR, toLocalDateStr } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ScheduleEvent } from "@/types";
import { SOAP_TEMPLATE_ID } from "@/lib/soap-template";
import { MiniCalendar } from "@/components/MiniCalendar";
import { NewsCard } from "@/components/NewsCard";
import { QuickNotesCard } from "@/components/QuickNotesCard";
import { AgendaWeekView } from "@/components/AgendaWeekView";
import { AgendaMonthView } from "@/components/AgendaMonthView";

const statusConfig: Record<string, { label: string; className: string; stripBg: string; stripBorder: string }> = {
  scheduled: { label: "Agendado", className: "status-scheduled", stripBg: "bg-slate-100/60", stripBorder: "border-l-slate-400" },
  confirmed: { label: "Confirmado", className: "status-confirmed", stripBg: "bg-primary/5", stripBorder: "border-l-primary" },
  in_progress: { label: "Em atendimento", className: "status-in_progress", stripBg: "bg-teal-50/60", stripBorder: "border-l-teal-500" },
  done: { label: "Concluída", className: "status-done", stripBg: "bg-success/5", stripBorder: "border-l-success" },
  no_show: { label: "Faltou", className: "status-no_show", stripBg: "bg-destructive/5", stripBorder: "border-l-destructive" },
  rescheduled: { label: "Remarcada", className: "status-rescheduled", stripBg: "bg-warning/[0.08]", stripBorder: "border-l-warning" },
};

const typeLabels: Record<string, string> = {
  primeira: "1ª Consulta",
  retorno: "Retorno",
  procedimento: "Procedimento",
};

interface AgendaProps {
  currentDate: Date;
  onNewSchedule: () => void;
  onReschedule: (eventId: string) => void;
  onNewTimeBlock: () => void;
  onSmartAssistant?: () => void;
}

const mockTranscript = [
  { speaker: "medico" as const, text: "Bom dia, qual a sua queixa principal?", tsSec: 0 },
  { speaker: "paciente" as const, text: "Estou com dor de cabeça há 5 dias.", tsSec: 5 },
  { speaker: "medico" as const, text: "Vou solicitar exames. Retorno em 7 dias.", tsSec: 15 },
];

export default function Agenda({ currentDate, onNewSchedule, onReschedule, onNewTimeBlock, onSmartAssistant }: AgendaProps) {
  const data = useAppData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quickNotes, setQuickNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [dayLoading, setDayLoading] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();
  const prevDateRef = useRef(toLocalDateStr(currentDate));

  const dateStr = toLocalDateStr(currentDate);

  useEffect(() => {
    if (prevDateRef.current !== dateStr) {
      prevDateRef.current = dateStr;
      setDayLoading(true);
      setSelectedId(null);
      const t = setTimeout(() => setDayLoading(false), 300);
      return () => clearTimeout(t);
    }
  }, [dateStr]);

  const dayEvents = useMemo(() => {
    return (data.scheduleEvents ?? [])
      .filter((e) => e.date === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [data.scheduleEvents, dateStr]);

  const filteredEvents = dayEvents;

  const selected = filteredEvents.find((e) => e.id === selectedId) ?? filteredEvents[0] ?? null;
  const selectedPatient = selected ? data.patients.find((p) => p.id === selected.patientId) : null;
  const selectedClinician = selected ? data.clinicians.find((c) => c.id === selected.clinicianId) : null;

  // Next patient highlight
  const [nowMinutes, setNowMinutes] = useState(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  });
  useEffect(() => {
    const interval = setInterval(() => {
      const n = new Date();
      setNowMinutes(n.getHours() * 60 + n.getMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const isToday = dateStr === toLocalDateStr();

  const nextPatientId = useMemo(() => {
    if (!isToday) return null;
    const upcoming = dayEvents.filter((e) => {
      if (e.status !== "scheduled" && e.status !== "confirmed") return false;
      const [h, m] = e.startTime.split(":").map(Number);
      return h * 60 + m >= nowMinutes;
    });
    return upcoming[0]?.id ?? null;
  }, [dayEvents, isToday, nowMinutes]);

  const calcAge = (birthDate?: string) => {
    if (!birthDate) return null;
    const diff = Date.now() - new Date(birthDate).getTime();
    return Math.floor(diff / 31557600000);
  };

  const handleNotesChange = (evtId: string, value: string) => {
    setQuickNotes((prev) => ({ ...prev, [evtId]: value }));
    setNotesSaved(false);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      updateScheduleEvent(evtId, { notes: value });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    }, 800);
  };

  const handleStart = useCallback((evt: ScheduleEvent) => {
    setLoading(true);
    setTimeout(() => {
      const now = new Date();
      const enc = addEncounter({
        patientId: evt.patientId,
        clinicianId: evt.clinicianId,
        startedAt: now.toISOString(),
        durationSec: 0,
        status: "recording",
        chiefComplaint: evt.notes || undefined,
      });
      updateScheduleEvent(evt.id, { status: "in_progress", encounterId: enc.id });
      toast({ title: "Consulta iniciada." });
      setLoading(false);
      navigate(`/consultas/${enc.id}`);
    }, 300);
  }, [navigate, toast]);

  const handleOpen = (evt: ScheduleEvent) => {
    if (evt.encounterId) navigate(`/consultas/${evt.encounterId}`);
  };

  const handleGenerate = useCallback((evt: ScheduleEvent) => {
    const enc = evt.encounterId ? data.encounters.find((e) => e.id === evt.encounterId) : null;
    if (!enc) {
      toast({ title: "Inicie a consulta primeiro.", variant: "destructive" });
      return;
    }
    if (enc.noteId) {
      navigate(`/consultas/${enc.id}`);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const pat = data.patients.find((p) => p.id === enc.patientId);
      const cli = data.clinicians.find((c) => c.id === enc.clinicianId);
      const tr = addTranscript({ encounterId: enc.id, source: "mock", content: mockTranscript });
      const sections = parseTranscriptToSections(mockTranscript, enc.id, pat?.name, cli?.name, formatDateTimeBR(enc.startedAt));
      const note = addNote({ encounterId: enc.id, templateId: SOAP_TEMPLATE_ID, sections });
      updateEncounter(enc.id, { transcriptId: tr.id, noteId: note.id, status: "draft" });
      toast({ title: "Prontuário gerado." });
      setLoading(false);
      navigate(`/consultas/${enc.id}`);
    }, 400);
  }, [data, navigate, toast]);

  const handleFinalize = useCallback((evt: ScheduleEvent) => {
    if (evt.encounterId) {
      updateEncounter(evt.encounterId, { status: "final" });
    }
    updateScheduleEvent(evt.id, { status: "done" });
    toast({ title: "Consulta finalizada e prontuário salvo." });
  }, [toast]);

  const handleNoShow = (evt: ScheduleEvent) => {
    updateScheduleEvent(evt.id, { status: "no_show" });
    toast({ title: "Paciente marcado como faltou." });
  };

  const handleReschedule = (evt: ScheduleEvent) => {
    onReschedule(evt.id);
  };

  const handleRemove = (evt: ScheduleEvent) => {
    deleteScheduleEvent(evt.id);
    setSelectedId(null);
    toast({ title: "Agendamento removido." });
  };

  // Now indicator
  const getNowPosition = () => {
    if (!isToday || filteredEvents.length === 0) return null;
    const firstMinutes = parseInt(filteredEvents[0].startTime.slice(0, 2)) * 60 + parseInt(filteredEvents[0].startTime.slice(3, 5));
    const lastEvt = filteredEvents[filteredEvents.length - 1];
    const lastEnd = lastEvt.endTime
      ? parseInt(lastEvt.endTime.slice(0, 2)) * 60 + parseInt(lastEvt.endTime.slice(3, 5))
      : firstMinutes + filteredEvents.length * 30;
    const range = lastEnd - firstMinutes;
    if (range <= 0) return null;
    const pct = ((nowMinutes - firstMinutes) / range) * 100;
    if (pct < -5 || pct > 105) return null;
    return Math.max(0, Math.min(100, pct));
  };

  const nowPct = getNowPosition();

  if (dayLoading) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-[360px] rounded-xl" />
      </div>
    );
  }

  return (
      <div className="space-y-5">
      {/* View mode tabs */}
      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList className="h-8">
            <TabsTrigger value="day" className="text-xs gap-1.5 px-3"><CalendarDays className="h-3.5 w-3.5" />Dia</TabsTrigger>
            <TabsTrigger value="week" className="text-xs gap-1.5 px-3"><LayoutGrid className="h-3.5 w-3.5" />Semana</TabsTrigger>
            <TabsTrigger value="month" className="text-xs gap-1.5 px-3"><Calendar className="h-3.5 w-3.5" />Mês</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          {onSmartAssistant && (
            <Button variant="outline" size="sm" onClick={() => onSmartAssistant()} className="gap-1.5 text-xs border-ai/30 text-ai hover:bg-ai-soft">
              <Sparkles className="h-3.5 w-3.5 text-ai" /> One Click
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onNewTimeBlock} className="gap-1.5 text-xs">
            <Lock className="h-3.5 w-3.5" /> Bloquear
          </Button>
          <Button variant="default" size="sm" onClick={onNewSchedule} className="gap-1.5 text-xs">
            Agendar
          </Button>
        </div>
      </div>

      {viewMode === "week" && (
        <AgendaWeekView currentDate={currentDate} onSelectDay={(d) => { setViewMode("day"); /* date change handled by parent */ }} />
      )}
      {viewMode === "month" && (
        <AgendaMonthView currentDate={currentDate} onSelectDay={(d) => { setViewMode("day"); }} />
      )}

      {viewMode === "day" && (
      <>
      {/* TIMELINE — principal */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-caption font-medium text-muted-foreground uppercase tracking-widest">
            Agenda do dia
          </h2>
          <span className="text-caption text-muted-foreground">
            {filteredEvents.length} consulta(s)
          </span>
        </div>

        {/* Time blocks for the day */}
        {(() => {
          const blocks = getTimeBlocksForDate(dateStr);
          if (blocks.length === 0) return null;
          return (
            <div className="flex flex-wrap gap-2">
              {blocks.map((b) => (
                <Badge key={b.id} variant="secondary" className="gap-1.5 text-xs py-1 px-2.5 bg-muted/80">
                  <Lock className="h-3 w-3 text-muted-foreground" />
                  {b.startTime}–{b.endTime} · {b.reason}
                </Badge>
              ))}
            </div>
          );
        })()}

        {filteredEvents.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="glass-card rounded-xl">
              <CardContent className="py-16 text-center text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm font-medium mb-1">
                  {dayEvents.length === 0 ? "Nenhum agendamento" : "Nenhum resultado para o filtro"}
                </p>
                <p className="text-xs mb-4">
                  {dayEvents.length === 0
                    ? "Este dia está livre. Que tal agendar uma consulta?"
                    : "Tente outro filtro ou visualize todos."}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="default" size="sm" onClick={onNewSchedule}>
                    Agendar consulta
                  </Button>
                  {dayEvents.length === 0 && (
                    <Button variant="outline" size="sm" onClick={() => { resetToSeed(); toast({ title: "Dados de exemplo carregados." }); }}>
                      Carregar seed
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Card className="glass-card rounded-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="relative">
                {/* Now indicator */}
                {nowPct !== null && (
                  <motion.div
                    className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                    style={{ top: `${nowPct}%` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 -ml-1 animate-pulse shadow-md shadow-primary/30" />
                    <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, hsl(215 84% 53% / 0.6), transparent)' }} />
                    <span className="text-[9px] font-bold text-primary bg-primary/10 backdrop-blur-sm px-1.5 py-0.5 rounded-full mr-2">
                      AGORA
                    </span>
                  </motion.div>
                )}

                <AnimatePresence>
                  {filteredEvents.map((evt, i) => {
                    const pat = data.patients.find((p) => p.id === evt.patientId);
                    const isSelected = evt.id === selected?.id;
                    const isNext = evt.id === nextPatientId;
                    const sc = statusConfig[evt.status];
                    return (
                      <motion.div
                        key={evt.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.25, ease: "easeOut" }}
                        onClick={() => setSelectedId(evt.id)}
                        className={`relative flex gap-3 py-3 px-4 cursor-pointer premium-hover border-b border-border/30 last:border-b-0 ${
                          isSelected
                            ? `bg-primary/[0.06] !border-l-primary`
                            : isNext
                            ? `bg-primary/[0.03] !border-l-primary/30`
                            : `hover:!border-l-${evt.status === 'done' ? 'success' : evt.status === 'no_show' ? 'destructive' : 'primary'}/40 hover:bg-secondary/50`
                        }`}
                      >
                        {/* Time */}
                        <div className="flex flex-col items-center shrink-0 w-14 tabular-nums">
                          <span className="text-sm font-semibold text-foreground">{evt.startTime}</span>
                          <span className="text-[10px] text-muted-foreground">{evt.endTime ?? "—"}</span>
                        </div>

                        {/* Avatar */}
                        <Avatar className="h-9 w-9 shrink-0 mt-0.5">
                          <AvatarFallback className={`gradient-avatar-${(pat?.name?.charCodeAt(0) ?? 0) % 6} text-white text-xs font-semibold shadow-inner`}>
                            {pat?.name?.charAt(0) ?? "?"}
                          </AvatarFallback>
                        </Avatar>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold truncate">{pat?.name ?? "—"}</span>
                            {isNext && (
                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-medium bg-primary/10 text-primary border-0">
                                Próximo
                              </Badge>
                            )}
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 font-medium border rounded-full ${sc.className}`}>
                              {sc.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground bg-secondary/80 px-1.5 py-0.5 rounded">
                              {typeLabels[evt.type]}
                            </span>
                          </div>

                          {/* Contextual actions */}
                          {isSelected && (
                            <motion.div
                              className="flex gap-1 mt-2"
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.15 }}
                            >
                              {(evt.status === "scheduled" || evt.status === "confirmed") && (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleStart(evt); }}>
                                        <Play className="h-3.5 w-3.5 text-primary" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Iniciar consulta</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleReschedule(evt); }}>
                                        <CalendarClock className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Remarcar</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleNoShow(evt); }}>
                                        <XCircle className="h-3.5 w-3.5 text-destructive" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Marcar falta</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleRemove(evt); }}>
                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Remover da agenda</TooltipContent>
                                  </Tooltip>
                                </>
                              )}
                              {evt.status === "in_progress" && evt.encounterId && (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleOpen(evt); }}>
                                        <FileText className="h-3.5 w-3.5 text-primary" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Abrir prontuário</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleFinalize(evt); }}>
                                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Finalizar</TooltipContent>
                                  </Tooltip>
                                </>
                              )}
                              {evt.status === "done" && evt.encounterId && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleOpen(evt); }}>
                                      <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Ver prontuário</TooltipContent>
                                </Tooltip>
                              )}
                              {(evt.status === "no_show" || evt.status === "rescheduled") && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleRemove(evt); }}>
                                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Remover da agenda</TooltipContent>
                                </Tooltip>
                              )}
                            </motion.div>
                          )}
                          {isSelected && i === filteredEvents.length - 1 && (
                            <motion.div className="flex gap-1 mt-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={(e) => { e.stopPropagation(); onNewSchedule(); }}>
                                    <PlusCircle className="h-3.5 w-3.5 text-primary" /> Agendar
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Adicionar consulta</TooltipContent>
                              </Tooltip>
                            </motion.div>
                          )}
                        </div>

                        {/* Selected indicator */}
                        {isSelected && (
                          <motion.div
                            layoutId="timeline-indicator"
                            className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary rounded-r"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}

                        {/* Next patient glow */}
                        {isNext && !isSelected && (
                          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary/30 rounded-r" />
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* NOTAS RÁPIDAS — glass laranja */}
      <QuickNotesCard />

      {/* CARD ÚNICO: Calendário + Notícias lado a lado */}
      <Card className="glass-card rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/30">
            {/* Coluna A: Mini-calendário */}
            <div className="p-4 flex flex-col">
              <MiniCalendar
                currentDate={currentDate}
                onDateSelect={() => setSelectedId(null)}
                onSchedule={() => onNewSchedule()}
                scheduleEvents={data.scheduleEvents ?? []}
              />
            </div>
            {/* Coluna B: Notícias */}
            <div className="p-0 max-h-[400px] md:max-h-[380px] overflow-y-auto">
              <NewsCard embedded />
            </div>
          </div>
        </CardContent>
      </Card>
      </>
      )}
      </div>
    );
}
