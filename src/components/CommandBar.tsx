import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, CalendarPlus, UserPlus, ClipboardPaste, Search, Newspaper } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";

interface CommandBarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNewConsulta: () => void;
  onNewAgendamento: () => void;
  onNewPaciente: () => void;
  onPasteTranscript?: () => void;
}

export function CommandBar({
  open,
  onOpenChange,
  onNewConsulta,
  onNewAgendamento,
  onNewPaciente,
  onPasteTranscript,
}: CommandBarProps) {
  const navigate = useNavigate();

  const runAction = (fn: () => void) => {
    onOpenChange(false);
    setTimeout(fn, 100);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar ação ou paciente…" />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup heading="Ações rápidas">
          <CommandItem onSelect={() => runAction(onNewConsulta)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova consulta
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runAction(onNewAgendamento)}>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Novo agendamento
            <CommandShortcut>A</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runAction(onNewPaciente)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Novo paciente
          </CommandItem>
          {onPasteTranscript && (
            <CommandItem onSelect={() => runAction(onPasteTranscript)}>
              <ClipboardPaste className="mr-2 h-4 w-4" />
              Colar transcrição
            </CommandItem>
          )}
        </CommandGroup>
        <CommandGroup heading="Navegação">
          <CommandItem onSelect={() => runAction(() => navigate("/agenda"))}>
            <Search className="mr-2 h-4 w-4" />
            Agenda
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate("/consultas"))}>
            <Search className="mr-2 h-4 w-4" />
            Consultas
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate("/pacientes"))}>
            <Search className="mr-2 h-4 w-4" />
            Pacientes
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate("/noticias"))}>
            <Newspaper className="mr-2 h-4 w-4" />
            Notícias
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
