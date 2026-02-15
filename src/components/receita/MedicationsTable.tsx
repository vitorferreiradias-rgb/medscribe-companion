import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Trash2, FlaskConical, Pill, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface Medication {
  id: string;
  commercialName: string;
  activeCompound: string;
  concentration: string;
  presentation: string;
  isCompounded: boolean;
  compoundedFormula: string;
}

interface MedicationsTableProps {
  medications: Medication[];
  onChange: (medications: Medication[]) => void;
}

const EMPTY_MED: Omit<Medication, "id"> = {
  commercialName: "",
  activeCompound: "",
  concentration: "",
  presentation: "",
  isCompounded: false,
  compoundedFormula: "",
};

export function MedicationsTable({ medications, onChange }: MedicationsTableProps) {
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMed, setNewMed] = useState<Omit<Medication, "id">>(EMPTY_MED);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = medications.filter(
    (m) =>
      !search ||
      m.commercialName.toLowerCase().includes(search.toLowerCase()) ||
      m.activeCompound.toLowerCase().includes(search.toLowerCase())
  );

  const addMedication = () => {
    const med: Medication = { ...newMed, id: crypto.randomUUID() };
    onChange([...medications, med]);
    setNewMed(EMPTY_MED);
    setShowAddModal(false);
  };

  const removeMedication = (id: string) => {
    onChange(medications.filter((m) => m.id !== id));
  };

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
            <Button size="sm" variant="outline" onClick={() => setShowAddModal(true)} className="h-7 text-xs">
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
                          <p className="font-medium text-foreground text-xs">{med.commercialName || "—"}</p>
                          {med.activeCompound && (
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

          {/* Compounded formula detail */}
          <AnimatePresence>
            {selectedId && medications.find((m) => m.id === selectedId)?.isCompounded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-border/20"
              >
                <div className="px-4 py-3 bg-accent/5">
                  <p className="text-[10px] font-medium text-accent uppercase tracking-wider mb-1.5">Fórmula Manipulada</p>
                  <p className="text-xs text-foreground whitespace-pre-wrap">
                    {medications.find((m) => m.id === selectedId)?.compoundedFormula || "Sem fórmula cadastrada"}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Add Medication Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> Adicionar Medicamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome comercial</Label>
              <Input
                placeholder="Ex: Amoxicilina"
                value={newMed.commercialName}
                onChange={(e) => setNewMed({ ...newMed, commercialName: e.target.value })}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Composto ativo</Label>
              <Input
                placeholder="Ex: Amoxicilina tri-hidratada"
                value={newMed.activeCompound}
                onChange={(e) => setNewMed({ ...newMed, activeCompound: e.target.value })}
                className="text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Concentração</Label>
                <Input
                  placeholder="Ex: 500mg"
                  value={newMed.concentration}
                  onChange={(e) => setNewMed({ ...newMed, concentration: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Apresentação</Label>
                <Input
                  placeholder="Ex: Comprimido"
                  value={newMed.presentation}
                  onChange={(e) => setNewMed({ ...newMed, presentation: e.target.value })}
                  className="text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="compounded"
                checked={newMed.isCompounded}
                onCheckedChange={(v) => setNewMed({ ...newMed, isCompounded: !!v })}
              />
              <label htmlFor="compounded" className="text-xs font-medium flex items-center gap-1.5 cursor-pointer">
                <FlaskConical className="h-3 w-3 text-accent" /> Fórmula manipulada
              </label>
            </div>
            <AnimatePresence>
              {newMed.isCompounded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fórmula</Label>
                    <Textarea
                      placeholder="Descreva a fórmula manipulada..."
                      value={newMed.compoundedFormula}
                      onChange={(e) => setNewMed({ ...newMed, compoundedFormula: e.target.value })}
                      rows={3}
                      className="text-sm resize-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>Cancelar</Button>
            <Button size="sm" onClick={addMedication} disabled={!newMed.commercialName && !newMed.activeCompound}>
              <Plus className="mr-1 h-3 w-3" /> Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
