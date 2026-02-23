import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, ChevronLeft, ChevronRight, UserPlus, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { QuickActionsMenu } from "./QuickActionsMenu";

interface TopbarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onNewConsulta: () => void;
  onNewPaciente: () => void;
  onNewAgendamento: () => void;
  onOpenCommandBar?: () => void;
  onPasteTranscript?: () => void;
  onSmartAssistant?: () => void;
}

export function Topbar({
  currentDate,
  onDateChange,
  onNewConsulta,
  onNewPaciente,
  onNewAgendamento,
  onOpenCommandBar,
  onPasteTranscript,
  onSmartAssistant,
}: TopbarProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const goDay = (delta: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + delta);
    onDateChange(d);
  };

  const isToday = currentDate.toDateString() === new Date().toDateString();

  const formatDate = (d: Date) =>
    d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "/") { e.preventDefault(); document.getElementById("global-search")?.focus(); }
      if (e.key === "n") onNewConsulta();
      if (e.key === "a") onNewAgendamento();
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenCommandBar?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNewConsulta, onNewAgendamento, onOpenCommandBar]);

  return (
    <header className="glass-topbar sticky top-0 z-20 flex items-center gap-4 px-5 h-[72px]">
      <SidebarTrigger className="h-8 w-8" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate("/agenda")} aria-label="Início">
            <Home className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Início</TooltipContent>
      </Tooltip>

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="global-search"
          placeholder="Buscar paciente / consulta… ( / )"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 text-sm bg-secondary/40 border-transparent rounded-lg focus-visible:border-primary/20 focus-visible:bg-white"
        />
      </div>

      {/* Date navigator */}
      <div className="hidden sm:flex items-center gap-1 ml-auto">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => goDay(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <button
          onClick={() => onDateChange(new Date())}
          className="text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-secondary/60 transition-colors duration-150 capitalize"
        >
          {isToday ? "Hoje" : formatDate(currentDate)}
        </button>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => goDay(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* CTA principal + Quick Actions */}
      <div className="flex items-center gap-1.5">
        <Button size="sm" className="h-9 rounded-lg gap-1.5" onClick={onNewPaciente}>
          <UserPlus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Adicionar paciente</span>
        </Button>

        <QuickActionsMenu
          onNewConsulta={onNewConsulta}
          onNewAgendamento={onNewAgendamento}
          onNewPaciente={onNewPaciente}
          onPasteTranscript={onPasteTranscript}
          onSmartAssistant={onSmartAssistant}
        />
      </div>
    </header>
  );
}
