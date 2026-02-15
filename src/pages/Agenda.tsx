import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, FileText, CalendarClock, XCircle, CheckCircle2,
  Clock, CalendarDays, Stethoscope, StickyNote, ClipboardList,
} from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import {
  addEncounter, addTranscript, addNote, updateEncounter,
  updateScheduleEvent, deleteScheduleEvent,
} from "@/lib/store";
import { parseTranscriptToSections } from "@/lib/parser";
import { formatDateTimeBR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ScheduleEvent } from "@/types";
import { SOAP_TEMPLATE_ID } from "@/lib/soap-template";

const statusConfig: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Aguardando", className: "bg-secondary text-secondary-foreground" },
  in_progress: { label: "Em atendimento", className: "bg-primary/15 text-primary border border-primary/30" },
  done: { label: "Concluída", className: "bg-success/15 text-success border border-success/30" },
  no_show: { label: "Faltou", className: "bg-destructive/15 text-destructive border border-destructive/30" },
  rescheduled: { label: "Remarcada", className: "bg-warning/15 text-warning border border-warning/30" },
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

// Mock transcript for oneclick
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

  const dateStr = currentDate.toISOString().slice(0, 10);

  const dayEvents = useMemo(() => {
    return (data.scheduleEvents ?? [])
      .filter((e) => e.date === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [data.scheduleEvents, dateStr]);

  const selected = dayEvents.find((e) => e.id === selectedId) ?? dayEvents[0] ?? null;
  const selectedPatient = selected ? data.patients.find((p) => p.id === selected.patientId) : null;
  const selectedClinician = selected ? data.clinicians.find((c) => c.id === selected.clinicianId) : null;

  // KPIs
  const totalDay = dayEvents.length;
  const pending = dayEvents.filter((e) => e.status === "scheduled").length;
  const drafts = data.encounters.filter((e) => e.status === "draft").length;

  const calcAge = (birthDate?: string) => {
    if (!birthDate) return null;
    const diff = Date.now() - new Date(birthDate).getTime();
    return Math.floor(diff / 31557600000);
  };

  // OneClick: Start consultation
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

  // OneClick: Open encounter
  const handleOpen = (evt: ScheduleEvent) => {
    if (evt.encounterId) navigate(`/consultas/${evt.encounterId}`);
  };

  // OneClick: Generate note
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

  // OneClick: Finalize
  const handleFinalize = useCallback((evt: ScheduleEvent) => {
    if (evt.encounterId) {
      updateEncounter(evt.encounterId, { status: "final" });
    }
    updateScheduleEvent(evt.id, { status: "done" });
    toast({ title: "Consulta finalizada e prontuário salvo." });
  }, [toast]);

  // Mark no-show
  const handleNoShow = (evt: ScheduleEvent) => {
    updateScheduleEvent(evt.id, { status: "no_show" });
    toast({ title: "Paciente marcado como faltou." });
  };

  // Reschedule placeholder
  const handleReschedule = (evt: ScheduleEvent) => {
    updateScheduleEvent(evt.id, { status: "rescheduled" });
    toast({ title: "Marcado como remarcado." });
  };

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Consultas hoje", value: totalDay, icon: CalendarDays, accent: "text-primary" },
          { label: "Aguardando", value: pending, icon: Clock, accent: "text-warning" },
          { label: "Rascunhos pendentes", value: drafts, icon: FileText, accent: "text-muted-foreground" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="glass-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <kpi.icon className={`h-5 w-5 ${kpi.accent}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className={`text-2xl font-bold ${kpi.accent}`}>{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left column: Timeline */}
        <div className="lg:col-span-4 space-y-1">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Agenda do dia
          </h2>
          {dayEvents.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center text-muted-foreground">
                <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Nenhum agendamento para este dia.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={onNewSchedule}>
                  Agendar consulta
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[27px] top-2 bottom-2 w-px bg-border" />
              <AnimatePresence>
                {dayEvents.map((evt, i) => {
                  const pat = data.patients.find((p) => p.id === evt.patientId);
                  const isSelected = evt.id === (selected?.id);
                  const sc = statusConfig[evt.status];
                  return (
                    <motion.div
                      key={evt.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setSelectedId(evt.id)}
                      className={`relative flex gap-3 py-2 px-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? "bg-secondary/80" : "hover:bg-secondary/40"
                      }`}
                    >
                      {/* Timeline dot */}
                      <div className={`relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                        evt.status === "in_progress" ? "border-primary bg-primary/20" :
                        evt.status === "done" ? "border-success bg-success/20" :
                        evt.status === "no_show" ? "border-destructive bg-destructive/20" :
                        "border-border bg-background"
                      }`}>
                        <span className="text-[9px] font-bold text-muted-foreground">
                          {evt.startTime.slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate">{pat?.name ?? "—"}</span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${sc.className}`}>
                            {sc.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{evt.startTime}–{evt.endTime ?? "?"}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary">{typeLabels[evt.type]}</span>
                        </div>
                        {/* Inline quick actions */}
                        <div className="flex gap-1 mt-1.5">
                          {evt.status === "scheduled" && (
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
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right column: OneClick panel */}
        <div className="lg:col-span-8 space-y-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-lg" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
              </div>
            </div>
          ) : selected && selectedPatient ? (
            <>
              {/* Patient card */}
              <Card className="glass-card">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary text-xl font-bold">
                      {selectedPatient.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold">{selectedPatient.name}</h2>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {calcAge(selectedPatient.birthDate) && (
                          <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                            {calcAge(selectedPatient.birthDate)} anos
                          </span>
                        )}
                        {selectedPatient.sex && selectedPatient.sex !== "NA" && (
                          <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                            {selectedPatient.sex === "M" ? "Masculino" : selectedPatient.sex === "F" ? "Feminino" : "Outro"}
                          </span>
                        )}
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                          {selected.startTime} — {typeLabels[selected.type]}
                        </span>
                      </div>
                      {selectedClinician && (
                        <p className="text-xs text-muted-foreground mt-1">{selectedClinician.name}</p>
                      )}
                    </div>
                    <div>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusConfig[selected.status].className}`}>
                        {statusConfig[selected.status].label}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* OneClick CTA grid */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                  disabled={selected.status !== "scheduled"}
                  onClick={() => handleStart(selected)}
                >
                  <Stethoscope className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">Iniciar consulta</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 border-warning/30 hover:bg-warning/10 hover:border-warning/50"
                  disabled={!selected.encounterId}
                  onClick={() => handleGenerate(selected)}
                >
                  <FileText className="h-6 w-6 text-warning" />
                  <span className="text-sm font-medium">Gerar prontuário</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 hover:bg-secondary/60"
                  disabled={!selected.encounterId}
                  onClick={() => handleOpen(selected)}
                >
                  <ClipboardList className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">Abrir prontuário</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 border-success/30 hover:bg-success/10 hover:border-success/50"
                  disabled={selected.status === "done" || selected.status === "no_show"}
                  onClick={() => handleFinalize(selected)}
                >
                  <CheckCircle2 className="h-6 w-6 text-success" />
                  <span className="text-sm font-medium">Finalizar consulta</span>
                </Button>
              </div>

              {/* Quick notes */}
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-muted-foreground" /> Notas rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Anotar antes/durante a consulta..."
                    rows={3}
                    value={quickNotes[selected.id] ?? selected.notes ?? ""}
                    onChange={(e) => {
                      setQuickNotes((prev) => ({ ...prev, [selected.id]: e.target.value }));
                      updateScheduleEvent(selected.id, { notes: e.target.value });
                    }}
                    className="resize-none"
                  />
                </CardContent>
              </Card>

              {/* Patient pending tasks mock */}
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-muted-foreground" /> Pendências do paciente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-warning" />
                      <span>Exame de sangue solicitado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                      <span>Retorno em 7 dias</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                      <span>Prescrição de paracetamol</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="glass-card">
              <CardContent className="py-16 text-center text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Selecione um agendamento ou crie um novo.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={onNewSchedule}>
                  Novo agendamento
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
