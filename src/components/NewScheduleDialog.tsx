import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData } from "@/hooks/useAppData";
import { addScheduleEvent, updateScheduleEvent } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { ScheduleEvent } from "@/types";
import { toLocalDateStr } from "@/lib/format";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editEvent?: ScheduleEvent | null;
  defaultDate?: string;
  defaultPatientId?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
}

export function NewScheduleDialog({ open, onOpenChange, editEvent, defaultDate, defaultPatientId, defaultStartTime, defaultEndTime }: Props) {
  const data = useAppData();
  const { toast } = useToast();

  const [date, setDate] = useState(defaultDate ?? toLocalDateStr());
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("08:30");
  const [patientId, setPatientId] = useState("");
  const [clinicianId, setClinicianId] = useState(data.clinicians[0]?.id ?? "");
  const [type, setType] = useState<string>("primeira");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open && editEvent) {
      setDate(editEvent.date);
      setStartTime(editEvent.startTime);
      setEndTime(editEvent.endTime ?? "");
      setPatientId(editEvent.patientId);
      setClinicianId(editEvent.clinicianId);
      setType(editEvent.type);
      setNotes(editEvent.notes ?? "");
    } else if (open) {
      setDate(defaultDate ?? toLocalDateStr());
      setStartTime(defaultStartTime ?? "08:00");
      setEndTime(defaultEndTime ?? "08:30");
      setPatientId(defaultPatientId ?? "");
      setClinicianId(data.clinicians[0]?.id ?? "");
      setType("primeira");
      setNotes("");
    }
  }, [open, editEvent, defaultDate, defaultPatientId, defaultStartTime, defaultEndTime]);

  const hasConflict = () => {
    if (!date || !startTime) return false;
    const blocks = (data.timeBlocks ?? []).filter((b) => {
      if (clinicianId && b.clinicianId !== clinicianId) return false;
      if (b.recurrence === "daily") return true;
      if (b.recurrence === "weekly") {
        const blockDay = new Date(b.date + "T12:00:00").getDay();
        return new Date(date + "T12:00:00").getDay() === blockDay;
      }
      return b.date === date;
    });
    return blocks.some((b) => startTime < b.endTime && (endTime || "23:59") > b.startTime);
  };

  const conflict = hasConflict();
  const canSave = date && startTime && patientId && clinicianId;

  const handleSave = () => {
    if (!canSave) return;
    if (editEvent) {
      updateScheduleEvent(editEvent.id, {
        date, startTime, endTime: endTime || undefined, patientId, clinicianId,
        type: type as ScheduleEvent["type"], notes: notes || undefined,
      });
      toast({ title: "Agendamento atualizado." });
    } else {
      addScheduleEvent({
        date, startTime, endTime: endTime || undefined, patientId, clinicianId,
        type: type as ScheduleEvent["type"], status: "scheduled", notes: notes || undefined,
      });
      toast({ title: "Agendamento criado." });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editEvent ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Início *</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fim</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Paciente *</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {data.patients.filter((p) => !p.archived).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Médico *</Label>
            <Select value={clinicianId} onValueChange={setClinicianId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {data.clinicians.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="primeira">Primeira consulta</SelectItem>
                <SelectItem value="retorno">Retorno</SelectItem>
                <SelectItem value="procedimento">Procedimento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações opcionais..." rows={2} />
          </div>
          {conflict && (
            <p className="text-xs text-warning flex items-center gap-1.5">
              ⚠ Este horário conflita com um bloqueio existente
            </p>
          )}
          <Button className="w-full" disabled={!canSave} onClick={handleSave}>
            {editEvent ? "Salvar alterações" : "Criar agendamento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
