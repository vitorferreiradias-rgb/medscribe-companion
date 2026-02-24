import { useState } from "react";
import { Newspaper, Search, ArrowLeft, RefreshCw, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMedicalNews } from "@/hooks/useMedicalNews";

const categories = [
  { label: "Todas", value: "all" },
  { label: "Hoje", value: "hoje" },
  { label: "Diretrizes", value: "diretrizes" },
  { label: "Medicações", value: "medicacoes" },
  { label: "Eventos", value: "eventos" },
];

export default function Noticias() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  // Fetch all categories
  const hoje = useMedicalNews("hoje");
  const diretrizes = useMedicalNews("diretrizes");
  const medicacoes = useMedicalNews("medicacoes");
  const eventos = useMedicalNews("eventos");

  const allByCategory: Record<string, ReturnType<typeof useMedicalNews>> = {
    hoje,
    diretrizes,
    medicacoes,
    eventos,
  };

  const activeCategories = category === "all" ? ["hoje", "diretrizes", "medicacoes", "eventos"] : [category];

  const allNews = activeCategories.flatMap((cat) => allByCategory[cat]?.data ?? []);
  const isLoading = activeCategories.some((cat) => allByCategory[cat]?.isLoading);

  const filtered = allNews.filter((n) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.source.toLowerCase().includes(q);
  });

  const handleRefreshAll = () => {
    activeCategories.forEach((cat) => allByCategory[cat]?.forceRefresh.mutate());
  };

  const isRefreshing = activeCategories.some((cat) => allByCategory[cat]?.forceRefresh.isPending);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 flex-1">
          <Newspaper className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Notícias</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-1.5"
          onClick={handleRefreshAll}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar notícia…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                category === cat.value
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="glass-card rounded-xl">
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : filtered.length > 0 ? (
          filtered.map((item) => (
            <a
              key={item.id}
              href={item.url || undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="block no-underline text-foreground"
            >
              <Card className="glass-card rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold leading-snug">{item.title}</h3>
                      {item.summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.summary}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px] font-normal">{item.category}</Badge>
                        <span className="text-[10px] text-muted-foreground">{item.source}</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">{item.published_at}</span>
                      </div>
                    </div>
                    {item.url && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />}
                  </div>
                </CardContent>
              </Card>
            </a>
          ))
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <Newspaper className="h-10 w-10 mx-auto mb-3 opacity-25" />
            <p className="text-sm">Nenhuma notícia encontrada.</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs text-primary"
              onClick={handleRefreshAll}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Carregando…" : "Buscar notícias"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
