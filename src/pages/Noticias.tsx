import { useState } from "react";
import { Newspaper, Search, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NewsItem {
  title: string;
  source: string;
  date: string;
  category: string;
  summary: string;
}

const categories = ["Todas", "Hoje", "Diretrizes", "Medicações", "Eventos"];

const allNews: NewsItem[] = [
  { title: "Nova diretriz para manejo de hipertensão em idosos", source: "SBC", date: "16/02/2026", category: "Hoje", summary: "A Sociedade Brasileira de Cardiologia publicou novas recomendações para o tratamento de hipertensão arterial em pacientes acima de 65 anos." },
  { title: "Anvisa aprova novo medicamento para diabetes tipo 2", source: "Anvisa", date: "16/02/2026", category: "Medicações", summary: "A agência reguladora aprovou um novo inibidor de SGLT2 com indicação ampliada para insuficiência cardíaca." },
  { title: "Campanha de vacinação contra gripe começa em março", source: "Ministério da Saúde", date: "15/02/2026", category: "Hoje", summary: "A campanha nacional de vacinação contra influenza terá início em 1º de março, com prioridade para grupos de risco." },
  { title: "Estudo mostra eficácia de telemedicina no SUS", source: "Lancet BR", date: "15/02/2026", category: "Hoje", summary: "Pesquisa multicêntrica demonstrou que teleconsultas reduziram em 30% o tempo de espera para especialistas no Sistema Único de Saúde." },
  { title: "CFM publica resolução sobre prontuário eletrônico", source: "CFM", date: "14/02/2026", category: "Diretrizes", summary: "Nova resolução estabelece padrões mínimos de segurança e interoperabilidade para sistemas de prontuário eletrônico." },
  { title: "Atualização protocolo AVC isquêmico", source: "ABN", date: "10/02/2026", category: "Diretrizes", summary: "A Academia Brasileira de Neurologia atualizou as recomendações para trombólise e trombectomia mecânica." },
  { title: "Novas recomendações para rastreio de câncer colorretal", source: "INCA", date: "08/02/2026", category: "Diretrizes", summary: "Idade de início do rastreio foi reduzida para 45 anos em pacientes sem fatores de risco adicionais." },
  { title: "Semaglutida: nova indicação para insuficiência cardíaca", source: "FDA/Anvisa", date: "12/02/2026", category: "Medicações", summary: "Estudos SELECT e STEP-HFpEF embasam nova indicação do medicamento para IC com fração de ejeção preservada." },
  { title: "Recall de lote de losartana potássica", source: "Anvisa", date: "10/02/2026", category: "Medicações", summary: "Lote específico foi recolhido por presença de impureza acima do limite aceitável." },
  { title: "Genérico de apixabana disponível no Brasil", source: "Anvisa", date: "07/02/2026", category: "Medicações", summary: "Primeiro genérico do anticoagulante foi aprovado, com potencial redução de custo para pacientes." },
  { title: "Congresso Brasileiro de Clínica Médica - São Paulo", source: "SBCM", date: "20/03/2026", category: "Eventos", summary: "O evento contará com mais de 200 palestrantes nacionais e internacionais, abordando temas de medicina interna." },
  { title: "Simpósio de Medicina de Família - Online", source: "SBMFC", date: "15/03/2026", category: "Eventos", summary: "Evento 100% online com foco em atenção primária e medicina de família e comunidade." },
  { title: "Jornada Paulista de Cardiologia", source: "SOCESP", date: "10/04/2026", category: "Eventos", summary: "Jornada abordará avanços em cardiologia intervencionista e novos tratamentos para arritmias." },
  { title: "Workshop de Telemedicina e IA na Saúde", source: "CBIS", date: "22/04/2026", category: "Eventos", summary: "Workshop prático sobre implementação de inteligência artificial em fluxos clínicos e telemedicina." },
  { title: "Diretriz brasileira de insuficiência cardíaca 2026", source: "SBC", date: "05/02/2026", category: "Diretrizes", summary: "Atualização completa das recomendações para diagnóstico e tratamento de IC crônica e aguda." },
];

export default function Noticias() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");

  const filtered = allNews.filter((n) => {
    const matchCategory = category === "Todas" || n.category === category;
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.source.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Notícias</h1>
        </div>
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
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                category === cat
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((item, i) => (
          <Card key={i} className="glass-card rounded-xl hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold leading-snug">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.summary}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-[10px] font-normal">{item.category}</Badge>
                    <span className="text-[10px] text-muted-foreground">{item.source}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground">{item.date}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <Newspaper className="h-10 w-10 mx-auto mb-3 opacity-25" />
            <p className="text-sm">Nenhuma notícia encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
}
