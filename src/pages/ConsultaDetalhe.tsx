import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Save, CheckCircle, Lock, Printer, Trash2, Copy, Search, Sparkles, Edit3, ClipboardPaste, CalendarDays, Pill, ArrowRightLeft, BrainCircuit, Loader2, AlertTriangle } from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import { updateEncounter, deleteEncounter } from "@/lib/store";
import { updateUnifiedNote } from "@/lib/store";
import { formatDateTimeBR, formatDuration, formatDateLongBR, formatMedicationsForNote, formatDateBR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/StatusBadge";
import { ConsultaTimeline } from "@/components/ConsultaTimeline";
import { ReceitaPlaceholder } from "@/components/ReceitaPlaceholder";
import { DietaPlaceholder } from "@/components/DietaPlaceholder";
import { NoteSection } from "@/types";
import type { Prescription } from "@/components/receita/PrescriptionFlow";
import { streamClinicalSummary } from "@/lib/ai-summary";

const PRESCRIPTIONS_KEY = "medscribe_prescriptions";

function loadPrescriptions(): Prescription[] {
  try {
    const raw = localStorage.getItem(PRESCRIPTIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function buildUnifiedContent(sections: NoteSection[]): string {
  return sections
    .map((s) => `## ${s.title}\n${s.content}`)
    .join("\n\n");
}

export default function ConsultaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const data = useAppData();
  const { toast } = useToast();
  const [showDelete, setShowDelete] = useState(false);
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const enc = data.encounters.find((e) => e.id === id);
  const patient = enc ? data.patients.find((p) => p.id === enc.patientId) : undefined;
  const clinician = enc ? data.clinicians.find((c) => c.id === enc.clinicianId) : undefined;
  const note = enc ? data.notes.find((n) => n.id === enc.noteId) : undefined;
  const transcript = enc ? data.transcripts.find((t) => t.id === enc.transcriptId) : undefined;

  const initialContent = useMemo(() => note ? buildUnifiedContent(note.sections) : "", [note?.id]); // unified-editor
  const [unifiedText, setUnifiedText] = useState(initialContent); // unified-state
  const isEdited = unifiedText !== initialContent; // unified-check

  // Load prescriptions and split by context
  const allPrescriptions = useMemo(() => loadPrescriptions(), []);
  const condutaMeds = useMemo(() =>
    enc ? allPrescriptions.filter((p) => p.encounterId === enc.id).flatMap((p) => p.medications) : [],
    [allPrescriptions, enc?.id]
  );
  const interconsultaMeds = useMemo(() =>
    enc ? allPrescriptions
      .filter((p) => p.patientId === enc.patientId && !p.encounterId)
      .map((p) => ({ medications: p.medications, date: p.createdAt })) : [],
    [allPrescriptions, enc?.patientId]
  );

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

  const handleSave = () => {
    if (note) {
      let text = unifiedText;

      // Inject conduta medications
      if (condutaMeds.length > 0) {
        const medsText = formatMedicationsForNote(condutaMeds);
        const planHeader = "## Plano / Conduta";
        if (text.includes(planHeader)) {
          const marker = "\n\nMedicações prescritas:\n";
          // Remove old injection if present
          const markerIdx = text.indexOf(marker);
          if (markerIdx === -1) {
            text = text.replace(planHeader, `${planHeader}\n\nMedicações prescritas:\n${medsText}\n`);
          }
        } else {
          text += `\n\n${planHeader}\nMedicações prescritas:\n${medsText}`;
        }
      }

      // Inject interconsulta medications
      if (interconsultaMeds.some((g) => g.medications.length > 0)) {
        const interHeader = "## Interconsultas";
        if (!text.includes(interHeader)) {
          const lines = interconsultaMeds
            .filter((g) => g.medications.length > 0)
            .map((g) => {
              const dateStr = g.date ? formatDateBR(g.date) : "";
              return g.medications.map((m) => {
                if (m.isCompounded) return `- Fórmula Manipulada — ${m.compoundedFormula || "sem descrição"} (${dateStr})`;
                const name = [m.commercialName, m.concentration, m.presentation].filter(Boolean).join(" ");
                return `- ${name} — ${m.usageInstructions || "sem posologia"} (${dateStr})`;
              }).join("\n");
            }).join("\n");
          text += `\n\n${interHeader}\nPrescrições realizadas fora desta consulta:\n${lines}`;
        }
      }

      updateUnifiedNote(note.id, text);
      setUnifiedText(text);
    }
    toast({ title: "Prontuário salvo." });
  };
  const handleReview = () => { handleSave(); updateEncounter(enc.id, { status: "reviewed" }); toast({ title: "Marcado como revisado." }); };
  const handleFinalize = () => { handleSave(); updateEncounter(enc.id, { status: "final" }); toast({ title: "Prontuário finalizado." }); };
  const handlePrint = () => window.print();
  const handleDelete = () => { deleteEncounter(enc.id); toast({ title: "Registro removido." }); navigate("/consultas"); };
  const copyAll = () => { navigator.clipboard.writeText(unifiedText); toast({ title: "Prontuário copiado." }); };

  const handleGenerateSummary = async () => {
    setAiLoading(true);
    setAiSummary("");
    const medStrings = condutaMeds.map((m) =>
      m.isCompounded
        ? `Fórmula Manipulada — ${m.compoundedFormula || "sem descrição"}`
        : `${[m.commercialName, m.concentration, m.presentation].filter(Boolean).join(" ")} — ${m.usageInstructions || "sem posologia"}`
    );
    const interStrings = interconsultaMeds
      .flatMap((g) => g.medications.map((m) =>
        m.isCompounded
          ? `Fórmula Manipulada — ${m.compoundedFormula || "sem descrição"}`
          : `${[m.commercialName, m.concentration, m.presentation].filter(Boolean).join(" ")} — ${m.usageInstructions || "sem posologia"}`
      ));
    await streamClinicalSummary({
      input: {
        noteContent: unifiedText,
        patientName: patient?.name || "",
        chiefComplaint: enc.chiefComplaint || "",
        medications: medStrings,
        interconsultaMedications: interStrings,
      },
      onDelta: (text) => setAiSummary((prev) => prev + text),
      onDone: () => setAiLoading(false),
      onError: (msg) => { toast({ title: "Erro", description: msg, variant: "destructive" }); setAiLoading(false); },
    });
  };

  const appendSummaryToNote = () => {
    if (aiSummary) {
      setUnifiedText((prev) => prev + "\n\n" + aiSummary);
      toast({ title: "Resumo adicionado ao prontuário." });
    }
  };

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
      {/* Allergy banner */}
      {patient && (patient.drugAllergies?.length ?? 0) > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive font-medium">Alergias: {patient.drugAllergies!.join(", ")}</p>
        </div>
      )}

      {/* Patient header card */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary text-lg font-bold">
                {patient?.name?.charAt(0) ?? "?"}
              </div>
              <div>
                <h1 className="text-xl font-semibold">
                  {patient ? (
                    <Link to={`/pacientes/${patient.id}`} className="hover:underline">{patient.name}</Link>
                  ) : "Paciente"}
                </h1>
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
      <div className="sticky top-12 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-2 glass-topbar">
        <div className="flex flex-wrap gap-2">
          {!isFinal && (
            <>
              <Button variant="secondary" size="sm" onClick={handleSave}><Save className="mr-1.5 h-3.5 w-3.5" /> Salvar</Button>
              <Button size="sm" onClick={handleReview}><CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Revisado/Salvar</Button>
              <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="mr-1.5 h-3.5 w-3.5" /> Exportar</Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={() => setShowDelete(true)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Column A - SOAP Editor */}
        <div className="lg:col-span-3 space-y-3">
          {note ? (
            <Card className="glass-card overflow-hidden">
              <div className="flex">
                <div className={`w-1 shrink-0 ${isEdited ? "bg-success" : "bg-primary"}`} />
                <div className="flex-1">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        isEdited
                          ? "bg-success/10 text-success"
                          : "bg-primary/10 text-primary"
                      }`}>
                        {isEdited ? <><Edit3 className="h-2.5 w-2.5" /> editado</> : <><Sparkles className="h-2.5 w-2.5" /> auto-gerado</>}
                      </span>
                    </div>
                    <Textarea
                      value={unifiedText}
                      onChange={(e) => setUnifiedText(e.target.value)}
                      disabled={isFinal}
                      className="resize-y min-h-[400px] font-mono text-sm leading-relaxed"
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      {!isFinal && isEdited && (
                        <Button variant="secondary" size="sm" onClick={handleSave}>
                          <Save className="mr-1 h-3 w-3" /> Salvar
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={copyAll}>
                        <Copy className="mr-1 h-3 w-3" /> Copiar tudo
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="glass-card">
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhum prontuário gerado para esta consulta.
              </CardContent>
            </Card>
          )}

          {/* Conduta medications card - Blue */}
          {condutaMeds.length > 0 && (
            <div className="flex rounded-xl border border-primary/25 overflow-hidden">
              <div className="w-1.5 shrink-0 bg-primary" />
              <div className="flex-1 bg-primary/5 px-4 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Pill className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Conduta — Medicações desta consulta</span>
                </div>
                <ul className="space-y-1">
                  {condutaMeds.map((m, i) => (
                    <li key={i} className="text-sm text-foreground">
                      {m.isCompounded
                        ? `• Fórmula Manipulada — ${m.compoundedFormula || "sem descrição"}`
                        : `• ${[m.commercialName, m.concentration, m.presentation].filter(Boolean).join(" ")} — ${m.usageInstructions || "sem posologia"}`
                      }
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Interconsulta medications card - Indigo */}
          {interconsultaMeds.some((g) => g.medications.length > 0) && (
            <div className="flex rounded-xl border border-indigo/25 overflow-hidden">
              <div className="w-1.5 shrink-0 bg-indigo" />
              <div className="flex-1 bg-indigo/5 px-4 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="h-3.5 w-3.5 text-indigo" />
                  <span className="text-[11px] font-semibold text-indigo uppercase tracking-wider">Interconsultas — Prescrições externas</span>
                </div>
                <ul className="space-y-1">
                  {interconsultaMeds.filter((g) => g.medications.length > 0).map((group, gi) =>
                    group.medications.map((m, mi) => (
                      <li key={`${gi}-${mi}`} className="text-sm text-foreground">
                        {m.isCompounded
                          ? `• Fórmula Manipulada — ${m.compoundedFormula || "sem descrição"}`
                          : `• ${[m.commercialName, m.concentration, m.presentation].filter(Boolean).join(" ")} — ${m.usageInstructions || "sem posologia"}`
                        }
                        {group.date && <span className="text-muted-foreground text-xs ml-1">({formatDateBR(group.date)})</span>}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* AI Summary card */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateSummary}
              disabled={aiLoading}
              className="self-start"
            >
              {aiLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <BrainCircuit className="mr-1.5 h-3.5 w-3.5" />}
              {aiLoading ? "Gerando resumo..." : "Gerar Resumo GenAI"}
            </Button>

            {aiSummary && (
              <div className="flex rounded-xl border border-accent/40 overflow-hidden">
                <div className="w-1.5 shrink-0 bg-accent" />
                <div className="flex-1 bg-accent/5 px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="h-3.5 w-3.5 text-accent-foreground" />
                      <span className="text-[11px] font-semibold text-accent-foreground uppercase tracking-wider">Resumo GenAI — Conduta para próxima consulta</span>
                    </div>
                    {!isFinal && (
                      <Button variant="ghost" size="sm" onClick={appendSummaryToNote} className="h-6 text-[10px]">
                        <ClipboardPaste className="mr-1 h-3 w-3" /> Inserir no prontuário
                      </Button>
                    )}
                  </div>
                  <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none">
                    {aiSummary}
                  </div>
                </div>
              </div>
            )}
          </div>

          {isFinal && (
            <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-muted/20 px-4 py-2.5">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-foreground font-medium">
                Finalizado em {formatDateLongBR(enc.startedAt)}
              </p>
            </div>
          )}
        </div>

        {/* Column B - Transcript & Tools */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="transcricao">
            <TabsList className="w-full grid grid-cols-5 h-9">
              <TabsTrigger value="transcricao" className="text-xs px-1.5">Transcrição</TabsTrigger>
              <TabsTrigger value="receita" className="text-xs px-1.5">Receita</TabsTrigger>
              <TabsTrigger value="dieta" className="text-xs px-1.5">Dieta</TabsTrigger>
              <TabsTrigger value="checklist" className="text-xs px-1.5">Checklist</TabsTrigger>
              <TabsTrigger value="historico" className="text-xs px-1.5">Histórico</TabsTrigger>
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
                        <div className={`group relative max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-shadow hover:shadow-md ${
                          isDoctor
                            ? "bg-primary/10 border border-primary/15 rounded-br-md"
                            : "bg-muted/70 border border-border/40 rounded-bl-md"
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

            <TabsContent value="receita" className="mt-3">
              <ReceitaPlaceholder encounterId={enc.id} patientId={enc.patientId} />
            </TabsContent>

            <TabsContent value="dieta" className="mt-3">
              <DietaPlaceholder />
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
