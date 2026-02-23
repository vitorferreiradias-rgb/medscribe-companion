import { Plus, CalendarPlus, UserPlus, ClipboardPaste, Stethoscope, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface QuickActionsMenuProps {
  onNewConsulta: () => void;
  onNewAgendamento: () => void;
  onNewPaciente: () => void;
  onPasteTranscript?: () => void;
  onSmartAssistant?: () => void;
}

export function QuickActionsMenu({
  onNewConsulta,
  onNewAgendamento,
  onNewPaciente,
  onPasteTranscript,
  onSmartAssistant,
}: QuickActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-primary/[0.08]">
          <Plus className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={onNewConsulta}>
          <Stethoscope className="mr-2 h-4 w-4" />
          Nova consulta
          <span className="ml-auto text-xs text-muted-foreground">N</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onNewAgendamento}>
          <CalendarPlus className="mr-2 h-4 w-4" />
          Novo agendamento
          <span className="ml-auto text-xs text-muted-foreground">A</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onNewPaciente}>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo paciente
        </DropdownMenuItem>
        {onSmartAssistant && (
          <DropdownMenuItem onClick={onSmartAssistant}>
            <Sparkles className="mr-2 h-4 w-4" />
            One Click
          </DropdownMenuItem>
        )}
        {onPasteTranscript && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onPasteTranscript}>
              <ClipboardPaste className="mr-2 h-4 w-4" />
              Colar transcrição
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
