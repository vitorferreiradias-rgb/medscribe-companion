import { cn } from "@/lib/utils";
import type { EncounterStatus } from "@/types";

const config: Record<EncounterStatus, { label: string; className: string }> = {
  recording: { label: "Gravando", className: "status-recording" },
  draft: { label: "Rascunho", className: "status-draft" },
  reviewed: { label: "Revisado", className: "status-reviewed" },
  final: { label: "Finalizado", className: "status-final" },
};

export function StatusBadge({ status, className }: { status: EncounterStatus; className?: string }) {
  const c = config[status];
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
      c.className,
      className
    )}>
      {status === "recording" && <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-destructive animate-ping" />}
      {c.label}
    </span>
  );
}
