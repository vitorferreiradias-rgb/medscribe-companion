import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppData } from "@/hooks/useAppData";
import { addEncounterAsync, addTranscriptAsync, addNoteAsync, updateEncounter, addPatient } from "@/lib/store";
import { parseTranscriptToSections } from "@/lib/parser";
import { formatTimer, formatDateTimeBR } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition, isSpeechRecognitionSupported } from "@/hooks/useSpeechRecognition";
import { Play, Pause, Square, Mic, AlertTriangle, Plus, UserPlus, ClipboardPaste } from "lucide-react";
import { Utterance } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPatientId?: string;
}

const mockTranscriptContent: Utterance[] = [
  { speaker: "medico", text: "Bom dia, qual a sua queixa principal?", tsSec: 0 },
  { speaker: "paciente", text: "Doutor, estou com dor de cabeça há 5 dias, piora à noite.", tsSec: 5 },
  { speaker: "medico", text: "Tem alergia a algum medicamento?", tsSec: 14 },
  { speaker: "paciente", text: "Não tenho alergia a nada.", tsSec: 19 },
  { speaker: "medico", text: "Está tomando algum medicamento?", tsSec: 25 },
  { speaker: "paciente", text: "Tomo paracetamol quando a dor é forte.", tsSec: 30 },
  { speaker: "medico", text: "Vou solicitar um exame de imagem. Orientei repouso e retorno em 10 dias.", tsSec: 40 },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

export function NewEncounterDialog({ open, onOpenChange, defaultPatientId }: Props) {
  const data = useAppData();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [patientId, setPatientId] = useState(defaultPatientId ?? "");
  const [clinicianId, setClinicianId] = useState(data.clinicians[0]?.id ?? "");
  const [complaint, setComplaint] = useState("");
  const [location, setLocation] = useState("");
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [showRecorder, setShowRecorder] = useState(false);

  // Recording state
  const [recording, setRecording] = useState<"idle" | "recording" | "paused">("idle");
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [useSpeech, setUseSpeech] = useState(true);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const speechSupported = isSpeechRecognitionSupported();
  const speech = useSpeechRecognition({ lang: "pt-BR" });

  useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [speech.utterances.length, speech.interimText]);

  useEffect(() => {
    if (!open) {
      setStep(1); setDirection(1); setPatientId(defaultPatientId ?? ""); setClinicianId(data.clinicians[0]?.id ?? ""); setComplaint(""); setLocation("");
      setRecording("idle"); setTimer(0); setPastedText(""); setUseSpeech(true); setShowNewPatient(false);
      setNewPatientName(""); setNewPatientPhone(""); setIsGenerating(false); setPatientSearch("");
      setManualNotes(""); setShowRecorder(false);
      speech.reset();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [open]);

  useEffect(() => {
    if (recording === "recording") {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recording]);

  const filteredPatients = data.patients.filter(
    (p) => !p.archived && (!patientSearch || p.name.toLowerCase().includes(patientSearch.toLowerCase()))
  );

  const canContinue = patientId && clinicianId;

  const handleCreatePatient = () => {
    if (!newPatientName.trim()) return;
    const p = addPatient({ name: newPatientName, phone: newPatientPhone || undefined });
    setPatientId(p.id);
    setShowNewPatient(false);
    setNewPatientName("");
    setNewPatientPhone("");
    toast({ title: "Paciente criado." });
  };

  const handleStart = () => { setRecording("recording"); if (useSpeech && speechSupported) speech.start(); };
  const handlePause = () => { setRecording("paused"); if (useSpeech && speechSupported) speech.pause(); };
  const handleResume = () => { setRecording("recording"); if (useSpeech && speechSupported) speech.resume(); };

  const totalUtterances = speech.utterances.length + (pastedText.trim() ? pastedText.split("\n").filter(Boolean).length : 0);

  const goToStep2 = () => { setDirection(1); setStep(2); };

  const handleFinish = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    speech.stop();
    setIsGenerating(true);

    const now = new Date();
    const startedAt = new Date(now.getTime() - timer * 1000).toISOString();
    const endedAt = now.toISOString();

    const enc = await addEncounterAsync({ patientId, clinicianId, startedAt, endedAt, durationSec: timer || 60, status: "draft", chiefComplaint: complaint || undefined, location: location || undefined });

    let utterances: Utterance[];
    let source: "pasted" | "mock" = "mock";

    if (speech.utterances.length > 0) {
      utterances = speech.utterances;
      source = "pasted";
    } else if (pastedText.trim()) {
      source = "pasted";
      utterances = pastedText.split("\n").filter(Boolean).map((line, i) => ({ speaker: i % 2 === 0 ? "medico" as const : "paciente" as const, text: line.trim(), tsSec: i * 10 }));
    } else if (manualNotes.trim()) {
      source = "pasted";
      utterances = [{ speaker: "medico" as const, text: manualNotes.trim(), tsSec: 0 }];
    } else {
      utterances = mockTranscriptContent;
    }

    if (manualNotes.trim() && (speech.utterances.length > 0 || pastedText.trim())) {
      utterances = [{ speaker: "medico" as const, text: manualNotes.trim(), tsSec: 0 }, ...utterances];
    }

    const tr = await addTranscriptAsync({ encounterId: enc.id, source, content: utterances });
    const pat = data.patients.find((p) => p.id === patientId);
    const cli = data.clinicians.find((c) => c.id === clinicianId);
    const sections = parseTranscriptToSections(utterances, enc.id, pat?.name, cli?.name, formatDateTimeBR(startedAt));
    const note = await addNoteAsync({ encounterId: enc.id, templateId: "template_soap_v1", sections });
    updateEncounter(enc.id, { transcriptId: tr.id, noteId: note.id });

    toast({ title: "Consulta criada com sucesso." });
    onOpenChange(false);
    navigate(`/consultas/${enc.id}`);
  };

  // Circular timer SVG
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const maxTime = 3600;
  const strokeOffset = circumference - (Math.min(timer, maxTime) / maxTime) * circumference;

  // Glass step progress
  const progressPercent = step === 1 ? 0 : 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle>Nova Consulta</DialogTitle>
        </DialogHeader>

        {/* Step indicator — glass progress */}
        <div className="flex items-center gap-3 pb-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors duration-200 ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>1</div>
          <div className="flex-1 h-1.5 rounded-full glass-surface overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
            />
          </div>
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors duration-200 ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>2</div>
        </div>
        <p className="text-xs text-muted-foreground text-center -mt-1 mb-2">
          {step === 1 ? "Identificação" : "Prontuário"}
        </p>

        {isGenerating ? (
          <div className="space-y-4 py-6">
            <p className="text-sm text-center text-muted-foreground">Gerando prontuário…</p>
            <div className="space-y-3 px-4">
              <Skeleton className="h-4 w-3/4 mx-auto animate-pulse" />
              <Skeleton className="h-4 w-full animate-pulse" style={{ animationDelay: "100ms" }} />
              <Skeleton className="h-4 w-5/6 mx-auto animate-pulse" style={{ animationDelay: "200ms" }} />
              <Skeleton className="h-4 w-2/3 mx-auto animate-pulse" style={{ animationDelay: "300ms" }} />
              <Skeleton className="h-4 w-4/5 mx-auto animate-pulse" style={{ animationDelay: "400ms" }} />
              <Skeleton className="h-4 w-1/2 mx-auto animate-pulse" style={{ animationDelay: "500ms" }} />
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {step === 1 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Paciente *</Label>
                    <Select value={patientId} onValueChange={setPatientId}>
                      <SelectTrigger><SelectValue placeholder="Selecione um paciente" /></SelectTrigger>
                      <SelectContent>
                        <div className="px-2 pb-2">
                          <Input
                            placeholder="Buscar..."
                            value={patientSearch}
                            onChange={(e) => setPatientSearch(e.target.value)}
                            className="h-8 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        {filteredPatients.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                        {filteredPatients.length === 0 && (
                          <p className="px-2 py-1.5 text-sm text-muted-foreground">Nenhum encontrado</p>
                        )}
                      </SelectContent>
                    </Select>
                    {!showNewPatient && (
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowNewPatient(true)}>
                        <UserPlus className="mr-1.5 h-3 w-3" /> Criar novo paciente
                      </Button>
                    )}
                    {showNewPatient && (
                      <div className="rounded-xl glass-surface p-3 space-y-3">
                        <Input placeholder="Nome do paciente" value={newPatientName} onChange={(e) => setNewPatientName(e.target.value)} className="h-8 text-sm" />
                        <Input placeholder="Telefone (opcional)" value={newPatientPhone} onChange={(e) => setNewPatientPhone(e.target.value)} className="h-8 text-sm" />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleCreatePatient} disabled={!newPatientName.trim()} className="h-7 text-xs">
                            <Plus className="mr-1 h-3 w-3" /> Criar
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setShowNewPatient(false)} className="h-7 text-xs">Cancelar</Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Médico *</Label>
                    <Select value={clinicianId} onValueChange={setClinicianId}>
                      <SelectTrigger><SelectValue placeholder="Selecione o médico" /></SelectTrigger>
                      <SelectContent>
                        {data.clinicians.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Queixa principal (opcional)</Label>
                    <Input value={complaint} onChange={(e) => setComplaint(e.target.value)} placeholder="Ex: Cefaleia persistente" />
                  </div>
                  <div className="space-y-2">
                    <Label>Local (opcional)</Label>
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Consultório 3" />
                  </div>
                  <Button className="w-full" disabled={!canContinue} onClick={goToStep2}>
                    Continuar
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Main textarea for anamnesis/observations */}
                  <div className="space-y-2">
                    <Label>Anamnese / Observações</Label>
                    <Textarea
                      value={manualNotes}
                      onChange={(e) => setManualNotes(e.target.value)}
                      placeholder="Descreva a anamnese, exame físico, hipóteses e plano..."
                      className="min-h-[200px] resize-y"
                    />
                  </div>

                  {/* Toggle audio recorder */}
                  <div className="space-y-3">
                    <Button
                      variant={showRecorder ? "secondary" : "outline"}
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setShowRecorder(!showRecorder)}
                    >
                      <Mic className="h-3.5 w-3.5" />
                      {showRecorder ? "Ocultar gravação" : "Gravar áudio"}
                    </Button>

                    {showRecorder && (
                      <div className="rounded-xl glass-surface p-4 space-y-3">
                        {!speechSupported && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>Reconhecimento de voz não suportado. Use Chrome ou cole o texto abaixo.</span>
                          </div>
                        )}

                        {/* Circular timer */}
                        <div className="flex flex-col items-center gap-2">
                          <div className="relative">
                            <svg width="80" height="80" className="-rotate-90">
                              <circle cx="40" cy="40" r={32} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                              <circle
                                cx="40" cy="40" r={32} fill="none"
                                stroke={recording === "recording" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                                strokeWidth="4" strokeLinecap="round"
                                strokeDasharray={2 * Math.PI * 32}
                                strokeDashoffset={2 * Math.PI * 32 - (Math.min(timer, maxTime) / maxTime) * 2 * Math.PI * 32}
                                className="transition-all duration-1000"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Mic className={`h-5 w-5 ${recording === "recording" ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
                            </div>
                          </div>
                          <p className="text-xl font-mono font-semibold tabular-nums">{formatTimer(timer)}</p>
                          <p className="text-xs text-muted-foreground">
                            {recording === "idle" ? "Pronto para gravar" : recording === "recording" ? (speechSupported ? "Ouvindo…" : "Gravando…") : "Pausado"}
                          </p>
                          <div className="flex gap-2">
                            {recording === "idle" && (
                              <Button size="sm" onClick={handleStart}><Play className="mr-1 h-3.5 w-3.5" /> Iniciar</Button>
                            )}
                            {recording === "recording" && (
                              <>
                                <Button size="sm" onClick={handlePause} variant="secondary"><Pause className="mr-1 h-3.5 w-3.5" /> Pausar</Button>
                                <Button size="sm" onClick={() => { speech.stop(); setRecording("idle"); }}><Square className="mr-1 h-3.5 w-3.5" /> Parar</Button>
                              </>
                            )}
                            {recording === "paused" && (
                              <>
                                <Button size="sm" onClick={handleResume}><Play className="mr-1 h-3.5 w-3.5" /> Retomar</Button>
                                <Button size="sm" onClick={() => { speech.stop(); setRecording("idle"); }}><Square className="mr-1 h-3.5 w-3.5" /> Parar</Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Live transcript */}
                        {speechSupported && (recording !== "idle" || speech.utterances.length > 0) && (
                          <ScrollArea className="h-28 rounded-lg bg-muted/30 p-2">
                            <div className="space-y-1.5">
                              {speech.utterances.map((u, i) => {
                                const isDoc = u.speaker === "medico";
                                return (
                                  <div key={i} className={`flex ${isDoc ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[80%] px-2.5 py-1 text-xs shadow-sm ${isDoc ? "bg-primary/15 rounded-xl rounded-br-md" : "bg-muted rounded-xl rounded-bl-md"}`}>
                                      {u.text}
                                    </div>
                                  </div>
                                );
                              })}
                              {speech.interimText && (
                                <p className="text-xs text-muted-foreground italic text-center">…{speech.interimText}</p>
                              )}
                              <div ref={transcriptEndRef} />
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Paste transcript */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <ClipboardPaste className="h-3 w-3" /> Colar transcrição (opcional)
                    </Label>
                    <Textarea value={pastedText} onChange={(e) => setPastedText(e.target.value)} placeholder="Cole aqui a transcrição, uma frase por linha..." rows={2} />
                  </div>

                  <Button className="w-full" onClick={handleFinish} disabled={!manualNotes.trim() && !pastedText.trim() && speech.utterances.length === 0}>
                    Finalizar e gerar prontuário
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </DialogContent>
    </Dialog>
  );
}
