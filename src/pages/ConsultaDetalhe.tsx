import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { Save, CheckCircle, Lock, Printer, Trash2, Copy, Search, Sparkles, Edit3, ClipboardPaste } from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import { updateEncounter, updateNoteSection, deleteEncounter } from "@/lib/store";
import { formatDateTimeBR, formatDuration } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/StatusBadge";
import { ConsultaTimeline } from "@/components/ConsultaTimeline";

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
          Voltar
        </Button>
      </div>
    );
  }

  const patient = data.patients.find((p) => p.id === enc.patientId);
  const clinician = data.clinicians.find((c) => c.id === enc.clinicianId);
  const note = data.notes.find((n) => n.id === enc.noteId);
  const transcript = data.transcripts.find((t) => t.id === enc.transcriptId);

  const handleSave = () => toast({ title: "Prontuário salvo." });
  const handleReview = () => { updateEncounter(enc.id, { status: "reviewed" }); toast({ title: "Marcado como revisado." }); };
  const handleFinalize = () => { updateEncounter(enc.id, { status: "final" }); toast({ title: "Prontuário finalizado." }); };
  const handlePrint = () => window.print();
  const handleDelete = () => { deleteEncounter(enc.id); toast({ title: "Registro removido." }); navigate("/consultas"); };
  const copySection = (text: string) => { navigator.clipboard.writeText(text); toast({ title: "Seção copiada." }); };

  const filteredUtterances = transcript?.content.filter((u) =>
    !transcriptSearch || u.text.toLowerCase().includes(transcriptSearch.toLowerCase())
  ) ?? [];

  const isFinal = enc.status === "final";

  const checklistItems = [
    { label: "Queixa principal preenchida", done: note?.sections.some((s) => s.id.includes("chief_complaint") && s.content && !s.content.includes("revise e edite")) ?? false },
    { label: "Alergias verificadas", done: note?.sections.some((s) => s.id.includes("alergias") && s.content && !s.content.includes("revise e edite")) ?? false },
    { label: "Medicamentos registrados", done: note?.sections.some((s) => s.id.includes("medicamentos") && s.content && !s.content.includes("revise e edite")) ?? false },
    { label: "Plano definido", done: note?.sections.some((s) => s.id.includes("plano") && s.content && !s.content.includes("revise e edite")) ?? false },
  ];

  const checklistProgress = Math.round((checklistItems.filter((c) => c.done).length / checklistItems.length) * 100);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Patient header card */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary text-lg font-bold">
                {patient?.name?.charAt(0) ?? "?"}
              </div>
              <div>
                <h1 className="text-xl font-semibold">{patient?.name ?? "Paciente"}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                  <span>{formatDateTimeBR(enc.startedAt)}</span>
                  <span>•</span>
                  <span>{clinician?.name}</span>
                  <span>•</span>
                  <span>{formatDuration(enc.durationSec)}</span>
                  <StatusBadge status={enc.status} />
                </div>
                {enc.chiefComplaint && (
                  <p className="text-sm text-muted-foreground mt-1">Queixa: {enc.chiefComplaint}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sticky action bar */}
      <div className="sticky top-12 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-2 bg-background/80 backdrop-blur-md border-b border-border">
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

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Column A - SOAP Editor */}
        <div className="lg:col-span-3 space-y-3">
          {note ? (
            <Accordion type="multiple" defaultValue={note.sections.map((s) => s.id)} className="space-y-3">
              {note.sections.map((section) => (
                <AccordionItem key={section.id} value={section.id} className="border rounded-lg overflow-hidden">
                  <div className="flex">
                    <div className={`w-1 shrink-0 ${section.autoGenerated ? "bg-primary" : "bg-success"}`} />
                    <div className="flex-1 px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{section.title}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            section.autoGenerated
                              ? "bg-primary/10 text-primary"
                              : "bg-success/10 text-success"
                          }`}>
                            {section.autoGenerated ? <><Sparkles className="h-2.5 w-2.5" /> auto</> : <><Edit3 className="h-2.5 w-2.5" /> editado</>}
                          </span>
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
                    </div>
                  </div>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <Card className="glass-card">
              <CardContent className="py-12 text-center text-muted-foreground">
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
                <Input placeholder="Buscar na transcrição..." value={transcriptSearch} onChange={(e) => setTranscriptSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {filteredUtterances.length > 0 ? (
                  filteredUtterances.map((u, i) => {
                    const isDoctor = u.speaker === "medico";
                    return (
                      <div key={i} className={`flex ${isDoctor ? "justify-end" : "justify-start"}`}>
                        <div className={`group relative max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                          isDoctor
                            ? "bg-primary/15 border border-primary/20 rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        }`}>
                          <p className="text-[10px] font-medium text-muted-foreground mb-1">
                            {isDoctor ? "🩺 Médico" : "🧑 Paciente"}
                          </p>
                          <p>{u.text}</p>
                          <button
                            onClick={() => { navigator.clipboard.writeText(u.text); toast({ title: "Trecho copiado." }); }}
                            className="absolute -top-2 -right-2 hidden group-hover:flex h-6 w-6 items-center justify-center rounded-full bg-card border border-border shadow-sm"
                            title="Copiar trecho"
                          >
                            <ClipboardPaste className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Sem transcrição disponível.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="checklist" className="mt-3">
              <Card className="glass-card">
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{checklistProgress}%</span>
                    </div>
                    <Progress value={checklistProgress} className="h-2" />
                  </div>
                  <Separator />
                  {checklistItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Checkbox checked={item.done} disabled className="data-[state=checked]:bg-success data-[state=checked]:border-success" />
                      <span className={`text-sm ${item.done ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="historico" className="mt-3">
              <Card className="glass-card">
                <CardContent className="pt-4">
                  <ConsultaTimeline createdAt={enc.startedAt} sections={note?.sections ?? []} />
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
