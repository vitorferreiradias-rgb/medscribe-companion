import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DoseVariant } from "@/lib/medication-knowledge";

interface VariantSelectorProps {
  medicationName: string;
  variants: DoseVariant[];
  onSelect: (variant: DoseVariant) => void;
  onCancel: () => void;
}

export function VariantSelector({ medicationName, variants, onSelect, onCancel }: VariantSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        Qual esquema para <strong>{medicationName}</strong>?
      </p>
      <div className="grid gap-2">
        {variants.map((v, i) => (
          <Card
            key={i}
            className="cursor-pointer transition-colors hover:border-primary/50 hover:bg-primary/5"
            onClick={() => onSelect(v)}
          >
            <CardContent className="p-3">
              <p className="text-sm font-medium">{v.label}</p>
              <p className="text-xs text-muted-foreground">{v.description}</p>
              <p className="text-xs text-primary mt-1">{v.dosage}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button size="sm" variant="ghost" onClick={onCancel}>Cancelar</Button>
    </div>
  );
}
