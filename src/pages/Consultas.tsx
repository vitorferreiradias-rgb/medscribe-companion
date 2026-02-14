import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, FileText, Mic, Edit3, Eye, Copy, Trash2 } from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import { deleteEncounter } from "@/lib/store";
import { formatDateTimeBR, formatDuration } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { NewEncounterDialog } from "@/components/NewEncounterDialog";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  recording: { label: "Gravando", variant: "destructive" },
  draft: { label: "Rascunho", variant: "secondary" },
  reviewed: { label: "Revisado", variant: "outline" },
  final: { label: "Finalizado", variant: "default" },
};

export default function Consultas() {
  const data = useAppData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [showNew, setShowNew] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...data.encounters].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    if (statusFilter !== "all") list = list.filter((e) => e.status === statusFilter);

    if (periodFilter !== "all") {
      const now = Date.now();
      const ms = periodFilter === "today" ? 86400000 : periodFilter === "7d" ? 604800000 : 2592000000;
      list = list.filter((e) => now - new Date(e.startedAt).getTime() < ms);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) => {
        const pat = data.patients.find((p) => p.id === e.patientId);
        const cli = data.clinicians.find((c) => c.id === e.clinicianId);
        return (
          pat?.name.toLowerCase().includes(q) ||
          cli?.name.toLowerCase().includes(q) ||
          e.chiefComplaint?.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [data, search, statusFilter, periodFilter]);

  const drafts = data.encounters.filter((e) => e.status === "draft");
  const toReview = data.encounters.filter((e) => e.status === "draft" && e.noteId);
  const noNote = data.encounters.filter((e) => e.status === "draft" && !e.noteId);

  const handleDelete = () => {
    if (deleteId) {
      deleteEncounter(deleteId);
      toast({ title: "Registro removido." });
      setDeleteId(null);
    }
  };

  if (data.encounters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Stethoscope className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Nenhuma consulta ainda</h2>
        <p className="text-muted-foreground mb-6">Comece registrando sua primeira consulta.</p>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="mr-2 h-4 w-4" /> Iniciar primeira consulta
        </Button>
        <NewEncounterDialog open={showNew} onOpenChange={setShowNew} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Consultas</h1>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova consulta
        </Button>
      </div>

      {/* Pending queue */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Prontuários para revisar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{toReview.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sem prontuário</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{noNote.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rascunhos recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{drafts.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente, médico..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Período" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Total</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="7d">7 dias</SelectItem>
            <SelectItem value="30d">30 dias</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="recording">Gravando</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="reviewed">Revisado</SelectItem>
            <SelectItem value="final">Finalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead className="hidden md:table-cell">Médico</TableHead>
              <TableHead className="hidden sm:table-cell">Duração</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {filtered.map((enc) => {
                const pat = data.patients.find((p) => p.id === enc.patientId);
                const cli = data.clinicians.find((c) => c.id === enc.clinicianId);
                const st = statusConfig[enc.status];
                return (
                  <motion.tr
                    key={enc.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/consultas/${enc.id}`)}
                  >
                    <TableCell className="font-medium">{formatDateTimeBR(enc.startedAt)}</TableCell>
                    <TableCell>{pat?.name ?? "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{cli?.name ?? "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell">{formatDuration(enc.durationSec)}</TableCell>
                    <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/consultas/${enc.id}`); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteId(enc.id); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma consulta encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <NewEncounterDialog open={showNew} onOpenChange={setShowNew} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir consulta?</AlertDialogTitle>
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

// Import for empty state
import { Stethoscope } from "lucide-react";
