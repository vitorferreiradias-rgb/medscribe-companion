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
import { addEncounter, addTranscript, addNote, updateEncounter, addPatient } from "@/lib/store";
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

export function NewEncounterDialog({ open, onOpenChange }: Props) {
  const data = useAppData();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [patientId, setPatientId] = useState("");
  const [clinicianId, setClinicianId] = useState(data.clinicians[0]?.id ?? "");
  const [complaint, setComplaint] = useState("");
  const [location, setLocation] = useState("");
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");

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
      setStep(1); setDirection(1); setPatientId(""); setClinicianId(data.clinicians[0]?.id ?? ""); setComplaint(""); setLocation("");
      setRecording("idle"); setTimer(0); setPastedText(""); setUseSpeech(true); setShowNewPatient(false);
      setNewPatientName(""); setNewPatientPhone(""); setIsGenerating(false); setPatientSearch("");
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

  const handleFinish = () => {
    if (totalUtterances > 0 && totalUtterances < 3) {
      const ok = window.confirm("A transcrição tem menos de 3 falas. Deseja continuar assim mesmo?");
      if (!ok) return;
    }

    if (timerRef.current) clearInterval(timerRef.current);
    speech.stop();
    setIsGenerating(true);

    setTimeout(() => {
      const now = new Date();
      const startedAt = new Date(now.getTime() - timer * 1000).toISOString();
      const endedAt = now.toISOString();

      const enc = addEncounter({ patientId, clinicianId, startedAt, endedAt, durationSec: timer || 60, status: "draft", chiefComplaint: complaint || undefined, location: location || undefined });

      let utterances: Utterance[];
      let source: "pasted" | "mock" = "mock";

      if (speech.utterances.length > 0) {
        utterances = speech.utterances;
        source = "pasted";
      } else if (pastedText.trim()) {
        source = "pasted";
        utterances = pastedText.split("\n").filter(Boolean).map((line, i) => ({ speaker: i % 2 === 0 ? "medico" as const : "paciente" as const, text: line.trim(), tsSec: i * 10 }));
      } else {
        utterances = mockTranscriptContent;
      }

      const tr = addTranscript({ encounterId: enc.id, source, content: utterances });
      const pat = data.patients.find((p) => p.id === patientId);
      const cli = data.clinicians.find((c) => c.id === clinicianId);
      const sections = parseTranscriptToSections(utterances, enc.id, pat?.name, cli?.name, formatDateTimeBR(startedAt));
      const note = addNote({ encounterId: enc.id, templateId: "template_soap_v1", sections });
      updateEncounter(enc.id, { transcriptId: tr.id, noteId: note.id });

      toast({ title: "Consulta criada com transcrição." });
      onOpenChange(false);
      navigate(`/consultas/${enc.id}`);
    }, 400);
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
          {step === 1 ? "Identificação" : "Gravação"}
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
                  {!speechSupported && (
                    <div className="flex items-center gap-2 rounded-xl glass-surface p-3 text-sm text-muted-foreground">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>Reconhecimento de voz não suportado. Use Chrome ou cole o texto abaixo.</span>
                    </div>
                  )}

                  {/* Circular timer — softer colors */}
                  <div className="flex flex-col items-center gap-3 py-2">
                    <div className="relative">
                      <svg width="112" height="112" className="-rotate-90">
                        <circle cx="56" cy="56" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
                        <circle
                          cx="56" cy="56" r={radius} fill="none"
                          stroke={recording === "recording" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                          strokeWidth="5" strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeOffset}
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Mic className={`h-7 w-7 ${recording === "recording" ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
                      </div>
                    </div>
                    <p className="text-3xl font-mono font-semibold tabular-nums">{formatTimer(timer)}</p>
                    <p className="text-sm text-muted-foreground">
                      {recording === "idle" ? "Pronto para gravar" : recording === "recording" ? (speechSupported ? "Ouvindo…" : "Gravando…") : "Pausado"}
                    </p>

                    <div className="flex gap-2">
                      {recording === "idle" && (
                        <Button onClick={handleStart} className="bg-primary hover:bg-primary/90"><Play className="mr-2 h-4 w-4" /> Iniciar</Button>
                      )}
                      {recording === "recording" && (
                        <>
                          <Button onClick={handlePause} variant="secondary"><Pause className="mr-2 h-4 w-4" /> Pausar</Button>
                          <Button onClick={handleFinish}><Square className="mr-2 h-4 w-4" /> Finalizar</Button>
                        </>
                      )}
                      {recording === "paused" && (
                        <>
                          <Button onClick={handleResume} className="bg-primary hover:bg-primary/90"><Play className="mr-2 h-4 w-4" /> Retomar</Button>
                          <Button onClick={handleFinish}><Square className="mr-2 h-4 w-4" /> Finalizar</Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Live transcript bubbles — 16px radius, micro shadow */}
                  {speechSupported && (recording !== "idle" || speech.utterances.length > 0) && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Transcrição ao vivo</Label>
                      <ScrollArea className="h-32 rounded-xl glass-surface p-3">
                        <div className="space-y-2">
                          {speech.utterances.map((u, i) => {
                            const isDoc = u.speaker === "medico";
                            return (
                              <div key={i} className={`flex ${isDoc ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] px-3 py-1.5 text-xs shadow-sm transition-shadow duration-150 hover:shadow-md ${isDoc ? "bg-primary/15 rounded-[16px] rounded-br-md" : "bg-muted rounded-[16px] rounded-bl-md"}`}>
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
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Colar transcrição (opcional)</Label>
                    <Textarea value={pastedText} onChange={(e) => setPastedText(e.target.value)} placeholder="Cole aqui a transcrição, uma frase por linha..." rows={3} />
                    <p className="text-xs text-muted-foreground">Linhas ímpares = médico, pares = paciente.</p>
                  </div>

                  {(recording === "idle" && !pastedText && speech.utterances.length === 0) ? null : (
                    <Button className="w-full" onClick={handleFinish}>
                      Finalizar e gerar prontuário
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </DialogContent>
    </Dialog>
  );
}
