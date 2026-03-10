import { useState, useRef } from "react";
import { Camera, X, Plus, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const ANGLE_SLOTS = [
  { key: "frente", label: "Frente", short: "F" },
  { key: "perfil", label: "Perfil", short: "P" },
  { key: "costas", label: "Costas", short: "C" },
] as const;

const GOAL_OPTIONS = [
  { value: "emagrecimento", label: "Emagrecimento" },
  { value: "hipertrofia", label: "Hipertrofia" },
  { value: "recomposicao", label: "Recomposição corporal" },
  { value: "pos_bariatrica", label: "Pós-bariátrica" },
  { value: "manutencao", label: "Manutenção" },
  { value: "outro", label: "Outro" },
];

interface PhotoSlot {
  angle: string;
  file: File;
  preview: string;
  focusLabel?: string;
}

interface SessionPhotoUploaderProps {
  onSubmit: (data: {
    photos: { file: File; angle: string; focusLabel?: string }[];
    label: string;
    date: string;
    weight?: number;
    height?: number;
    waistCircumference?: number;
    treatmentGoal?: string;
    notes?: string;
    sessaoId: string;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
  sessaoId: string;
}

export function SessionPhotoUploader({ onSubmit, onCancel, isLoading = false, sessaoId }: SessionPhotoUploaderProps) {
  const [photos, setPhotos] = useState<PhotoSlot[]>([]);
  const [extraSlots, setExtraSlots] = useState<{ id: string; focus: string }[]>([]);
  const [label, setLabel] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [waist, setWaist] = useState("");
  const [goal, setGoal] = useState("");
  const [notes, setNotes] = useState("");

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const toggleGoal = (value: string) => {
    const goals = goal ? goal.split(",").filter(Boolean) : [];
    const idx = goals.indexOf(value);
    if (idx >= 0) goals.splice(idx, 1);
    else goals.push(value);
    setGoal(goals.join(","));
  };

  const selectedGoals = goal ? goal.split(",").filter(Boolean) : [];

  const handleFileForAngle = (angle: string, files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    const preview = URL.createObjectURL(file);
    setPhotos((prev) => {
      // Remove existing photo for this angle
      const old = prev.find((p) => p.angle === angle);
      if (old) URL.revokeObjectURL(old.preview);
      const filtered = prev.filter((p) => p.angle !== angle);
      const extraSlot = extraSlots.find((s) => s.id === angle);
      return [...filtered, { angle, file, preview, focusLabel: extraSlot?.focus }];
    });
  };

  const removePhoto = (angle: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.angle === angle);
      if (photo) URL.revokeObjectURL(photo.preview);
      return prev.filter((p) => p.angle !== angle);
    });
  };

  const addExtraSlot = () => {
    setExtraSlots((prev) => [...prev, { id: `outro_${Date.now()}`, focus: "" }]);
  };

  const updateExtraFocus = (id: string, focus: string) => {
    setExtraSlots((prev) => prev.map((s) => (s.id === id ? { ...s, focus } : s)));
    // Update photo if already uploaded
    setPhotos((prev) => prev.map((p) => (p.angle === id ? { ...p, focusLabel: focus } : p)));
  };

  const removeExtraSlot = (id: string) => {
    removePhoto(id);
    setExtraSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const canSubmit = photos.length >= 1 && !isLoading;

  const handleSubmit = () => {
    onSubmit({
      photos: photos.map((p) => ({ file: p.file, angle: p.angle.startsWith("outro") ? "outro" : p.angle, focusLabel: p.focusLabel })),
      label: label || "Registro",
      date,
      weight: weight ? parseFloat(weight) : undefined,
      height: height ? parseFloat(height) : undefined,
      waistCircumference: waist ? parseFloat(waist) : undefined,
      treatmentGoal: goal || undefined,
      notes: notes || undefined,
      sessaoId,
    });
  };

  const getPhotoForAngle = (angle: string) => photos.find((p) => p.angle === angle);

  return (
    <div className="rounded-xl border border-border/50 p-4 space-y-4 bg-muted/10">
      <p className="text-sm font-medium">Nova sessão de evolução</p>

      {/* Shared metadata */}
      <div className="space-y-3">
        <Input placeholder="Descrição (ex: 3ª sessão, pós-procedimento)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input type="number" step="0.1" placeholder="Peso (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input type="number" step="0.1" placeholder="Altura (cm)" value={height} onChange={(e) => setHeight(e.target.value)} />
          <Input type="number" step="0.1" placeholder="Circ. abd. (cm)" value={waist} onChange={(e) => setWaist(e.target.value)} />
        </div>

        {/* Goals */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Objetivo do tratamento</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {GOAL_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer text-sm">
                <Checkbox
                  checked={selectedGoals.includes(opt.value)}
                  onCheckedChange={() => toggleGoal(opt.value)}
                  className="h-3.5 w-3.5"
                />
                <span className="text-xs">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <Input placeholder="Observações — opcional" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {/* Photo slots */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Fotos (mínimo 1)</Label>
        <div className="grid grid-cols-3 gap-2">
          {ANGLE_SLOTS.map((slot) => {
            const photo = getPhotoForAngle(slot.key);
            return (
              <div key={slot.key} className="relative">
                {photo ? (
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-primary/30 bg-muted/20">
                    <img src={photo.preview} alt={slot.label} className="w-full h-full object-cover" />
                    <Badge className="absolute top-1 left-1 text-[10px] h-5">{slot.short}</Badge>
                    {!isLoading && (
                      <button
                        onClick={() => removePhoto(slot.key)}
                        className="absolute top-1 right-1 bg-background/80 backdrop-blur-sm rounded-full p-0.5"
                      >
                        <X className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => inputRefs.current[slot.key]?.click()}
                    disabled={isLoading}
                    className="aspect-[3/4] w-full rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50"
                  >
                    <Camera className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground font-medium">{slot.label}</span>
                  </button>
                )}
                <input
                  ref={(el) => { inputRefs.current[slot.key] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { handleFileForAngle(slot.key, e.target.files); e.target.value = ""; }}
                />
              </div>
            );
          })}
        </div>

        {/* Extra "Outro" slots */}
        {extraSlots.map((slot) => {
          const photo = getPhotoForAngle(slot.id);
          return (
            <div key={slot.id} className="flex items-start gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Descreva o que está sendo fotografado *"
                  value={slot.focus}
                  onChange={(e) => updateExtraFocus(slot.id, e.target.value)}
                  className="h-8 text-sm mb-1"
                />
                {photo ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-primary/30 bg-muted/20 max-w-[200px]">
                    <img src={photo.preview} alt="Outro" className="w-full h-full object-cover" />
                    {!isLoading && (
                      <button
                        onClick={() => removePhoto(slot.id)}
                        className="absolute top-1 right-1 bg-background/80 backdrop-blur-sm rounded-full p-0.5"
                      >
                        <X className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => inputRefs.current[slot.id]?.click()}
                    disabled={isLoading}
                    className="h-16 w-full rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-colors text-xs text-muted-foreground"
                  >
                    <Camera className="h-4 w-4" /> Selecionar foto
                  </button>
                )}
                <input
                  ref={(el) => { inputRefs.current[slot.id] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { handleFileForAngle(slot.id, e.target.files); e.target.value = ""; }}
                />
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeExtraSlot(slot.id)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        })}

        <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={addExtraSlot} disabled={isLoading}>
          <Plus className="h-3 w-3" /> Adicionar outro ângulo
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
          <span className="text-sm text-primary">Salvando fotos…</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button size="sm" disabled={!canSubmit} onClick={handleSubmit} className="gap-1.5">
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {isLoading ? "Salvando…" : `Salvar sessão (${photos.length} foto${photos.length !== 1 ? "s" : ""})`}
        </Button>
      </div>
    </div>
  );
}
