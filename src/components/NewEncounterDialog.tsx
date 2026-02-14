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
import { Play, Pause, Square, Mic } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mockTranscriptContent = [
  { speaker: "medico" as const, text: "Bom dia, qual a sua queixa principal?", tsSec: 0 },
  { speaker: "paciente" as const, text: "Doutor, estou com dor de cabeça há 5 dias, piora à noite.", tsSec: 5 },
  { speaker: "medico" as const, text: "Tem alergia a algum medicamento?", tsSec: 14 },
  { speaker: "paciente" as const, text: "Não tenho alergia a nada.", tsSec: 19 },
  { speaker: "medico" as const, text: "Está tomando algum medicamento?", tsSec: 25 },
  { speaker: "paciente" as const, text: "Tomo paracetamol quando a dor é forte.", tsSec: 30 },
  { speaker: "medico" as const, text: "Vou solicitar um exame de imagem. Orientei repouso e retorno em 10 dias.", tsSec: 40 },
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

  const handleFinish = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const now = new Date();
    const startedAt = new Date(now.getTime() - timer * 1000).toISOString();
    const endedAt = now.toISOString();

    // Create encounter
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

    // Create transcript
    let utterances = mockTranscriptContent;
    let source: "pasted" | "mock" = "mock";
    if (pastedText.trim()) {
      source = "pasted";
      utterances = pastedText.split("\n").filter(Boolean).map((line, i) => ({
        speaker: i % 2 === 0 ? "medico" as const : "paciente" as const,
        text: line.trim(),
        tsSec: i * 10,
      }));
    }

    const tr = addTranscript({ encounterId: enc.id, source, content: utterances });

    // Generate note
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

    // Link to encounter
    updateEncounter(enc.id, { transcriptId: tr.id, noteId: note.id });

    toast({ title: "Consulta criada." });
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
            {/* Timer display */}
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="relative">
                <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center ${recording === "recording" ? "border-destructive animate-pulse" : "border-muted"}`}>
                  <Mic className={`h-8 w-8 ${recording === "recording" ? "text-destructive" : "text-muted-foreground"}`} />
                </div>
              </div>
              <p className="text-3xl font-mono font-semibold tabular-nums">{formatTimer(timer)}</p>
              <p className="text-sm text-muted-foreground">
                {recording === "idle" ? "Pronto para gravar" : recording === "recording" ? "Gravando…" : "Pausado"}
              </p>

              <div className="flex gap-2">
                {recording === "idle" && (
                  <Button onClick={() => setRecording("recording")} variant="destructive">
                    <Play className="mr-2 h-4 w-4" /> Iniciar
                  </Button>
                )}
                {recording === "recording" && (
                  <>
                    <Button onClick={() => setRecording("paused")} variant="secondary">
                      <Pause className="mr-2 h-4 w-4" /> Pausar
                    </Button>
                    <Button onClick={handleFinish} variant="default">
                      <Square className="mr-2 h-4 w-4" /> Finalizar
                    </Button>
                  </>
                )}
                {recording === "paused" && (
                  <>
                    <Button onClick={() => setRecording("recording")} variant="destructive">
                      <Play className="mr-2 h-4 w-4" /> Retomar
                    </Button>
                    <Button onClick={handleFinish} variant="default">
                      <Square className="mr-2 h-4 w-4" /> Finalizar
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Colar transcrição (opcional)</Label>
              <Textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Cole aqui a transcrição completa da consulta, uma frase por linha..."
                rows={5}
              />
              <p className="text-xs text-muted-foreground">Linhas ímpares = médico, pares = paciente.</p>
            </div>

            {(recording === "idle" && !pastedText) ? null : (
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
