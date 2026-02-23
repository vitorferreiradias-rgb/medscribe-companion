import { useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Sparkles, Send } from "lucide-react";
import { parsePrescriptionInput } from "@/lib/smart-prescription-parser";
import { findMedication, findDosePattern, type MedicationKnowledge, type DoseVariant } from "@/lib/medication-knowledge";
import { classifyPrescription, type ComplianceResult } from "@/lib/compliance-router";
import { useSpeechRecognition, isSpeechRecognitionSupported } from "@/hooks/useSpeechRecognition";
import { PosologyPrompt } from "./PosologyPrompt";
import { DivergenceConfirmation } from "./DivergenceConfirmation";
import { VariantSelector } from "./VariantSelector";
import { SmartPrescriptionPreview, type PrescriptionItem } from "./SmartPrescriptionPreview";

const EXAMPLES = [
  "Prescrever Mounjaro 2,5 mg",
  "Prescrever Contrave 1 cp 2x ao dia por 30 dias",
  "Suspender Mounjaro porque atingiu a meta",
  "Renovar última prescrição",
];

type FlowStep = "input" | "posology" | "divergence" | "variants" | "preview";

interface SmartPrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: { id: string; name: string };
  prescriber: { name: string; crm: string };
  encounterId?: string;
  initialText?: string;
}

export function SmartPrescriptionDialog({
  open,
  onOpenChange,
  patient,
  prescriber,
  encounterId,
  initialText = "",
}: SmartPrescriptionDialogProps) {
  const [inputText, setInputText] = useState(initialText);
  const [step, setStep] = useState<FlowStep>("input");

  // Flow state
  const [parsedMedName, setParsedMedName] = useState("");
  const [parsedConcentration, setParsedConcentration] = useState("");
  const [doctorDosage, setDoctorDosage] = useState<string | null>(null);
  const [standardDosage, setStandardDosage] = useState("");
  const [resolvedDosage, setResolvedDosage] = useState("");
  const [resolvedDuration, setResolvedDuration] = useState<string | undefined>();
  const [resolvedQuantity, setResolvedQuantity] = useState<string | undefined>();
  const [resolvedForm, setResolvedForm] = useState<string | undefined>();
  const [parsedAction, setParsedAction] = useState<"prescrever" | "renovar" | "suspender" | "continuar">("prescrever");
  const [foundMed, setFoundMed] = useState<MedicationKnowledge | null>(null);
  const [compliance, setCompliance] = useState<ComplianceResult | null>(null);
  const [items, setItems] = useState<PrescriptionItem[]>([]);

  // Speech
  const speechSupported = isSpeechRecognitionSupported();
  const { isListening, interimText, start: startListening, stop: stopListening } = useSpeechRecognition({
    onUtterance: (u) => {
      setInputText((prev) => (prev ? prev + " " + u.text : u.text));
    },
  });

  const resetFlow = useCallback(() => {
    setStep("input");
    setInputText(initialText);
    setParsedMedName("");
    setParsedConcentration("");
    setDoctorDosage(null);
    setStandardDosage("");
    setResolvedDosage("");
    setResolvedDuration(undefined);
    setResolvedQuantity(undefined);
    setResolvedForm(undefined);
    setFoundMed(null);
    setCompliance(null);
    setItems([]);
  }, [initialText]);

  const proceedToPreview = useCallback((dosage: string, duration?: string, quantity?: string, form?: string, concentration?: string) => {
    const finalConc = concentration || parsedConcentration;
    const finalItem: PrescriptionItem = {
      medicationName: parsedMedName,
      concentration: finalConc,
      dosage,
      duration,
      quantity,
      form,
    };
    setItems([finalItem]);

    const compResult = classifyPrescription({
      items: [{ medicationName: parsedMedName, concentration: finalConc }],
      patient,
      prescriber,
    });
    setCompliance(compResult);
    setStep("preview");
  }, [parsedMedName, parsedConcentration, patient, prescriber]);

  const handleSubmit = useCallback(() => {
    if (!inputText.trim()) return;
    if (isListening) stopListening();

    const parsed = parsePrescriptionInput(inputText);
    setParsedAction(parsed.action);

    if (parsed.action === "renovar") {
      // For now just show a message — could integrate with LastDocumentsSheet
      return;
    }

    if (!parsed.medicationName) return;

    const medName = parsed.medicationName;
    setParsedMedName(medName);
    setParsedConcentration(parsed.concentration || "");

    const med = findMedication(medName);
    setFoundMed(med);

    if (parsed.action === "suspender") {
      // Go directly to preview for suspension
      const item: PrescriptionItem = {
        medicationName: medName,
        concentration: parsed.concentration || "",
        dosage: "SUSPENDER — " + (parsed.note || "conforme orientação médica"),
      };
      setItems([item]);
      const compResult = classifyPrescription({
        items: [{ medicationName: medName, concentration: parsed.concentration || undefined }],
        patient,
        prescriber,
      });
      setCompliance(compResult);
      setStep("preview");
      return;
    }

    // Check for variants when no dosage specified
    if (med?.variants && med.variants.length > 0 && !parsed.dosage) {
      setStep("variants");
      return;
    }

    // If no dosage from doctor
    if (!parsed.dosage) {
      if (med) {
        const pattern = findDosePattern(med, parsed.concentration || undefined);
        if (pattern) {
          proceedToPreview(
            pattern.dosage,
            parsed.duration || pattern.duration,
            parsed.quantity || pattern.quantity,
            med.commonForms[0],
            parsed.concentration || pattern.concentration
          );
        } else {
          setStep("posology");
        }
      } else {
        setStep("posology");
      }
      return;
    }

    // Doctor specified dosage — check for divergence
    if (med) {
      const pattern = findDosePattern(med, parsed.concentration || undefined);
      if (pattern && parsed.dosage.toLowerCase() !== pattern.dosage.toLowerCase()) {
        setDoctorDosage(parsed.dosage);
        setStandardDosage(pattern.dosage);
        setResolvedDuration(parsed.duration || pattern.duration);
        setResolvedQuantity(parsed.quantity || pattern.quantity);
        setResolvedForm(med.commonForms[0]);
        setStep("divergence");
        return;
      }
    }

    // No divergence — proceed
    proceedToPreview(
      parsed.dosage,
      parsed.duration || (med ? findDosePattern(med, parsed.concentration || undefined)?.duration : undefined),
      parsed.quantity || (med ? findDosePattern(med, parsed.concentration || undefined)?.quantity : undefined),
      med?.commonForms[0]
    );
  }, [inputText, isListening, stopListening, patient, prescriber, proceedToPreview]);

  const handleVariantSelect = useCallback((variant: DoseVariant) => {
    proceedToPreview(
      variant.dosage,
      variant.duration,
      undefined,
      foundMed?.commonForms[0],
      variant.concentration
    );
  }, [foundMed, proceedToPreview]);

  const handleClose = () => {
    resetFlow();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Prescrição Inteligente
          </DialogTitle>
          <DialogDescription>
            Digite ou fale a prescrição. O sistema identifica automaticamente o tipo de receita.
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4">
            <div className="relative">
              <Textarea
                placeholder="Digite ou fale a prescrição…"
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
              <p className="text-xs text-primary animate-pulse">🎙️ Ouvindo...</p>
            )}

            {/* Example chips */}
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
              <Send className="mr-2 h-4 w-4" /> Processar prescrição
            </Button>
          </div>
        )}

        {step === "posology" && (
          <PosologyPrompt
            medicationName={parsedMedName}
            concentration={parsedConcentration}
            onSubmit={(dosage) => {
              proceedToPreview(dosage, undefined, undefined, foundMed?.commonForms[0]);
            }}
            onCancel={() => setStep("input")}
          />
        )}

        {step === "divergence" && doctorDosage && (
          <DivergenceConfirmation
            doctorDosage={doctorDosage}
            standardDosage={standardDosage}
            medicationName={parsedMedName}
            onKeepDoctor={() => proceedToPreview(doctorDosage, resolvedDuration, resolvedQuantity, resolvedForm)}
            onUseStandard={() => proceedToPreview(standardDosage, resolvedDuration, resolvedQuantity, resolvedForm)}
            onEditManually={() => setStep("posology")}
          />
        )}

        {step === "variants" && foundMed?.variants && (
          <VariantSelector
            medicationName={parsedMedName}
            variants={foundMed.variants}
            onSelect={handleVariantSelect}
            onCancel={() => setStep("input")}
          />
        )}

        {step === "preview" && compliance && (
          <SmartPrescriptionPreview
            items={items}
            compliance={compliance}
            patient={patient}
            prescriber={prescriber}
            encounterId={encounterId}
            action={parsedAction}
            onDone={handleClose}
            onBack={() => setStep("input")}
            onCancel={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
