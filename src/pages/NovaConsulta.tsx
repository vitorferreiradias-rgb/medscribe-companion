import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppData } from "@/hooks/useAppData";
import { addEncounter, addTranscript, addNote, updateEncounter, addPatient } from "@/lib/store";
import { parseTranscriptToSections } from "@/lib/parser";
import { soapTemplate } from "@/lib/soap-template";
import { formatTimer, formatDateTimeBR } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition, isSpeechRecognitionSupported } from "@/hooks/useSpeechRecognition";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ArrowLeft, Play, Pause, Square, Mic, AlertTriangle,
  UserPlus, Plus, ChevronDown, MoreHorizontal, PanelRightClose, PanelRightOpen,
  ClipboardPaste, FileText, Save, CheckCircle2
} from "lucide-react";
import { Utterance } from "@/types";

const mockTranscriptContent: Utterance[] = [
  { speaker: "medico", text: "Bom dia, qual a sua queixa principal?", tsSec: 0 },
  { speaker: "paciente", text: "Doutor, estou com dor de cabeça há 5 dias, piora à noite.", tsSec: 5 },
  { speaker: "medico", text: "Tem alergia a algum medicamento?", tsSec: 14 },
  { speaker: "paciente", text: "Não tenho alergia a nada.", tsSec: 19 },
  { speaker: "medico", text: "Está tomando algum medicamento?", tsSec: 25 },
  { speaker: "paciente", text: "Tomo paracetamol quando a dor é forte.", tsSec: 30 },
  { speaker: "medico", text: "Vou solicitar um exame de imagem. Orientei repouso e retorno em 10 dias.", tsSec: 40 },
];

// Skip identification and non-editable sections for SOAP editor
const editableSections = soapTemplate.sections.filter(
  (s) => !["identification", "interconsultas", "anexos"].includes(s.id)
);

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

  // Notes / SOAP
  const [manualNotes, setManualNotes] = useState("");
  const [soapSections, setSoapSections] = useState<Record<string, string>>(
    () => Object.fromEntries(editableSections.map((s) => [s.id, ""]))
  );
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // Recording
  const [showRecording, setShowRecording] = useState(true);
  const [recording, setRecording] = useState<"idle" | "recording" | "paused">("idle");
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pastedText, setPastedText] = useState("");
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const speechSupported = isSpeechRecognitionSupported();
  const speech = useSpeechRecognition({ lang: "pt-BR" });

  // Generating state
  const [isGenerating, setIsGenerating] = useState(false);

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
      if (e.key === "Escape") {
        e.preventDefault();
        navigate(-1);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSaveDraft();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [patientId, clinicianId, complaint, location, manualNotes, timer]);

  const filteredPatients = data.patients.filter(
    (p) => !p.archived && (!patientSearch || p.name.toLowerCase().includes(patientSearch.toLowerCase()))
  );

  // Recording controls
  const handleStart = () => {
    setRecording("recording");
    if (speechSupported) speech.start();
  };
  const handlePause = () => {
    setRecording("paused");
    if (speechSupported) speech.pause();
  };
  const handleResume = () => {
    setRecording("recording");
    if (speechSupported) speech.resume();
  };
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

  const buildAndFinish = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    speech.stop();
    setIsGenerating(true);

    setTimeout(() => {
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

      // Build utterances
      let utterances: Utterance[];
      let source: "pasted" | "mock" = "mock";

      if (speech.utterances.length > 0) {
        utterances = speech.utterances;
        source = "pasted";
      } else if (pastedText.trim()) {
        source = "pasted";
        utterances = pastedText.split("\n").filter(Boolean).map((line, i) => ({
          speaker: i % 2 === 0 ? "medico" as const : "paciente" as const,
          text: line.trim(),
          tsSec: i * 10,
        }));
      } else if (manualNotes.trim()) {
        source = "pasted";
        utterances = [{ speaker: "medico" as const, text: manualNotes.trim(), tsSec: 0 }];
      } else {
        utterances = mockTranscriptContent;
      }

      // Prepend manual notes if we also have transcription
      if (manualNotes.trim() && (speech.utterances.length > 0 || pastedText.trim())) {
        utterances = [{ speaker: "medico" as const, text: manualNotes.trim(), tsSec: 0 }, ...utterances];
      }

      const tr = addTranscript({ encounterId: enc.id, source, content: utterances });
      const pat = data.patients.find((p) => p.id === patientId);
      const cli = data.clinicians.find((c) => c.id === clinicianId);
      const sections = parseTranscriptToSections(utterances, enc.id, pat?.name, cli?.name, formatDateTimeBR(startedAt));

      // Merge any manually-filled SOAP sections over generated ones
      const mergedSections = sections.map((sec) => {
        const soapKey = soapTemplate.sections.find((t) => sec.title === t.title)?.id;
        if (soapKey && soapSections[soapKey]?.trim()) {
          return { ...sec, content: soapSections[soapKey], autoGenerated: false };
        }
        return sec;
      });

      const note = addNote({ encounterId: enc.id, templateId: "template_soap_v1", sections: mergedSections });
      updateEncounter(enc.id, { transcriptId: tr.id, noteId: note.id });

      toast({ title: "Consulta finalizada com sucesso." });
      navigate(`/consultas/${enc.id}`);
    }, 500);
  }, [patientId, clinicianId, complaint, location, timer, manualNotes, pastedText, speech.utterances, soapSections, data]);

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

  const handleDiscard = () => {
    toast({ title: "Rascunho descartado." });
    navigate(-1);
  };

  // Circular timer SVG
  const maxTime = 3600;
  const circumference = 2 * Math.PI * 32;
  const strokeOffset = circumference - (Math.min(timer, maxTime) / maxTime) * circumference;

  const statusBadge = recording === "recording" ? (
    <Badge className="status-recording border text-xs gap-1"><Mic className="h-3 w-3" /> Gravando…</Badge>
  ) : (
    <Badge className="status-draft border text-xs gap-1"><FileText className="h-3 w-3" /> Rascunho</Badge>
  );

  // ── Prontuário column content ──
  const prontuarioContent = (
    <div className="space-y-5">
      {/* Identification */}
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

      {/* Main anamnesis textarea */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">Anamnese / Observações</Label>
        <Textarea
          value={manualNotes}
          onChange={(e) => setManualNotes(e.target.value)}
          placeholder="Descreva a anamnese, exame físico, hipóteses e plano…"
          className="min-h-[200px] resize-y"
        />
      </div>

      {/* Collapsible SOAP sections */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Seções do Prontuário (SOAP)</p>
        {editableSections.map((sec) => (
          <Collapsible
            key={sec.id}
            open={openSections[sec.id] ?? false}
            onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, [sec.id]: open }))}
          >
            <CollapsibleTrigger asChild>
              <button className="flex items-center w-full text-left py-2 px-3 rounded-md hover:bg-accent/50 transition-colors text-sm font-medium gap-2">
                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${openSections[sec.id] ? "rotate-0" : "-rotate-90"}`} />
                {sec.title}
                {soapSections[sec.id]?.trim() && <span className="ml-auto text-xs text-success">●</span>}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 pb-2">
              <Textarea
                value={soapSections[sec.id]}
                onChange={(e) => setSoapSections((prev) => ({ ...prev, [sec.id]: e.target.value }))}
                placeholder={sec.hint}
                className="min-h-[80px] resize-y text-sm"
                rows={3}
              />
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );

  // ── Recording column content ──
  const recordingContent = (
    <div className="space-y-4">
      {!speechSupported && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground p-3 rounded-lg glass-surface">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Reconhecimento de voz não suportado. Use Chrome ou cole o texto abaixo.</span>
        </div>
      )}

      {/* Timer */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <svg width="96" height="96" className="-rotate-90">
            <circle cx="48" cy="48" r={32} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
            <circle
              cx="48" cy="48" r={32} fill="none"
              stroke={recording === "recording" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
              strokeWidth="4" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Mic className={`h-5 w-5 ${recording === "recording" ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
          </div>
        </div>
        <p className="text-2xl font-mono font-semibold tabular-nums">{formatTimer(timer)}</p>
        <p className="text-xs text-muted-foreground">
          {recording === "idle" ? "Pronto para gravar" : recording === "recording" ? "Ouvindo…" : "Pausado"}
        </p>

        {/* Controls */}
        <div className="flex gap-2">
          {recording === "idle" && (
            <Button size="sm" onClick={handleStart} className="gap-1.5">
              <Play className="h-3.5 w-3.5" /> Iniciar gravação
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

      {/* Transcription */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Transcrição</p>
        <ScrollArea className="h-[200px] rounded-lg glass-surface p-3">
          {speech.utterances.length === 0 && !speech.interimText && (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma transcrição ainda.</p>
          )}
          <div className="space-y-2">
            {speech.utterances.map((u, i) => (
              <div key={i} className={`flex ${u.speaker === "medico" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-1.5 text-sm ${u.speaker === "medico" ? "bg-primary/10 text-foreground" : "bg-secondary text-foreground"}`}>
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
      </div>

      {/* Paste text */}
      <div className="space-y-1.5">
        <Label className="text-xs flex items-center gap-1.5"><ClipboardPaste className="h-3 w-3" /> Colar transcrição</Label>
        <Textarea
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          placeholder="Cole aqui o texto da transcrição (uma fala por linha)…"
          className="min-h-[80px] resize-y text-sm"
          rows={3}
        />
      </div>
    </div>
  );

  if (isGenerating) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md text-center">
          <p className="text-sm text-muted-foreground">Gerando prontuário…</p>
          <div className="space-y-3 px-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-4 mx-auto animate-pulse" style={{ width: `${60 + Math.random() * 30}%`, animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-30 glass-topbar px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold flex-1">Nova Consulta</h1>
        {statusBadge}
        {!isMobile && (
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => setShowRecording(!showRecording)}>
            {showRecording ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            {showRecording ? "Ocultar gravação" : "Mostrar gravação"}
          </Button>
        )}
      </header>

      {/* ── Main content ── */}
      <div className="flex-1 overflow-y-auto">
        {isMobile ? (
          <Tabs defaultValue="prontuario" className="px-4 py-4">
            <TabsList className="w-full">
              <TabsTrigger value="prontuario" className="flex-1">Prontuário</TabsTrigger>
              <TabsTrigger value="gravacao" className="flex-1">Gravação</TabsTrigger>
            </TabsList>
            <TabsContent value="prontuario">{prontuarioContent}</TabsContent>
            <TabsContent value="gravacao">{recordingContent}</TabsContent>
          </Tabs>
        ) : (
          <div className="flex gap-5 px-5 py-5 max-w-[1440px] mx-auto">
            <div className={showRecording ? "w-[65%]" : "w-full"}>
              {prontuarioContent}
            </div>
            {showRecording && (
              <div className="w-[35%] sticky top-20 self-start">
                <div className="rounded-xl glass-surface p-4">
                  {recordingContent}
                </div>
              </div>
            )}
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
              <DropdownMenuItem onClick={() => { navigate(-1); }}>Cancelar consulta</DropdownMenuItem>
              <DropdownMenuItem onClick={handleDiscard} className="text-destructive">Descartar rascunho</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button onClick={buildAndFinish} className="gap-1.5">
          <CheckCircle2 className="h-4 w-4" /> Finalizar e gerar prontuário
        </Button>
      </footer>
    </div>
  );
}
