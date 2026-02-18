import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppData } from "@/hooks/useAppData";
import { addEncounter, addTranscript, addNote, updateEncounter, addPatient } from "@/lib/store";
import { parseTranscriptToSections } from "@/lib/parser";
import { soapTemplate } from "@/lib/soap-template";
import { formatTimer, formatDateTimeBR } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition, isSpeechRecognitionSupported } from "@/hooks/useSpeechRecognition";
import { useIsMobile } from "@/hooks/use-mobile";
import { streamGenerateSoap } from "@/lib/ai-soap";
import { saveTranscription } from "@/lib/transcript-archive";
import { getDefaultSoapMarkdown, listTemplates, saveTemplate, deleteTemplate } from "@/lib/note-templates";
import {
  ArrowLeft, Play, Pause, Square, Mic, AlertTriangle,
  UserPlus, Plus, ChevronDown, MoreHorizontal,
  ClipboardPaste, FileText, Save, CheckCircle2, Sparkles,
  Bold, Italic, Heading2, List, Minus, Copy, ArrowDownToLine,
  Merge, FileDown, Trash2
} from "lucide-react";
import { Utterance } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function NovaConsulta() {
  const data = useAppData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Identification
  const [patientId, setPatientId] = useState("");
  const [clinicianId, setClinicianId] = useState(data.clinicians[0]?.id ?? "");
  const [complaint, setComplaint] = useState("");
  const [location, setLocation] = useState("");
  const [patientSearch, setPatientSearch] = useState("");

  // Quick new patient
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");

  // Manual editor
  const [editorContent, setEditorContent] = useState("");
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // AI result
  const [aiSoapContent, setAiSoapContent] = useState("");
  const [isStreamingAI, setIsStreamingAI] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);

  // Recording
  const [recordingOpen, setRecordingOpen] = useState(true);
  const [recording, setRecording] = useState<"idle" | "recording" | "paused">("idle");
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pastedText, setPastedText] = useState("");
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const speechSupported = isSpeechRecognitionSupported();
  const speech = useSpeechRecognition({ lang: "pt-BR" });

  // Templates
  const [templates, setTemplates] = useState(() => listTemplates());
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  // Timer
  useEffect(() => {
    if (recording === "recording") {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recording]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [speech.utterances.length, speech.interimText]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); navigate(-1); }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); handleSaveDraft(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [patientId, clinicianId, complaint, location, editorContent, timer]);

  const filteredPatients = data.patients.filter(
    (p) => !p.archived && (!patientSearch || p.name.toLowerCase().includes(patientSearch.toLowerCase()))
  );

  // ── Toolbar helpers ──
  const insertMarkdown = (before: string, after: string = "") => {
    const ta = editorRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = editorContent.slice(start, end);
    const newText = editorContent.slice(0, start) + before + selected + after + editorContent.slice(end);
    setEditorContent(newText);
    setTimeout(() => {
      ta.focus();
      const cursorPos = start + before.length + selected.length + after.length;
      ta.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  };

  // ── Recording controls ──
  const handleStart = () => { setRecording("recording"); if (speechSupported) speech.start(); };
  const handlePause = () => { setRecording("paused"); if (speechSupported) speech.pause(); };
  const handleResume = () => { setRecording("recording"); if (speechSupported) speech.resume(); };
  const handleStopRecording = () => {
    setRecording("idle");
    speech.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleCreatePatient = () => {
    if (!newPatientName.trim()) return;
    const p = addPatient({ name: newPatientName, phone: newPatientPhone || undefined });
    setPatientId(p.id);
    setShowNewPatient(false);
    setNewPatientName("");
    setNewPatientPhone("");
    toast({ title: "Paciente criado." });
  };

  // ── Build transcription text from all sources ──
  const getTranscriptionText = useCallback((): string => {
    if (speech.utterances.length > 0) {
      return speech.utterances.map((u) => `${u.speaker === "medico" ? "Médico" : "Paciente"}: ${u.text}`).join("\n");
    }
    if (pastedText.trim()) return pastedText.trim();
    return "";
  }, [speech.utterances, pastedText]);

  // ── Generate AI SOAP ──
  const handleGenerateAI = useCallback(async () => {
    const transcriptionText = getTranscriptionText();
    if (!transcriptionText) {
      toast({ title: "Sem transcrição", description: "Grave áudio ou cole uma transcrição antes de gerar.", variant: "destructive" });
      return;
    }

    // Stop recording if active
    if (recording !== "idle") handleStopRecording();

    // Archive the transcription
    const pat = data.patients.find((p) => p.id === patientId);
    saveTranscription({
      date: new Date().toISOString(),
      patientName: pat?.name || "Não identificado",
      patientId: patientId || "unknown",
      content: transcriptionText,
    });

    // Stream AI
    setIsStreamingAI(true);
    setAiSoapContent("");
    setAiGenerated(false);

    await streamGenerateSoap({
      input: {
        transcription: transcriptionText,
        patientName: pat?.name || "Não identificado",
        chiefComplaint: complaint || "Não informada",
      },
      onDelta: (text) => setAiSoapContent((prev) => prev + text),
      onDone: () => {
        setIsStreamingAI(false);
        setAiGenerated(true);
        toast({ title: "Prontuário IA gerado com sucesso." });
      },
      onError: (msg) => {
        setIsStreamingAI(false);
        toast({ title: "Erro ao gerar prontuário IA", description: msg, variant: "destructive" });
      },
    });
  }, [getTranscriptionText, patientId, complaint, recording, data.patients]);

  // ── Merge & Save ──
  const handleMergeAndSave = useCallback(() => {
    const now = new Date();
    const startedAt = new Date(now.getTime() - timer * 1000).toISOString();
    const endedAt = now.toISOString();

    const enc = addEncounter({
      patientId: patientId || "unknown",
      clinicianId,
      startedAt,
      endedAt,
      durationSec: timer || 60,
      status: "draft",
      chiefComplaint: complaint || undefined,
      location: location || undefined,
    });

    // Build utterances for transcript record
    let utterances: Utterance[];
    let source: "pasted" | "mock" = "pasted";
    if (speech.utterances.length > 0) {
      utterances = speech.utterances;
    } else if (pastedText.trim()) {
      utterances = pastedText.split("\n").filter(Boolean).map((line, i) => ({
        speaker: i % 2 === 0 ? "medico" as const : "paciente" as const,
        text: line.trim(),
        tsSec: i * 10,
      }));
    } else {
      utterances = [{ speaker: "medico" as const, text: editorContent || "(sem transcrição)", tsSec: 0 }];
    }

    const tr = addTranscript({ encounterId: enc.id, source, content: utterances });

    // Merge manual + AI content
    const mergedContent = [editorContent.trim(), aiSoapContent.trim()].filter(Boolean).join("\n\n---\n\n");

    // Parse merged content into sections
    const pat = data.patients.find((p) => p.id === patientId);
    const cli = data.clinicians.find((c) => c.id === clinicianId);
    const baseSections = parseTranscriptToSections(utterances, enc.id, pat?.name, cli?.name, formatDateTimeBR(startedAt));

    // Override with merged content if available
    const sections = baseSections.map((sec) => {
      // Check if merged content has this section header
      const headerPattern = new RegExp(`## ${sec.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n([\\s\\S]*?)(?=\\n## |$)`);
      const match = mergedContent.match(headerPattern);
      if (match && match[1]?.trim()) {
        return { ...sec, content: match[1].trim(), autoGenerated: false };
      }
      return sec;
    });

    const note = addNote({ encounterId: enc.id, templateId: "template_soap_v1", sections });
    updateEncounter(enc.id, { transcriptId: tr.id, noteId: note.id });

    toast({ title: "Prontuário salvo com sucesso." });
    navigate(`/consultas/${enc.id}`);
  }, [patientId, clinicianId, complaint, location, timer, editorContent, aiSoapContent, pastedText, speech.utterances, data]);

  const handleSaveDraft = useCallback(() => {
    const now = new Date();
    const startedAt = new Date(now.getTime() - timer * 1000).toISOString();
    addEncounter({
      patientId: patientId || "unknown",
      clinicianId,
      startedAt,
      durationSec: timer || 0,
      status: "draft",
      chiefComplaint: complaint || undefined,
      location: location || undefined,
    });
    toast({ title: "Rascunho salvo." });
  }, [patientId, clinicianId, complaint, location, timer]);

  const handleDiscard = () => { toast({ title: "Rascunho descartado." }); navigate(-1); };

  const handleSaveTemplateSubmit = () => {
    if (!templateName.trim() || !editorContent.trim()) return;
    saveTemplate(templateName.trim(), editorContent);
    setTemplates(listTemplates());
    setShowSaveTemplate(false);
    setTemplateName("");
    toast({ title: "Modelo salvo." });
  };

  const handleDeleteTemplate = (id: string) => {
    deleteTemplate(id);
    setTemplates(listTemplates());
    toast({ title: "Modelo removido." });
  };

  // Circular timer SVG
  const maxTime = 3600;
  const circumference = 2 * Math.PI * 32;
  const strokeOffset = circumference - (Math.min(timer, maxTime) / maxTime) * circumference;

  const statusBadge = recording === "recording" ? (
    <Badge className="status-recording border text-xs gap-1"><Mic className="h-3 w-3" /> Gravando…</Badge>
  ) : isStreamingAI ? (
    <Badge className="status-reviewed border text-xs gap-1"><Sparkles className="h-3 w-3" /> Gerando IA…</Badge>
  ) : (
    <Badge className="status-draft border text-xs gap-1"><FileText className="h-3 w-3" /> Rascunho</Badge>
  );

  // ── Identification Form ──
  const identificationForm = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Paciente *</Label>
        <Select value={patientId} onValueChange={setPatientId}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            <div className="px-2 pb-2">
              <Input placeholder="Buscar…" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} className="h-8 text-sm" onClick={(e) => e.stopPropagation()} />
            </div>
            {filteredPatients.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            {filteredPatients.length === 0 && <p className="px-2 py-1.5 text-sm text-muted-foreground">Nenhum encontrado</p>}
          </SelectContent>
        </Select>
        {!showNewPatient && (
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => setShowNewPatient(true)}>
            <UserPlus className="mr-1 h-3 w-3" /> Criar paciente
          </Button>
        )}
        {showNewPatient && (
          <div className="rounded-lg glass-surface p-3 space-y-2">
            <Input placeholder="Nome" value={newPatientName} onChange={(e) => setNewPatientName(e.target.value)} className="h-8 text-sm" />
            <Input placeholder="Telefone (opcional)" value={newPatientPhone} onChange={(e) => setNewPatientPhone(e.target.value)} className="h-8 text-sm" />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreatePatient} disabled={!newPatientName.trim()} className="h-7 text-xs"><Plus className="mr-1 h-3 w-3" /> Criar</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowNewPatient(false)} className="h-7 text-xs">Cancelar</Button>
            </div>
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Médico *</Label>
        <Select value={clinicianId} onValueChange={setClinicianId}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {data.clinicians.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Queixa principal</Label>
        <Input value={complaint} onChange={(e) => setComplaint(e.target.value)} placeholder="Ex: Cefaleia persistente" className="h-9" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Local</Label>
        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Consultório 3" className="h-9" />
      </div>
    </div>
  );

  // ── Manual Editor (Left) ──
  const manualEditorPane = (
    <div className="space-y-3 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Prontuário Manual</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
              <FileDown className="h-3.5 w-3.5" /> Inserir modelo
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setEditorContent((prev) => prev ? prev + "\n\n" + getDefaultSoapMarkdown() : getDefaultSoapMarkdown())}>
              <FileText className="mr-2 h-3.5 w-3.5" /> Modelo SOAP padrão
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {templates.length > 0 && (
              <>
                <p className="px-2 py-1 text-xs text-muted-foreground font-medium">Meus modelos</p>
                {templates.map((t) => (
                  <DropdownMenuItem key={t.id} className="flex items-center justify-between group">
                    <span className="flex-1 truncate" onClick={() => setEditorContent((prev) => prev ? prev + "\n\n" + t.content : t.content)}>
                      {t.name}
                    </span>
                    <button
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive transition-opacity"
                      onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => setShowSaveTemplate(true)} disabled={!editorContent.trim()}>
              <Save className="mr-2 h-3.5 w-3.5" /> Salvar modelo atual
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 p-1 rounded-lg glass-surface">
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Negrito (Ctrl+B)" onClick={() => insertMarkdown("**", "**")}>
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Itálico (Ctrl+I)" onClick={() => insertMarkdown("*", "*")}>
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Título H2" onClick={() => insertMarkdown("## ")}>
          <Heading2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Lista" onClick={() => insertMarkdown("- ")}>
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Separador" onClick={() => insertMarkdown("\n---\n")}>
          <Minus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Editor textarea */}
      <Textarea
        ref={editorRef}
        value={editorContent}
        onChange={(e) => setEditorContent(e.target.value)}
        placeholder="Escreva livremente o prontuário ou insira um modelo acima…"
        className="flex-1 min-h-[300px] resize-y font-mono text-sm leading-relaxed"
        onKeyDown={(e) => {
          if (e.ctrlKey || e.metaKey) {
            if (e.key === "b") { e.preventDefault(); insertMarkdown("**", "**"); }
            if (e.key === "i") { e.preventDefault(); insertMarkdown("*", "*"); }
          }
        }}
      />

      {/* Recording collapsible */}
      <Collapsible open={recordingOpen} onOpenChange={setRecordingOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center w-full text-left py-2 px-3 rounded-lg glass-surface hover:bg-accent/10 transition-colors text-sm font-medium gap-2">
            <Mic className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">Gravação / Transcrição</span>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${recordingOpen ? "rotate-0" : "-rotate-90"}`} />
            {recording === "recording" && <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-4">
          {!speechSupported && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground p-3 rounded-lg glass-surface">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Reconhecimento de voz não suportado. Use Chrome ou cole o texto abaixo.</span>
            </div>
          )}

          {/* Timer + controls */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <svg width="64" height="64" className="-rotate-90">
                <circle cx="32" cy="32" r={24} fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                <circle cx="32" cy="32" r={24} fill="none"
                  stroke={recording === "recording" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                  strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 24} strokeDashoffset={2 * Math.PI * 24 - (Math.min(timer, maxTime) / maxTime) * 2 * Math.PI * 24}
                  className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Mic className={`h-4 w-4 ${recording === "recording" ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
              </div>
            </div>
            <div>
              <p className="text-xl font-mono font-semibold tabular-nums">{formatTimer(timer)}</p>
              <p className="text-xs text-muted-foreground">
                {recording === "idle" ? "Pronto" : recording === "recording" ? "Ouvindo…" : "Pausado"}
              </p>
            </div>
            <div className="flex gap-2 ml-auto">
              {recording === "idle" && (
                <Button size="sm" onClick={handleStart} className="gap-1.5">
                  <Play className="h-3.5 w-3.5" /> Iniciar
                </Button>
              )}
              {recording === "recording" && (
                <>
                  <Button variant="secondary" size="sm" onClick={handlePause}><Pause className="h-3.5 w-3.5" /></Button>
                  <Button variant="destructive" size="sm" onClick={handleStopRecording}><Square className="h-3.5 w-3.5" /></Button>
                </>
              )}
              {recording === "paused" && (
                <>
                  <Button size="sm" onClick={handleResume}><Play className="h-3.5 w-3.5" /></Button>
                  <Button variant="destructive" size="sm" onClick={handleStopRecording}><Square className="h-3.5 w-3.5" /></Button>
                </>
              )}
            </div>
          </div>

          {/* Transcript bubbles */}
          <ScrollArea className="h-[150px] rounded-lg glass-surface p-3">
            {speech.utterances.length === 0 && !speech.interimText && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma transcrição ainda.</p>
            )}
            <div className="space-y-2">
              {speech.utterances.map((u, i) => (
                <div key={i} className={`flex ${u.speaker === "medico" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-1.5 text-sm ${u.speaker === "medico" ? "bg-primary/10" : "bg-secondary"}`}>
                    <span className="text-[10px] font-medium text-muted-foreground block mb-0.5">
                      {u.speaker === "medico" ? "Médico" : "Paciente"}
                    </span>
                    {u.text}
                  </div>
                </div>
              ))}
              {speech.interimText && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-lg px-3 py-1.5 text-sm bg-primary/5 text-muted-foreground italic">
                    {speech.interimText}…
                  </div>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>
          </ScrollArea>

          {/* Paste */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5"><ClipboardPaste className="h-3 w-3" /> Colar transcrição</Label>
            <Textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Cole aqui o texto da transcrição (uma fala por linha)…"
              className="min-h-[60px] resize-y text-sm"
              rows={2}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  // ── AI Pane (Right) ──
  const aiPane = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold">Prontuário IA (Cloud)</p>
      </div>

      <div className="flex-1 rounded-xl glass-surface p-4 overflow-auto">
        {!aiSoapContent && !isStreamingAI ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Sparkles className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground max-w-[240px]">
              O prontuário gerado pela IA aparecerá aqui após clicar em "Finalizar e gerar"
            </p>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none text-sm whitespace-pre-wrap leading-relaxed">
            {aiSoapContent}
            {isStreamingAI && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5 rounded-sm" />}
          </div>
        )}
      </div>

      {aiGenerated && (
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => {
              navigator.clipboard.writeText(aiSoapContent);
              toast({ title: "Copiado!" });
            }}
          >
            <Copy className="h-3.5 w-3.5" /> Copiar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => {
              setEditorContent((prev) => prev ? prev + "\n\n" + aiSoapContent : aiSoapContent);
              toast({ title: "Inserido no editor manual." });
            }}
          >
            <ArrowDownToLine className="h-3.5 w-3.5" /> Inserir no editor
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-30 glass-topbar px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold flex-1">Nova Consulta</h1>
        {statusBadge}
      </header>

      {/* ── Main content ── */}
      <div className="flex-1 overflow-y-auto">
        {isMobile ? (
          <Tabs defaultValue="editor" className="px-4 py-4">
            <TabsList className="w-full">
              <TabsTrigger value="editor" className="flex-1">Editor Manual</TabsTrigger>
              <TabsTrigger value="ai" className="flex-1">Prontuário IA</TabsTrigger>
            </TabsList>
            <TabsContent value="editor" className="space-y-4 mt-4">
              {identificationForm}
              {manualEditorPane}
            </TabsContent>
            <TabsContent value="ai" className="mt-4">
              {aiPane}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex gap-5 px-5 py-5 max-w-[1600px] mx-auto h-full">
            {/* Left: identification + editor */}
            <div className="w-1/2 space-y-5 flex flex-col">
              {identificationForm}
              {manualEditorPane}
            </div>
            {/* Right: AI pane */}
            <div className="w-1/2">
              {aiPane}
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky footer ── */}
      <footer className="sticky bottom-0 z-30 glass-topbar px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleSaveDraft} className="gap-1.5">
            <Save className="h-3.5 w-3.5" /> Salvar rascunho
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => navigate(-1)}>Cancelar consulta</DropdownMenuItem>
              <DropdownMenuItem onClick={handleDiscard} className="text-destructive">Descartar rascunho</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          {aiGenerated && (
            <Button onClick={handleMergeAndSave} className="gap-1.5" variant="default">
              <Merge className="h-4 w-4" /> Unir e salvar
            </Button>
          )}
          <Button
            onClick={aiGenerated ? handleMergeAndSave : handleGenerateAI}
            disabled={isStreamingAI}
            className="gap-1.5"
            variant={aiGenerated ? "secondary" : "default"}
          >
            {isStreamingAI ? (
              <><Sparkles className="h-4 w-4 animate-spin" /> Gerando…</>
            ) : aiGenerated ? (
              <><CheckCircle2 className="h-4 w-4" /> Salvar sem unir</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Finalizar e gerar prontuário</>
            )}
          </Button>
        </div>
      </footer>

      {/* Save template dialog */}
      <Dialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Salvar como modelo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Nome do modelo</Label>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Ex: Consulta dermatológica"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSaveTemplate(false)}>Cancelar</Button>
            <Button onClick={handleSaveTemplateSubmit} disabled={!templateName.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
