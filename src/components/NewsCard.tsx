import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Newspaper, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface NewsItem {
  title: string;
  source: string;
  date: string;
  category: string;
}

const mockNews: Record<string, NewsItem[]> = {
  hoje: [
    { title: "Nova diretriz para manejo de hipertensão em idosos", source: "SBC", date: "16/02/2026", category: "hoje" },
    { title: "Anvisa aprova novo medicamento para diabetes tipo 2", source: "Anvisa", date: "16/02/2026", category: "hoje" },
    { title: "Campanha de vacinação contra gripe começa em março", source: "MS", date: "15/02/2026", category: "hoje" },
    { title: "Estudo mostra eficácia de telemedicina no SUS", source: "Lancet BR", date: "15/02/2026", category: "hoje" },
    { title: "CFM publica resolução sobre prontuário eletrônico", source: "CFM", date: "14/02/2026", category: "hoje" },
  ],
  diretrizes: [
    { title: "Atualização protocolo AVC isquêmico", source: "ABN", date: "10/02/2026", category: "diretrizes" },
    { title: "Novas recomendações para rastreio de câncer colorretal", source: "INCA", date: "08/02/2026", category: "diretrizes" },
    { title: "Diretriz brasileira de insuficiência cardíaca 2026", source: "SBC", date: "05/02/2026", category: "diretrizes" },
    { title: "Protocolo atualizado de sepse neonatal", source: "SBP", date: "01/02/2026", category: "diretrizes" },
    { title: "Consenso sobre uso de antibióticos em IVAS", source: "SBPT", date: "28/01/2026", category: "diretrizes" },
  ],
  medicacoes: [
    { title: "Semaglutida: nova indicação para insuficiência cardíaca", source: "FDA/Anvisa", date: "12/02/2026", category: "medicacoes" },
    { title: "Recall de lote de losartana potássica", source: "Anvisa", date: "10/02/2026", category: "medicacoes" },
    { title: "Genérico de apixabana disponível no Brasil", source: "Anvisa", date: "07/02/2026", category: "medicacoes" },
    { title: "Novo broncodilatador aprovado para DPOC", source: "EMA/Anvisa", date: "03/02/2026", category: "medicacoes" },
    { title: "Interações medicamentosas: alerta para fluconazol + warfarina", source: "CFF", date: "01/02/2026", category: "medicacoes" },
  ],
  eventos: [
    { title: "Congresso Brasileiro de Clínica Médica - São Paulo", source: "SBCM", date: "20/03/2026", category: "eventos" },
    { title: "Simpósio de Medicina de Família - Online", source: "SBMFC", date: "15/03/2026", category: "eventos" },
    { title: "Jornada Paulista de Cardiologia", source: "SOCESP", date: "10/04/2026", category: "eventos" },
    { title: "Workshop de Telemedicina e IA na Saúde", source: "CBIS", date: "22/04/2026", category: "eventos" },
    { title: "Conferência Nacional de Saúde Digital", source: "MS", date: "05/05/2026", category: "eventos" },
  ],
};

export function NewsCard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("hoje");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, [activeTab]);

  const items = mockNews[activeTab] ?? [];

  return (
    <Card className="glass-card rounded-xl">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-caption font-medium flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-muted-foreground" />
          Notícias
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full h-8 bg-secondary/60">
            <TabsTrigger value="hoje" className="text-[11px] h-6 px-2.5">Hoje</TabsTrigger>
            <TabsTrigger value="diretrizes" className="text-[11px] h-6 px-2.5">Diretrizes</TabsTrigger>
            <TabsTrigger value="medicacoes" className="text-[11px] h-6 px-2.5">Medicações</TabsTrigger>
            <TabsTrigger value="eventos" className="text-[11px] h-6 px-2.5">Eventos</TabsTrigger>
          </TabsList>

          <div className="mt-3 space-y-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))
            ) : (
              items.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-start gap-2 py-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0 mt-1.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-snug truncate">{item.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{item.source}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground">{item.date}</span>
                    </div>
                  </div>
                </div>
              ))
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
    </Card>
  );
}
