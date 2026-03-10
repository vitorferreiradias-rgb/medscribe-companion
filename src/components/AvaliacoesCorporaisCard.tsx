import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sparkles, ImageIcon, Clock, FileText, Loader2, ChevronDown, ChevronUp, Pencil, Check, X, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAvaliacoesCorporais, useUpdateAvaliacaoCorporal } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnalysisResultModal } from "@/components/AnalysisResultModal";

interface AvaliacoesCorporaisCardProps {
  patientId: string;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Pendente", variant: "outline" },
  analyzing: { label: "Analisando", variant: "secondary" },
  completed: { label: "Concluída", variant: "default" },
  error: { label: "Erro", variant: "destructive" },
};

export function AvaliacoesCorporaisCard({ patientId }: AvaliacoesCorporaisCardProps) {
  const { data: avaliacoes, isLoading } = useAvaliacoesCorporais(patientId);
  const updateMutation = useUpdateAvaliacaoCorporal();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [printModalData, setPrintModalData] = useState<{ result: string; date: string } | null>(null);

  const startEditing = (id: string, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveEdit = (id: string) => {
    updateMutation.mutate({ id, resultado_analise_ia: editText }, {
      onSuccess: () => {
        setEditingId(null);
        setEditText("");
      },
    });
  };

  return (
    <>
    <Card className="glass-card">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Avaliações Corporais com IA
          {avaliacoes && avaliacoes.length > 0 && (
            <Badge variant="secondary" className="text-xs ml-auto">
              {avaliacoes.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : !avaliacoes || avaliacoes.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma avaliação corporal ainda.</p>
            <p className="text-xs mt-1">Use o botão "Nova Avaliação" na timeline para iniciar.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {avaliacoes.map((av) => {
              const st = statusMap[av.status] || statusMap.pending;
              const isExpanded = expandedId === av.id;
              const isEditing = editingId === av.id;
              return (
                <div key={av.id} className="rounded-lg border bg-muted/10 overflow-hidden">
                  <div
                    className="flex items-start gap-3 p-3 hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : av.id)}
                  >
                    <div className="flex items-center justify-center h-9 w-9 rounded-md bg-primary/10 shrink-0">
                      {av.status === "analyzing" ? (
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      ) : av.status === "completed" ? (
                        <FileText className="h-4 w-4 text-primary" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {format(parseISO(av.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                        <Badge variant={st.variant} className="text-[10px] px-1.5 py-0">
                          {st.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" />
                          {av.photo_paths.length} foto{av.photo_paths.length !== 1 ? "s" : ""}
                        </span>
                        {av.angles && av.angles.length > 0 && (
                          <span>{av.angles.join(", ")}</span>
                        )}
                      </div>
                      {!isExpanded && av.resultado_analise_ia && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {av.resultado_analise_ia.slice(0, 120)}…
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(parseISO(av.created_at), "HH:mm")}
                      </div>
                      {av.resultado_analise_ia && (
                        isExpanded
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded result */}
                  {isExpanded && av.resultado_analise_ia && (
                    <div className="border-t px-4 py-3">
                      <div className="flex items-center justify-end gap-1 mb-2">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={cancelEditing}
                              disabled={updateMutation.isPending}
                            >
                              <X className="h-3.5 w-3.5 mr-1" />
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => saveEdit(av.id)}
                              disabled={updateMutation.isPending}
                            >
                              {updateMutation.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5 mr-1" />
                              )}
                              Salvar
                            </Button>
                          </>
                        ) : (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(av.id, av.resultado_analise_ia!);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPrintModalData({
                                  result: av.resultado_analise_ia!,
                                  date: format(parseISO(av.date), "dd/MM/yyyy"),
                                });
                              }}
                            >
                              <Printer className="h-3.5 w-3.5 mr-1" />
                              Imprimir
                            </Button>
                          </div>
                        )}
                      </div>
                      {isEditing ? (
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="min-h-[300px] text-sm font-mono"
                          placeholder="Edite o relatório da IA..."
                        />
                      ) : (
                        <ScrollArea className="max-h-[400px]">
                          <div className="prose prose-sm dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                            {av.resultado_analise_ia}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  )}

                  {/* Error state */}
                  {isExpanded && av.status === "error" && av.resultado_analise_ia && (
                    <div className="border-t px-4 py-3">
                      <p className="text-sm text-destructive">{av.resultado_analise_ia}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>

    <AnalysisResultModal
      open={!!printModalData}
      onOpenChange={(open) => { if (!open) setPrintModalData(null); }}
      result={printModalData?.result || ""}
      date={printModalData?.date}
    />
    </>
  );
}
