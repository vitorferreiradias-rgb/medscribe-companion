import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, UserPlus, CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface TopbarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onNewConsulta: () => void;
  onNewPaciente: () => void;
  onNewAgendamento: () => void;
}

export function Topbar({ currentDate, onDateChange, onNewConsulta, onNewPaciente, onNewAgendamento }: TopbarProps) {
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
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNewConsulta, onNewAgendamento]);

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 backdrop-blur-md px-4 h-14">
      <SidebarTrigger />

      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="global-search"
          placeholder="Buscar paciente / consulta… ( / )"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm bg-secondary/50 border-transparent focus-visible:border-border"
        />
      </div>

      {/* Date navigator */}
      <div className="hidden sm:flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => goDay(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <button
          onClick={() => onDateChange(new Date())}
          className="text-sm font-medium px-2 py-1 rounded-md hover:bg-secondary/60 transition-colors capitalize"
        >
          {isToday ? "Hoje" : formatDate(currentDate)}
        </button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => goDay(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1 ml-auto">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onNewConsulta}>
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Nova Consulta (n)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onNewPaciente}>
              <UserPlus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Novo Paciente</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onNewAgendamento}>
              <CalendarPlus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Novo Agendamento (a)</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
