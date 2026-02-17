import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft, Edit3, Save, X, MoreVertical, Trash2,
  Plus, CalendarIcon, Heart, MapPin, Users, Activity, Megaphone
} from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import { updatePatient, deletePatient } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Patient } from "@/types";

// ---- Masks ----
function maskCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskCEP(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.replace(/(\d{5})(\d)/, "$1-$2");
}

// ---- Draft type ----
interface PatientDraft {
  name: string;
  birthDate: string;
  sex: string;
  cpf: string;
  rg: string;
  phone: string;
  addressLine: string;
  cep: string;
  children: string[];
  petName: string;
  referralSource: string;
  diagnoses: string[];
  drugAllergies: string[];
  notes: string;
}

function patientToDraft(p: Patient): PatientDraft {
  return {
    name: p.name ?? "",
    birthDate: p.birthDate ?? "",
    sex: p.sex ?? "NA",
    cpf: p.cpf ?? "",
    rg: p.rg ?? "",
    phone: p.phone ?? "",
    addressLine: p.addressLine ?? "",
    cep: p.cep ?? "",
    children: [...(p.children ?? [])],
    petName: p.petName ?? "",
    referralSource: p.referralSource ?? "",
    diagnoses: [...(p.diagnoses ?? [])],
    drugAllergies: [...(p.drugAllergies ?? [])],
    notes: p.notes ?? "",
  };
}

// ---- Field display ----
function FieldView({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <p className="text-sm min-h-[1.5rem]">{value || "—"}</p>
    </div>
  );
}

// ---- Component ----
export default function PacienteDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const data = useAppData();
  const { toast } = useToast();

  const patient = useMemo(() => data.patients.find((p) => p.id === id), [data.patients, id]);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PatientDraft>(() => patient ? patientToDraft(patient) : patientToDraft({} as Patient));
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [newDiagnosis, setNewDiagnosis] = useState("");
  const [newAllergy, setNewAllergy] = useState("");

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Users className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Paciente não encontrado</h2>
        <Button variant="outline" onClick={() => navigate("/pacientes")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    );
  }

  const startEdit = () => { setDraft(patientToDraft(patient)); setEditing(true); };
  const cancelEdit = () => { setDraft(patientToDraft(patient)); setEditing(false); };

  const handleSave = () => {
    if (!draft.name.trim()) return;
    updatePatient(patient.id, {
      name: draft.name,
      birthDate: draft.birthDate || undefined,
      sex: (draft.sex as Patient["sex"]) || undefined,
      cpf: draft.cpf || undefined,
      rg: draft.rg || undefined,
      phone: draft.phone || undefined,
      addressLine: draft.addressLine || undefined,
      cep: draft.cep || undefined,
      children: draft.children.length ? draft.children : undefined,
      petName: draft.petName || undefined,
      referralSource: draft.referralSource || undefined,
      diagnoses: draft.diagnoses.length ? draft.diagnoses : undefined,
      drugAllergies: draft.drugAllergies.length ? draft.drugAllergies : undefined,
      notes: draft.notes || undefined,
    });
    toast({ title: "Paciente atualizado com sucesso." });
    setEditing(false);
  };

  const handleDelete = () => {
    deletePatient(patient.id);
    toast({ title: "Paciente excluído." });
    navigate("/pacientes");
  };

  const set = (field: keyof PatientDraft, value: any) => setDraft((d) => ({ ...d, [field]: value }));

  // Children helpers
  const addChild = () => set("children", [...draft.children, ""]);
  const removeChild = (i: number) => set("children", draft.children.filter((_, idx) => idx !== i));
  const updateChild = (i: number, v: string) => {
    const c = [...draft.children];
    c[i] = v;
    set("children", c);
  };

  // Chips helpers
  const addChip = (field: "diagnoses" | "drugAllergies", value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    set(field, [...draft[field], value.trim()]);
    setter("");
  };
  const removeChip = (field: "diagnoses" | "drugAllergies", i: number) => {
    set(field, draft[field].filter((_, idx) => idx !== i));
  };

  const birthDateObj = draft.birthDate && isValid(parseISO(draft.birthDate)) ? parseISO(draft.birthDate) : undefined;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate("/pacientes")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
          {patient.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold truncate">{patient.name}</h1>
          <p className="text-xs text-muted-foreground">Paciente</p>
        </div>
        <Badge variant={patient.archived ? "secondary" : "default"} className="shrink-0">
          {patient.archived ? "Arquivado" : "Ativo"}
        </Badge>

        {!editing ? (
          <Button size="sm" onClick={startEdit}><Edit3 className="mr-1.5 h-3.5 w-3.5" /> Editar</Button>
        ) : (
          <div className="flex gap-1.5">
            <Button size="sm" onClick={handleSave} disabled={!draft.name.trim()}><Save className="mr-1.5 h-3.5 w-3.5" /> Salvar</Button>
            <Button size="sm" variant="outline" onClick={cancelEdit}><X className="mr-1.5 h-3.5 w-3.5" /> Cancelar</Button>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConfirm(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Excluir paciente
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* A) Identificação */}
      <Card className="glass-card">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Identificação</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {editing ? (
            <>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Nome *</Label>
                <Input value={draft.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Data de nascimento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !birthDateObj && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {birthDateObj ? format(birthDateObj, "dd/MM/yyyy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={birthDateObj}
                      onSelect={(d) => set("birthDate", d ? format(d, "yyyy-MM-dd") : "")}
                      disabled={(d) => d > new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label>Sexo</Label>
                <Select value={draft.sex} onValueChange={(v) => set("sex", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                    <SelectItem value="O">Outro</SelectItem>
                    <SelectItem value="NA">Não informado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>CPF</Label>
                <Input value={draft.cpf} onChange={(e) => set("cpf", maskCPF(e.target.value))} placeholder="000.000.000-00" />
              </div>
              <div className="space-y-1.5">
                <Label>RG</Label>
                <Input value={draft.rg} onChange={(e) => set("rg", e.target.value)} placeholder="RG" />
              </div>
            </>
          ) : (
            <>
              <FieldView label="Nome" value={patient.name} />
              <FieldView label="Data de nascimento" value={patient.birthDate ? format(parseISO(patient.birthDate), "dd/MM/yyyy") : undefined} />
              <FieldView label="Sexo" value={{ M: "Masculino", F: "Feminino", O: "Outro", NA: "Não informado" }[patient.sex ?? "NA"]} />
              <FieldView label="CPF" value={patient.cpf} />
              <FieldView label="RG" value={patient.rg} />
            </>
          )}
        </CardContent>
      </Card>

      {/* B) Contato e Endereço */}
      <Card className="glass-card">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Contato e Endereço</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {editing ? (
            <>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input value={draft.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(11) 99999-0000" />
              </div>
              <div className="space-y-1.5">
                <Label>CEP</Label>
                <Input value={draft.cep} onChange={(e) => set("cep", maskCEP(e.target.value))} placeholder="00000-000" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Endereço</Label>
                <Input value={draft.addressLine} onChange={(e) => set("addressLine", e.target.value)} placeholder="Logradouro, número, complemento" />
              </div>
            </>
          ) : (
            <>
              <FieldView label="Telefone" value={patient.phone} />
              <FieldView label="CEP" value={patient.cep} />
              <FieldView label="Endereço" value={patient.addressLine} />
            </>
          )}
        </CardContent>
      </Card>

      {/* C) Família */}
      <Card className="glass-card">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2"><Heart className="h-4 w-4 text-primary" /> Família</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          {editing ? (
            <>
              <div className="space-y-2">
                <Label>Filhos</Label>
                {draft.children.map((c, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input value={c} onChange={(e) => updateChild(i, e.target.value)} placeholder="Nome do filho(a)" className="flex-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeChild(i)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addChild}><Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar filho(a)</Button>
              </div>
              <div className="space-y-1.5">
                <Label>Animal de estimação</Label>
                <Input value={draft.petName} onChange={(e) => set("petName", e.target.value)} placeholder="Nome do animal" />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Filhos</Label>
                {patient.children?.length ? (
                  <div className="flex flex-wrap gap-1.5">{patient.children.map((c, i) => <Badge key={i} variant="secondary">{c}</Badge>)}</div>
                ) : <p className="text-sm">—</p>}
              </div>
              <FieldView label="Animal de estimação" value={patient.petName} />
            </>
          )}
        </CardContent>
      </Card>

      {/* D) Origem */}
      <Card className="glass-card">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2"><Megaphone className="h-4 w-4 text-primary" /> Origem</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {editing ? (
            <div className="space-y-1.5 max-w-xs">
              <Label>Como conheceu a clínica?</Label>
              <Select value={draft.referralSource || "none"} onValueChange={(v) => set("referralSource", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não informado</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Google">Google</SelectItem>
                  <SelectItem value="Indicação">Indicação</SelectItem>
                  <SelectItem value="Evento">Evento</SelectItem>
                  <SelectItem value="Retorno">Retorno</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <FieldView label="Como conheceu a clínica?" value={patient.referralSource} />
          )}
        </CardContent>
      </Card>

      {/* E) Saúde */}
      <Card className="glass-card">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Saúde</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          {/* Diagnósticos */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Diagnósticos</Label>
            <div className="flex flex-wrap gap-1.5">
              {draft.diagnoses.map((d, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {d}
                  {editing && (
                    <button onClick={() => removeChip("diagnoses", i)} className="ml-0.5 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
              {!editing && draft.diagnoses.length === 0 && <p className="text-sm">—</p>}
            </div>
            {editing && (
              <div className="flex gap-2 max-w-sm">
                <Input
                  value={newDiagnosis}
                  onChange={(e) => setNewDiagnosis(e.target.value)}
                  placeholder="Novo diagnóstico"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChip("diagnoses", newDiagnosis, setNewDiagnosis); } }}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={() => addChip("diagnoses", newDiagnosis, setNewDiagnosis)}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Alergias */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Alergias medicamentosas</Label>
            <div className="flex flex-wrap gap-1.5">
              {draft.drugAllergies.map((a, i) => (
                <Badge key={i} variant="outline" className="gap-1 border-destructive/40 text-destructive">
                  {a}
                  {editing && (
                    <button onClick={() => removeChip("drugAllergies", i)} className="ml-0.5 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
              {!editing && draft.drugAllergies.length === 0 && <p className="text-sm">—</p>}
            </div>
            {editing && (
              <div className="flex gap-2 max-w-sm">
                <Input
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="Nova alergia"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChip("drugAllergies", newAllergy, setNewAllergy); } }}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={() => addChip("drugAllergies", newAllergy, setNewAllergy)}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir paciente?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Todos os dados deste paciente serão removidos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
