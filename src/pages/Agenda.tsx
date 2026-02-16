import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, FileText, CalendarClock, XCircle, CheckCircle2,
  Clock, CalendarDays, Stethoscope, StickyNote, ClipboardList,
  User, Save, Loader2,
} from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import {
  addEncounter, addTranscript, addNote, updateEncounter,
  updateScheduleEvent, resetToSeed,
} from "@/lib/store";
import { parseTranscriptToSections } from "@/lib/parser";
import { formatDateTimeBR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScheduleEvent } from "@/types";
import { SOAP_TEMPLATE_ID } from "@/lib/soap-template";
import { MiniCalendar } from "@/components/MiniCalendar";
import { NewsCard } from "@/components/NewsCard";

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
}

const mockTranscript = [
  { speaker: "medico" as const, text: "Bom dia, qual a sua queixa principal?", tsSec: 0 },
  { speaker: "paciente" as const, text: "Estou com dor de cabeça há 5 dias.", tsSec: 5 },
  { speaker: "medico" as const, text: "Vou solicitar exames. Retorno em 7 dias.", tsSec: 15 },
];

export default function Agenda({ currentDate, onNewSchedule }: AgendaProps) {
  const data = useAppData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quickNotes, setQuickNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [dayLoading, setDayLoading] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();
  const prevDateRef = useRef(currentDate.toISOString().slice(0, 10));

  const dateStr = currentDate.toISOString().slice(0, 10);

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

  const isToday = dateStr === new Date().toISOString().slice(0, 10);

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
    updateScheduleEvent(evt.id, { status: "rescheduled" });
    toast({ title: "Marcado como remarcado." });
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
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-3 space-y-4">
          <Skeleton className="h-[220px] rounded-xl" />
          <Skeleton className="h-[100px] rounded-xl" />
        </div>
        <div className="lg:col-span-5 space-y-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <div className="lg:col-span-4 space-y-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      {/* LEFT COLUMN: Mini Calendar + Summary + Filters */}
      <div className="lg:col-span-3 space-y-4">
        <MiniCalendar
          currentDate={currentDate}
          onDateSelect={() => setSelectedId(null)}
          onSchedule={() => onNewSchedule()}
          scheduleEvents={data.scheduleEvents ?? []}
        />
        <NewsCard />
      </div>

      {/* CENTER COLUMN: Timeline */}
      <div className="lg:col-span-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
            Agenda do dia
          </h2>
          <span className="text-caption text-muted-foreground">
            {filteredEvents.length} de {dayEvents.length}
          </span>
        </div>

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
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0 -ml-1" />
                    <div className="flex-1 h-px bg-primary/60" />
                    <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full mr-2">
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
                        className={`relative flex gap-3 py-3 px-4 cursor-pointer transition-all duration-150 ease-out border-b border-border/50 last:border-b-0 ${
                          isSelected
                            ? "bg-primary/[0.06]"
                            : isNext
                            ? "bg-primary/[0.03]"
                            : "hover:bg-secondary/50"
                        }`}
                      >
                        {/* Time */}
                        <div className="flex flex-col items-center shrink-0 w-14">
                          <span className="text-sm font-semibold text-foreground">{evt.startTime}</span>
                          <span className="text-[10px] text-muted-foreground">{evt.endTime ?? "—"}</span>
                        </div>

                        {/* Avatar */}
                        <Avatar className="h-9 w-9 shrink-0 mt-0.5">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
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
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 font-medium border ${sc.className}`}>
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

      {/* RIGHT COLUMN: Patient panel + News + Alerts */}
      <div className="lg:col-span-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          </div>
        ) : selected && selectedPatient ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="space-y-4"
            >
              {/* Patient card */}
              <Card className="glass-card rounded-xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 shrink-0">
                      <AvatarFallback className="bg-primary/15 text-primary text-xl font-bold">
                        {selectedPatient.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold">{selectedPatient.name}</h2>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {calcAge(selectedPatient.birthDate) && (
                          <Badge variant="secondary" className="text-[11px] font-normal">
                            {calcAge(selectedPatient.birthDate)} anos
                          </Badge>
                        )}
                        {selectedPatient.sex && selectedPatient.sex !== "NA" && (
                          <Badge variant="secondary" className="text-[11px] font-normal">
                            {selectedPatient.sex === "M" ? "Masculino" : selectedPatient.sex === "F" ? "Feminino" : "Outro"}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[11px] font-normal">
                          {typeLabels[selected.type]}
                        </Badge>
                      </div>
                      {selectedClinician && (
                        <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {selectedClinician.name}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className={`shrink-0 text-xs font-medium border ${statusConfig[selected.status].className}`}>
                      {statusConfig[selected.status].label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* CTA grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Iniciar consulta",
                    icon: Stethoscope,
                    accent: "text-primary",
                    borderClass: "border-primary/20 hover:bg-primary/[0.06] hover:border-primary/40",
                    disabled: selected.status !== "scheduled" && selected.status !== "confirmed",
                    onClick: () => handleStart(selected),
                  },
                  {
                    label: "Gerar prontuário",
                    icon: FileText,
                    accent: "text-warning",
                    borderClass: "border-warning/20 hover:bg-warning/[0.06] hover:border-warning/40",
                    disabled: !selected.encounterId,
                    onClick: () => handleGenerate(selected),
                  },
                  {
                    label: "Abrir prontuário",
                    icon: ClipboardList,
                    accent: "text-muted-foreground",
                    borderClass: "hover:bg-secondary/60",
                    disabled: !selected.encounterId,
                    onClick: () => handleOpen(selected),
                  },
                  {
                    label: "Finalizar",
                    icon: CheckCircle2,
                    accent: "text-success",
                    borderClass: "border-success/20 hover:bg-success/[0.06] hover:border-success/40",
                    disabled: selected.status === "done" || selected.status === "no_show",
                    onClick: () => handleFinalize(selected),
                  },
                ].map((cta) => (
                  <Button
                    key={cta.label}
                    variant="outline"
                    className={`h-auto py-4 flex-col gap-2 rounded-xl transition-all duration-150 ease-out ${cta.borderClass}`}
                    disabled={cta.disabled}
                    onClick={cta.onClick}
                  >
                    <cta.icon className={`h-6 w-6 ${cta.accent}`} />
                    <span className="text-sm font-medium">{cta.label}</span>
                  </Button>
                ))}
              </div>

              {/* Quick notes */}
              <Card className="glass-card rounded-xl">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-caption font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <StickyNote className="h-4 w-4 text-muted-foreground" />
                      Notas rápidas
                    </span>
                    <AnimatePresence>
                      {notesSaved && (
                        <motion.span
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-1 text-[10px] text-success font-normal"
                        >
                          <Save className="h-3 w-3" /> Salvo
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <Textarea
                    placeholder="Anotar antes/durante a consulta..."
                    rows={3}
                    value={quickNotes[selected.id] ?? selected.notes ?? ""}
                    onChange={(e) => handleNotesChange(selected.id, e.target.value)}
                    className="resize-none rounded-lg text-sm"
                  />
                </CardContent>
              </Card>

              {/* Pendências */}
              <Card className="glass-card rounded-xl">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-caption font-medium flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    Pendências do paciente
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-2.5">
                    {[
                      { label: "Exame de sangue solicitado", color: "bg-warning" },
                      { label: "Retorno em 7 dias", color: "bg-primary/40" },
                      { label: "Prescrição de paracetamol", color: "bg-muted-foreground/40" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <div className={`h-2 w-2 rounded-full shrink-0 ${item.color}`} />
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="glass-card rounded-xl">
              <CardContent className="py-16 text-center text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-25" />
                <p className="text-sm font-medium mb-1">Nenhum paciente selecionado</p>
                <p className="text-xs">Selecione um agendamento na timeline.</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

      </div>
    </div>
  );
}
