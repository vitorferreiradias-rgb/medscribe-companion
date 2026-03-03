import { PrescriptionFlow } from "@/components/receita/PrescriptionFlow";

interface ReceitaPlaceholderProps {
  encounterId?: string;
  patientId?: string;
  clinicianId?: string;
  clinicianName?: string;
  clinicianCrm?: string;
  clinicianCpf?: string;
  clinicAddress?: string;
  patientName?: string;
}

export function ReceitaPlaceholder({ encounterId, patientId, clinicianId, clinicianName, clinicianCrm, clinicianCpf, clinicAddress, patientName }: ReceitaPlaceholderProps) {
  return (
    <PrescriptionFlow
      encounterId={encounterId}
      patientId={patientId}
      clinicianId={clinicianId}
      clinicianName={clinicianName}
      clinicianCrm={clinicianCrm}
      clinicianCpf={clinicianCpf}
      clinicAddress={clinicAddress}
      patientName={patientName}
    />
  );
}
