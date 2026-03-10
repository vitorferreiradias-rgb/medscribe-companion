import { useRef } from "react";
import { Printer, X } from "lucide-react";
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

const TYPE_LABELS: Record<string, string> = {
  composition: "Relatório de Composição Corporal",
  compare: "Comparação de Evolução",
  evolution: "Laudo de Evolução Completa",
};

export function AnalysisResultModal({
  open,
  onOpenChange,
  result,
  date,
  patientName,
  analysisType,
}: AnalysisResultModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${TYPE_LABELS[analysisType || ""] || "Relatório"} — ${patientName || "Paciente"}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
          h1 { font-size: 20px; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 4px; }
          .meta { font-size: 12px; color: #666; margin-bottom: 24px; }
          .content { font-size: 14px; }
          .content h1, .content h2, .content h3 { margin-top: 16px; margin-bottom: 8px; }
          .content h2 { font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
          .content h3 { font-size: 14px; }
          .content p { margin: 8px 0; }
          .content ul, .content ol { margin: 8px 0; padding-left: 20px; }
          table { border-collapse: collapse; width: 100%; margin: 12px 0; }
          th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; font-size: 13px; }
          th { background: #f5f5f5; font-weight: 600; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>${TYPE_LABELS[analysisType || ""] || "Relatório de Análise"}</h1>
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
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            {TYPE_LABELS[analysisType || ""] || "Resultado da Análise"}
            {analysisType && (
              <Badge variant="secondary" className="text-[10px]">
                {analysisType}
              </Badge>
            )}
          </DialogTitle>
          {(patientName || date) && (
            <p className="text-xs text-muted-foreground">
              {patientName && <span>{patientName}</span>}
              {patientName && date && <span> • </span>}
              {date && <span>{date}</span>}
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <div ref={printRef}>
            <MarkdownRenderer content={result} className="text-sm" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            <X className="h-3.5 w-3.5 mr-1" />
            Fechar
          </Button>
          <Button size="sm" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5 mr-1" />
            Imprimir Relatório
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
