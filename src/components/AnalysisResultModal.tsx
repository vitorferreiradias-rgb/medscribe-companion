import { useRef } from "react";
import { Activity, Printer, TrendingUp, X, FileText } from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AnalysisResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: string;
  date?: string;
  patientName?: string;
  analysisType?: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Activity; gradient: string }> = {
  composition: {
    label: "Relatório de Composição Corporal",
    icon: Activity,
    gradient: "from-primary/20 via-primary/5 to-transparent",
  },
  compare: {
    label: "Comparação de Evolução",
    icon: TrendingUp,
    gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
  },
  evolution: {
    label: "Laudo de Evolução Completa",
    icon: TrendingUp,
    gradient: "from-blue-500/20 via-blue-500/5 to-transparent",
  },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function nameToColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 55%)`;
}

export function AnalysisResultModal({
  open,
  onOpenChange,
  result,
  date,
  patientName,
  analysisType,
}: AnalysisResultModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const config = TYPE_CONFIG[analysisType || ""] || {
    label: "Resultado da Análise",
    icon: FileText,
    gradient: "from-muted/40 to-transparent",
  };
  const Icon = config.icon;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${config.label} — ${patientName || "Paciente"}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
          h1 { font-size: 20px; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 4px; }
          .meta { font-size: 12px; color: #666; margin-bottom: 24px; }
          .content { font-size: 13px; }
          .content h2 { font-size: 15px; border-left: 4px solid #3b82f6; padding-left: 10px; margin-top: 20px; margin-bottom: 8px; background: #f0f7ff; padding: 6px 10px; border-radius: 4px; }
          .content h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; margin-top: 14px; }
          .content p { margin: 6px 0; }
          .content ul, .content ol { margin: 6px 0; padding-left: 18px; }
          .content li { margin: 3px 0; }
          table { border-collapse: collapse; width: 100%; margin: 10px 0; border-radius: 8px; overflow: hidden; }
          th { background: #f0f4f8; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; color: #555; }
          th, td { border: 1px solid #e2e8f0; padding: 7px 12px; text-align: left; font-size: 12px; font-variant-numeric: tabular-nums; }
          tr:nth-child(even) { background: #f8fafc; }
          blockquote { border-left: 3px solid #f59e0b; background: #fffbeb; padding: 10px 14px; margin: 12px 0; border-radius: 4px; font-style: normal; }
          hr { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>${config.label}</h1>
        <div class="meta">
          ${patientName ? `Paciente: ${patientName}` : ""}
          ${date ? ` • Data: ${date}` : ""}
        </div>
        <div class="content">${printRef.current?.innerHTML || result}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden p-0 gap-0">
        {/* Premium Header */}
        <div className={`bg-gradient-to-r ${config.gradient} px-6 pt-5 pb-4 border-b border-border/40`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base font-bold">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              {config.label}
              {analysisType && (
                <Badge variant="secondary" className="text-[10px] font-medium">
                  {analysisType}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {(patientName || date) && (
            <div className="mt-2.5 flex items-center gap-2.5">
              {patientName && (
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm"
                  style={{ background: nameToColor(patientName) }}
                >
                  {getInitials(patientName)}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {patientName && <span className="font-medium text-foreground/80">{patientName}</span>}
                {patientName && date && <span> • </span>}
                {date && <span>{date}</span>}
              </p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          <div ref={printRef}>
            <MarkdownRenderer content={result} className="text-sm" />
          </div>
        </div>

        {/* Premium Footer */}
        <div className="flex justify-end gap-2 px-6 py-3 border-t border-border/40 bg-muted/20">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            <X className="h-3.5 w-3.5 mr-1" />
            Fechar
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-gradient-to-r from-primary to-primary/80 shadow-md hover:shadow-lg transition-shadow"
          >
            <Printer className="h-3.5 w-3.5 mr-1" />
            Imprimir Relatório
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
