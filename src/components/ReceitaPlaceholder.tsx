import { PrescriptionFlow } from "@/components/receita/PrescriptionFlow";

interface ReceitaPlaceholderProps {
  encounterId?: string;
  patientId?: string;
}

export function ReceitaPlaceholder({ encounterId, patientId }: ReceitaPlaceholderProps) {
  return <PrescriptionFlow encounterId={encounterId} patientId={patientId} />;
}
