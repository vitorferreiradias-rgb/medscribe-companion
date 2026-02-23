import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface DivergenceConfirmationProps {
  doctorDosage: string;
  standardDosage: string;
  medicationName: string;
  onKeepDoctor: () => void;
  onUseStandard: () => void;
  onEditManually: () => void;
}

export function DivergenceConfirmation({
  doctorDosage,
  standardDosage,
  medicationName,
  onKeepDoctor,
  onUseStandard,
  onEditManually,
}: DivergenceConfirmationProps) {
  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Divergência de posologia — {medicationName}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Você ditou: <strong className="text-foreground">{doctorDosage}</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              O padrão mais comum é: <strong className="text-foreground">{standardDosage}</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-2">Confirmar como ditado?</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onKeepDoctor}>Manter como ditado</Button>
          <Button size="sm" variant="secondary" onClick={onUseStandard}>Ajustar para padrão</Button>
          <Button size="sm" variant="outline" onClick={onEditManually}>Editar manualmente</Button>
        </div>
      </CardContent>
    </Card>
  );
}
