import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Newspaper, ExternalLink, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NewsItem {
  title: string;
  source: string;
  date: string;
  category: string;
  summary: string;
  url: string;
}

const mockNews: Record<string, NewsItem[]> = {
  hoje: [
    { title: "Nova diretriz para manejo de hipertensão em idosos", source: "SBC", date: "16/02/2026", category: "hoje", summary: "A Sociedade Brasileira de Cardiologia publicou novas recomendações para o tratamento de hipertensão arterial em pacientes acima de 65 anos, incluindo metas pressóricas individualizadas e preferência por combinações fixas.", url: "https://www.sbc.org.br" },
    { title: "Anvisa aprova novo medicamento para diabetes tipo 2", source: "Anvisa", date: "16/02/2026", category: "hoje", summary: "A agência reguladora aprovou um novo inibidor de SGLT2 com indicação ampliada para insuficiência cardíaca e doença renal crônica, ampliando o arsenal terapêutico disponível no Brasil.", url: "https://www.gov.br/anvisa" },
    { title: "Campanha de vacinação contra gripe começa em março", source: "MS", date: "15/02/2026", category: "hoje", summary: "A campanha nacional de vacinação contra influenza terá início em 1º de março, com prioridade para grupos de risco incluindo idosos, gestantes e profissionais de saúde.", url: "https://www.gov.br/saude" },
    { title: "Estudo mostra eficácia de telemedicina no SUS", source: "Lancet BR", date: "15/02/2026", category: "hoje", summary: "Pesquisa multicêntrica demonstrou que teleconsultas reduziram em 30% o tempo de espera para especialistas no Sistema Único de Saúde, com satisfação de 87% dos pacientes.", url: "https://www.thelancet.com" },
    { title: "CFM publica resolução sobre prontuário eletrônico", source: "CFM", date: "14/02/2026", category: "hoje", summary: "Nova resolução estabelece padrões mínimos de segurança e interoperabilidade para sistemas de prontuário eletrônico, com prazo de adequação de 18 meses.", url: "https://www.cfm.org.br" },
  ],
  diretrizes: [
    { title: "Atualização protocolo AVC isquêmico", source: "ABN", date: "10/02/2026", category: "diretrizes", summary: "A Academia Brasileira de Neurologia atualizou as recomendações para trombólise e trombectomia mecânica, estendendo a janela terapêutica para casos selecionados.", url: "https://www.abneuro.org.br" },
    { title: "Novas recomendações para rastreio de câncer colorretal", source: "INCA", date: "08/02/2026", category: "diretrizes", summary: "Idade de início do rastreio foi reduzida para 45 anos em pacientes sem fatores de risco adicionais, alinhando-se às diretrizes internacionais.", url: "https://www.inca.gov.br" },
    { title: "Diretriz brasileira de insuficiência cardíaca 2026", source: "SBC", date: "05/02/2026", category: "diretrizes", summary: "Atualização completa das recomendações para diagnóstico e tratamento de IC crônica e aguda, com inclusão de novos fármacos e dispositivos.", url: "https://www.sbc.org.br" },
    { title: "Protocolo atualizado de sepse neonatal", source: "SBP", date: "01/02/2026", category: "diretrizes", summary: "Sociedade Brasileira de Pediatria revisou os critérios diagnósticos e esquemas antibióticos para sepse neonatal precoce e tardia.", url: "https://www.sbp.com.br" },
    { title: "Consenso sobre uso de antibióticos em IVAS", source: "SBPT", date: "28/01/2026", category: "diretrizes", summary: "Documento reforça que a maioria das infecções de vias aéreas superiores não requer antibioticoterapia, com critérios claros para prescrição.", url: "https://sbpt.org.br" },
  ],
  medicacoes: [
    { title: "Semaglutida: nova indicação para insuficiência cardíaca", source: "FDA/Anvisa", date: "12/02/2026", category: "medicacoes", summary: "Estudos SELECT e STEP-HFpEF embasam nova indicação do medicamento para IC com fração de ejeção preservada em pacientes obesos.", url: "https://www.gov.br/anvisa" },
    { title: "Recall de lote de losartana potássica", source: "Anvisa", date: "10/02/2026", category: "medicacoes", summary: "Lote específico foi recolhido por presença de impureza acima do limite aceitável. Pacientes devem verificar o número do lote na embalagem.", url: "https://www.gov.br/anvisa" },
    { title: "Genérico de apixabana disponível no Brasil", source: "Anvisa", date: "07/02/2026", category: "medicacoes", summary: "Primeiro genérico do anticoagulante foi aprovado, com potencial redução de custo de até 40% para pacientes.", url: "https://www.gov.br/anvisa" },
    { title: "Novo broncodilatador aprovado para DPOC", source: "EMA/Anvisa", date: "03/02/2026", category: "medicacoes", summary: "Novo broncodilatador de ultra-longa duração aprovado para tratamento de manutenção de DPOC moderada a grave.", url: "https://www.gov.br/anvisa" },
    { title: "Interações medicamentosas: alerta para fluconazol + warfarina", source: "CFF", date: "01/02/2026", category: "medicacoes", summary: "Conselho Federal de Farmácia emitiu alerta sobre risco aumentado de sangramento na associação fluconazol-warfarina, recomendando monitorização rigorosa do INR.", url: "https://www.cff.org.br" },
  ],
  eventos: [
    { title: "Congresso Brasileiro de Clínica Médica - São Paulo", source: "SBCM", date: "20/03/2026", category: "eventos", summary: "O evento contará com mais de 200 palestrantes nacionais e internacionais, abordando temas de medicina interna e atualização clínica.", url: "https://www.sbcm.org.br" },
    { title: "Simpósio de Medicina de Família - Online", source: "SBMFC", date: "15/03/2026", category: "eventos", summary: "Evento 100% online com foco em atenção primária e medicina de família e comunidade, com certificação de 20 horas.", url: "https://www.sbmfc.org.br" },
    { title: "Jornada Paulista de Cardiologia", source: "SOCESP", date: "10/04/2026", category: "eventos", summary: "Jornada abordará avanços em cardiologia intervencionista e novos tratamentos para arritmias cardíacas.", url: "https://www.socesp.org.br" },
    { title: "Workshop de Telemedicina e IA na Saúde", source: "CBIS", date: "22/04/2026", category: "eventos", summary: "Workshop prático sobre implementação de inteligência artificial em fluxos clínicos e telemedicina, com cases reais.", url: "https://www.cbis.org.br" },
    { title: "Conferência Nacional de Saúde Digital", source: "MS", date: "05/05/2026", category: "eventos", summary: "Conferência promovida pelo Ministério da Saúde para discutir a transformação digital do SUS e prontuário eletrônico nacional.", url: "https://www.gov.br/saude" },
  ],
};

interface NewsCardProps {
  embedded?: boolean;
}

export function NewsCard({ embedded = false }: NewsCardProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("hoje");
  const [loading, setLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLoading(true);
    setExpandedIndex(null);
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, [activeTab]);

  const items = mockNews[activeTab] ?? [];

  const handleClick = useCallback((index: number, url: string) => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      window.open(url, "_blank");
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

          <div className="mt-3">
            {loading ? (
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
                    <span className="text-[10px] text-muted-foreground">{expandedItem.date}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 text-xs text-primary hover:text-primary p-0 h-auto"
                    onClick={() => window.open(expandedItem.url, "_blank")}
                  >
                    Abrir fonte
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {items.slice(0, 5).map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 py-1 cursor-pointer rounded-md px-1 -mx-1 hover:bg-secondary/50 transition-colors"
                    onClick={() => handleClick(i, item.url)}
                  >
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
