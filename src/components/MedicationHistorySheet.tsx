import { useState, useMemo } from "react";
import { Pill, Search, ChevronDown, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getMedicationHistoryForPatient, addMedicationEvent } from "@/lib/medication-history";
import { formatDateBR } from "@/lib/format";
import type { MedicationEvent } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
}

const statusConfig: Record<MedicationEvent["status"], { label: string; className: string }> = {
  prescrito: { label: "Prescrito", className: "bg-success/15 text-success border-success/30" },
  suspenso: { label: "Suspenso", className: "bg-destructive/15 text-destructive border-destructive/30" },
  nao_renovado: { label: "Não renovado", className: "bg-warning/15 text-warning border-warning/30" },
};

export function MedicationHistorySheet({ open, onOpenChange, patientId }: Props) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<MedicationEvent[]>(() => getMedicationHistoryForPatient(patientId));
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<MedicationEvent["status"]>("suspenso");
  const [newNote, setNewNote] = useState("");

  const refreshEvents = () => setEvents(getMedicationHistoryForPatient(patientId));

  const grouped = useMemo(() => {
    const filtered = events.filter((e) =>
      !search || e.medicationName.toLowerCase().includes(search.toLowerCase())
    );
    const map = new Map<string, MedicationEvent[]>();
    for (const e of filtered) {
      const key = e.medicationName;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries());
  }, [events, search]);

  const handleAddEvent = (medicationName: string) => {
    addMedicationEvent({
      patientId,
      medicationName,
      date: new Date().toISOString(),
      status: newStatus,
      note: newNote || undefined,
    });
    refreshEvents();
    setAddingFor(null);
    setNewNote("");
    setNewStatus("suspenso");
    toast({ title: `Evento registrado para ${medicationName}.` });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            Histórico de medicações
          </SheetTitle>
          <SheetDescription>Linha do tempo por medicamento com observações</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filtrar por medicamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum histórico de medicação encontrado.
            </p>
          ) : (
            <div className="space-y-2">
              {grouped.map(([name, medEvents]) => (
                <Collapsible key={name} defaultOpen>
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border px-3 py-2.5 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Pill className="h-3.5 w-3.5 text-primary" />
                      <span className="text-sm font-semibold">{name}</span>
                      <Badge variant="outline" className="text-[9px] h-4">{medEvents.length}</Badge>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 pr-2 pt-1 space-y-1">
                    {medEvents.map((ev) => {
                      const cfg = statusConfig[ev.status];
                      return (
                        <div key={ev.id} className="flex items-start gap-3 py-1.5">
                          <div className="mt-1 h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-muted-foreground">{formatDateBR(ev.date)}</span>
                              <Badge variant="outline" className={`text-[9px] h-4 ${cfg.className}`}>
                                {cfg.label}
                              </Badge>
                            </div>
                            {ev.note && (
                              <p className="text-xs text-muted-foreground mt-0.5 italic">"{ev.note}"</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {addingFor === name ? (
                      <div className="space-y-2 py-2 pl-5">
                        <Select value={newStatus} onValueChange={(v) => setNewStatus(v as MedicationEvent["status"])}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="suspenso">Suspenso</SelectItem>
                            <SelectItem value="nao_renovado">Não renovado</SelectItem>
                            <SelectItem value="prescrito">Prescrito</SelectItem>
                          </SelectContent>
                        </Select>
                        <Textarea
                          placeholder="Observação (opcional)..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          className="min-h-[60px] text-xs"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" className="h-7 text-xs" onClick={() => handleAddEvent(name)}>Salvar</Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setAddingFor(null)}>Cancelar</Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground ml-5 mt-1"
                        onClick={() => setAddingFor(name)}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Registrar evento
                      </Button>
                    )}
                    <Separator className="mt-1" />
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
