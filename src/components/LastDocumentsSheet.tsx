import { useState, useMemo } from "react";
import { FileText, Copy, Edit3, CheckCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getDocumentsForPatient, addDocument } from "@/lib/clinical-documents";
import { formatDateTimeBR } from "@/lib/format";
import type { ClinicalDocument } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  encounterId?: string;
  onEditContent?: (content: string) => void;
}

const typeLabels: Record<ClinicalDocument["type"], string> = {
  prescricao: "Prescrição",
  atestado: "Atestado",
  solicitacao_exames: "Solicitação",
  orientacoes: "Orientações",
  outro: "Outro",
};

export function LastDocumentsSheet({ open, onOpenChange, patientId, encounterId, onEditContent }: Props) {
  const { toast } = useToast();
  const [docs, setDocs] = useState<ClinicalDocument[]>(() => getDocumentsForPatient(patientId));

  const refreshDocs = () => setDocs(getDocumentsForPatient(patientId));

  const handleRepeat = (doc: ClinicalDocument) => {
    const now = new Date().toISOString();
    addDocument({
      patientId: doc.patientId,
      encounterId: encounterId,
      type: doc.type,
      title: doc.title,
      content: doc.content,
      createdAt: now,
      signedAt: now,
      signedBy: "Dr. Mock",
      status: "signed",
    });
    refreshDocs();
    toast({ title: "Documento repetido e renovado com sucesso." });
  };

  const handleEdit = (doc: ClinicalDocument) => {
    if (onEditContent) {
      onEditContent(doc.content);
      onOpenChange(false);
      toast({ title: "Conteúdo carregado para edição." });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Últimos documentos
          </SheetTitle>
          <SheetDescription>Documentos anteriores do paciente</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-2">
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum documento encontrado.
            </p>
          ) : (
            docs.map((doc) => (
              <div key={doc.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[9px] h-4">
                    {typeLabels[doc.type] || doc.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatDateTimeBR(doc.createdAt)}</span>
                  {doc.status === "signed" && (
                    <Badge variant="outline" className="text-[9px] h-4 bg-success/10 text-success border-success/30">
                      <CheckCircle className="h-2.5 w-2.5 mr-0.5" /> Assinado
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{doc.content.slice(0, 100)}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => handleRepeat(doc)}>
                    <Copy className="h-3 w-3 mr-1" /> Repetir e renovar
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => handleEdit(doc)}>
                    <Edit3 className="h-3 w-3 mr-1" /> Editar para assinar
                  </Button>
                </div>
                <Separator />
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
