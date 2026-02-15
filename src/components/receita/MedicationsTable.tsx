import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Trash2, FlaskConical, Pill, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PrescriptionEditor } from "@/components/receita/PrescriptionEditor";

export interface Medication {
  id: string;
  commercialName: string;
  activeCompound: string;
  concentration: string;
  presentation: string;
  isCompounded: boolean;
  compoundedFormula: string;
  usageInstructions: string;
}

interface MedicationsTableProps {
  medications: Medication[];
  onChange: (medications: Medication[]) => void;
}

type MedType = "industrial" | "compounded";

const EMPTY_INDUSTRIAL = {
  commercialName: "",
  activeCompound: "",
  concentration: "",
  presentation: "",
  usageInstructions: "",
};

const EMPTY_COMPOUNDED = {
  compoundedFormula: "",
  usageInstructions: "",
};

export function MedicationsTable({ medications, onChange }: MedicationsTableProps) {
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [medType, setMedType] = useState<MedType>("industrial");
  const [industrial, setIndustrial] = useState(EMPTY_INDUSTRIAL);
  const [compounded, setCompounded] = useState(EMPTY_COMPOUNDED);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = medications.filter(
    (m) =>
      !search ||
      m.commercialName.toLowerCase().includes(search.toLowerCase()) ||
      m.activeCompound.toLowerCase().includes(search.toLowerCase()) ||
      m.compoundedFormula.toLowerCase().includes(search.toLowerCase())
  );

  const resetModal = () => {
    setMedType("industrial");
    setIndustrial(EMPTY_INDUSTRIAL);
    setCompounded(EMPTY_COMPOUNDED);
  };

  const openModal = () => {
    resetModal();
    setShowAddModal(true);
  };

  const addMedication = () => {
    const med: Medication =
      medType === "industrial"
        ? {
            id: crypto.randomUUID(),
            commercialName: industrial.commercialName,
            activeCompound: industrial.activeCompound,
            concentration: industrial.concentration,
            presentation: industrial.presentation,
            isCompounded: false,
            compoundedFormula: "",
            usageInstructions: industrial.usageInstructions,
          }
        : {
            id: crypto.randomUUID(),
            commercialName: "",
            activeCompound: "",
            concentration: "",
            presentation: "",
            isCompounded: true,
            compoundedFormula: compounded.compoundedFormula,
            usageInstructions: compounded.usageInstructions,
          };
    onChange([...medications, med]);
    setShowAddModal(false);
  };

  const canAdd =
    medType === "industrial"
      ? !!industrial.commercialName.trim()
      : !!compounded.compoundedFormula.trim();

  const removeMedication = (id: string) => {
    onChange(medications.filter((m) => m.id !== id));
  };

  const selectedMed = selectedId ? medications.find((m) => m.id === selectedId) : null;

  return (
    <>
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
            <div className="flex items-center gap-2">
              <Pill className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Medicamentos</span>
              {medications.length > 0 && (
                <Badge variant="secondary" className="text-[10px] h-5">{medications.length}</Badge>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={openModal} className="h-7 text-xs">
              <Plus className="mr-1 h-3 w-3" /> Adicionar
            </Button>
          </div>

          {/* Search */}
          {medications.length > 0 && (
            <div className="px-4 py-2 border-b border-border/20">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar medicamento..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>
          )}

          {/* Table */}
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20">
                    <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Nome</th>
                    <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Concentração</th>
                    <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Apresentação</th>
                    <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Tipo</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((med, i) => (
                    <motion.tr
                      key={med.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => setSelectedId(selectedId === med.id ? null : med.id)}
                      className={`border-b border-border/15 cursor-pointer transition-colors duration-150 ${
                        i % 2 === 1 ? "bg-muted/8" : ""
                      } ${selectedId === med.id ? "bg-primary/5 border-primary/20" : "hover:bg-muted/30"}`}
                    >
                      <td className="px-4 py-2.5">
                        <div>
                          <p className="font-medium text-foreground text-xs">
                            {med.isCompounded ? med.compoundedFormula.slice(0, 50) : med.commercialName || "—"}
                          </p>
                          {!med.isCompounded && med.activeCompound && (
                            <p className="text-[11px] text-muted-foreground">{med.activeCompound}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{med.concentration || "—"}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{med.presentation || "—"}</td>
                      <td className="px-4 py-2.5">
                        {med.isCompounded ? (
                          <Badge variant="outline" className="text-[10px] border-accent/30 text-accent gap-1">
                            <FlaskConical className="h-2.5 w-2.5" /> Manipulado
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Industrial</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => { e.stopPropagation(); removeMedication(med.id); }}
                                className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="text-[11px]">Remover</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Pill className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                {medications.length === 0 ? "Nenhum medicamento adicionado" : "Sem resultados para a busca"}
              </p>
            </div>
          )}

          {/* Expanded detail panel */}
          <AnimatePresence>
            {selectedMed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-border/20"
              >
                <div className="px-4 py-3 bg-muted/10 space-y-2">
                  {selectedMed.isCompounded && (
                    <div>
                      <p className="text-[10px] font-medium text-accent uppercase tracking-wider mb-1">Fórmula Manipulada</p>
                      <p className="text-xs text-foreground whitespace-pre-wrap">
                        {selectedMed.compoundedFormula || "Sem fórmula cadastrada"}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-medium text-primary uppercase tracking-wider mb-1">Fórmula de Uso</p>
                    <p className="text-xs text-foreground whitespace-pre-wrap">
                      {selectedMed.usageInstructions || "Sem posologia cadastrada"}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Add Medication Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> Adicionar Medicamento
            </DialogTitle>
          </DialogHeader>

          <Tabs value={medType} onValueChange={(v) => setMedType(v as MedType)} className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="industrial" className="gap-1.5 text-xs">
                <Pill className="h-3.5 w-3.5" /> Medicamento
              </TabsTrigger>
              <TabsTrigger value="compounded" className="gap-1.5 text-xs">
                <FlaskConical className="h-3.5 w-3.5" /> Fórmula Manipulada
              </TabsTrigger>
            </TabsList>

            <TabsContent value="industrial" className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome comercial <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Ex: Amoxicilina"
                  value={industrial.commercialName}
                  onChange={(e) => setIndustrial({ ...industrial, commercialName: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Composto ativo</Label>
                <Input
                  placeholder="Ex: Amoxicilina tri-hidratada"
                  value={industrial.activeCompound}
                  onChange={(e) => setIndustrial({ ...industrial, activeCompound: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Concentração</Label>
                  <Input
                    placeholder="Ex: 500mg"
                    value={industrial.concentration}
                    onChange={(e) => setIndustrial({ ...industrial, concentration: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Apresentação</Label>
                  <Input
                    placeholder="Ex: Comprimido"
                    value={industrial.presentation}
                    onChange={(e) => setIndustrial({ ...industrial, presentation: e.target.value })}
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fórmula de uso (posologia)</Label>
                <Textarea
                  placeholder="Ex: Tomar 1 comprimido de 8/8h por 7 dias"
                  value={industrial.usageInstructions}
                  onChange={(e) => setIndustrial({ ...industrial, usageInstructions: e.target.value })}
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>
            </TabsContent>

            <TabsContent value="compounded" className="pt-1">
              <div className="space-y-1.5 mb-2">
                <Label className="text-xs">Descrição da fórmula / Modo de uso <span className="text-destructive">*</span></Label>
              </div>
              <PrescriptionEditor
                value={compounded.compoundedFormula}
                onChange={(v) => setCompounded({ ...compounded, compoundedFormula: v })}
                placeholder="Descreva a fórmula manipulada e o modo de uso..."
              />
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>Cancelar</Button>
            <Button size="sm" onClick={addMedication} disabled={!canAdd}>
              <Plus className="mr-1 h-3 w-3" /> Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
