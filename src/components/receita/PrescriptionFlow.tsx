import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Plus, ShieldCheck, ShieldAlert, ChevronRight, Check,
  ScrollText, AlertTriangle, Image, Signature, FileStack, CalendarDays
} from "lucide-react";
import { formatDateLongBR } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PrescriptionEditor } from "./PrescriptionEditor";
import { MedicationsTable, Medication } from "./MedicationsTable";

export type PrescriptionType = "simple" | "special";

export interface Prescription {
  id: string;
  type: PrescriptionType;
  content: string;
  medications: Medication[];
  signed: boolean;
  createdAt: string;
}

const STORAGE_KEY = "medscribe_prescriptions";

function loadPrescriptions(): Prescription[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function savePrescriptions(prescriptions: Prescription[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prescriptions));
}

export function PrescriptionFlow() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => {
    const loaded = loadPrescriptions();
    if (loaded.length === 0) {
      return [{
        id: crypto.randomUUID(),
        type: "simple",
        content: "",
        medications: [],
        signed: false,
        createdAt: new Date().toISOString(),
      }];
    }
    return loaded;
  });
  const [activeId, setActiveId] = useState<string>(prescriptions[0]?.id ?? "");
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [signMode, setSignMode] = useState<"all" | "single">("all");

  useEffect(() => {
    savePrescriptions(prescriptions);
  }, [prescriptions]);

  const active = prescriptions.find((p) => p.id === activeId);

  const updateActive = (updates: Partial<Prescription>) => {
    setPrescriptions((prev) =>
      prev.map((p) => (p.id === activeId ? { ...p, ...updates } : p))
    );
  };

  const createPrescription = (type: PrescriptionType) => {
    const newP: Prescription = {
      id: crypto.randomUUID(),
      type,
      content: "",
      medications: [],
      signed: false,
      createdAt: new Date().toISOString(),
    };
    setPrescriptions((prev) => [...prev, newP]);
    setActiveId(newP.id);
    setShowTypeDialog(false);
  };

  const signPrescriptions = (mode: "all" | "single") => {
    setPrescriptions((prev) =>
      prev.map((p) => {
        if (mode === "all") return { ...p, signed: true };
        if (p.id === activeId) return { ...p, signed: true };
        return p;
      })
    );
    setShowSignDialog(false);
  };

  const unsignedCount = prescriptions.filter((p) => !p.signed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      {/* Prescription cards row */}
      <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {prescriptions.map((p, i) => (
          <motion.button
            key={p.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setActiveId(p.id)}
            className={`relative flex-shrink-0 w-36 rounded-xl border p-3 text-left transition-all duration-150 ${
              p.id === activeId
                ? "border-primary/40 bg-primary/5 shadow-sm"
                : "border-border/40 bg-white/60 hover:border-primary/20 hover:bg-white/80"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">Receita {i + 1}</span>
            </div>
            <Badge
              variant="outline"
              className={`text-[9px] h-4 ${
                p.type === "special"
                  ? "border-warning/30 text-warning"
                  : "border-muted-foreground/20 text-muted-foreground"
              }`}
            >
              {p.type === "special" ? "Especial" : "Simples"}
            </Badge>
            {p.signed && (
              <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-success flex items-center justify-center">
                <Check className="h-3 w-3 text-success-foreground" />
              </div>
            )}
          </motion.button>
        ))}
        <button
          onClick={() => setShowTypeDialog(true)}
          className="flex-shrink-0 w-36 rounded-xl border-2 border-dashed border-border/40 flex flex-col items-center justify-center gap-1.5 py-3 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="text-[10px] font-medium">Nova Receita</span>
        </button>
      </div>

      {/* RDC 1.000/2025 Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 rounded-lg bg-info/8 border border-info/20 px-4 py-2.5"
      >
        <ScrollText className="h-4 w-4 text-info flex-shrink-0" />
        <div className="flex-1">
          <p className="text-[11px] font-semibold text-info">RDC nº 1.000/2025 — Anvisa</p>
          <p className="text-[10px] text-info/70">Receitas digitais em conformidade com normas de prescrição eletrônica.</p>
        </div>
        <Badge variant="outline" className="border-info/30 text-info text-[9px] flex-shrink-0">
          Conforme
        </Badge>
      </motion.div>

      {/* Active prescription */}
      {active && (
        <div className="space-y-4">
          {/* Blue zone — prescription content */}
          <div className="rounded-xl border-2 border-primary/20 overflow-hidden">
            <div className="bg-primary/5 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary/40" />
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Área de prescrição</span>
              </div>
              <span className="text-[10px] text-primary/60">
                Receita {prescriptions.findIndex((p) => p.id === activeId) + 1} de {prescriptions.length}
              </span>
            </div>
            <PrescriptionEditor
              value={active.content}
              onChange={(v) => updateActive({ content: v })}
              placeholder="Digite a prescrição aqui..."
            />
          </div>

          {/* Medications table */}
          <MedicationsTable
            medications={active.medications}
            onChange={(meds) => updateActive({ medications: meds })}
          />

          {/* Yellow zone — patient/doctor data */}
          <div className="rounded-xl border-2 border-warning/25 overflow-hidden">
            <div className="bg-warning/5 px-4 py-2 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-warning/40" />
              <span className="text-[11px] font-semibold text-warning uppercase tracking-wider">Dados do paciente / médico</span>
            </div>
            <div className="bg-warning/3 px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Paciente</p>
                  <div className="h-4 w-32 rounded bg-warning/10 animate-pulse" />
                  <div className="h-3 w-24 rounded bg-warning/8 animate-pulse mt-1.5" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Médico</p>
                  <div className="h-4 w-28 rounded bg-warning/10 animate-pulse" />
                  <div className="h-3 w-20 rounded bg-warning/8 animate-pulse mt-1.5" />
                </div>
              </div>
              {/* Auto date */}
              <Separator className="bg-warning/15" />
              <div className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-warning/60" />
                <p className="text-[11px] text-foreground font-medium">
                  {formatDateLongBR(active.createdAt)}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                Placeholder — dados pré-cadastrados serão preenchidos automaticamente.
              </p>
            </div>
          </div>

          {/* Image attachment reference */}
          <Card className="glass-card">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted/40 flex items-center justify-center">
                <Image className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium">Anexos de imagem</p>
                <p className="text-[10px] text-muted-foreground">Espaço para referências e imagens anexas à receita.</p>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-[10px]" disabled>
                Anexar
              </Button>
            </CardContent>
          </Card>

          {/* Digital Certificate / Signature */}
          <Card className="glass-card">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-warning" />
                  <span className="text-sm font-semibold">Assinatura Digital</span>
                </div>
                {unsignedCount > 0 && (
                  <Badge variant="outline" className="border-warning/30 text-warning text-[10px]">
                    {unsignedCount} pendente{unsignedCount > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              <Separator />

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                  <ShieldAlert className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Certificado ICP-Brasil</p>
                  <p className="text-xs text-muted-foreground">
                    Configure para assinar receitas eletronicamente.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => { setSignMode("single"); setShowSignDialog(true); }}
                      >
                        <Signature className="mr-1.5 h-3.5 w-3.5" /> Assinar esta
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-[11px]">Assinar apenas a receita ativa</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => { setSignMode("all"); setShowSignDialog(true); }}
                      >
                        <FileStack className="mr-1.5 h-3.5 w-3.5" /> Assinar todas
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-[11px]">Assinatura coletiva de todas as receitas</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Type selection dialog */}
      <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Tipo de receituário</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <button
              onClick={() => createPrescription("simple")}
              className="w-full rounded-xl border border-border/50 p-4 text-left hover:border-primary/30 hover:bg-primary/3 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted/40 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Receita Simples</p>
                  <p className="text-[11px] text-muted-foreground">Receituário padrão para medicamentos comuns</p>
                </div>
                <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </div>
            </button>

            <button
              onClick={() => createPrescription("special")}
              className="w-full rounded-xl border border-warning/25 p-4 text-left hover:border-warning/50 hover:bg-warning/3 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Receita Especial</p>
                  <p className="text-[11px] text-muted-foreground">Controlados — com dados completos do paciente e médico</p>
                </div>
                <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Signature dialog */}
      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Confirmar Assinatura
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-3">
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <p className="text-sm font-medium">
                {signMode === "all"
                  ? `Assinar ${unsignedCount} receita${unsignedCount > 1 ? "s" : ""} pendente${unsignedCount > 1 ? "s" : ""}`
                  : "Assinar a receita ativa"
                }
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Simulação — certificado digital ICP-Brasil não configurado.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/5 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-warning flex-shrink-0" />
              <p className="text-[10px] text-warning">
                Assinatura parcial permitida. Receitas não assinadas serão alertadas.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setShowSignDialog(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => signPrescriptions(signMode)}>
              <ShieldCheck className="mr-1 h-3 w-3" /> Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
