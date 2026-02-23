import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface PosologyPromptProps {
  medicationName: string;
  concentration?: string;
  onSubmit: (dosage: string) => void;
  onCancel: () => void;
}

export function PosologyPrompt({ medicationName, concentration, onSubmit, onCancel }: PosologyPromptProps) {
  const [dosage, setDosage] = useState("");

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardContent className="p-4 space-y-3">
        <p className="text-sm font-medium">
          Posologia não identificada para <strong>{medicationName} {concentration || ""}</strong>
        </p>
        <p className="text-xs text-muted-foreground">
          Informe a posologia desejada (ex.: 1x/dia, semanal, 1 cp 2x ao dia por 30 dias)
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Ex.: 1 cp 1x ao dia por 30 dias"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && dosage.trim() && onSubmit(dosage.trim())}
            autoFocus
          />
          <Button size="sm" onClick={() => dosage.trim() && onSubmit(dosage.trim())} disabled={!dosage.trim()}>
            Confirmar
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
