import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData } from "@/hooks/useAppData";
import { addTimeBlock, updateTimeBlock } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { TimeBlock } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editBlock?: TimeBlock | null;
  defaultDate?: string;
}

export function NewTimeBlockDialog({ open, onOpenChange, editBlock, defaultDate }: Props) {
  const data = useAppData();
  const { toast } = useToast();

  const [date, setDate] = useState(defaultDate ?? new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [reason, setReason] = useState("Almoço");
  const [recurrence, setRecurrence] = useState<string>("none");
  const [clinicianId, setClinicianId] = useState(data.clinicians[0]?.id ?? "");

  useEffect(() => {
    if (open && editBlock) {
      setDate(editBlock.date);
      setStartTime(editBlock.startTime);
      setEndTime(editBlock.endTime);
      setReason(editBlock.reason);
      setRecurrence(editBlock.recurrence);
      setClinicianId(editBlock.clinicianId);
    } else if (open) {
      setDate(defaultDate ?? new Date().toISOString().slice(0, 10));
      setStartTime("12:00");
      setEndTime("13:00");
      setReason("Almoço");
      setRecurrence("none");
      setClinicianId(data.clinicians[0]?.id ?? "");
    }
  }, [open, editBlock, defaultDate]);

  const canSave = date && startTime && endTime && reason.trim() && clinicianId;

  const handleSave = () => {
    if (!canSave) return;
    if (editBlock) {
      updateTimeBlock(editBlock.id, { date, startTime, endTime, reason, recurrence: recurrence as TimeBlock["recurrence"], clinicianId });
      toast({ title: "Bloqueio atualizado." });
    } else {
      addTimeBlock({ date, startTime, endTime, reason, recurrence: recurrence as TimeBlock["recurrence"], clinicianId });
      toast({ title: "Horário bloqueado." });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editBlock ? "Editar Bloqueio" : "Bloquear Horário"}</DialogTitle>
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
              <Label>Fim *</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Motivo *</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: Almoço, Férias, Reunião..." />
          </div>
          <div className="space-y-2">
            <Label>Recorrência</Label>
            <Select value={recurrence} onValueChange={setRecurrence}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Apenas este dia</SelectItem>
                <SelectItem value="daily">Diariamente</SelectItem>
                <SelectItem value="weekly">Semanalmente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Médico *</Label>
            <Select value={clinicianId} onValueChange={setClinicianId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {data.clinicians.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" disabled={!canSave} onClick={handleSave}>
            {editBlock ? "Salvar alterações" : "Bloquear horário"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
