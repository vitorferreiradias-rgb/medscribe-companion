import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO, isValid, subDays, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft, Edit3, Save, X, MoreVertical, Trash2,
  Plus, CalendarIcon, Heart, MapPin, Users, Activity, Megaphone,
  AlertTriangle, FileText, Search, Copy, Clock, Stethoscope, FolderOpen,
  Camera, ImageIcon, Eye, ZoomIn, TrendingUp, Weight, StickyNote, Sparkles, Loader2,
} from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import { updatePatient, deletePatient, duplicateEncounter, deleteEncounter } from "@/lib/store";
import { useEvolutionPhotos, useAddEvolutionPhoto, useDeleteEvolutionPhoto } from "@/hooks/useSupabaseData";
import { EvolutionPhotoImage } from "@/components/EvolutionPhotoImage";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/StatusBadge";

import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Patient, PatientDocument, BeforeAfterPhoto, EvolutionPhoto } from "@/types";
import { formatDateTimeBR } from "@/lib/format";

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
  email: string;
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
    email: p.email ?? "",
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

function FieldView({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <p className="text-sm min-h-[1.5rem]">{value || "—"}</p>
    </div>
  );
}

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
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
  const [deleteEncId, setDeleteEncId] = useState<string | null>(null);

  // Tab Diagnósticos / Alergias standalone editing
  const [tabNewDiagnosis, setTabNewDiagnosis] = useState("");
  const [tabNewAllergy, setTabNewAllergy] = useState("");

  // Tab Consultas filters
  const [consultaFilter, setConsultaFilter] = useState<"all" | "7d" | "30d">("all");
  const [consultaStatus, setConsultaStatus] = useState<"all" | "draft" | "final">("all");
  const [consultaSearch, setConsultaSearch] = useState("");

  // Tab Documentos
  const [showDocForm, setShowDocForm] = useState(false);
  const [docName, setDocName] = useState("");
  const [docDate, setDocDate] = useState("");
  const [docType, setDocType] = useState<PatientDocument["type"]>("exame");

  // Tab Evolução (Evolution Timeline) - Supabase
  const [photoLabel, setPhotoLabel] = useState("");
  const [photoDate, setPhotoDate] = useState("");
  const [photoNotes, setPhotoNotes] = useState("");
  const [photoWeight, setPhotoWeight] = useState("");
  const [photoAngle, setPhotoAngle] = useState("frontal");
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [compareIds, setCompareIds] = useState<[string, string] | null>(null);
  const [zoomPhotoId, setZoomPhotoId] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);

  const { data: dbEvolutionPhotos = [] } = useEvolutionPhotos(id);
  const addEvolutionPhotoMutation = useAddEvolutionPhoto();
  const deleteEvolutionPhotoMutation = useDeleteEvolutionPhoto();

  const handleAddEvolutionPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !patient || !id) return;
    addEvolutionPhotoMutation.mutate({
      patientId: id,
      file,
      label: photoLabel || "Registro",
      date: photoDate || format(new Date(), "yyyy-MM-dd"),
      notes: photoNotes || undefined,
      weight: photoWeight ? parseFloat(photoWeight) : undefined,
      angle: photoAngle,
    });
    setPhotoLabel("");
    setPhotoDate("");
    setPhotoNotes("");
    setPhotoWeight("");
    setPhotoAngle("frontal");
    setShowPhotoForm(false);
    e.target.value = "";
  };

  const handleRemoveEvolutionPhoto = (photoId: string, imagePath: string) => {
    if (!id) return;
    deleteEvolutionPhotoMutation.mutate({ id: photoId, imagePath, patientId: id });
    if (compareIds && (compareIds[0] === photoId || compareIds[1] === photoId)) setCompareIds(null);
    if (zoomPhotoId === photoId) setZoomPhotoId(null);
  };

  const toggleCompare = (photoId: string) => {
    if (!compareIds) {
      setCompareIds([photoId, ""]);
    } else if (compareIds[0] === photoId) {
      setCompareIds(null);
    } else if (!compareIds[1]) {
      setCompareIds([compareIds[0], photoId]);
    } else {
      setCompareIds([photoId, ""]);
    }
  };

  const evolutionPhotos = useMemo(() =>
    [...dbEvolutionPhotos].sort((a, b) => a.date.localeCompare(b.date)),
    [dbEvolutionPhotos]
  );

  const comparePhotos = useMemo(() => {
    if (!compareIds || !compareIds[1]) return null;
    const a = evolutionPhotos.find(p => p.id === compareIds[0]);
    const b = evolutionPhotos.find(p => p.id === compareIds[1]);
    if (!a || !b) return null;
    return a.date <= b.date ? [a, b] as const : [b, a] as const;
  }, [compareIds, evolutionPhotos]);

  const handleAiCompare = async () => {
    if (!comparePhotos) return;
    setAiAnalysisLoading(true);
    setAiAnalysis(null);
    try {
      const angleLabels: Record<string, string> = { frontal: "Frontal", posterior: "Posterior", lateral_direito: "Lateral Direito", lateral_esquerdo: "Lateral Esquerdo", tres_quartos: "¾" };
      const weightContext = [
        comparePhotos[0].weight ? `Peso antes: ${comparePhotos[0].weight}kg` : "",
        comparePhotos[1].weight ? `Peso depois: ${comparePhotos[1].weight}kg` : "",
        (comparePhotos[0] as any).angle ? `Ângulo foto antes (informado pelo médico): ${angleLabels[(comparePhotos[0] as any).angle] || (comparePhotos[0] as any).angle}` : "",
        (comparePhotos[1] as any).angle ? `Ângulo foto depois (informado pelo médico): ${angleLabels[(comparePhotos[1] as any).angle] || (comparePhotos[1] as any).angle}` : "",
        comparePhotos[0].notes ? `Notas antes: ${comparePhotos[0].notes}` : "",
        comparePhotos[1].notes ? `Notas depois: ${comparePhotos[1].notes}` : "",
      ].filter(Boolean).join(". ");

      const { data, error } = await supabase.functions.invoke("evolution-compare", {
        body: {
          beforeImagePath: comparePhotos[0].image_path,
          afterImagePath: comparePhotos[1].image_path,
          patientContext: weightContext || undefined,
        },
      });
      if (error) throw error;
      setAiAnalysis(data?.analysis || "Não foi possível gerar a análise.");
    } catch (err: any) {
      toast({ title: "Erro na análise com IA", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  const now = new Date();

  const patientEncounters = useMemo(() =>
    data.encounters
      .filter((e) => e.patientId === id)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()),
    [data.encounters, id]
  );

  const nextSchedule = useMemo(() => {
    if (!data.scheduleEvents || !id) return null;
    return data.scheduleEvents
      .filter((s) => s.patientId === id && isAfter(parseISO(`${s.date}T${s.startTime}`), now))
      .sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime())[0] ?? null;
  }, [data.scheduleEvents, id]);

  const filteredEncounters = useMemo(() => {
    let list = patientEncounters;
    if (consultaFilter === "7d") list = list.filter((e) => isAfter(parseISO(e.startedAt), subDays(now, 7)));
    if (consultaFilter === "30d") list = list.filter((e) => isAfter(parseISO(e.startedAt), subDays(now, 30)));
    if (consultaStatus !== "all") list = list.filter((e) => consultaStatus === "draft" ? e.status === "draft" : e.status === "final");
    if (consultaSearch.trim()) {
      const q = consultaSearch.toLowerCase();
      list = list.filter((e) => {
        const note = data.notes.find((n) => n.encounterId === e.id);
        const noteText = note?.sections.map((s) => s.content).join(" ").toLowerCase() ?? "";
        return (e.chiefComplaint?.toLowerCase().includes(q)) || noteText.includes(q);
      });
    }
    return list;
  }, [patientEncounters, consultaFilter, consultaStatus, consultaSearch, data.notes]);

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

  const lastEncounter = patientEncounters[0] ?? null;

  // Edit helpers
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
      email: draft.email || undefined,
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

  const addChild = () => set("children", [...draft.children, ""]);
  const removeChild = (i: number) => set("children", draft.children.filter((_, idx) => idx !== i));
  const updateChild = (i: number, v: string) => {
    const c = [...draft.children];
    c[i] = v;
    set("children", c);
  };

  const addChip = (field: "diagnoses" | "drugAllergies", value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    set(field, [...draft[field], value.trim()]);
    setter("");
  };
  const removeChip = (field: "diagnoses" | "drugAllergies", i: number) => {
    set(field, draft[field].filter((_, idx) => idx !== i));
  };

  // Standalone chip add (for tabs without edit mode)
  const addDiagnosisStandalone = (value: string) => {
    if (!value.trim()) return;
    const updated = [...(patient.diagnoses ?? []), value.trim()];
    updatePatient(patient.id, { diagnoses: updated });
    setTabNewDiagnosis("");
    toast({ title: "Diagnóstico adicionado." });
  };
  const removeDiagnosisStandalone = (i: number) => {
    const updated = (patient.diagnoses ?? []).filter((_, idx) => idx !== i);
    updatePatient(patient.id, { diagnoses: updated.length ? updated : undefined });
    toast({ title: "Diagnóstico removido." });
  };
  const addAllergyStandalone = (value: string) => {
    if (!value.trim()) return;
    const updated = [...(patient.drugAllergies ?? []), value.trim()];
    updatePatient(patient.id, { drugAllergies: updated });
    setTabNewAllergy("");
    toast({ title: "Alergia adicionada." });
  };
  const removeAllergyStandalone = (i: number) => {
    const updated = (patient.drugAllergies ?? []).filter((_, idx) => idx !== i);
    updatePatient(patient.id, { drugAllergies: updated.length ? updated : undefined });
    toast({ title: "Alergia removida." });
  };

  // Documents
  const addDocument = () => {
    if (!docName.trim()) return;
    const doc: PatientDocument = { id: uid("doc"), name: docName.trim(), date: docDate || format(now, "yyyy-MM-dd"), type: docType };
    updatePatient(patient.id, { documents: [...(patient.documents ?? []), doc] });
    setDocName("");
    setDocDate("");
    setDocType("exame");
    setShowDocForm(false);
    toast({ title: "Documento adicionado." });
  };
  const removeDocument = (docId: string) => {
    updatePatient(patient.id, { documents: (patient.documents ?? []).filter((d) => d.id !== docId) });
    toast({ title: "Documento removido." });
  };

  // Encounter actions
  const handleDuplicate = (encId: string) => {
    const newEnc = duplicateEncounter(encId);
    if (newEnc) toast({ title: "Consulta duplicada como rascunho." });
  };
  const handleDeleteEncounter = () => {
    if (!deleteEncId) return;
    deleteEncounter(deleteEncId);
    setDeleteEncId(null);
    toast({ title: "Consulta excluída." });
  };

  const birthDateObj = draft.birthDate && isValid(parseISO(draft.birthDate)) ? parseISO(draft.birthDate) : undefined;

  const lastNote = lastEncounter ? data.notes.find((n) => n.encounterId === lastEncounter.id) : null;
  const lastNoteSummary = lastNote?.sections?.[0]?.content?.slice(0, 120) ?? "";

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

      {/* Allergy banner */}
      {(patient.drugAllergies?.length ?? 0) > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Alergias medicamentosas</AlertTitle>
          <AlertDescription>{patient.drugAllergies!.join(", ")}</AlertDescription>
        </Alert>
      )}

      {/* ===== TABS ===== */}
      <Tabs defaultValue="resumo" className="w-full">
        <TabsList className="w-full grid grid-cols-6 h-9">
          <TabsTrigger value="resumo" className="text-xs">Resumo</TabsTrigger>
          <TabsTrigger value="consultas" className="text-xs">Consultas</TabsTrigger>
          <TabsTrigger value="evolucao" className="text-xs">Evolução</TabsTrigger>
          <TabsTrigger value="diagnosticos" className="text-xs">Diagnósticos</TabsTrigger>
          <TabsTrigger value="alergias" className="text-xs">Alergias</TabsTrigger>
          <TabsTrigger value="documentos" className="text-xs">Documentos</TabsTrigger>
        </TabsList>

        {/* ===== TAB RESUMO ===== */}
        <TabsContent value="resumo" className="space-y-4 mt-4">
          {/* Identificação e Contato */}
          <Card className="glass-card">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Identificação e Contato</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {editing ? (
                  <>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Nome *</Label>
                      <Input value={draft.name} onChange={(e) => set("name", e.target.value)} />
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
                      <Label>Data de nascimento</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !birthDateObj && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {birthDateObj ? format(birthDateObj, "dd/MM/yyyy") : "Selecionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={birthDateObj} onSelect={(d) => set("birthDate", d ? format(d, "yyyy-MM-dd") : "")} disabled={(d) => d > new Date()} initialFocus className="p-3 pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1.5"><Label>CPF</Label><Input value={draft.cpf} onChange={(e) => set("cpf", maskCPF(e.target.value))} placeholder="000.000.000-00" /></div>
                    <div className="space-y-1.5"><Label>RG</Label><Input value={draft.rg} onChange={(e) => set("rg", e.target.value)} placeholder="RG" /></div>
                    <div className="space-y-1.5"><Label>Telefone</Label><Input value={draft.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(11) 99999-0000" /></div>
                    <div className="space-y-1.5"><Label>E-mail</Label><Input type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} placeholder="paciente@email.com" /></div>
                    <div className="space-y-1.5"><Label>CEP</Label><Input value={draft.cep} onChange={(e) => set("cep", maskCEP(e.target.value))} placeholder="00000-000" /></div>
                    <div className="space-y-1.5 sm:col-span-2"><Label>Endereço</Label><Input value={draft.addressLine} onChange={(e) => set("addressLine", e.target.value)} placeholder="Logradouro, número, complemento" /></div>
                  </>
                ) : (
                  <>
                    <FieldView label="Nome" value={patient.name} />
                    <FieldView label="Sexo" value={{ M: "Masculino", F: "Feminino", O: "Outro", NA: "Não informado" }[patient.sex ?? "NA"]} />
                    <FieldView label="Data de nascimento" value={patient.birthDate ? format(parseISO(patient.birthDate), "dd/MM/yyyy") : undefined} />
                    <FieldView label="CPF" value={patient.cpf} />
                    <FieldView label="RG" value={patient.rg} />
                    <FieldView label="Telefone" value={patient.phone} />
                    <FieldView label="E-mail" value={patient.email} />
                    <FieldView label="CEP" value={patient.cep} />
                    <FieldView label="Endereço" value={patient.addressLine} />
                  </>
                )}
              </div>
              {/* Observações */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Observações</Label>
                {editing ? (
                  <textarea value={draft.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Ex.: preferências do paciente…" className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" rows={3} />
                ) : (
                  <p className="text-sm min-h-[1.5rem] whitespace-pre-wrap">{patient.notes || "—"}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Família */}
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeChild(i)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addChild}><Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar filho(a)</Button>
                  </div>
                  <div className="space-y-1.5"><Label>Animal de estimação</Label><Input value={draft.petName} onChange={(e) => set("petName", e.target.value)} placeholder="Nome do animal" /></div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Filhos</Label>
                    {patient.children?.length ? (<div className="flex flex-wrap gap-1.5">{patient.children.map((c, i) => <Badge key={i} variant="secondary">{c}</Badge>)}</div>) : <p className="text-sm">—</p>}
                  </div>
                  <FieldView label="Animal de estimação" value={patient.petName} />
                </>
              )}
            </CardContent>
          </Card>

          {/* Origem */}
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

          {/* Saúde - read-only summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="glass-card">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Diagnósticos</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex flex-wrap gap-1.5">
                  {(patient.diagnoses ?? []).length > 0
                    ? patient.diagnoses!.map((d, i) => <Badge key={i} variant="secondary">{d}</Badge>)
                    : <p className="text-sm text-muted-foreground">Nenhum diagnóstico</p>
                  }
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Alergias</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex flex-wrap gap-1.5">
                  {(patient.drugAllergies ?? []).length > 0
                    ? patient.drugAllergies!.map((a, i) => <Badge key={i} variant="outline" className="border-destructive/40 text-destructive">{a}</Badge>)
                    : <p className="text-sm text-muted-foreground">Nenhuma alergia</p>
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Última consulta */}
          <Card className="glass-card">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><Stethoscope className="h-4 w-4 text-primary" /> Última consulta</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {lastEncounter ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatDateTimeBR(lastEncounter.startedAt)}</span>
                    <StatusBadge status={lastEncounter.status} />
                  </div>
                  {lastEncounter.chiefComplaint && <p className="text-sm text-muted-foreground">Queixa: {lastEncounter.chiefComplaint}</p>}
                  {lastNoteSummary && <p className="text-xs text-muted-foreground truncate">{lastNoteSummary}</p>}
                  <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => navigate(`/consultas/${lastEncounter.id}`)}>Abrir consulta →</Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma consulta registrada.</p>
              )}
            </CardContent>
          </Card>

          {/* Próxima consulta */}
          {nextSchedule && (
            <Card className="glass-card">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Próxima consulta</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm">{format(parseISO(nextSchedule.date), "dd/MM/yyyy")} às {nextSchedule.startTime}</p>
              </CardContent>
            </Card>
          )}

          {/* Nova consulta button */}
          <Button onClick={() => navigate(`/consultas/nova?paciente=${patient.id}`)} className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Nova consulta
          </Button>

          {patientEncounters.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Stethoscope className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nenhuma consulta registrada ainda.</p>
              <p className="text-xs mt-1">Clique em "Nova consulta" para começar.</p>
            </div>
          )}
        </TabsContent>

        {/* ===== TAB CONSULTAS ===== */}
        <TabsContent value="consultas" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar nas consultas…" value={consultaSearch} onChange={(e) => setConsultaSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={consultaFilter} onValueChange={(v) => setConsultaFilter(v as any)}>
              <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
              </SelectContent>
            </Select>
            <Select value={consultaStatus} onValueChange={(v) => setConsultaStatus(v as any)}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="final">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredEncounters.length > 0 ? (
            <div className="space-y-2">
              {filteredEncounters.map((enc) => {
                const encNote = data.notes.find((n) => n.encounterId === enc.id);
                const summary = enc.chiefComplaint || encNote?.sections?.[0]?.content?.slice(0, 80) || "Sem resumo";
                return (
                  <Card key={enc.id} className="glass-card hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{formatDateTimeBR(enc.startedAt)}</span>
                            <StatusBadge status={enc.status} />
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{summary}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/consultas/${enc.id}`)}>Abrir</Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDuplicate(enc.id)}><Copy className="mr-2 h-4 w-4" /> Duplicar</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteEncId(enc.id)}><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Stethoscope className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nenhuma consulta encontrada.</p>
              <Button variant="outline" className="mt-3" onClick={() => navigate(`/consultas/nova?paciente=${patient.id}`)}>
                <Plus className="mr-2 h-4 w-4" /> Criar primeira consulta
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ===== TAB EVOLUÇÃO (Timeline Cronológica) ===== */}
        <TabsContent value="evolucao" className="space-y-4 mt-4">
          {/* Comparison View */}
          {comparePhotos && (
            <Card className="glass-card border-primary/30">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" /> Comparação de Evolução
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => { setCompareIds(null); setAiAnalysis(null); }}>
                    <X className="h-3.5 w-3.5 mr-1" /> Fechar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  {comparePhotos.map((photo, idx) => (
                    <div key={photo.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={idx === 0 ? "secondary" : "default"} className="text-[10px]">
                          {idx === 0 ? "ANTES" : "DEPOIS"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{format(parseISO(photo.date), "dd/MM/yyyy")}</span>
                      </div>
                      <div className="relative rounded-xl overflow-hidden bg-muted/30 border border-border/40">
                        <EvolutionPhotoImage imagePath={photo.image_path} alt={photo.label} />
                      </div>
                      {photo.weight && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Weight className="h-3 w-3" /> {photo.weight} kg
                        </div>
                      )}
                      {photo.notes && (
                        <p className="text-xs text-muted-foreground italic">{photo.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
                {/* Weight diff */}
                {comparePhotos[0].weight && comparePhotos[1].weight && (
                  <div className="mt-3 rounded-lg bg-muted/30 p-3 flex items-center gap-3">
                    <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                    <div className="text-sm">
                      <span className="font-medium">Variação de peso: </span>
                      <span className={cn(
                        "font-semibold",
                        comparePhotos[1].weight - comparePhotos[0].weight > 0 ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                      )}>
                        {comparePhotos[1].weight - comparePhotos[0].weight > 0 ? "+" : ""}
                        {(comparePhotos[1].weight - comparePhotos[0].weight).toFixed(1)} kg
                      </span>
                      <span className="text-muted-foreground ml-1.5 text-xs">
                        ({comparePhotos[0].weight} → {comparePhotos[1].weight} kg)
                      </span>
                    </div>
                  </div>
                )}

                {/* AI Analysis Button & Result */}
                <div className="mt-4 space-y-3">
                  <Button
                    onClick={handleAiCompare}
                    disabled={aiAnalysisLoading}
                    className="w-full gap-2"
                    variant="default"
                  >
                    {aiAnalysisLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Analisando com IA…</>
                    ) : (
                      <><Sparkles className="h-4 w-4" /> Analisar evolução com IA</>
                    )}
                  </Button>

                  {aiAnalysis && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">Análise com IA</span>
                      </div>
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                        {aiAnalysis}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instruction */}
          {compareIds && !compareIds[1] && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center text-sm text-primary animate-pulse">
              Selecione a segunda foto para comparar
            </div>
          )}

          {/* Timeline Grid */}
          <Card className="glass-card">
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Camera className="h-4 w-4 text-primary" /> Timeline de Evolução
                  {evolutionPhotos.length > 0 && (
                    <Badge variant="outline" className="text-[10px] ml-1">{evolutionPhotos.length} registros</Badge>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              {evolutionPhotos.length > 0 ? (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border/60" />

                  <div className="space-y-6">
                    {evolutionPhotos.map((photo, idx) => {
                      const isSelected = compareIds?.includes(photo.id);
                      return (
                        <div key={photo.id} className="relative pl-10">
                          {/* Timeline dot */}
                          <div className={cn(
                            "absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 transition-colors",
                            isSelected
                              ? "bg-primary border-primary scale-125"
                              : "bg-background border-muted-foreground/40"
                          )} />

                          <div className={cn(
                            "rounded-xl border p-3 transition-all cursor-pointer group",
                            isSelected
                              ? "border-primary/50 bg-primary/5 shadow-sm"
                              : "border-border/40 hover:border-primary/30 hover:bg-muted/20"
                          )}>
                            {/* Header */}
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-sm font-semibold">{photo.label}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(parseISO(photo.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                  {idx > 0 && (() => {
                                    const prev = evolutionPhotos[idx - 1];
                                    const days = Math.round((parseISO(photo.date).getTime() - parseISO(prev.date).getTime()) / 86400000);
                                    return <span className="ml-1.5 text-primary/70">({days}d desde anterior)</span>;
                                  })()}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant={isSelected ? "default" : "ghost"}
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(e) => { e.stopPropagation(); toggleCompare(photo.id); }}
                                  title="Comparar"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(e) => { e.stopPropagation(); setZoomPhotoId(zoomPhotoId === photo.id ? null : photo.id); }}
                                  title="Ampliar"
                                >
                                  <ZoomIn className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(e) => { e.stopPropagation(); handleRemoveEvolutionPhoto(photo.id, photo.image_path); }}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </div>
                            </div>

                            {/* Photo */}
                            <div className={cn(
                              "rounded-lg overflow-hidden bg-muted/30 border border-border/30 transition-all",
                              zoomPhotoId === photo.id ? "aspect-auto" : "aspect-auto max-h-[300px]"
                            )}>
                              <EvolutionPhotoImage
                                imagePath={photo.image_path}
                                alt={photo.label}
                                onClick={() => setZoomPhotoId(zoomPhotoId === photo.id ? null : photo.id)}
                              />
                            </div>

                            {/* Metadata */}
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              {photo.weight && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Weight className="h-3 w-3" /> {photo.weight} kg
                                  {idx > 0 && evolutionPhotos[idx - 1].weight && (
                                    <span className={cn(
                                      "ml-1 font-medium",
                                      photo.weight - evolutionPhotos[idx - 1].weight! > 0
                                        ? "text-red-500 dark:text-red-400"
                                        : "text-emerald-600 dark:text-emerald-400"
                                    )}>
                                      ({photo.weight - evolutionPhotos[idx - 1].weight! > 0 ? "+" : ""}
                                      {(photo.weight - evolutionPhotos[idx - 1].weight!).toFixed(1)})
                                    </span>
                                  )}
                                </div>
                              )}
                              {photo.notes && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <StickyNote className="h-3 w-3" /> {photo.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium mb-1">Nenhum registro de evolução</p>
                  <p className="text-xs">Adicione fotos a cada consulta para acompanhar a evolução do paciente ao longo do tempo.</p>
                </div>
              )}

              {/* Add new photo form */}
              {showPhotoForm ? (
                <div className="rounded-xl border border-border/50 p-4 space-y-3 bg-muted/10">
                  <p className="text-sm font-medium">Nova foto de evolução</p>
                  <Input placeholder="Descrição (ex: 3ª sessão, pós-procedimento)" value={photoLabel} onChange={(e) => setPhotoLabel(e.target.value)} />
                  <div className="grid grid-cols-3 gap-3">
                    <Input type="date" value={photoDate} onChange={(e) => setPhotoDate(e.target.value)} placeholder="Data" />
                    <Input type="number" step="0.1" placeholder="Peso (kg) — opcional" value={photoWeight} onChange={(e) => setPhotoWeight(e.target.value)} />
                    <select
                      value={photoAngle}
                      onChange={(e) => setPhotoAngle(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="frontal">Frontal</option>
                      <option value="posterior">Posterior</option>
                      <option value="lateral_direito">Lateral Direito</option>
                      <option value="lateral_esquerdo">Lateral Esquerdo</option>
                      <option value="tres_quartos">¾ (Três Quartos)</option>
                    </select>
                  </div>
                  <Input placeholder="Observações — opcional" value={photoNotes} onChange={(e) => setPhotoNotes(e.target.value)} />
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer">
                      <Button variant="default" size="sm" asChild>
                        <span><Camera className="mr-1.5 h-3.5 w-3.5" /> Selecionar foto</span>
                      </Button>
                      <input type="file" accept="image/*" className="hidden" onChange={handleAddEvolutionPhoto} />
                    </label>
                    <Button size="sm" variant="ghost" onClick={() => setShowPhotoForm(false)}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setShowPhotoForm(true)} className="w-full">
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar registro de evolução
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB DIAGNÓSTICOS ===== */}
        <TabsContent value="diagnosticos" className="space-y-4 mt-4">
          <Card className="glass-card">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Diagnósticos</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {(patient.diagnoses ?? []).map((d, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {d}
                    <button onClick={() => removeDiagnosisStandalone(i)} className="ml-0.5 hover:text-destructive"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
                {(patient.diagnoses ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhum diagnóstico cadastrado.</p>}
              </div>
              <div className="flex gap-2 max-w-sm">
                <Input value={tabNewDiagnosis} onChange={(e) => setTabNewDiagnosis(e.target.value)} placeholder="Novo diagnóstico" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDiagnosisStandalone(tabNewDiagnosis); } }} className="flex-1" />
                <Button variant="outline" size="sm" onClick={() => addDiagnosisStandalone(tabNewDiagnosis)}><Plus className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB ALERGIAS ===== */}
        <TabsContent value="alergias" className="space-y-4 mt-4">
          <Card className="glass-card">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Alergias Medicamentosas</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {(patient.drugAllergies ?? []).map((a, i) => (
                  <Badge key={i} variant="outline" className="gap-1 border-destructive/40 text-destructive">
                    {a}
                    <button onClick={() => removeAllergyStandalone(i)} className="ml-0.5 hover:text-destructive"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
                {(patient.drugAllergies ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhuma alergia cadastrada.</p>}
              </div>
              <div className="flex gap-2 max-w-sm">
                <Input value={tabNewAllergy} onChange={(e) => setTabNewAllergy(e.target.value)} placeholder="Nova alergia" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAllergyStandalone(tabNewAllergy); } }} className="flex-1" />
                <Button variant="outline" size="sm" onClick={() => addAllergyStandalone(tabNewAllergy)}><Plus className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB DOCUMENTOS ===== */}
        <TabsContent value="documentos" className="space-y-4 mt-4">
          <Card className="glass-card">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><FolderOpen className="h-4 w-4 text-primary" /> Documentos / Exames</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {(patient.documents ?? []).length > 0 ? (
                <div className="space-y-2">
                  {(patient.documents ?? []).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{format(parseISO(doc.date), "dd/MM/yyyy")} • {doc.type}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeDocument(doc.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhum documento cadastrado.</p>
                </div>
              )}

              {showDocForm ? (
                <div className="rounded-lg border border-border/50 p-3 space-y-3">
                  <Input placeholder="Nome do documento" value={docName} onChange={(e) => setDocName(e.target.value)} />
                  <Input type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} />
                  <Select value={docType} onValueChange={(v) => setDocType(v as PatientDocument["type"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exame">Exame</SelectItem>
                      <SelectItem value="laudo">Laudo</SelectItem>
                      <SelectItem value="imagem">Imagem</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addDocument} disabled={!docName.trim()}><Plus className="mr-1 h-3 w-3" /> Salvar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowDocForm(false)}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setShowDocForm(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar exame (mock)
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete patient confirmation */}
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

      {/* Delete encounter confirmation */}
      <AlertDialog open={!!deleteEncId} onOpenChange={(open) => { if (!open) setDeleteEncId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir consulta?</AlertDialogTitle>
            <AlertDialogDescription>Todos os dados desta consulta serão removidos permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEncounter}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
