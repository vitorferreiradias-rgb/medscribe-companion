import { useState, useCallback } from "react";
import { useAppData, useClinicianId } from "@/hooks/useAppData";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Send, Sparkles, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { parseIntent, type ParsedIntent } from "@/lib/intent-parser";
import { useSpeechRecognition, isSpeechRecognitionSupported } from "@/hooks/useSpeechRecognition";
import { addQuickNoteExternal } from "@/components/QuickNotesCard";
import { getData, updateScheduleEvent } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { toLocalDateStr } from "@/lib/format";
import { parsePrescriptionInput, type PrescriptionAction } from "@/lib/smart-prescription-parser";
import { findMedicationAsync, findDosePattern } from "@/lib/medication-knowledge";
import { classifyPrescriptionAsync, type ComplianceResult } from "@/lib/compliance-router";
import { SmartPrescriptionPreview, type PrescriptionItem } from "@/components/smart-prescription/SmartPrescriptionPreview";

interface SmartAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule?: (defaults: { patientId?: string; date?: string; startTime?: string; endTime?: string }) => void;
  onReschedule?: (eventId: string) => void;
  onNavigate?: (path: string) => void;
}

type DialogStep = "input" | "confirm-cancel" | "result" | "prescription-preview";

interface PrescriptionPreviewData {
  items: PrescriptionItem[];
  compliance: ComplianceResult;
  patient: { id: string; name: string };
  prescriber: { name: string; crm: string };
  clinicianId: string;
  action: "prescrever" | "renovar" | "suspender" | "continuar";
}

export function SmartAssistantDialog({
  open,
  onOpenChange,
  onSchedule,
  onReschedule,
  onNavigate,
}: SmartAssistantDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const data = useAppData();
  const clinicianId = useClinicianId();
  const [inputText, setInputText] = useState("");
  const [step, setStep] = useState<DialogStep>("input");
  const [parsedResult, setParsedResult] = useState<ParsedIntent | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{ eventId: string; patientName: string; date: string; time: string } | null>(null);
  const [resultMessage, setResultMessage] = useState("");
  const [resultType, setResultType] = useState<"success" | "error" | "warning">("success");
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionPreviewData | null>(null);

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
    setPrescriptionData(null);
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

  // Build prescription preview data directly from parsed intent
  const buildPrescriptionPreview = useCallback(async (intent: ParsedIntent) => {
    try {
    const clinician = data.clinicians?.[0];
    if (!clinician) {
      showResult("Perfil de médico não encontrado. Configure seu perfil primeiro.", "error");
      return;
    }

    // Resolve patient
    const patientId = intent.patientId;
    const patientName = intent.patientName;
    if (!patientId || !patientName) {
      showResult("Não identifiquei o paciente. Inclua o nome: 'prescrever dipirona 500mg para Maria'.", "warning");
      return;
    }

    // Clean up text: remove patient name, action verbs, and connectors before parsing medications
    let cleanedText = intent.rawInput;
    if (patientName) {
      const fullNameEscaped = patientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const nameParts = patientName.split(/\s+/).filter(p => p.length >= 3);
      
      // Build regex that matches any contiguous subset of the name parts (e.g. "Ana Beatriz" from "Ana Beatriz Costa")
      // First try removing "para ... <name>" pattern with the full name
      cleanedText = cleanedText.replace(new RegExp(`\\s*para\\s+(?:o\\s+|a\\s+)?(?:paciente\\s+)?${fullNameEscaped}\\s*`, "gi"), " ");
      cleanedText = cleanedText.replace(new RegExp(`\\b${fullNameEscaped}\\b`, "gi"), "");
      
      // Try partial name combinations (longest first): "Ana Beatriz", then individual parts
      if (nameParts.length > 1) {
        for (let len = nameParts.length - 1; len >= 2; len--) {
          for (let start = 0; start <= nameParts.length - len; start++) {
            const partial = nameParts.slice(start, start + len).join("\\s+");
            cleanedText = cleanedText.replace(new RegExp(`\\s*para\\s+(?:o\\s+|a\\s+)?(?:paciente\\s+)?${partial}\\s*`, "gi"), " ");
            cleanedText = cleanedText.replace(new RegExp(`\\b${partial}\\b`, "gi"), "");
          }
        }
      }
      
      // Remove individual name parts (only if they're standalone words, not part of medication names)
      for (const part of nameParts) {
        const escaped = part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Only remove if preceded by space/start and followed by space/end (not part of a compound word)
        cleanedText = cleanedText.replace(new RegExp(`(?<=^|\\s)${escaped}(?=\\s|$)`, "gi"), "");
      }
      
      cleanedText = cleanedText.replace(/\s{2,}/g, " ").trim();
    }
    // Remove leading action words
    cleanedText = cleanedText.replace(/^\s*(por\s*escrever|prescrever|receitar|renovar|suspender|prescri[çc][ãa]o)\s*/i, "");

    console.debug("[prescription-build] cleaned text:", cleanedText);

    // Split by "e" to handle multiple medications: "Dipirona 500mg e Amoxicilina 500mg por 8 dias"
    // First detect if there's a global duration/quantity at the end
    const globalDurationMatch = cleanedText.match(/\bpor\s+(\d+\s*(?:dias?|semanas?|meses?))\s*$/i);
    let globalDuration = globalDurationMatch?.[1] || "";
    if (globalDurationMatch) {
      cleanedText = cleanedText.replace(globalDurationMatch[0], "").trim();
    }

    // Split by " e " to separate multiple medications
    const medSegments = cleanedText.split(/\s+e\s+/i).map(s => s.trim()).filter(s => s.length >= 2);
    
    if (medSegments.length === 0) {
      showResult("Não identifiquei o nome da medicação. Tente: 'prescrever dipirona 500mg para Maria'.", "warning");
      return;
    }

    const prescriptionItems: PrescriptionItem[] = [];
    let overallAction: PrescriptionAction = "prescrever";

    for (const segment of medSegments) {
      const parsed = parsePrescriptionInput(segment);
      overallAction = parsed.action;

      if (!parsed.medicationName) continue;

      console.log("[OneClick] Buscando medicação no banco:", parsed.medicationName);
      const med = await findMedicationAsync(parsed.medicationName);
      console.log("[OneClick] Resultado da busca:", med?.name, med?.category, med ? "ENCONTRADO" : "NÃO ENCONTRADO");
      
      let finalDosage = parsed.dosage || "";
      let finalConcentration = parsed.concentration || "";
      let finalDuration = parsed.duration || globalDuration || "";
      let finalQuantity = parsed.quantity || "";
      let finalForm = "";

      if (med) {
        if (!finalConcentration && med.defaultDosePatterns[0]) {
          finalConcentration = med.defaultDosePatterns[0].concentration;
        }

        const dosePattern = findDosePattern(med, finalConcentration || undefined);

        if (!parsed.dosage && dosePattern) {
          finalDosage = dosePattern.dosage;
        }
        if (!finalDuration && dosePattern?.duration) {
          finalDuration = dosePattern.duration;
        }
        if (!finalQuantity && dosePattern?.quantity) {
          finalQuantity = dosePattern.quantity;
        }

        if (med.variants && med.variants.length > 0 && !parsed.dosage) {
          const firstVariant = med.variants[0];
          finalDosage = firstVariant.dosage;
          if (firstVariant.concentration) finalConcentration = firstVariant.concentration;
          if (firstVariant.duration) finalDuration = firstVariant.duration;
        }

        finalForm = med.commonForms[0] || "";
      }

      if (!finalDosage) {
        finalDosage = "Conforme orientação médica";
      }

      prescriptionItems.push({
        medicationName: med?.name || parsed.medicationName,
        concentration: finalConcentration,
        dosage: finalDosage,
        duration: finalDuration || undefined,
        quantity: finalQuantity || undefined,
        form: finalForm || undefined,
      });
    }

    if (prescriptionItems.length === 0) {
      showResult("Não identifiquei o nome da medicação. Tente: 'prescrever dipirona 500mg para Maria'.", "warning");
      return;
    }

    // Classify prescription type (uses highest requirement among all items)
    const compliance = await classifyPrescriptionAsync({
      items: prescriptionItems.map(item => ({ medicationName: item.medicationName, concentration: item.concentration })),
      patient: { id: patientId, name: patientName },
      prescriber: { name: clinician.name, crm: clinician.crm },
    });

    setPrescriptionData({
      items: prescriptionItems,
      compliance,
      patient: { id: patientId, name: patientName },
      prescriber: { name: clinician.name, crm: clinician.crm },
      clinicianId: clinician.id,
      action: overallAction,
    });
    setStep("prescription-preview");
    } catch (err) {
      console.error("[OneClick] Erro ao montar prescrição:", err);
      showResult("Erro ao processar prescrição. Tente novamente.", "error");
    }
  }, [data.clinicians]);

  const executeIntent = useCallback(async (intent: ParsedIntent) => {
    setParsedResult(intent);

    switch (intent.intent) {
      case "agendar": {
        handleClose();
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
        const today = toLocalDateStr();
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
        const targetDate = intent.date || toLocalDateStr();
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
        await buildPrescriptionPreview(intent);
        break;
      }

      case "buscar": {
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
  }, [onSchedule, onReschedule, onNavigate, navigate, toast, buildPrescriptionPreview]);

  const handleSubmit = useCallback(async () => {
    const fullText = isListening && interimText ? inputText + " " + interimText : inputText;
    if (!fullText.trim()) return;
    if (isListening) stopListening();
    setInputText(fullText);
    const intent = parseIntent(fullText, data.patients);
    await executeIntent(intent);
  }, [inputText, isListening, interimText, stopListening, executeIntent, data.patients]);

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
      <DialogContent className="max-w-lg ai-dialog-bloom">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-ai" />
            One Click
          </DialogTitle>
          <DialogDescription>
            Digite ou fale um comando. Ex: agendar, remarcar, anotar, prescrever, navegar.
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4">
            <div className="relative">
              <Textarea
                placeholder="O que você precisa? Ex: 'Prescrever dipirona 500mg para Maria'"
                value={isListening && interimText ? inputText + " " + interimText : inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[100px] pr-12 resize-none focus-visible:!shadow-[0_0_0_4px_hsl(var(--ai-ring))]"
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

        {step === "prescription-preview" && prescriptionData && (
          <SmartPrescriptionPreview
            items={prescriptionData.items}
            compliance={prescriptionData.compliance}
            patient={prescriptionData.patient}
            prescriber={prescriptionData.prescriber}
            clinicianId={prescriptionData.clinicianId}
            action={prescriptionData.action}
            onDone={handleClose}
            onBack={() => setStep("input")}
            onCancel={handleClose}
          />
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
