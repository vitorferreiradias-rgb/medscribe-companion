import { useState, useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";
import { NewEncounterDialog } from "./NewEncounterDialog";
import { NewScheduleDialog } from "./NewScheduleDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData } from "@/hooks/useAppData";
import { addPatient } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

export function AppLayout() {
  const location = useLocation();
  const data = useAppData();
  const { toast } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNewConsulta, setShowNewConsulta] = useState(false);
  const [showNewPaciente, setShowNewPaciente] = useState(false);
  const [showNewSchedule, setShowNewSchedule] = useState(false);

  // New patient form
  const [patName, setPatName] = useState("");
  const [patBirth, setPatBirth] = useState("");
  const [patSex, setPatSex] = useState("NA");
  const [patPhone, setPatPhone] = useState("");

  const handleNewPaciente = () => {
    if (!patName.trim()) return;
    addPatient({ name: patName, birthDate: patBirth || undefined, sex: patSex as any, phone: patPhone || undefined });
    toast({ title: "Paciente adicionado." });
    setShowNewPaciente(false);
    setPatName(""); setPatBirth(""); setPatSex("NA"); setPatPhone("");
  };

  const onNewConsulta = useCallback(() => setShowNewConsulta(true), []);
  const onNewPaciente = useCallback(() => setShowNewPaciente(true), []);
  const onNewSchedule = useCallback(() => setShowNewSchedule(true), []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <Topbar
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onNewConsulta={onNewConsulta}
            onNewPaciente={onNewPaciente}
            onNewAgendamento={onNewSchedule}
          />
          <div className="flex-1 px-5 py-5 md:px-6 md:py-6 max-w-[1440px]">
            {location.pathname.startsWith("/agenda") ? (
              <Outlet context={{ currentDate, onNewSchedule }} />
            ) : (
              <Outlet />
            )}
          </div>
        </SidebarInset>
      </div>

      <NewEncounterDialog open={showNewConsulta} onOpenChange={setShowNewConsulta} />
      <NewScheduleDialog open={showNewSchedule} onOpenChange={setShowNewSchedule} defaultDate={currentDate.toISOString().slice(0, 10)} />

      {/* Quick new patient dialog */}
      <Dialog open={showNewPaciente} onOpenChange={setShowNewPaciente}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo Paciente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nome *</Label><Input value={patName} onChange={(e) => setPatName(e.target.value)} placeholder="Nome completo" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Nascimento</Label><Input type="date" value={patBirth} onChange={(e) => setPatBirth(e.target.value)} /></div>
              <div className="space-y-2"><Label>Sexo</Label>
                <Select value={patSex} onValueChange={setPatSex}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                    <SelectItem value="O">Outro</SelectItem>
                    <SelectItem value="NA">Não informado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Telefone</Label><Input value={patPhone} onChange={(e) => setPatPhone(e.target.value)} placeholder="(11) 99999-0000" /></div>
            <Button className="w-full" disabled={!patName.trim()} onClick={handleNewPaciente}>Adicionar paciente</Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
