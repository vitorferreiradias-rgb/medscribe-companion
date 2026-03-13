import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO, isValid, subDays, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft, Edit3, Save, X, MoreVertical, Trash2, Pencil, Check,
  Plus, CalendarIcon, Heart, MapPin, Users, Activity, Megaphone,
  AlertTriangle, FileText, Search, Copy, Clock, Stethoscope, FolderOpen,
  Camera, ImageIcon, Eye, ZoomIn, TrendingUp, Weight, StickyNote, Sparkles, Loader2, Upload,
  User, UserRound, ArrowRight, Target, ScanSearch, GitCompareArrows,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppData } from "@/hooks/useAppData";
import { updatePatient, deletePatient, duplicateEncounter, deleteEncounter } from "@/lib/store";
import { useEvolutionPhotos, useAddEvolutionPhoto, useDeleteEvolutionPhoto, useUpdateEvolutionPhoto, useReplaceEvolutionPhoto, useAvaliacoesCorporais, usePatientLabResults, useAddPatientLabResult, useDeletePatientLabResult } from "@/hooks/useSupabaseData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { FlaskConical } from "lucide-react";
import { useRef } from "react";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { differenceInYears, differenceInMonths } from "date-fns";
import { StatusBadge } from "@/components/StatusBadge";

import { AvaliacoesCorporaisCard } from "@/components/AvaliacoesCorporaisCard";
import { AnalysisResultModal } from "@/components/AnalysisResultModal";
import { EvolutionPhotoSelector } from "@/components/EvolutionPhotoSelector";
import { SessionPhotoUploader } from "@/components/SessionPhotoUploader";
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

const GOAL_OPTIONS = [
  { value: "emagrecimento", label: "Emagrecimento" },
  { value: "hipertrofia", label: "Hipertrofia" },
  { value: "recomposicao", label: "Recomposição corporal" },
  { value: "pos_bariatrica", label: "Pós-bariátrica" },
  { value: "manutencao", label: "Manutenção" },
  { value: "outro", label: "Análise focal (manchas, lesões, dermatites...)" },
];

function toggleGoal(current: string, value: string): string {
  const goals = current ? current.split(",").filter(Boolean) : [];
  const idx = goals.indexOf(value);
  if (idx >= 0) goals.splice(idx, 1);
  else goals.push(value);
  return goals.join(",");
}

function GoalCheckboxGroup({ value, onChange, compact }: { value: string; onChange: (v: string) => void; compact?: boolean }) {
  const selected = value ? value.split(",").filter(Boolean) : [];
  return (
    <div className={cn("space-y-1.5", compact && "space-y-1")}>
      <Label className="text-xs text-muted-foreground">Objetivo do tratamento</Label>
      <div className={cn("grid gap-1.5", compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3")}>
        {GOAL_OPTIONS.map((opt) => (
          <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer text-sm">
            <Checkbox
              checked={selected.includes(opt.value)}
              onCheckedChange={() => onChange(toggleGoal(value, opt.value))}
              className="h-3.5 w-3.5"
            />
            <span className={compact ? "text-xs" : "text-sm"}>{opt.label}</span>
          </label>
        ))}
      </div>
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
  const [evoSubTab, setEvoSubTab] = useState<"corpo" | "focal">("corpo");
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [currentSessaoId, setCurrentSessaoId] = useState(() => crypto.randomUUID());
  const [sessionSaving, setSessionSaving] = useState(false);
  const [showMultiUpload, setShowMultiUpload] = useState(false);
  const [multiUploadLoading, setMultiUploadLoading] = useState(false);
  const [compareIds, setCompareIds] = useState<[string, string] | null>(null);
  const [zoomPhotoId, setZoomPhotoId] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [singleAnalysisId, setSingleAnalysisId] = useState<string | null>(null);
  const [singleAnalysisResult, setSingleAnalysisResult] = useState<Record<string, string>>({});
  const [singleAnalysisLoading, setSingleAnalysisLoading] = useState<string | null>(null);
  const [editingAnalysisId, setEditingAnalysisId] = useState<string | null>(null);
  const [editingAnalysisText, setEditingAnalysisText] = useState("");
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [analysisModalResult, setAnalysisModalResult] = useState("");
  const [analysisModalType, setAnalysisModalType] = useState<string>("");
  const [focalCompareLoading, setFocalCompareLoading] = useState<string | null>(null);
  const [focalCompareResult, setFocalCompareResult] = useState<Record<string, string>>({});

  // Inline photo editing (session-based)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editHeight, setEditHeight] = useState("");
  const [editWaist, setEditWaist] = useState("");
  const [editGoal, setEditGoal] = useState("");
  const [editBodyFat, setEditBodyFat] = useState("");

  const { data: dbEvolutionPhotos = [] } = useEvolutionPhotos(id);
  const addEvolutionPhotoMutation = useAddEvolutionPhoto();
  const deleteEvolutionPhotoMutation = useDeleteEvolutionPhoto();
  const updateEvolutionPhotoMutation = useUpdateEvolutionPhoto();
  const replaceEvolutionPhotoMutation = useReplaceEvolutionPhoto();
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [replacingPhotoId, setReplacingPhotoId] = useState<string | null>(null);
  const [replacingPhotoPath, setReplacingPhotoPath] = useState<string | null>(null);
  const { refetch: refetchAvaliacoes } = useAvaliacoesCorporais(id);
  const { data: labResults = [], refetch: refetchLabResults } = usePatientLabResults(id);
  const addLabResultMutation = useAddPatientLabResult();
  const deleteLabResultMutation = useDeletePatientLabResult();

  // Lab results form state
  const [showLabForm, setShowLabForm] = useState(false);
  const [labName, setLabName] = useState("");
  const [labDate, setLabDate] = useState("");
  const [labType, setLabType] = useState<"laboratorial" | "biopsia">("laboratorial");
  const [labResult, setLabResult] = useState("");
  const [labReference, setLabReference] = useState("");
  const [labNotes, setLabNotes] = useState("");

  // Lab import from file
  interface ExtractedLabResult { name: string; result: string; reference_range?: string | null; type: "laboratorial" | "biopsia"; date?: string | null; }
  const [importedLabs, setImportedLabs] = useState<ExtractedLabResult[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const labFileInputRef = useRef<HTMLInputElement>(null);

  const handleLabFileImport = useCallback(async (file: File) => {
    setImportLoading(true);
    try {
      const isImage = file.type.startsWith("image/");
      let body: any = {};
      if (isImage) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
          reader.readAsDataURL(file);
        });
        body = { imageBase64: base64, mimeType: file.type };
      } else {
        const text = await file.text();
        body = { textContent: text };
      }

      const { data, error } = await supabase.functions.invoke("extract-lab-results", { body });
      if (error) throw error;
      if (data?.results?.length) {
        setImportedLabs(data.results);
        setShowImportPreview(true);
      } else {
        toast({ title: "Nenhum exame encontrado", description: "A IA não conseguiu identificar exames no documento.", variant: "destructive" });
      }
    } catch (e: any) {
      console.error("Import error:", e);
      toast({ title: "Erro ao importar", description: e?.message || "Não foi possível processar o arquivo.", variant: "destructive" });
    } finally {
      setImportLoading(false);
      if (labFileInputRef.current) labFileInputRef.current.value = "";
    }
  }, [toast]);

  const handleConfirmImport = useCallback(async () => {
    if (!id) return;
    setImportLoading(true);
    try {
      for (const lab of importedLabs) {
        await addLabResultMutation.mutateAsync({
          patient_id: id,
          date: lab.date || new Date().toISOString().slice(0, 10),
          type: lab.type,
          name: lab.name,
          result: lab.result,
          reference_range: lab.reference_range || undefined,
        });
      }
      toast({ title: "Exames importados", description: `${importedLabs.length} exame(s) adicionado(s) com sucesso.` });
      setImportedLabs([]);
      setShowImportPreview(false);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e?.message || "Falha ao salvar exames.", variant: "destructive" });
    } finally {
      setImportLoading(false);
    }
  }, [id, importedLabs, addLabResultMutation, toast]);
  const handleConsolidatedAnalysis = useCallback(async (photoPaths: string[], action: "composition" | "compare" | "evolution") => {
    if (!id || !patient) return;
    setMultiUploadLoading(true);

    const objectiveMap: Record<string, string> = {
      composition: "Avaliação corporal consolidada",
      compare: "Comparação simples entre fotos",
      evolution: "Relatório de evolução completa",
    };

    try {
      const { data: avaliacao, error: insertError } = await supabase
        .from("avaliacoes_corporais" as any)
        .insert({
          patient_id: id,
          photo_paths: photoPaths,
          status: "pending",
          analysis_objective: objectiveMap[action],
        } as any)
        .select()
        .single();

      if (insertError) throw new Error(`Falha ao criar avaliação: ${insertError.message}`);

      const avaliacaoId = (avaliacao as any).id;

      const contextParts: string[] = [];
      if (patient.sex) contextParts.push(`Sexo: ${patient.sex}`);
      if (patient.birthDate) contextParts.push(`Data de nascimento: ${patient.birthDate}`);
      if (patient.diagnoses?.length) contextParts.push(`Diagnósticos: ${patient.diagnoses.join(", ")}`);
      if (patient.drugAllergies?.length) contextParts.push(`Alergias: ${patient.drugAllergies.join(", ")}`);

      // Extract anthropometric data from selected photos
      const selectedPhotos = dbEvolutionPhotos.filter((p: any) => photoPaths.includes(p.image_path));
      const photoWithWeight = selectedPhotos.find((p: any) => p.weight);
      const photoWithHeight = selectedPhotos.find((p: any) => p.height);
      const photoWithWaist = selectedPhotos.find((p: any) => p.waist_circumference);
      const anthropometrics: Record<string, number> = {};
      if (photoWithWeight?.weight) anthropometrics.weight = Number(photoWithWeight.weight);
      if (photoWithHeight?.height) anthropometrics.height = Number(photoWithHeight.height);
      if (photoWithWaist?.waist_circumference) anthropometrics.waistCircumference = Number(photoWithWaist.waist_circumference);
      const photoWithBodyFat = selectedPhotos.find((p: any) => p.body_fat_percentage);
      if (photoWithBodyFat?.body_fat_percentage) anthropometrics.bodyFatPercentage = Number(photoWithBodyFat.body_fat_percentage);

      // For evolution: build per-session anthropometric data + time interval + reuse previous analysis
      let sessionData: any = undefined;
      let previousAnalysis: string | undefined = undefined;
      let session2PhotoPaths: string[] | undefined = undefined;
      if (action === "evolution" && selectedPhotos.length >= 2) {
        const bySession: Record<string, any[]> = {};
        selectedPhotos.forEach((p: any) => {
          const key = p.sessao_id || p.date;
          if (!bySession[key]) bySession[key] = [];
          bySession[key].push(p);
        });
        const sessionKeys = Object.keys(bySession);
        if (sessionKeys.length === 2) {
          const extractSessionAnthro = (photos: any[]) => {
            const w = photos.find((p: any) => p.weight);
            const h = photos.find((p: any) => p.height);
            const wc = photos.find((p: any) => p.waist_circumference);
            const bf = photos.find((p: any) => p.body_fat_percentage);
            return {
              weight: w?.weight ? Number(w.weight) : undefined,
              height: h?.height ? Number(h.height) : undefined,
              waistCircumference: wc?.waist_circumference ? Number(wc.waist_circumference) : undefined,
              bodyFatPercentage: bf?.body_fat_percentage ? Number(bf.body_fat_percentage) : undefined,
            };
          };
          const dates = sessionKeys.map(k => bySession[k][0]?.date).sort();
          const date1 = new Date(dates[0]);
          const date2 = new Date(dates[1]);
          const diffDays = Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));

          // Sort sessions chronologically
          const sortedKeys = sessionKeys.sort((a, b) => {
            const dA = bySession[a][0]?.date || "";
            const dB = bySession[b][0]?.date || "";
            return dA.localeCompare(dB);
          });

          sessionData = {
            session1: {
              date: bySession[sortedKeys[0]][0]?.date,
              anthropometrics: extractSessionAnthro(bySession[sortedKeys[0]]),
            },
            session2: {
              date: bySession[sortedKeys[1]][0]?.date,
              anthropometrics: extractSessionAnthro(bySession[sortedKeys[1]]),
            },
            intervalDays: diffDays,
          };

          // Try to find existing completed analysis for session 1 photos
          const session1Paths = bySession[sortedKeys[0]].map((p: any) => p.image_path);
          session2PhotoPaths = bySession[sortedKeys[1]].map((p: any) => p.image_path);
          try {
            const { data: existingAnalyses } = await supabase
              .from("avaliacoes_corporais" as any)
              .select("resultado_analise_ia, photo_paths")
              .eq("patient_id", id)
              .eq("status", "completed")
              .not("resultado_analise_ia", "is", null);
            
            if (existingAnalyses) {
              // Find an analysis whose photo_paths match session 1's photos
              const match = (existingAnalyses as any[]).find((a: any) => {
                const aPaths = a.photo_paths || [];
                return session1Paths.length > 0 && 
                  session1Paths.every((p: string) => aPaths.includes(p)) &&
                  aPaths.every((p: string) => session1Paths.includes(p));
              });
              if (match?.resultado_analise_ia) {
                previousAnalysis = match.resultado_analise_ia;
              }
            }
          } catch (e) {
            console.warn("Could not fetch previous analysis, will analyze both sessions:", e);
          }
        }
      }

      const { data: fnData, error: fnError } = await supabase.functions.invoke("consolidated-analysis", {
        body: {
          avaliacaoId,
          photoPaths: previousAnalysis && session2PhotoPaths ? session2PhotoPaths : photoPaths,
          action,
          patientContext: contextParts.length > 0 ? contextParts.join(". ") : undefined,
          anthropometrics: Object.keys(anthropometrics).length > 0 ? anthropometrics : undefined,
          sessionData,
          previousAnalysis,
        },
      });

      if (fnError) throw new Error(`Falha na análise: ${fnError.message}`);

      refetchAvaliacoes();
      setShowMultiUpload(false);

      // Open result modal
      if (fnData?.analysis) {
        setAnalysisModalResult(fnData.analysis);
        setAnalysisModalType(action);
        setAnalysisModalOpen(true);
      }

      toast({
        title: "Avaliação concluída",
        description: action === "compare"
          ? "A comparação foi gerada com sucesso."
          : action === "evolution"
          ? "O relatório de evolução foi gerado com sucesso."
          : "O relatório de composição corporal foi gerado com sucesso.",
      });
    } catch (err: any) {
      console.error("Consolidated analysis error:", err);
      toast({
        title: "Erro na avaliação",
        description: err.message || "Ocorreu um erro ao processar a avaliação.",
        variant: "destructive",
      });
      refetchAvaliacoes();
    } finally {
      setMultiUploadLoading(false);
    }
  }, [id, patient, toast, refetchAvaliacoes]);

  const handleSessionSubmit = async (data: {
    photos: { file: File; angle: string; focusLabel?: string }[];
    label: string;
    date: string;
    weight?: number;
    height?: number;
    waistCircumference?: number;
    bodyFatPercentage?: number;
    treatmentGoal?: string;
    notes?: string;
    sessaoId: string;
  }) => {
    if (!id || !patient) return;
    setSessionSaving(true);
    try {
      for (const photo of data.photos) {
        await addEvolutionPhotoMutation.mutateAsync({
          patientId: id,
          file: photo.file,
          label: data.label,
          date: data.date,
          notes: data.notes,
          weight: data.weight,
          angle: photo.angle,
          height: data.height,
          waist_circumference: data.waistCircumference,
          treatment_goal: data.treatmentGoal,
          analysis_focus: photo.focusLabel || undefined,
          sessao_id: data.sessaoId,
          body_fat_percentage: data.bodyFatPercentage,
        });
      }
      toast({ title: `${data.photos.length} foto${data.photos.length > 1 ? "s" : ""} salva${data.photos.length > 1 ? "s" : ""} com sucesso.` });
      setShowPhotoForm(false);
    } catch (err: any) {
      toast({ title: "Erro ao salvar fotos", description: err.message, variant: "destructive" });
    } finally {
      setSessionSaving(false);
    }
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

  const startEditPhoto = (photo: any) => {
    const sessaoId = photo.sessao_id || photo.id;
    setEditingSessionId(sessaoId);
    setEditingPhotoId(photo.id);
    setEditLabel(photo.label || "");
    setEditDate(photo.date || "");
    setEditWeight(photo.weight?.toString() || "");
    setEditNotes(photo.notes || "");
    setEditHeight((photo as any).height?.toString() || "");
    setEditWaist((photo as any).waist_circumference?.toString() || "");
    setEditGoal((photo as any).treatment_goal || "");
    setEditBodyFat((photo as any).body_fat_percentage?.toString() || "");
  };

  const getSessionPhotos = (sessaoId: string) => {
    return evolutionPhotos.filter((p: any) => (p.sessao_id || p.id) === sessaoId);
  };

  const saveEditPhoto = () => {
    if (!editingSessionId) return;
    const sessionPhotos = getSessionPhotos(editingSessionId);
    const sharedUpdates = {
      label: editLabel || "Registro",
      date: editDate || undefined,
      weight: editWeight ? parseFloat(editWeight) : null,
      notes: editNotes || null,
      height: editHeight ? parseFloat(editHeight) : null,
      waist_circumference: editWaist ? parseFloat(editWaist) : null,
      treatment_goal: editGoal || null,
      body_fat_percentage: editBodyFat ? parseFloat(editBodyFat) : null,
    };
    for (const photo of sessionPhotos) {
      updateEvolutionPhotoMutation.mutate({
        id: photo.id,
        updates: sharedUpdates as any,
      });
    }
    setEditingSessionId(null);
    setEditingPhotoId(null);
  };

  const cancelEditPhoto = () => { setEditingSessionId(null); setEditingPhotoId(null); };

  const evolutionPhotos = useMemo(() =>
    [...dbEvolutionPhotos].sort((a, b) => a.date.localeCompare(b.date)),
    [dbEvolutionPhotos]
  );

  // Group photos by sessao_id for timeline display
  const ANGLE_ORDER: Record<string, number> = { frente: 0, frontal: 0, perfil: 1, lateral_direito: 1, lateral_esquerdo: 2, costas: 3, posterior: 3, outro: 99 };
  const sessionGroups = useMemo(() => {
    const groups: Record<string, typeof evolutionPhotos> = {};
    for (const photo of evolutionPhotos) {
      const key = (photo as any).sessao_id || photo.id;
      if (!groups[key]) groups[key] = [];
      groups[key].push(photo);
    }
    // Sort groups by earliest date, and photos within each group by angle order (F→P→C)
    return Object.entries(groups)
      .map(([sessaoId, photos]) => ({
        sessaoId,
        photos: [...photos].sort((a, b) => (ANGLE_ORDER[(a as any).angle] ?? 50) - (ANGLE_ORDER[(b as any).angle] ?? 50)),
      }))
      .sort((a, b) => a.photos[0].date.localeCompare(b.photos[0].date));
  }, [evolutionPhotos]);

  // Initialize analysis results from saved DB data
  useMemo(() => {
    const saved: Record<string, string> = {};
    dbEvolutionPhotos.forEach((p: any) => {
      if (p.ai_analysis) saved[p.id] = p.ai_analysis;
    });
    if (Object.keys(saved).length > 0) {
      setSingleAnalysisResult(prev => {
        const merged = { ...saved, ...prev };
        return merged;
      });
    }
  }, [dbEvolutionPhotos]);

  const comparePhotos = useMemo(() => {
    if (!compareIds || !compareIds[1]) return null;
    const a = evolutionPhotos.find(p => p.id === compareIds[0]);
    const b = evolutionPhotos.find(p => p.id === compareIds[1]);
    if (!a || !b) return null;
    return a.date <= b.date ? [a, b] as const : [b, a] as const;
  }, [compareIds, evolutionPhotos]);

  // Build patient context for AI analysis
  const buildPatientContext = (photos: { before?: any; after?: any }) => {
    const angleLabels: Record<string, string> = { frente: "Frente", perfil: "Perfil", costas: "Costas", frontal: "Frontal", posterior: "Posterior", lateral_direito: "Lateral Direito", lateral_esquerdo: "Lateral Esquerdo", outro: "Outro (focal)" };
    const contextParts: string[] = [];

    if (patient?.birthDate) {
      const age = differenceInYears(new Date(), parseISO(patient.birthDate));
      contextParts.push(`Idade: ${age} anos`);
    }
    if (patient?.sex) {
      const sexLabels: Record<string, string> = { M: "Masculino", F: "Feminino", NA: "Não informado" };
      contextParts.push(`Sexo: ${sexLabels[patient.sex] || patient.sex}`);
    }
    if (patient?.diagnoses?.length) contextParts.push(`Diagnósticos: ${patient.diagnoses.join(", ")}`);
    if (patient?.drugAllergies?.length) contextParts.push(`Alergias medicamentosas: ${patient.drugAllergies.join(", ")}`);

    const { before, after } = photos;
    if (before?.weight) contextParts.push(`Peso${after ? " antes" : ""}: ${before.weight}kg`);
    if (after?.weight) contextParts.push(`Peso depois: ${after.weight}kg`);
    if (before?.height) contextParts.push(`Altura${after ? " antes" : ""}: ${before.height}cm`);
    if (after?.height) contextParts.push(`Altura depois: ${after.height}cm`);
    if (before?.waist_circumference) contextParts.push(`Circunferência abdominal${after ? " antes" : ""}: ${before.waist_circumference}cm`);
    if (after?.waist_circumference) contextParts.push(`Circunferência abdominal depois: ${after.waist_circumference}cm`);
    if (before?.treatment_goal) contextParts.push(`Objetivo do tratamento${after ? " (antes)" : ""}: ${before.treatment_goal}`);
    if (after?.treatment_goal) contextParts.push(`Objetivo do tratamento (depois): ${after.treatment_goal}`);
    if (before?.angle) contextParts.push(`Ângulo foto${after ? " antes" : ""} (informado pelo médico): ${angleLabels[before.angle] || before.angle}`);
    if (after?.angle) contextParts.push(`Ângulo foto depois (informado pelo médico): ${angleLabels[after.angle] || after.angle}`);

    const isFocal = before?.angle === "outro" || after?.angle === "outro";
    const focusText = before?.analysis_focus || after?.analysis_focus;
    if (isFocal && focusText) {
      contextParts.push(`FOCO DA ANÁLISE: ${focusText}`);
      if (before?.notes) contextParts.push(`Observações clínicas${after ? " (antes)" : ""}: ${before.notes}`);
      if (after?.notes) contextParts.push(`Observações clínicas (depois): ${after.notes}`);
    } else {
      if (before?.notes) contextParts.push(`Notas${after ? " antes" : ""}: ${before.notes}`);
      if (after?.notes) contextParts.push(`Notas depois: ${after.notes}`);
    }

    // Include photo dates for temporal correlation
    if (before?.date) {
      const dateLabel = before.date;
      try { const d = parseISO(before.date); if (isValid(d)) contextParts.push(`Data da foto${after ? " ANTES" : ""}: ${format(d, "dd/MM/yyyy")}`); } catch {}
    }
    if (after?.date) {
      try { const d = parseISO(after.date); if (isValid(d)) contextParts.push(`Data da foto DEPOIS: ${format(d, "dd/MM/yyyy")}`); } catch {}
    }

    // Build lab data as separate string for AI prominence
    let labData = "";
    if (labResults.length > 0) {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const recentLabs = labResults.filter(r => {
        try { return isAfter(parseISO(r.date), oneYearAgo); } catch { return false; }
      });
      if (recentLabs.length > 0) {
        const labDataParts: string[] = [];
        const labs = recentLabs.filter(r => r.type === "laboratorial");
        const biopsias = recentLabs.filter(r => r.type === "biopsia");
        if (biopsias.length > 0) {
          labDataParts.push(`Biópsias: ${biopsias.map(r => { let t = `${r.name}: ${r.result}`; if (r.notes) t += ` (${r.notes})`; try { t += ` em ${format(parseISO(r.date), "dd/MM/yyyy")}`; } catch {} return t; }).join("; ")}`);
        }
        if (labs.length > 0) {
          labDataParts.push(`Exames laboratoriais: ${labs.map(r => { let t = `${r.name}: ${r.result}`; if (r.reference_range) t += ` (ref: ${r.reference_range})`; try { t += ` em ${format(parseISO(r.date), "dd/MM/yyyy")}`; } catch {} return t; }).join("; ")}`);
        }
        labData = labDataParts.join("\n");
      }
    }

    return { context: contextParts.join(". "), labData };
  };

  const handleAiCompare = async () => {
    if (!comparePhotos) return;
    setAiAnalysisLoading(true);
    setAiAnalysis(null);
    try {
      const { context, labData } = buildPatientContext({ before: comparePhotos[0], after: comparePhotos[1] });
      const { data, error } = await supabase.functions.invoke("evolution-compare", {
        body: {
          beforeImagePath: comparePhotos[0].image_path,
          afterImagePath: comparePhotos[1].image_path,
          patientContext: context || undefined,
          labData: labData || undefined,
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

  // Filtered session groups for sub-tabs
  const bodySessionGroups = useMemo(() => {
    return sessionGroups
      .map(g => ({ ...g, photos: g.photos.filter((p: any) => p.angle !== "outro") }))
      .filter(g => g.photos.length > 0);
  }, [sessionGroups]);

  const focalSessionGroups = useMemo(() => {
    return sessionGroups
      .map(g => ({ ...g, photos: g.photos.filter((p: any) => p.angle === "outro") }))
      .filter(g => g.photos.length > 0);
  }, [sessionGroups]);


  const handleSinglePhotoAnalysis = async (photo: any) => {
    setSingleAnalysisLoading(photo.id);
    setSingleAnalysisId(photo.id);
    try {
      const { context, labData } = buildPatientContext({ before: photo });
      const { data, error } = await supabase.functions.invoke("evolution-compare", {
        body: {
          beforeImagePath: photo.image_path,
          patientContext: context || undefined,
          labData: labData || undefined,
        },
      });
      if (error) throw error;
      setSingleAnalysisResult(prev => ({ ...prev, [photo.id]: data?.analysis || "Não foi possível gerar a análise." }));
    } catch (err: any) {
      toast({ title: "Erro na análise com IA", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setSingleAnalysisLoading(null);
    }
  };

  const handleFocalCompare = async (sessaoId: string, focalPhotos: any[]) => {
    if (focalPhotos.length < 2) return;
    setFocalCompareLoading(sessaoId);
    try {
      // Build context from first and last photo for patient data
      const { context, labData } = buildPatientContext({ before: focalPhotos[0], after: focalPhotos[focalPhotos.length - 1] });
      const { data, error } = await supabase.functions.invoke("evolution-compare", {
        body: {
          imagePaths: focalPhotos.map((p: any) => p.image_path),
          patientContext: context || undefined,
          labData: labData || undefined,
        },
      });
      if (error) throw error;
      setFocalCompareResult(prev => ({ ...prev, [sessaoId]: data?.analysis || "Não foi possível gerar a análise." }));
    } catch (err: any) {
      toast({ title: "Erro na comparação focal", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setFocalCompareLoading(null);
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
        <TabsList className="w-full grid grid-cols-7 h-9">
          <TabsTrigger value="resumo" className="text-xs">Resumo</TabsTrigger>
          <TabsTrigger value="consultas" className="text-xs">Consultas</TabsTrigger>
          <TabsTrigger value="evolucao" className="text-xs">Evolução</TabsTrigger>
          <TabsTrigger value="exames" className="text-xs">Exames</TabsTrigger>
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
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Camera className="h-4 w-4 text-primary" /> Timeline de Evolução
                </CardTitle>
              </div>
              <div className="flex gap-1 mt-2">
                <Button
                  variant={evoSubTab === "corpo" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setEvoSubTab("corpo")}
                >
                  <Camera className="h-3 w-3" /> Composição Corporal
                  {bodySessionGroups.length > 0 && (
                    <Badge variant={evoSubTab === "corpo" ? "secondary" : "outline"} className="text-[10px] py-0 h-4 ml-0.5">{bodySessionGroups.length}</Badge>
                  )}
                </Button>
                <Button
                  variant={evoSubTab === "focal" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setEvoSubTab("focal")}
                >
                  <ScanSearch className="h-3 w-3" /> Análise Focal
                  {focalSessionGroups.length > 0 && (
                    <Badge variant={evoSubTab === "focal" ? "secondary" : "outline"} className="text-[10px] py-0 h-4 ml-0.5">{focalSessionGroups.length}</Badge>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              {(() => {
                const activeGroups = evoSubTab === "corpo" ? bodySessionGroups : focalSessionGroups;
                const emptyIcon = evoSubTab === "corpo" ? Camera : ScanSearch;
                const emptyLabel = evoSubTab === "corpo" ? "Nenhum registro de composição corporal" : "Nenhum registro de análise focal";
                const EmptyIcon = emptyIcon;
                return activeGroups.length > 0 ? (
                  <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border/60" />

                  <input
                    type="file"
                    accept="image/*"
                    ref={replaceFileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && replacingPhotoId && replacingPhotoPath && id) {
                        replaceEvolutionPhotoMutation.mutate({
                          id: replacingPhotoId,
                          patientId: id,
                          oldImagePath: replacingPhotoPath,
                          newFile: file,
                        });
                      }
                      e.target.value = "";
                      setReplacingPhotoId(null);
                      setReplacingPhotoPath(null);
                    }}
                  />
                  <div className="space-y-6">
                    {activeGroups.map((group, gIdx) => {
                      const firstPhoto = group.photos[0];
                      const sessaoId = group.sessaoId;
                      const isEditing = editingSessionId === sessaoId;
                      const angleLabelsMap: Record<string,string> = { frente: "Frente", perfil: "Perfil", costas: "Costas", frontal: "Frontal", posterior: "Posterior", lateral_direito: "Lat. Dir.", lateral_esquerdo: "Lat. Esq." };
                      const angleBadgeMap: Record<string,string> = { frente: "F", perfil: "P", costas: "C" };
                      const prevGroup = gIdx > 0 ? activeGroups[gIdx - 1] : null;
                      const prevFirstPhoto = prevGroup?.photos[0];

                      return (
                        <div key={sessaoId} className="relative pl-10">
                          <div className={cn(
                            "absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 transition-colors",
                            "bg-background border-muted-foreground/40"
                          )} />

                          <div className="rounded-xl border p-3 transition-all border-border/40 hover:border-primary/30 hover:bg-muted/20">
                            {isEditing ? (
                              <div className="space-y-2 mb-2">
                                <p className="text-xs font-semibold text-primary">Editando sessão ({group.photos.length} foto{group.photos.length !== 1 ? "s" : ""})</p>
                                <div className="grid grid-cols-3 gap-2">
                                  {group.photos.map((sp: any) => (
                                    <div key={sp.id} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-primary/30 bg-muted/20">
                                      <EvolutionPhotoImage imagePath={sp.image_path} alt={sp.angle || "foto"} />
                                      <Badge className="absolute top-1 left-1 text-[10px] h-5">
                                        {angleBadgeMap[sp.angle] || sp.angle?.charAt(0)?.toUpperCase() || "?"}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                                <Input placeholder="Descrição" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="h-8 text-sm" />
                                <div className="grid grid-cols-2 gap-2">
                                  <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-8 text-sm" />
                                  <Input type="number" step="0.1" placeholder="Peso (kg)" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} className="h-8 text-sm" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <Input type="number" step="0.1" placeholder="Altura (cm)" value={editHeight} onChange={(e) => setEditHeight(e.target.value)} className="h-8 text-sm" />
                                  <Input type="number" step="0.1" placeholder="Circ. abd. (cm)" value={editWaist} onChange={(e) => setEditWaist(e.target.value)} className="h-8 text-sm" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <Input type="number" step="0.1" placeholder="% Gordura corporal" value={editBodyFat} onChange={(e) => setEditBodyFat(e.target.value)} className="h-8 text-sm" />
                                </div>
                                <GoalCheckboxGroup value={editGoal} onChange={setEditGoal} compact />
                                <Input placeholder="Observações" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="h-8 text-sm" />
                                <div className="flex gap-1.5">
                                  <Button size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); saveEditPhoto(); }}>
                                    <Check className="mr-1 h-3 w-3" /> Salvar sessão
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); cancelEditPhoto(); }}>
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* Session header */}
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <p className="text-sm font-semibold">{firstPhoto.label}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {format(parseISO(firstPhoto.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                      {prevFirstPhoto && (() => {
                                        const days = Math.round((parseISO(firstPhoto.date).getTime() - parseISO(prevFirstPhoto.date).getTime()) / 86400000);
                                        return days > 0 ? <span className="ml-1.5 text-primary/70">({days}d desde anterior)</span> : null;
                                      })()}
                                      {group.photos.length > 1 && (
                                        <span className="ml-1.5">• {group.photos.length} fotos</span>
                                      )}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); startEditPhoto(firstPhoto); }} title="Editar sessão">
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => {
                                      e.stopPropagation();
                                      group.photos.forEach(p => handleRemoveEvolutionPhoto(p.id, p.image_path));
                                    }} title="Excluir sessão">
                                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Photo grid - always 3 cols for body comp to align across sessions */}
                                <div className={cn("grid gap-2 mt-2",
                                  evoSubTab === "corpo" ? "grid-cols-3" : (group.photos.length >= 3 ? "grid-cols-3" : group.photos.length === 2 ? "grid-cols-2" : "grid-cols-1")
                                )}>
                                  {group.photos.map((photo) => (
                                    <div key={photo.id} className="relative group/photo">
                                      <div className={cn(
                                        "rounded-lg overflow-hidden bg-muted/30 border border-border/30",
                                        evoSubTab === "corpo" ? "aspect-[3/4]" : (group.photos.length === 1 ? "aspect-auto max-h-[300px]" : "aspect-[3/4]")
                                      )}>
                                        <EvolutionPhotoImage
                                          imagePath={photo.image_path}
                                          alt={photo.label}
                                          onClick={() => setZoomPhotoId(zoomPhotoId === photo.id ? null : photo.id)}
                                        />
                                        {replaceEvolutionPhotoMutation.isPending && replacingPhotoId === photo.id && (
                                          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                          </div>
                                        )}
                                      </div>
                                      {(photo as any).angle && (photo as any).angle !== "outro" && (
                                        <Badge variant="outline" className="absolute top-1 left-1 text-[10px] bg-background/80 backdrop-blur-sm">
                                          {angleBadgeMap[(photo as any).angle] || (photo as any).angle}
                                        </Badge>
                                      )}
                                      {(photo as any).angle === "outro" && (photo as any).analysis_focus && (
                                        <Badge variant="outline" className="absolute top-1 left-1 max-w-[calc(100%-2.5rem)] text-[10px] bg-background/80 backdrop-blur-sm gap-1 border-amber-500/50 text-amber-700 dark:text-amber-400">
                                          <ScanSearch className="h-2.5 w-2.5 shrink-0" />
                                          <span className="truncate">{(photo as any).analysis_focus}</span>
                                        </Badge>
                                      )}
                                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/photo:opacity-100 transition-opacity">
                                        <Button
                                          variant="secondary"
                                          size="icon"
                                          className="h-6 w-6 bg-background/80 backdrop-blur-sm"
                                          title="Trocar foto"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setReplacingPhotoId(photo.id);
                                            setReplacingPhotoPath(photo.image_path);
                                            replaceFileInputRef.current?.click();
                                          }}
                                        >
                                          <Camera className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="secondary"
                                          size="icon"
                                          className="h-6 w-6 bg-background/80 backdrop-blur-sm hover:bg-destructive/20"
                                          title="Excluir foto"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveEvolutionPhoto(photo.id, photo.image_path);
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3 text-destructive" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                    {group.photos.some(p => zoomPhotoId === p.id) && (
                                      <div className="mt-2 rounded-lg overflow-hidden bg-muted/30 border border-border/30">
                                        <EvolutionPhotoImage
                                          imagePath={group.photos.find(p => p.id === zoomPhotoId)!.image_path}
                                          alt="Zoom"
                                          onClick={() => setZoomPhotoId(null)}
                                        />
                                      </div>
                                    )}

                                    <div className="flex flex-wrap items-center gap-3 mt-2">
                                      {firstPhoto.weight && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Weight className="h-3 w-3" /> {firstPhoto.weight} kg
                                          {prevFirstPhoto?.weight && (
                                            <span className={cn(
                                              "ml-1 font-medium",
                                              firstPhoto.weight - prevFirstPhoto.weight! > 0
                                                ? "text-destructive"
                                                : "text-emerald-600 dark:text-emerald-400"
                                            )}>
                                              ({firstPhoto.weight - prevFirstPhoto.weight! > 0 ? "+" : ""}
                                              {(firstPhoto.weight - prevFirstPhoto.weight!).toFixed(1)})
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      {(firstPhoto as any).body_fat_percentage && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Activity className="h-3 w-3" /> {(firstPhoto as any).body_fat_percentage}% gordura
                                        </div>
                                      )}
                                      {(firstPhoto as any).height && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          {(firstPhoto as any).height} cm
                                        </div>
                                      )}
                                      {(firstPhoto as any).waist_circumference && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          Circ. {(firstPhoto as any).waist_circumference} cm
                                        </div>
                                      )}
                                      {(firstPhoto as any).treatment_goal && (
                                        <div className="flex items-center gap-1 flex-wrap">
                                          <Target className="h-3 w-3 text-muted-foreground" />
                                          {(firstPhoto as any).treatment_goal.split(",").filter(Boolean).map((g: string) => (
                                            <Badge key={g} variant="secondary" className="text-[10px] py-0">
                                              {GOAL_OPTIONS.find(o => o.value === g)?.label || g}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                      {firstPhoto.notes && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <StickyNote className="h-3 w-3" /> {firstPhoto.notes}
                                        </div>
                                      )}
                                    </div>

                                    {/* Single focal photo analysis */}
                                    {(() => {
                                      const singleFocals = group.photos.filter((p: any) => p.angle === "outro" && p.analysis_focus);
                                      if (singleFocals.length !== 1) return null;
                                      return singleFocals.map((focalPhoto: any) => (
                                        <div key={focalPhoto.id} className="mt-2 space-y-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full gap-2 text-xs border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                                            onClick={(e) => { e.stopPropagation(); handleSinglePhotoAnalysis(focalPhoto); }}
                                            disabled={singleAnalysisLoading === focalPhoto.id}
                                          >
                                            {singleAnalysisLoading === focalPhoto.id ? (
                                              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analisando…</>
                                            ) : (
                                              <><ScanSearch className="h-3.5 w-3.5" /> Avaliar com IA</>
                                            )}
                                          </Button>
                                          {singleAnalysisResult[focalPhoto.id] && (
                                            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                                                  <span className="text-xs font-semibold text-primary">Análise Focal com IA</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                  {editingAnalysisId === focalPhoto.id ? (
                                                    <>
                                                      <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1"
                                                        onClick={(e) => { e.stopPropagation(); setSingleAnalysisResult(prev => ({ ...prev, [focalPhoto.id]: editingAnalysisText })); setEditingAnalysisId(null); }}>
                                                        <Check className="h-3 w-3" /> OK
                                                      </Button>
                                                      <Button variant="ghost" size="sm" className="h-6 text-[10px]"
                                                        onClick={(e) => { e.stopPropagation(); setEditingAnalysisId(null); }}>
                                                        <X className="h-3 w-3" />
                                                      </Button>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1"
                                                        onClick={(e) => { e.stopPropagation(); setEditingAnalysisId(focalPhoto.id); setEditingAnalysisText(singleAnalysisResult[focalPhoto.id]); }}>
                                                        <Pencil className="h-3 w-3" /> Editar
                                                      </Button>
                                                      <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 hover:bg-destructive/10"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          setSingleAnalysisResult(prev => { const next = { ...prev }; delete next[focalPhoto.id]; return next; });
                                                          if ((focalPhoto as any).ai_analysis) {
                                                            updateEvolutionPhotoMutation.mutate({ id: focalPhoto.id, updates: { ai_analysis: null } as any });
                                                          }
                                                        }}>
                                                        <Trash2 className="h-3 w-3 text-destructive" />
                                                      </Button>
                                                    </>
                                                  )}
                                                </div>
                                              </div>
                                              {editingAnalysisId === focalPhoto.id ? (
                                                <textarea
                                                  className="w-full min-h-[120px] text-xs bg-background rounded border p-2"
                                                  value={editingAnalysisText}
                                                  onChange={(e) => setEditingAnalysisText(e.target.value)}
                                                  onClick={(e) => e.stopPropagation()}
                                                />
                                              ) : (
                                                <div className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                                                  {singleAnalysisResult[focalPhoto.id]}
                                                </div>
                                              )}
                                              {editingAnalysisId !== focalPhoto.id && (
                                                <Button variant="outline" size="sm" className="w-full gap-2 text-xs"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateEvolutionPhotoMutation.mutate({ id: focalPhoto.id, updates: { ai_analysis: singleAnalysisResult[focalPhoto.id] } as any }, {
                                                      onSuccess: () => { toast({ title: "Análise salva no prontuário." }); }
                                                    });
                                                  }}
                                                  disabled={updateEvolutionPhotoMutation.isPending}
                                                >
                                                  {(focalPhoto as any).ai_analysis === singleAnalysisResult[focalPhoto.id] ? (
                                                    <><Check className="h-3.5 w-3.5 text-emerald-600" /> Salvo no prontuário</>
                                                  ) : (
                                                    <><Save className="h-3.5 w-3.5" /> Salvar no prontuário</>
                                                  )}
                                                </Button>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      ));
                                    })()}

                                    {/* Multi-focal comparison */}
                                    {(() => {
                                      const focalPhotos = group.photos.filter((p: any) => p.angle === "outro" && p.analysis_focus);
                                      if (focalPhotos.length < 2) return null;
                                      return (
                                        <div className="mt-3 space-y-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full gap-2 text-xs border-primary/40 text-primary hover:bg-primary/10"
                                            onClick={(e) => { e.stopPropagation(); handleFocalCompare(sessaoId, focalPhotos); }}
                                            disabled={focalCompareLoading === sessaoId}
                                          >
                                            {focalCompareLoading === sessaoId ? (
                                              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Comparando lesões…</>
                                            ) : (
                                              <><GitCompareArrows className="h-3.5 w-3.5" /> Comparar lesões com IA ({focalPhotos.length} fotos)</>
                                            )}
                                          </Button>
                                          {focalCompareResult[sessaoId] && (
                                            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                                              <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-1.5">
                                                  <GitCompareArrows className="h-3.5 w-3.5 text-primary" />
                                                  <span className="text-xs font-semibold text-primary">Análise Comparativa Consolidada</span>
                                                </div>
                                                <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-destructive hover:text-destructive"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFocalCompareResult(prev => { const next = { ...prev }; delete next[sessaoId]; return next; });
                                                  }}>
                                                  <Trash2 className="h-3 w-3" /> Excluir
                                                </Button>
                                              </div>
                                              <div className="text-xs prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                                                {focalCompareResult[sessaoId]}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <EmptyIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium mb-1">{emptyLabel}</p>
                  <p className="text-xs">Adicione fotos a cada consulta para acompanhar a evolução do paciente ao longo do tempo.</p>
                </div>
              );
              })()}

              {/* Add new photo form */}
              {showPhotoForm ? (
                <SessionPhotoUploader
                  sessaoId={currentSessaoId}
                  onSubmit={handleSessionSubmit}
                  onCancel={() => setShowPhotoForm(false)}
                  isLoading={sessionSaving}
                />
              ) : showMultiUpload ? (
                <EvolutionPhotoSelector
                  photos={(evoSubTab === "corpo"
                    ? evolutionPhotos.filter((p: any) => p.angle !== "outro")
                    : evolutionPhotos.filter((p: any) => p.angle === "outro")
                  ).map((p) => ({
                    id: p.id,
                    image_path: p.image_path,
                    label: p.label,
                    date: p.date,
                    angle: (p as any).angle,
                    sessao_id: (p as any).sessao_id,
                  }))}
                  onSubmit={handleConsolidatedAnalysis}
                  onCancel={() => setShowMultiUpload(false)}
                  isLoading={multiUploadLoading}
                />
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setCurrentSessaoId(crypto.randomUUID()); setShowPhotoForm(true); }} className="flex-1">
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar registro de evolução
                  </Button>
                  <Button variant="default" size="sm" className="gap-1.5" onClick={() => setShowMultiUpload(true)}>
                    <Sparkles className="h-3.5 w-3.5" /> Nova Avaliação
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Histórico de Avaliações Corporais */}
          <AvaliacoesCorporaisCard patientId={patient.id} />
        </TabsContent>

        {/* ===== TAB EXAMES ===== */}
        <TabsContent value="exames" className="space-y-4 mt-4">
          <Card className="glass-card">
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><FlaskConical className="h-4 w-4 text-primary" /> Exames Laboratoriais e Biópsias</CardTitle>
                {!showLabForm && !showImportPreview && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowLabForm(true)}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar
                    </Button>
                    <Button variant="outline" size="sm" disabled={importLoading} onClick={() => labFileInputRef.current?.click()}>
                      {importLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
                      Importar arquivo
                    </Button>
                    <input ref={labFileInputRef} type="file" accept="image/*,.pdf,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLabFileImport(f); }} />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {showLabForm && (
                <div className="rounded-lg border border-border/50 p-3 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Nome do exame *</Label>
                      <Input value={labName} onChange={(e) => setLabName(e.target.value)} placeholder="Ex: Hemoglobina glicada, TSH..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tipo</Label>
                      <Select value={labType} onValueChange={(v) => setLabType(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="laboratorial">Laboratorial</SelectItem>
                          <SelectItem value="biopsia">Biópsia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Resultado *</Label>
                      <Input value={labResult} onChange={(e) => setLabResult(e.target.value)} placeholder="Ex: 7.2%, Positivo..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Valor de referência</Label>
                      <Input value={labReference} onChange={(e) => setLabReference(e.target.value)} placeholder="Ex: < 5.7%, 0.4-4.0 mUI/L" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Data *</Label>
                      <Input type="date" value={labDate} onChange={(e) => setLabDate(e.target.value)} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs">Observações</Label>
                      <Input value={labNotes} onChange={(e) => setLabNotes(e.target.value)} placeholder="Observações adicionais..." />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={!labName.trim() || !labResult.trim() || !labDate} onClick={() => {
                      addLabResultMutation.mutate({
                        patient_id: id!,
                        date: labDate,
                        type: labType,
                        name: labName.trim(),
                        result: labResult.trim(),
                        reference_range: labReference.trim() || undefined,
                        notes: labNotes.trim() || undefined,
                      }, {
                        onSuccess: () => {
                          setLabName(""); setLabDate(""); setLabResult(""); setLabReference(""); setLabNotes(""); setLabType("laboratorial");
                          setShowLabForm(false);
                        }
                      });
                    }}>
                      <Plus className="mr-1 h-3 w-3" /> Salvar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowLabForm(false)}>Cancelar</Button>
                  </div>
                </div>
              )}

              {showImportPreview && importedLabs.length > 0 && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Exames extraídos — revise antes de confirmar</p>
                    <Button size="sm" variant="ghost" onClick={() => { setShowImportPreview(false); setImportedLabs([]); }}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Exame</TableHead>
                          <TableHead className="text-xs">Tipo</TableHead>
                          <TableHead className="text-xs">Resultado</TableHead>
                          <TableHead className="text-xs">Referência</TableHead>
                          <TableHead className="text-xs">Data</TableHead>
                          <TableHead className="text-xs w-8"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importedLabs.map((r, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-xs">
                              <Input className="h-7 text-xs" value={r.name} onChange={(e) => setImportedLabs(prev => prev.map((item, i) => i === idx ? { ...item, name: e.target.value } : item))} />
                            </TableCell>
                            <TableCell className="text-xs">
                              <Select value={r.type} onValueChange={(v) => setImportedLabs(prev => prev.map((item, i) => i === idx ? { ...item, type: v as any } : item))}>
                                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="laboratorial">Lab</SelectItem>
                                  <SelectItem value="biopsia">Biópsia</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-xs">
                              <Input className="h-7 text-xs" value={r.result} onChange={(e) => setImportedLabs(prev => prev.map((item, i) => i === idx ? { ...item, result: e.target.value } : item))} />
                            </TableCell>
                            <TableCell className="text-xs">
                              <Input className="h-7 text-xs" value={r.reference_range || ""} onChange={(e) => setImportedLabs(prev => prev.map((item, i) => i === idx ? { ...item, reference_range: e.target.value } : item))} />
                            </TableCell>
                            <TableCell className="text-xs">
                              <Input className="h-7 text-xs" type="date" value={r.date || ""} onChange={(e) => setImportedLabs(prev => prev.map((item, i) => i === idx ? { ...item, date: e.target.value } : item))} />
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setImportedLabs(prev => prev.filter((_, i) => i !== idx))}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={importLoading || importedLabs.length === 0} onClick={handleConfirmImport}>
                      {importLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
                      Confirmar {importedLabs.length} exame(s)
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setShowImportPreview(false); setImportedLabs([]); }}>Cancelar</Button>
                  </div>
                </div>
              )}

                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Data</TableHead>
                        <TableHead className="text-xs">Tipo</TableHead>
                        <TableHead className="text-xs">Exame</TableHead>
                        <TableHead className="text-xs">Resultado</TableHead>
                        <TableHead className="text-xs">Referência</TableHead>
                        <TableHead className="text-xs w-8"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {labResults.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-xs">{(() => { try { return format(parseISO(r.date), "dd/MM/yyyy"); } catch { return r.date; } })()}</TableCell>
                          <TableCell className="text-xs">
                            <Badge variant={r.type === "biopsia" ? "default" : "secondary"} className="text-[10px]">
                              {r.type === "biopsia" ? "Biópsia" : "Lab"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-medium">{r.name}</TableCell>
                          <TableCell className="text-xs">{r.result}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{r.reference_range || "—"}</TableCell>
                          <TableCell className="text-xs">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteLabResultMutation.mutate({ id: r.id, patientId: id! })}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : !showLabForm ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhum exame cadastrado.</p>
                  <p className="text-xs mt-1">Adicione exames laboratoriais ou biópsias para correlação com as fotos de evolução.</p>
                </div>
              ) : null}
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

      {/* Analysis Result Modal */}
      <AnalysisResultModal
        open={analysisModalOpen}
        onOpenChange={setAnalysisModalOpen}
        result={analysisModalResult}
        patientName={patient?.name}
        analysisType={analysisModalType}
      />

    </div>
  );
}
