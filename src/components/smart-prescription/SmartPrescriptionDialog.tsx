import { useState, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Sparkles, Send, Search, User } from "lucide-react";
import { parsePrescriptionInput } from "@/lib/smart-prescription-parser";
import { findMedication, findDosePattern, type MedicationKnowledge, type DoseVariant } from "@/lib/medication-knowledge";
import { classifyPrescription, type ComplianceResult } from "@/lib/compliance-router";
import { useSpeechRecognition, isSpeechRecognitionSupported } from "@/hooks/useSpeechRecognition";
import { PosologyPrompt } from "./PosologyPrompt";
import { DivergenceConfirmation } from "./DivergenceConfirmation";
import { VariantSelector } from "./VariantSelector";
import { SmartPrescriptionPreview, type PrescriptionItem } from "./SmartPrescriptionPreview";
import { getData } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const EXAMPLES = [
  "Prescrever Mounjaro 2,5 mg",
  "Prescrever Contrave 1 cp 2x ao dia por 30 dias",
  "Suspender Mounjaro porque atingiu a meta",
  "Renovar última prescrição",
];

type FlowStep = "select-patient" | "input" | "posology" | "divergence" | "variants" | "preview";

interface SmartPrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: { id: string; name: string };
  prescriber?: { name: string; crm: string };
  encounterId?: string;
  initialText?: string;
}

export function SmartPrescriptionDialog({
  open,
  onOpenChange,
  patient: patientProp,
  prescriber: prescriberProp,
  encounterId,
  initialText = "",
}: SmartPrescriptionDialogProps) {
  const [inputText, setInputText] = useState(initialText);
  const [step, setStep] = useState<FlowStep>(patientProp ? "input" : "select-patient");
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string } | null>(null);

  // Resolve patient & prescriber
  const patient = patientProp || selectedPatient;
  const prescriber = useMemo(() => {
    if (prescriberProp) return prescriberProp;
    const d = getData();
    const c = d.clinicians[0];
    return c ? { name: c.name, crm: c.crm } : { name: "Médico", crm: "000000" };
  }, [prescriberProp]);

  // Patient list for selection
  const patients = useMemo(() => {
    if (patientProp) return [];
    const d = getData();
    return d.patients;
  }, [patientProp, open]);

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    const q = patientSearch.toLowerCase();
    return patients.filter((p) => p.name.toLowerCase().includes(q));
  }, [patients, patientSearch]);

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
    setStep(patientProp ? "input" : "select-patient");
    setInputText(initialText);
    setSelectedPatient(null);
    setPatientSearch("");
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
  }, [initialText, patientProp]);

  const proceedToPreview = useCallback((dosage: string, duration?: string, quantity?: string, form?: string, concentration?: string) => {
    if (!patient) return;
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
    const fullText = isListening && interimText ? inputText + " " + interimText : inputText;
    if (!fullText.trim()) return;
    if (isListening) stopListening();
    setInputText(fullText);

    const parsed = parsePrescriptionInput(fullText);
    setParsedAction(parsed.action);

    if (parsed.action === "renovar") return;
    if (!parsed.medicationName) return;

    const medName = parsed.medicationName;
    setParsedMedName(medName);
    setParsedConcentration(parsed.concentration || "");

    const med = findMedication(medName);
    setFoundMed(med);

    if (parsed.action === "suspender") {
      const item: PrescriptionItem = {
        medicationName: medName,
        concentration: parsed.concentration || "",
        dosage: "SUSPENDER — " + (parsed.note || "conforme orientação médica"),
      };
      setItems([item]);
      if (patient) {
        const compResult = classifyPrescription({
          items: [{ medicationName: medName, concentration: parsed.concentration || undefined }],
          patient,
          prescriber,
        });
        setCompliance(compResult);
      }
      setStep("preview");
      return;
    }

    if (med?.variants && med.variants.length > 0 && !parsed.dosage) {
      setStep("variants");
      return;
    }

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

    proceedToPreview(
      parsed.dosage,
      parsed.duration || (med ? findDosePattern(med, parsed.concentration || undefined)?.duration : undefined),
      parsed.quantity || (med ? findDosePattern(med, parsed.concentration || undefined)?.quantity : undefined),
      med?.commonForms[0]
    );
  }, [inputText, isListening, interimText, stopListening, patient, prescriber, proceedToPreview]);

  const handleStopAndProcess = useCallback(() => {
    if (isListening) stopListening();
    // Small delay to let final utterance land
    setTimeout(() => handleSubmit(), 150);
  }, [isListening, stopListening, handleSubmit]);

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

  const handleSelectPatient = (p: { id: string; name: string }) => {
    setSelectedPatient(p);
    setStep("input");
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
            {step === "select-patient"
              ? "Selecione o paciente para iniciar a prescrição."
              : "Digite ou fale a prescrição. O sistema identifica automaticamente o tipo de receita."}
          </DialogDescription>
        </DialogHeader>

        {step === "select-patient" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente…"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            <ScrollArea className="h-[280px]">
              <div className="space-y-1">
                {filteredPatients.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum paciente encontrado.</p>
                )}
                {filteredPatients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPatient({ id: p.id, name: p.name })}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/60 transition-colors text-left"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {p.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      {p.birthDate && (
                        <p className="text-xs text-muted-foreground">{p.birthDate}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {step === "input" && (
          <div className="space-y-4">
            {/* Show selected patient chip when not from prop */}
            {!patientProp && selectedPatient && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{selectedPatient.name}</span>
                <button
                  onClick={() => { setSelectedPatient(null); setStep("select-patient"); }}
                  className="text-xs text-muted-foreground hover:text-foreground underline ml-auto"
                >
                  Trocar
                </button>
              </div>
            )}

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
              <div className="flex items-center gap-2">
                <p className="text-xs text-primary animate-pulse flex-1">🎙️ Ouvindo...</p>
                <Button
                  size="sm"
                  variant="default"
                  className="gap-1.5"
                  onClick={handleStopAndProcess}
                >
                  <Send className="h-3.5 w-3.5" />
                  Parar e processar
                </Button>
              </div>
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

        {step === "preview" && compliance && patient && (
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
