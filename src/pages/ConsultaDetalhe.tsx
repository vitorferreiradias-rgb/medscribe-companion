import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { Save, CheckCircle, Lock, Printer, Trash2, ArrowLeft, Copy, Search, Sparkles, Edit3 } from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import { updateEncounter, updateNoteSection, deleteEncounter } from "@/lib/store";
import { formatDateTimeBR, formatDuration } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const statusLabels: Record<string, string> = {
  recording: "Gravando",
  draft: "Rascunho",
  reviewed: "Revisado",
  final: "Finalizado",
};

export default function ConsultaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const data = useAppData();
  const { toast } = useToast();
  const [showDelete, setShowDelete] = useState(false);
  const [transcriptSearch, setTranscriptSearch] = useState("");

  const enc = data.encounters.find((e) => e.id === id);
  if (!enc) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Consulta não encontrada.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/consultas")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    );
  }

  const patient = data.patients.find((p) => p.id === enc.patientId);
  const clinician = data.clinicians.find((c) => c.id === enc.clinicianId);
  const note = data.notes.find((n) => n.id === enc.noteId);
  const transcript = data.transcripts.find((t) => t.id === enc.transcriptId);

  const handleSave = () => {
    toast({ title: "Prontuário salvo." });
  };

  const handleReview = () => {
    updateEncounter(enc.id, { status: "reviewed" });
    toast({ title: "Marcado como revisado." });
  };

  const handleFinalize = () => {
    updateEncounter(enc.id, { status: "final" });
    toast({ title: "Prontuário finalizado." });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = () => {
    deleteEncounter(enc.id);
    toast({ title: "Registro removido." });
    navigate("/consultas");
  };

  const copySection = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Seção copiada." });
  };

  const filteredUtterances = transcript?.content.filter((u) =>
    !transcriptSearch || u.text.toLowerCase().includes(transcriptSearch.toLowerCase())
  ) ?? [];

  const isFinal = enc.status === "final";

  // Checklist items
  const checklistItems = [
    { label: "Queixa principal preenchida", done: note?.sections.some((s) => s.id.includes("chief_complaint") && s.content && !s.content.includes("revise e edite")) ?? false },
    { label: "Alergias verificadas", done: note?.sections.some((s) => s.id.includes("alergias") && s.content && !s.content.includes("revise e edite")) ?? false },
    { label: "Medicamentos registrados", done: note?.sections.some((s) => s.id.includes("medicamentos") && s.content && !s.content.includes("revise e edite")) ?? false },
    { label: "Plano definido", done: note?.sections.some((s) => s.id.includes("plano") && s.content && !s.content.includes("revise e edite")) ?? false },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => navigate("/consultas")} className="hover:text-foreground transition-colors">Consultas</button>
          <span>/</span>
          <span className="text-foreground">{patient?.name ?? "Paciente"}</span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Prontuário</h1>
            <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
              <span>{formatDateTimeBR(enc.startedAt)}</span>
              <span>•</span>
              <span>{clinician?.name}</span>
              <span>•</span>
              <span>{formatDuration(enc.durationSec)}</span>
              <Badge variant="outline" className="ml-1">{statusLabels[enc.status]}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isFinal && (
              <>
                <Button variant="secondary" size="sm" onClick={handleSave}><Save className="mr-1.5 h-3.5 w-3.5" /> Salvar</Button>
                <Button variant="secondary" size="sm" onClick={handleReview}><CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Revisado</Button>
                <Button size="sm" onClick={handleFinalize}><Lock className="mr-1.5 h-3.5 w-3.5" /> Finalizar</Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="mr-1.5 h-3.5 w-3.5" /> Exportar</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowDelete(true)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Column A - Editor */}
        <div className="lg:col-span-3 space-y-2">
          {note ? (
            <Accordion type="multiple" defaultValue={note.sections.map((s) => s.id)} className="space-y-2">
              {note.sections.map((section) => (
                <AccordionItem key={section.id} value={section.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{section.title}</span>
                      {section.autoGenerated ? (
                        <Badge variant="outline" className="text-xs gap-1"><Sparkles className="h-3 w-3" /> auto</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs gap-1"><Edit3 className="h-3 w-3" /> editado</Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4">
                    <Textarea
                      value={section.content}
                      onChange={(e) => updateNoteSection(note.id, section.id, e.target.value)}
                      rows={4}
                      disabled={isFinal}
                      className="resize-y"
                    />
                    <div className="flex justify-end mt-2">
                      <Button variant="ghost" size="sm" onClick={() => copySection(section.content)}>
                        <Copy className="mr-1 h-3 w-3" /> Copiar
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum prontuário gerado para esta consulta.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Column B - Transcript & Tools */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="transcricao">
            <TabsList className="w-full">
              <TabsTrigger value="transcricao" className="flex-1">Transcrição</TabsTrigger>
              <TabsTrigger value="checklist" className="flex-1">Checklist</TabsTrigger>
              <TabsTrigger value="historico" className="flex-1">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="transcricao" className="space-y-3 mt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar na transcrição..."
                  value={transcriptSearch}
                  onChange={(e) => setTranscriptSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {filteredUtterances.length > 0 ? (
                  filteredUtterances.map((u, i) => (
                    <div key={i} className={`p-3 rounded-lg text-sm ${u.speaker === "medico" ? "bg-primary/10 border border-primary/20" : "bg-muted"}`}>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {u.speaker === "medico" ? "🩺 Médico" : "🧑 Paciente"}
                      </p>
                      <p>{u.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Sem transcrição disponível.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="checklist" className="mt-3">
              <Card>
                <CardContent className="pt-4 space-y-3">
                  {checklistItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${item.done ? "border-success bg-success" : "border-muted-foreground"}`}>
                        {item.done && <CheckCircle className="h-3 w-3 text-success-foreground" />}
                      </div>
                      <span className={`text-sm ${item.done ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="historico" className="mt-3">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    Criado em {formatDateTimeBR(enc.startedAt)}
                  </p>
                  {note?.sections.filter((s) => s.lastEditedAt).map((s) => (
                    <p key={s.id} className="text-sm text-muted-foreground mt-1">
                      {s.title} editado em {formatDateTimeBR(s.lastEditedAt!)}
                    </p>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir consulta?</AlertDialogTitle>
            <AlertDialogDescription>Todos os dados desta consulta serão removidos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
