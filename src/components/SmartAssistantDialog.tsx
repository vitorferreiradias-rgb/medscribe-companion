import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Send, Sparkles, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { parseIntent, type ParsedIntent } from "@/lib/intent-parser";
import { useSpeechRecognition, isSpeechRecognitionSupported } from "@/hooks/useSpeechRecognition";
import { addQuickNoteExternal } from "@/components/QuickNotesCard";
import { getData, updateScheduleEvent } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

const EXAMPLES = [
  "Agendar Maria amanhã às 14h",
  "Remarcar João para sexta 10h",
  "Cancelar consulta da Ana hoje",
  "Anotar: pedir exames do Carlos",
  "Prescrever Amoxicilina 500mg",
  "Quando é o congresso de clínica médica?",
  "Abrir pacientes",
];

interface SmartAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule?: (defaults: { patientId?: string; date?: string; startTime?: string; endTime?: string }) => void;
  onReschedule?: (eventId: string) => void;
  onPrescription?: (text: string) => void;
  onNavigate?: (path: string) => void;
}

type DialogStep = "input" | "confirm-cancel" | "result";

export function SmartAssistantDialog({
  open,
  onOpenChange,
  onSchedule,
  onReschedule,
  onPrescription,
  onNavigate,
}: SmartAssistantDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inputText, setInputText] = useState("");
  const [step, setStep] = useState<DialogStep>("input");
  const [parsedResult, setParsedResult] = useState<ParsedIntent | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{ eventId: string; patientName: string; date: string; time: string } | null>(null);
  const [resultMessage, setResultMessage] = useState("");
  const [resultType, setResultType] = useState<"success" | "error" | "warning">("success");

  const speechSupported = isSpeechRecognitionSupported();
  const { isListening, interimText, start: startListening, stop: stopListening } = useSpeechRecognition({
    onUtterance: (u) => {
      setInputText((prev) => (prev ? prev + " " + u.text : u.text));
    },
  });

  const resetFlow = useCallback(() => {
    setStep("input");
    setInputText("");
    setParsedResult(null);
    setCancelTarget(null);
    setResultMessage("");
  }, []);

  const handleClose = () => {
    if (isListening) stopListening();
    resetFlow();
    onOpenChange(false);
  };

  const showResult = (message: string, type: "success" | "error" | "warning" = "success") => {
    setResultMessage(message);
    setResultType(type);
    setStep("result");
  };

  const executeIntent = useCallback((intent: ParsedIntent) => {
    setParsedResult(intent);

    switch (intent.intent) {
      case "agendar": {
        handleClose();
        // Calculate endTime = startTime + 30min
        let endTime: string | undefined;
        if (intent.time) {
          const [h, m] = intent.time.split(":").map(Number);
          const totalMin = h * 60 + m + 30;
          endTime = `${String(Math.floor(totalMin / 60) % 24).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
        }
        onSchedule?.({
          patientId: intent.patientId,
          date: intent.date,
          startTime: intent.time,
          endTime,
        });
        toast({ title: "Abrindo agendamento…", description: intent.patientName ? `Paciente: ${intent.patientName}` : undefined });
        break;
      }

      case "remarcar": {
        const data = getData();
        const events = data.scheduleEvents ?? [];
        // Find next upcoming event for this patient
        const today = new Date().toISOString().slice(0, 10);
        const evt = events.find((e) =>
          intent.patientId
            ? e.patientId === intent.patientId && e.date >= today && e.status !== "done" && e.status !== "no_show"
            : false
        );
        if (evt) {
          handleClose();
          onReschedule?.(evt.id);
          toast({ title: "Abrindo remarcação…", description: `${intent.patientName} — ${evt.date} ${evt.startTime}` });
        } else {
          showResult(
            intent.patientName
              ? `Nenhuma consulta futura encontrada para ${intent.patientName}.`
              : "Não identifiquei o paciente. Tente novamente com o nome completo.",
            "warning"
          );
        }
        break;
      }

      case "cancelar": {
        const data = getData();
        const events = data.scheduleEvents ?? [];
        const targetDate = intent.date || new Date().toISOString().slice(0, 10);
        const evt = events.find((e) =>
          intent.patientId
            ? e.patientId === intent.patientId && e.date === targetDate && e.status !== "done" && e.status !== "no_show"
            : false
        );
        if (evt) {
          const pat = data.patients.find((p) => p.id === evt.patientId);
          setCancelTarget({
            eventId: evt.id,
            patientName: pat?.name || "Paciente",
            date: evt.date,
            time: evt.startTime,
          });
          setStep("confirm-cancel");
        } else {
          showResult(
            intent.patientName
              ? `Nenhuma consulta encontrada para ${intent.patientName} em ${targetDate}.`
              : "Não identifiquei o paciente. Tente novamente com o nome.",
            "warning"
          );
        }
        break;
      }

      case "nota": {
        const noteText = intent.freeText || intent.rawInput;
        addQuickNoteExternal(noteText);
        handleClose();
        toast({ title: "Nota adicionada!", description: noteText.slice(0, 60) });
        break;
      }

      case "prescrever": {
        handleClose();
        onPrescription?.(intent.rawInput);
        break;
      }

      case "buscar": {
        // Search in news
        handleClose();
        const nav = onNavigate || ((p: string) => navigate(p));
        nav("/noticias");
        toast({ title: "Abrindo notícias…", description: intent.freeText ? `Busca: ${intent.freeText}` : undefined });
        break;
      }

      case "navegar": {
        const route = intent.freeText;
        if (route) {
          handleClose();
          const nav = onNavigate || ((p: string) => navigate(p));
          nav(route);
        } else {
          showResult("Não entendi para onde navegar. Tente: 'abrir agenda', 'ir para pacientes'.", "warning");
        }
        break;
      }

      case "desconhecido":
      default:
        showResult(
          "Não entendi o comando. Tente algo como:\n• \"Agendar Maria amanhã às 14h\"\n• \"Anotar: ligar para laboratório\"\n• \"Abrir pacientes\"",
          "warning"
        );
        break;
    }
  }, [onSchedule, onReschedule, onPrescription, onNavigate, navigate, toast]);

  const handleSubmit = useCallback(() => {
    const fullText = isListening && interimText ? inputText + " " + interimText : inputText;
    if (!fullText.trim()) return;
    if (isListening) stopListening();
    setInputText(fullText);
    const intent = parseIntent(fullText);
    executeIntent(intent);
  }, [inputText, isListening, interimText, stopListening, executeIntent]);

  const handleStopAndProcess = useCallback(() => {
    if (isListening) stopListening();
    setTimeout(() => handleSubmit(), 150);
  }, [isListening, stopListening, handleSubmit]);

  const confirmCancel = useCallback(() => {
    if (!cancelTarget) return;
    updateScheduleEvent(cancelTarget.eventId, { status: "no_show" });
    handleClose();
    toast({ title: "Consulta cancelada.", description: `${cancelTarget.patientName} — ${cancelTarget.date} ${cancelTarget.time}` });
  }, [cancelTarget, toast]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Assistente Inteligente
          </DialogTitle>
          <DialogDescription>
            Digite ou fale um comando. Ex: agendar, remarcar, anotar, prescrever, navegar.
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4">
            <div className="relative">
              <Textarea
                placeholder="O que você precisa? Ex: 'Agendar Maria amanhã às 14h'"
                value={isListening && interimText ? inputText + " " + interimText : inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[100px] pr-12 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                autoFocus
              />
              {speechSupported && (
                <Button
                  variant={isListening ? "destructive" : "ghost"}
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8"
                  onClick={isListening ? stopListening : startListening}
                  type="button"
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
            </div>

            {isListening && (
              <div className="flex items-center gap-2">
                <p className="text-xs text-primary animate-pulse flex-1">🎙️ Ouvindo...</p>
                <Button size="sm" variant="default" className="gap-1.5" onClick={handleStopAndProcess}>
                  <Send className="h-3.5 w-3.5" />
                  Parar e processar
                </Button>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 text-xs"
                  onClick={() => setInputText(ex)}
                >
                  {ex}
                </Badge>
              ))}
            </div>

            <Button onClick={handleSubmit} disabled={!inputText.trim()} className="w-full">
              <Send className="mr-2 h-4 w-4" /> Processar comando
            </Button>
          </div>
        )}

        {step === "confirm-cancel" && cancelTarget && (
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold text-sm">Confirmar cancelamento</span>
              </div>
              <p className="text-sm">
                Cancelar consulta de <strong>{cancelTarget.patientName}</strong> em{" "}
                <strong>{cancelTarget.date}</strong> às <strong>{cancelTarget.time}</strong>?
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("input")}>
                Voltar
              </Button>
              <Button variant="destructive" className="flex-1" onClick={confirmCancel}>
                <XCircle className="mr-2 h-4 w-4" /> Confirmar cancelamento
              </Button>
            </div>
          </div>
        )}

        {step === "result" && (
          <div className="space-y-4">
            <div className={`rounded-lg border p-4 space-y-2 ${
              resultType === "success" ? "border-success/20 bg-success/5" :
              resultType === "warning" ? "border-warning/20 bg-warning/5" :
              "border-destructive/20 bg-destructive/5"
            }`}>
              <div className="flex items-center gap-2">
                {resultType === "success" && <CheckCircle2 className="h-5 w-5 text-success" />}
                {resultType === "warning" && <AlertTriangle className="h-5 w-5 text-warning" />}
                {resultType === "error" && <XCircle className="h-5 w-5 text-destructive" />}
                <span className="font-semibold text-sm">
                  {resultType === "success" ? "Feito!" : resultType === "warning" ? "Atenção" : "Erro"}
                </span>
              </div>
              <p className="text-sm whitespace-pre-line">{resultMessage}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => { resetFlow(); }}>
              Novo comando
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
