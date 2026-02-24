import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Newspaper, ExternalLink, ArrowLeft, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMedicalNews } from "@/hooks/useMedicalNews";

interface NewsCardProps {
  embedded?: boolean;
}

export function NewsCard({ embedded = false }: NewsCardProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("hoje");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: items = [], isLoading, forceRefresh } = useMedicalNews(activeTab);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setExpandedIndex(null);
  };

  const handleClick = useCallback((index: number, url: string | null) => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      if (url) window.open(url, "_blank");
      return;
    }
    clickTimer.current = setTimeout(() => {
      clickTimer.current = null;
      setExpandedIndex(index);
    }, 300);
  }, []);

  const expandedItem = expandedIndex !== null ? items[expandedIndex] : null;

  const content = (
    <>
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-caption font-medium flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-muted-foreground" />
          Notícias
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 ml-auto"
            onClick={() => forceRefresh.mutate()}
            disabled={forceRefresh.isPending}
          >
            <RefreshCw className={`h-3 w-3 ${forceRefresh.isPending ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full h-8 bg-secondary/60">
            <TabsTrigger value="hoje" className="text-[11px] h-6 px-2.5">Hoje</TabsTrigger>
            <TabsTrigger value="diretrizes" className="text-[11px] h-6 px-2.5">Diretrizes</TabsTrigger>
            <TabsTrigger value="medicacoes" className="text-[11px] h-6 px-2.5">Medicações</TabsTrigger>
            <TabsTrigger value="eventos" className="text-[11px] h-6 px-2.5">Eventos</TabsTrigger>
          </TabsList>

          <div className="mt-3">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                ))}
              </div>
            ) : expandedItem ? (
              <div className="space-y-3">
                <button
                  onClick={() => setExpandedIndex(null)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Voltar à lista
                </button>
                <div>
                  <h3 className="text-sm font-semibold leading-snug">{expandedItem.title}</h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{expandedItem.summary}</p>
                  <div className="flex items-center gap-1.5 mt-3">
                    <Badge variant="secondary" className="text-[10px] font-normal">{expandedItem.source}</Badge>
                    <span className="text-[10px] text-muted-foreground">{expandedItem.published_at}</span>
                  </div>
                  {expandedItem.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 text-xs text-primary hover:text-primary p-0 h-auto"
                      onClick={() => window.open(expandedItem.url!, "_blank")}
                    >
                      Abrir fonte
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs text-muted-foreground">Nenhuma notícia disponível.</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs text-primary"
                  onClick={() => forceRefresh.mutate()}
                  disabled={forceRefresh.isPending}
                >
                  {forceRefresh.isPending ? "Carregando…" : "Buscar notícias"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {items.slice(0, 5).map((item, i) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2 py-1 cursor-pointer rounded-md px-1 -mx-1 hover:bg-secondary/50 transition-colors"
                    onClick={() => handleClick(i, item.url)}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0 mt-1.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-snug truncate">{item.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{item.source}</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">{item.published_at}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Tabs>

        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-3 text-xs text-primary hover:text-primary"
          onClick={() => navigate("/noticias")}
        >
          Ver todas
          <ExternalLink className="ml-1.5 h-3 w-3" />
        </Button>
      </CardContent>
    </>
  );

  if (embedded) return content;

  return (
    <Card className="glass-card rounded-xl">
      {content}
    </Card>
  );
}
