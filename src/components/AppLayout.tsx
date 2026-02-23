import { useState, useCallback } from "react";
import { Plus, X } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";
import { CommandBar } from "./CommandBar";
import { NewScheduleDialog } from "./NewScheduleDialog";
import { NewTimeBlockDialog } from "./NewTimeBlockDialog";
import { SmartPrescriptionDialog } from "./smart-prescription/SmartPrescriptionDialog";
import { SmartAssistantDialog } from "./SmartAssistantDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData } from "@/hooks/useAppData";
import { addPatient } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = useAppData();
  const { toast } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNewPaciente, setShowNewPaciente] = useState(false);
  const [showNewSchedule, setShowNewSchedule] = useState(false);
  const [showCommandBar, setShowCommandBar] = useState(false);
  const [showTimeBlock, setShowTimeBlock] = useState(false);
  const [showSmartPrescription, setShowSmartPrescription] = useState(false);
  const [smartPrescriptionText, setSmartPrescriptionText] = useState("");
  const [showAssistant, setShowAssistant] = useState(false);
  const [editScheduleEvent, setEditScheduleEvent] = useState<import("@/types").ScheduleEvent | null>(null);

  // Schedule defaults from assistant
  const [scheduleDefaults, setScheduleDefaults] = useState<{
    patientId?: string;
    date?: string;
    startTime?: string;
  } | null>(null);

  // New patient form
  const [patName, setPatName] = useState("");
  const [patBirth, setPatBirth] = useState("");
  const [patSex, setPatSex] = useState("NA");
  const [patPhone, setPatPhone] = useState("");
  const [patCpf, setPatCpf] = useState("");
  const [patRg, setPatRg] = useState("");
  const [patEmail, setPatEmail] = useState("");
  const [patCep, setPatCep] = useState("");
  const [patAddress, setPatAddress] = useState("");
  const [patNotes, setPatNotes] = useState("");
  const [patPetName, setPatPetName] = useState("");
  const [patChildren, setPatChildren] = useState<string[]>([]);
  const [patReferral, setPatReferral] = useState("");

  const maskCpf = (v: string) => v.replace(/\D/g, "").slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  const maskCep = (v: string) => v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");

  const resetPatientForm = () => {
    setPatName(""); setPatBirth(""); setPatSex("NA"); setPatPhone("");
    setPatCpf(""); setPatRg(""); setPatEmail(""); setPatCep(""); setPatAddress(""); setPatNotes("");
    setPatPetName(""); setPatChildren([]); setPatReferral("");
  };

  const handleNewPaciente = () => {
    if (!patName.trim()) return;
    addPatient({
      name: patName,
      birthDate: patBirth || undefined,
      sex: patSex as any,
      phone: patPhone || undefined,
      cpf: patCpf.replace(/\D/g, "") || undefined,
      rg: patRg || undefined,
      email: patEmail || undefined,
      cep: patCep.replace(/\D/g, "") || undefined,
      addressLine: patAddress || undefined,
      notes: patNotes || undefined,
      petName: patPetName || undefined,
      children: patChildren.length > 0 ? patChildren : undefined,
      referralSource: patReferral || undefined,
    });
    toast({ title: "Paciente adicionado." });
    setShowNewPaciente(false);
    resetPatientForm();
  };

  const onNewConsulta = useCallback(() => navigate("/consultas/nova"), [navigate]);
  const onNewPaciente = useCallback(() => setShowNewPaciente(true), []);
  const onNewSchedule = useCallback(() => { setEditScheduleEvent(null); setScheduleDefaults(null); setShowNewSchedule(true); }, []);
  const onOpenCommandBar = useCallback(() => setShowCommandBar(true), []);
  const onNewTimeBlock = useCallback(() => setShowTimeBlock(true), []);
  const onSmartAssistant = useCallback(() => setShowAssistant(true), []);
  const onSmartPrescription = useCallback((text?: string) => {
    setSmartPrescriptionText(text || "");
    setShowSmartPrescription(true);
  }, []);
  const onReschedule = useCallback((eventId: string) => {
    const evt = data.scheduleEvents?.find((e) => e.id === eventId);
    if (evt) { setEditScheduleEvent(evt); setShowNewSchedule(true); }
  }, [data.scheduleEvents]);

  // Assistant callbacks
  const handleAssistantSchedule = useCallback((defaults: { patientId?: string; date?: string; startTime?: string }) => {
    setScheduleDefaults(defaults);
    setEditScheduleEvent(null);
    setShowNewSchedule(true);
  }, []);

  const handleAssistantPrescription = useCallback((text: string) => {
    setSmartPrescriptionText(text);
    setShowSmartPrescription(true);
  }, []);

  const handleAssistantNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

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
            onOpenCommandBar={onOpenCommandBar}
            onSmartAssistant={onSmartAssistant}
          />
          <div className="flex-1 px-5 py-5 md:px-6 md:py-6 max-w-[1440px]">
            {location.pathname.startsWith("/agenda") ? (
              <Outlet context={{ currentDate, onNewSchedule, onReschedule, onNewTimeBlock, onSmartAssistant }} />
            ) : (
              <Outlet />
            )}
          </div>
        </SidebarInset>
      </div>

      <CommandBar
        open={showCommandBar}
        onOpenChange={setShowCommandBar}
        onNewConsulta={onNewConsulta}
        onNewAgendamento={onNewSchedule}
        onNewPaciente={onNewPaciente}
        onSmartAssistant={onSmartAssistant}
      />

      <NewScheduleDialog
        open={showNewSchedule}
        onOpenChange={(v) => { setShowNewSchedule(v); if (!v) { setEditScheduleEvent(null); setScheduleDefaults(null); } }}
        editEvent={editScheduleEvent}
        defaultDate={scheduleDefaults?.date || currentDate.toISOString().slice(0, 10)}
        defaultPatientId={scheduleDefaults?.patientId}
        defaultStartTime={scheduleDefaults?.startTime}
      />
      <NewTimeBlockDialog open={showTimeBlock} onOpenChange={setShowTimeBlock} defaultDate={currentDate.toISOString().slice(0, 10)} />

      {/* Quick new patient dialog */}
      <Dialog open={showNewPaciente} onOpenChange={(v) => { setShowNewPaciente(v); if (!v) resetPatientForm(); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>CPF</Label><Input value={patCpf} onChange={(e) => setPatCpf(maskCpf(e.target.value))} placeholder="000.000.000-00" /></div>
              <div className="space-y-2"><Label>RG</Label><Input value={patRg} onChange={(e) => setPatRg(e.target.value)} placeholder="RG" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Telefone</Label><Input value={patPhone} onChange={(e) => setPatPhone(e.target.value)} placeholder="(11) 99999-0000" /></div>
              <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={patEmail} onChange={(e) => setPatEmail(e.target.value)} placeholder="email@exemplo.com" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>CEP</Label><Input value={patCep} onChange={(e) => setPatCep(maskCep(e.target.value))} placeholder="00000-000" /></div>
              <div className="space-y-2"><Label>Endereço</Label><Input value={patAddress} onChange={(e) => setPatAddress(e.target.value)} placeholder="Rua, número, bairro" /></div>
            </div>
            <div className="space-y-2"><Label>Observações</Label><Textarea value={patNotes} onChange={(e) => setPatNotes(e.target.value)} placeholder="Alergias, condições especiais, etc." rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Animal de estimação</Label><Input value={patPetName} onChange={(e) => setPatPetName(e.target.value)} placeholder="Nome do pet" /></div>
              <div className="space-y-2"><Label>Como conheceu a clínica?</Label>
                <Select value={patReferral} onValueChange={setPatReferral}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Google">Google</SelectItem>
                    <SelectItem value="Indicação">Indicação</SelectItem>
                    <SelectItem value="Evento">Evento</SelectItem>
                    <SelectItem value="Retorno">Retorno</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Filhos</Label>
              <div className="space-y-2">
                {patChildren.map((child, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={child} onChange={(e) => { const c = [...patChildren]; c[i] = e.target.value; setPatChildren(c); }} placeholder={`Nome do filho(a) ${i + 1}`} />
                    <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => setPatChildren(patChildren.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setPatChildren([...patChildren, ""])}><Plus className="h-3.5 w-3.5" />Adicionar filho(a)</Button>
              </div>
            </div>
            <Button className="w-full" disabled={!patName.trim()} onClick={handleNewPaciente}>Adicionar paciente</Button>
          </div>
        </DialogContent>
      </Dialog>

      <SmartPrescriptionDialog
        open={showSmartPrescription}
        onOpenChange={setShowSmartPrescription}
        initialText={smartPrescriptionText}
      />

      <SmartAssistantDialog
        open={showAssistant}
        onOpenChange={setShowAssistant}
        onSchedule={handleAssistantSchedule}
        onReschedule={onReschedule}
        onPrescription={handleAssistantPrescription}
        onNavigate={handleAssistantNavigate}
      />
    </SidebarProvider>
  );
}
