import { useState } from "react";
import { FileText, Pill } from "lucide-react";
import { formatDateTimeBR } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { Encounter, Note, Prescription } from "@/types";

interface Props {
  patientId: string;
  currentEncounterId: string;
  encounters: Encounter[];
  notes: Note[];
  prescriptions: Prescription[];
}

type TimelineItem =
  | { type: "consulta"; encounter: Encounter; note?: Note; meds: Prescription[] }
  | { type: "interconsulta"; prescription: Prescription };

export function ConsultaTimeline({ patientId, currentEncounterId, encounters, notes, prescriptions }: Props) {
  const [expanded, setExpanded] = useState<Record<string, "resumo" | "meds" | null>>({});

  const toggle = (id: string, section: "resumo" | "meds") => {
    setExpanded((prev) => ({ ...prev, [id]: prev[id] === section ? null : section }));
  };

  // Build unified timeline
  const items: TimelineItem[] = [];

  // Consultas (excluding current)
  encounters
    .filter((e) => e.patientId === patientId && e.id !== currentEncounterId)
    .forEach((enc) => {
      const note = notes.find((n) => n.encounterId === enc.id);
      const meds = prescriptions.filter((p) => p.encounterId === enc.id);
      items.push({ type: "consulta", encounter: enc, note, meds });
    });

  // Interconsultas (prescriptions without encounterId)
  prescriptions
    .filter((p) => p.patientId === patientId && !p.encounterId)
    .forEach((p) => {
      items.push({ type: "interconsulta", prescription: p });
    });

  // Sort by date descending
  items.sort((a, b) => {
    const dateA = a.type === "consulta" ? a.encounter.startedAt : a.prescription.createdAt;
    const dateB = b.type === "consulta" ? b.encounter.startedAt : b.prescription.createdAt;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Nenhum histórico anterior.</p>;
  }

  return (
    <div className="space-y-0">
      {items.map((item, i) => {
        if (item.type === "consulta") {
          const { encounter: enc, note, meds } = item;
          const hasSummary = note && note.sections.some((s) => s.content.trim());
          const hasMeds = meds.length > 0;
          const exp = expanded[enc.id];

          return (
            <div key={enc.id}>
              {i > 0 && <Separator />}
              <div className="py-3 pl-6 relative">
                <div className="absolute left-1.5 top-5 h-2.5 w-2.5 rounded-full border-2 border-primary bg-background" />
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatDateTimeBR(enc.startedAt)}</span>
                      <span className="text-sm text-muted-foreground">— Consulta</span>
                      <StatusBadge status={enc.status} />
                    </div>
                    {enc.chiefComplaint && (
                      <p className="text-xs text-muted-foreground">Queixa: {enc.chiefComplaint}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {hasSummary && (
                      <Button variant="ghost" size="sm" onClick={() => toggle(enc.id, "resumo")} className="h-7 px-2 text-xs">
                        <FileText className="mr-1 h-3.5 w-3.5" /> Resumo
                      </Button>
                    )}
                    {hasMeds && (
                      <Button variant="ghost" size="sm" onClick={() => toggle(enc.id, "meds")} className="h-7 px-2 text-xs">
                        <Pill className="mr-1 h-3.5 w-3.5" /> Medicações
                      </Button>
                    )}
                  </div>
                </div>

                {exp === "resumo" && note && (
                  <div className="mt-2 rounded-md border bg-muted/40 p-3 space-y-2 text-sm">
                    {note.sections.filter((s) => s.content.trim()).map((s) => (
                      <div key={s.id}>
                        <p className="font-semibold text-xs text-muted-foreground">{s.title}</p>
                        <p className="whitespace-pre-wrap">{s.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {exp === "meds" && (
                  <div className="mt-2 rounded-md border bg-muted/40 p-3 space-y-1 text-sm">
                    {meds.flatMap((p) => p.medications).map((m) => (
                      <p key={m.id}>
                        • {m.isCompounded
                          ? `Fórmula: ${m.compoundedFormula || "sem descrição"}`
                          : `${[m.commercialName, m.concentration, m.presentation].filter(Boolean).join(" ")} — ${m.usageInstructions || "sem posologia"}`}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        }

        // Interconsulta
        const { prescription: rx } = item;
        const exp = expanded[rx.id];

        return (
          <div key={rx.id}>
            {i > 0 && <Separator />}
            <div className="py-3 pl-6 relative rounded-md bg-indigo-50 dark:bg-indigo-950/30">
              <div className="absolute left-1.5 top-5 h-2.5 w-2.5 rounded-sm rotate-45 border-2 border-indigo-500 bg-background" />
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatDateTimeBR(rx.createdAt)}</span>
                    <span className="text-sm text-indigo-600 dark:text-indigo-400">— Interconsulta</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => toggle(rx.id, "meds")} className="h-7 px-2 text-xs">
                  <Pill className="mr-1 h-3.5 w-3.5" /> Medicações
                </Button>
              </div>

              {exp === "meds" && (
                <div className="mt-2 rounded-md border border-indigo-200 dark:border-indigo-800 bg-background p-3 space-y-1 text-sm">
                  {rx.medications.map((m) => (
                    <p key={m.id}>
                      • {m.isCompounded
                        ? `Fórmula: ${m.compoundedFormula || "sem descrição"}`
                        : `${[m.commercialName, m.concentration, m.presentation].filter(Boolean).join(" ")} — ${m.usageInstructions || "sem posologia"}`}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
