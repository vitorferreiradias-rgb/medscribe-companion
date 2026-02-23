import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Shield, FileSignature, Edit3, X } from "lucide-react";
import { getRecipeTypes, type RecipeType, type ComplianceResult } from "@/lib/compliance-router";
import { addDocument } from "@/lib/clinical-documents";
import { addMedicationEvent } from "@/lib/medication-history";
import { useToast } from "@/hooks/use-toast";

export interface PrescriptionItem {
  medicationName: string;
  concentration: string;
  dosage: string;
  duration?: string;
  quantity?: string;
  form?: string;
}

interface SmartPrescriptionPreviewProps {
  items: PrescriptionItem[];
  compliance: ComplianceResult;
  patient: { id: string; name: string };
  prescriber: { name: string; crm: string };
  encounterId?: string;
  action: "prescrever" | "renovar" | "suspender" | "continuar";
  onDone: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export function SmartPrescriptionPreview({
  items,
  compliance,
  patient,
  prescriber,
  encounterId,
  action,
  onDone,
  onBack,
  onCancel,
}: SmartPrescriptionPreviewProps) {
  const { toast } = useToast();
  const [recipeType, setRecipeType] = useState<RecipeType>(compliance.recipeType);
  const [showSignPrompt, setShowSignPrompt] = useState(false);
  const recipeTypes = getRecipeTypes();

  const now = new Date().toISOString();
  const dateStr = new Date().toLocaleDateString("pt-BR");

  const buildContent = (): string => {
    const lines: string[] = [];
    lines.push(`RECEITA ${recipeType.toUpperCase().replace("_", " ")}`);
    lines.push("");
    lines.push(`Paciente: ${patient.name}`);
    lines.push(`Data: ${dateStr}`);
    lines.push("");

    items.forEach((item, i) => {
      lines.push(`${i + 1}) ${item.medicationName} ${item.concentration}`);
      if (item.form) lines.push(`   Forma: ${item.form}`);
      lines.push(`   ${item.dosage}`);
      if (item.duration) lines.push(`   Duração: ${item.duration}`);
      if (item.quantity) lines.push(`   Quantidade: ${item.quantity}`);
      lines.push("");
    });

    lines.push("");
    lines.push(`Dr(a). ${prescriber.name}`);
    lines.push(`CRM: ${prescriber.crm}`);
    return lines.join("\n");
  };

  const handleSign = () => {
    const content = buildContent();
    const docType = recipeType === "simples" ? "prescricao" : "prescricao";

    addDocument({
      patientId: patient.id,
      encounterId,
      type: docType,
      title: `Receita ${recipeType.replace("_", " ")} — ${items.map((i) => i.medicationName).join(", ")}`,
      content,
      createdAt: now,
      signedAt: now,
      signedBy: `${prescriber.name} (CRM ${prescriber.crm})`,
      status: "signed",
      recipeType,
      compliance: {
        regulatorySource: compliance.regulatorySource,
        requirements: compliance.requirements,
        warnings: compliance.warnings,
        needsConfirmation: compliance.needsConfirmation,
        confirmedByDoctor: true,
        confirmedAt: now,
      },
    });

    // Create medication events
    const medStatus = action === "suspender" ? "suspenso" : "prescrito";
    for (const item of items) {
      addMedicationEvent({
        patientId: patient.id,
        encounterId,
        medicationName: `${item.medicationName} ${item.concentration}`,
        date: now.slice(0, 10),
        status: medStatus as "prescrito" | "suspenso" | "nao_renovado",
        note: action === "suspender" ? "Suspenso via prescrição inteligente" : undefined,
      });
    }

    toast({ title: "Receita assinada e salva com sucesso." });
    onDone();
  };

  const handleSaveDraft = () => {
    const content = buildContent();
    addDocument({
      patientId: patient.id,
      encounterId,
      type: "prescricao",
      title: `Rascunho — ${items.map((i) => i.medicationName).join(", ")}`,
      content,
      createdAt: now,
      status: "draft",
      recipeType,
      compliance: {
        regulatorySource: compliance.regulatorySource,
        requirements: compliance.requirements,
        warnings: compliance.warnings,
        needsConfirmation: compliance.needsConfirmation,
      },
    });
    toast({ title: "Rascunho salvo." });
    onCancel();
  };

  if (showSignPrompt) {
    return (
      <div className="space-y-4 p-1">
        <div className="text-center space-y-2">
          <FileSignature className="h-10 w-10 text-primary mx-auto" />
          <p className="text-lg font-semibold">Assinar eletronicamente?</p>
          <p className="text-sm text-muted-foreground">
            A assinatura é simulada nesta versão. No futuro será integrada com certificado digital.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={handleSign} className="w-full">
            <FileSignature className="mr-2 h-4 w-4" /> Assinar agora
          </Button>
          <Button variant="secondary" onClick={() => setShowSignPrompt(false)} className="w-full">
            <Edit3 className="mr-2 h-4 w-4" /> Revisar
          </Button>
          <Button variant="ghost" onClick={handleSaveDraft} className="w-full">
            <X className="mr-2 h-4 w-4" /> Cancelar (salvar rascunho)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base">Preview da Receita</h3>
        <Badge variant="outline" className="text-[10px]">
          <Shield className="h-3 w-3 mr-1" />
          {compliance.regulatorySource}
        </Badge>
      </div>

      {/* Recipe type selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Tipo:</span>
        <Select value={recipeType} onValueChange={(v) => setRecipeType(v as RecipeType)}>
          <SelectTrigger className="h-8 w-auto text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {recipeTypes.map((rt) => (
              <SelectItem key={rt.value} value={rt.value} className="text-xs">{rt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Control special banner */}
      {recipeType === "controle_especial" && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Este tipo de receita exigirá emissão eletrônica integrada (backend/SNCR) quando habilitado. Nesta etapa, é simulação.
          </p>
        </div>
      )}

      {/* Warnings */}
      {compliance.warnings.length > 0 && (
        <div className="space-y-1">
          {compliance.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-amber-600">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      <Separator />

      {/* Document preview */}
      <Card>
        <CardContent className="p-4 space-y-3 text-sm">
          <div className="text-center">
            <p className="font-bold uppercase text-xs tracking-wider text-muted-foreground">
              Receita {recipeType.replace("_", " ")}
            </p>
          </div>

          <div className="text-xs text-muted-foreground">
            <p><strong>Paciente:</strong> {patient.name}</p>
            <p><strong>Data:</strong> {dateStr}</p>
          </div>

          <Separator />

          {items.map((item, i) => (
            <div key={i} className="space-y-0.5">
              <p className="font-medium">
                {i + 1}) {item.medicationName} {item.concentration}
              </p>
              {item.form && <p className="text-xs text-muted-foreground">Forma: {item.form}</p>}
              <p className="text-xs">{item.dosage}</p>
              {item.duration && <p className="text-xs text-muted-foreground">Duração: {item.duration}</p>}
              {item.quantity && <p className="text-xs text-muted-foreground">Quantidade: {item.quantity}</p>}
            </div>
          ))}

          <Separator />

          <div className="text-xs text-muted-foreground text-right">
            <p>Dr(a). {prescriber.name}</p>
            <p>CRM: {prescriber.crm}</p>
            <p className="italic mt-1">— Não assinado —</p>
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Exigências regulatórias:</p>
        <ul className="list-disc pl-4 space-y-0.5">
          {compliance.requirements.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={() => setShowSignPrompt(true)} className="flex-1">
          <FileSignature className="mr-2 h-4 w-4" /> Assinar
        </Button>
        <Button variant="secondary" onClick={onBack}>Editar</Button>
        <Button variant="ghost" onClick={handleSaveDraft}>Cancelar</Button>
      </div>
    </div>
  );
}
