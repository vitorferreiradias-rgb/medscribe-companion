import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData } from "@/hooks/useAppData";
import { addEncounter, addTranscript, addNote, updateEncounter } from "@/lib/store";
import { parseTranscriptToSections } from "@/lib/parser";
import { formatTimer, formatDateTimeBR } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition, isSpeechRecognitionSupported } from "@/hooks/useSpeechRecognition";
import { Play, Pause, Square, Mic, AlertTriangle } from "lucide-react";
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

export function NewEncounterDialog({ open, onOpenChange }: Props) {
  const data = useAppData();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [patientId, setPatientId] = useState("");
  const [clinicianId, setClinicianId] = useState(data.clinicians[0]?.id ?? "");
  const [complaint, setComplaint] = useState("");
  const [location, setLocation] = useState("");

  // Recording state
  const [recording, setRecording] = useState<"idle" | "recording" | "paused">("idle");
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [useSpeech, setUseSpeech] = useState(true);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const speechSupported = isSpeechRecognitionSupported();

  const speech = useSpeechRecognition({
    lang: "pt-BR",
  });

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [speech.utterances.length, speech.interimText]);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setPatientId("");
      setClinicianId(data.clinicians[0]?.id ?? "");
      setComplaint("");
      setLocation("");
      setRecording("idle");
      setTimer(0);
      setPastedText("");
      setUseSpeech(true);
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

  const canContinue = patientId && clinicianId;

  const handleStart = () => {
    setRecording("recording");
    if (useSpeech && speechSupported) {
      speech.start();
    }
  };

  const handlePause = () => {
    setRecording("paused");
    if (useSpeech && speechSupported) {
      speech.pause();
    }
  };

  const handleResume = () => {
    setRecording("recording");
    if (useSpeech && speechSupported) {
      speech.resume();
    }
  };

  const handleFinish = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    speech.stop();

    const now = new Date();
    const startedAt = new Date(now.getTime() - timer * 1000).toISOString();
    const endedAt = now.toISOString();

    const enc = addEncounter({
      patientId,
      clinicianId,
      startedAt,
      endedAt,
      durationSec: timer || 60,
      status: "draft",
      chiefComplaint: complaint || undefined,
      location: location || undefined,
    });

    // Determine utterances source
    let utterances: Utterance[];
    let source: "pasted" | "mock" = "mock";

    if (speech.utterances.length > 0) {
      // Use speech recognition results
      utterances = speech.utterances;
      source = "pasted"; // treat as user-generated content
    } else if (pastedText.trim()) {
      source = "pasted";
      utterances = pastedText.split("\n").filter(Boolean).map((line, i) => ({
        speaker: i % 2 === 0 ? "medico" as const : "paciente" as const,
        text: line.trim(),
        tsSec: i * 10,
      }));
    } else {
      utterances = mockTranscriptContent;
    }

    const tr = addTranscript({ encounterId: enc.id, source, content: utterances });

    const pat = data.patients.find((p) => p.id === patientId);
    const cli = data.clinicians.find((c) => c.id === clinicianId);
    const sections = parseTranscriptToSections(
      utterances,
      enc.id,
      pat?.name,
      cli?.name,
      formatDateTimeBR(startedAt)
    );
    const note = addNote({ encounterId: enc.id, templateId: "template_soap_v1", sections });
    updateEncounter(enc.id, { transcriptId: tr.id, noteId: note.id });

    toast({ title: "Consulta criada com transcrição." });
    onOpenChange(false);
    navigate(`/consultas/${enc.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{step === 1 ? "Nova Consulta — Identificação" : "Nova Consulta — Gravação"}</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger><SelectValue placeholder="Selecione um paciente" /></SelectTrigger>
                <SelectContent>
                  {data.patients.filter((p) => !p.archived).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Button className="w-full" disabled={!canContinue} onClick={() => setStep(2)}>
              Continuar
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {/* Speech support warning */}
            {!speechSupported && (
              <div className="flex items-center gap-2 rounded-md bg-accent/50 p-3 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Reconhecimento de voz não suportado neste navegador. Use Chrome para transcrição automática, ou cole o texto abaixo.</span>
              </div>
            )}

            {/* Timer display */}
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="relative">
                <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center ${recording === "recording" ? "border-destructive animate-pulse" : "border-muted"}`}>
                  <Mic className={`h-8 w-8 ${recording === "recording" ? "text-destructive" : "text-muted-foreground"}`} />
                </div>
              </div>
              <p className="text-3xl font-mono font-semibold tabular-nums">{formatTimer(timer)}</p>
              <p className="text-sm text-muted-foreground">
                {recording === "idle" ? "Pronto para gravar" : recording === "recording" ? (speechSupported ? "Ouvindo e transcrevendo…" : "Gravando…") : "Pausado"}
              </p>

              <div className="flex gap-2">
                {recording === "idle" && (
                  <Button onClick={handleStart} variant="destructive">
                    <Play className="mr-2 h-4 w-4" /> Iniciar
                  </Button>
                )}
                {recording === "recording" && (
                  <>
                    <Button onClick={handlePause} variant="secondary">
                      <Pause className="mr-2 h-4 w-4" /> Pausar
                    </Button>
                    <Button onClick={handleFinish} variant="default">
                      <Square className="mr-2 h-4 w-4" /> Finalizar
                    </Button>
                  </>
                )}
                {recording === "paused" && (
                  <>
                    <Button onClick={handleResume} variant="destructive">
                      <Play className="mr-2 h-4 w-4" /> Retomar
                    </Button>
                    <Button onClick={handleFinish} variant="default">
                      <Square className="mr-2 h-4 w-4" /> Finalizar
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Live transcript */}
            {speechSupported && (recording !== "idle" || speech.utterances.length > 0) && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Transcrição ao vivo</Label>
                <ScrollArea className="h-32 rounded-md border bg-muted/30 p-3">
                  <div className="space-y-1 text-sm">
                    {speech.utterances.map((u, i) => (
                      <p key={i}>
                        <span className={`font-medium ${u.speaker === "medico" ? "text-primary" : "text-accent-foreground"}`}>
                          {u.speaker === "medico" ? "Médico" : "Paciente"}:
                        </span>{" "}
                        {u.text}
                      </p>
                    ))}
                    {speech.interimText && (
                      <p className="text-muted-foreground italic">…{speech.interimText}</p>
                    )}
                    <div ref={transcriptEndRef} />
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="space-y-2">
              <Label>Colar transcrição (opcional)</Label>
              <Textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Cole aqui a transcrição completa da consulta, uma frase por linha..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">Linhas ímpares = médico, pares = paciente. Usado somente se não houver transcrição por voz.</p>
            </div>

            {(recording === "idle" && !pastedText && speech.utterances.length === 0) ? null : (
              <Button className="w-full" onClick={handleFinish}>
                Finalizar e gerar prontuário
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
