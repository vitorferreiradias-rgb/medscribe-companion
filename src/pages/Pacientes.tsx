import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Users, Trash2, Edit3, Stethoscope, CalendarPlus, History } from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import { addPatient, updatePatient, deletePatient } from "@/lib/store";
import { formatDateBR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Patient } from "@/types";

export default function Pacientes() {
  const data = useAppData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState<string>("NA");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setName(""); setBirthDate(""); setSex("NA"); setPhone(""); setNotes("");
    setEditingPatient(null);
  };

  const openNew = () => { resetForm(); setShowForm(true); };

  const openEdit = (p: Patient) => {
    setEditingPatient(p);
    setName(p.name);
    setBirthDate(p.birthDate ?? "");
    setSex(p.sex ?? "NA");
    setPhone(p.phone ?? "");
    setNotes(p.notes ?? "");
    setShowForm(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editingPatient) {
      updatePatient(editingPatient.id, { name, birthDate: birthDate || undefined, sex: sex as Patient["sex"], phone: phone || undefined, notes: notes || undefined });
      toast({ title: "Paciente atualizado." });
    } else {
      addPatient({ name, birthDate: birthDate || undefined, sex: sex as Patient["sex"], phone: phone || undefined, notes: notes || undefined });
      toast({ title: "Paciente adicionado." });
    }
    setShowForm(false);
    resetForm();
  };

  const handleDelete = () => {
    if (deleteId) {
      deletePatient(deleteId);
      toast({ title: "Registro removido." });
      setDeleteId(null);
    }
  };

  const filtered = useMemo(() => {
    let list = data.patients.filter((p) => !p.archived);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.phone?.includes(q));
    }
    return list;
  }, [data.patients, search]);

  const getLastEncounter = (patId: string) => {
    const encs = data.encounters.filter((e) => e.patientId === patId).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    return encs[0];
  };

  const getEncounterCount = (patId: string) => data.encounters.filter((e) => e.patientId === patId).length;

  if (data.patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Users className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Nenhum paciente cadastrado</h2>
        <p className="text-muted-foreground mb-6">Adicione o primeiro paciente para começar.</p>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Adicionar primeiro paciente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Pacientes</h1>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Novo paciente</Button>
      </div>

      {/* Search — glass surface */}
      <div className="glass-surface rounded-xl p-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 border-none bg-background/50" />
        </div>
      </div>

      {/* Table — glass */}
      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/50 hover:bg-transparent">
              <TableHead>Nome</TableHead>
              <TableHead className="hidden sm:table-cell">Nascimento</TableHead>
              <TableHead className="hidden md:table-cell">Contato</TableHead>
              <TableHead className="hidden lg:table-cell">Consultas</TableHead>
              <TableHead className="hidden lg:table-cell">Última consulta</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {filtered.map((p) => {
                const lastEnc = getLastEncounter(p.id);
                const encCount = getEncounterCount(p.id);
                return (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-b border-border/40 transition-all duration-150 ease-out hover:bg-primary/[0.03] hover:shadow-[inset_3px_0_0_hsl(var(--primary))] group"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {p.name.charAt(0)}
                        </div>
                        {p.name}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{p.birthDate ? formatDateBR(p.birthDate) : "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{p.phone ?? "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{encCount}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{lastEnc ? formatDateBR(lastEnc.startedAt) : "—"}</TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider delayDuration={300}>
                        <div className="flex items-center justify-end gap-0.5 opacity-50 group-hover:opacity-100 transition-opacity duration-150">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Edit3 className="h-4 w-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                          {lastEnc && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/consultas/${lastEnc.id}`)}><History className="h-4 w-4" /></Button>
                              </TooltipTrigger>
                              <TooltipContent>Histórico</TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </TooltipTrigger>
                            <TooltipContent>Excluir</TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum paciente encontrado.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { setShowForm(o); if (!o) resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPatient ? "Editar Paciente" : "Novo Paciente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de nascimento</Label>
                <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Sexo</Label>
                <Select value={sex} onValueChange={setSex}>
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
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-0000" />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações gerais" />
            </div>
            <Button className="w-full" onClick={handleSave} disabled={!name.trim()}>
              {editingPatient ? "Salvar alterações" : "Adicionar paciente"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir paciente?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
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
