import { PrescriptionFlow } from "@/components/receita/PrescriptionFlow";

interface ReceitaPlaceholderProps {
  encounterId?: string;
  patientId?: string;
  clinicianName?: string;
  clinicianCrm?: string;
  clinicianCpf?: string;
  clinicAddress?: string;
  patientName?: string;
}

export function ReceitaPlaceholder({ encounterId, patientId, clinicianName, clinicianCrm, clinicianCpf, clinicAddress, patientName }: ReceitaPlaceholderProps) {
  return (
    <PrescriptionFlow
      encounterId={encounterId}
      patientId={patientId}
      clinicianName={clinicianName}
      clinicianCrm={clinicianCrm}
      clinicianCpf={clinicianCpf}
      clinicAddress={clinicAddress}
      patientName={patientName}
    />
  );
}
