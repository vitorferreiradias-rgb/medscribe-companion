import { useState } from "react";
import { motion } from "framer-motion";
import { Pill, Plus, Trash2, ShieldCheck, ShieldAlert, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  instructions: string;
}

export function ReceitaPlaceholder() {
  const [medications, setMedications] = useState<MedicationItem[]>([
    { id: "1", name: "", dosage: "", instructions: "" },
  ]);
  const [validity, setValidity] = useState("30");

  const addMedication = () => {
    setMedications((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", dosage: "", instructions: "" },
    ]);
  };

  const removeMedication = (id: string) => {
    if (medications.length > 1) {
      setMedications((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const updateMedication = (id: string, field: keyof MedicationItem, value: string) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      {/* Medications */}
      <Card className="glass-card">
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Medicamentos</span>
          </div>

          {medications.map((med, i) => (
            <div key={med.id} className="space-y-2 p-3 rounded-lg bg-muted/40 border border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Item {i + 1}
                </span>
                {medications.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => removeMedication(med.id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                )}
              </div>
              <Input
                placeholder="Nome do medicamento"
                value={med.name}
                onChange={(e) => updateMedication(med.id, "name", e.target.value)}
                className="text-sm"
              />
              <Input
                placeholder="Dosagem (ex: 500mg, 1 comprimido)"
                value={med.dosage}
                onChange={(e) => updateMedication(med.id, "dosage", e.target.value)}
                className="text-sm"
              />
              <Textarea
                placeholder="Instruções de uso"
                value={med.instructions}
                onChange={(e) => updateMedication(med.id, "instructions", e.target.value)}
                rows={2}
                className="text-sm resize-none"
              />
            </div>
          ))}

          <Button variant="outline" size="sm" className="w-full" onClick={addMedication}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar medicamento
          </Button>
        </CardContent>
      </Card>

      {/* Validity */}
      <Card className="glass-card">
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Validade</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={validity}
              onChange={(e) => setValidity(e.target.value)}
              className="w-20 text-sm"
              min={1}
              max={365}
            />
            <span className="text-sm text-muted-foreground">dias</span>
          </div>
        </CardContent>
      </Card>

      {/* Digital Certificate */}
      <Card className="glass-card">
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-warning" />
            <span className="text-sm font-semibold">Certificado Digital</span>
          </div>
          <Separator />
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
              <ShieldAlert className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Assinatura não configurada</p>
              <p className="text-xs text-muted-foreground">
                Configure seu certificado digital ICP-Brasil para assinar receitas.
              </p>
            </div>
            <Badge variant="outline" className="border-warning/30 text-warning text-[10px]">
              Pendente
            </Badge>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="w-full" disabled>
                  <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Assinar Receita
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">É necessário configurar um certificado digital ICP-Brasil para assinar receitas eletronicamente.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardContent>
      </Card>
    </motion.div>
  );
}
