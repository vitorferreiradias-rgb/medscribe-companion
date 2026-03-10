import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sparkles, ImageIcon, Clock, FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAvaliacoesCorporais } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";

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

  return (
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
              return (
                <div
                  key={av.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer"
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
                    {av.resultado_analise_ia && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {av.resultado_analise_ia.slice(0, 120)}…
                      </p>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(parseISO(av.created_at), "HH:mm")}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
