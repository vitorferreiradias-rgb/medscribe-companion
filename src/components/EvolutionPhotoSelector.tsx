import { useState, useMemo } from "react";
import { Check, Sparkles, Loader2, GitCompareArrows, FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EvolutionPhotoImage } from "@/components/EvolutionPhotoImage";
import { cn } from "@/lib/utils";

interface PhotoItem {
  id: string;
  image_path: string;
  label: string;
  date: string;
  angle?: string | null;
  sessao_id?: string | null;
}

export type SelectorAction =
  | { type: "composicao"; photoPaths: string[] }
  | { type: "comparar"; photoPaths: string[] }
  | { type: "evolucao_completa"; photoPaths: string[] };

interface EvolutionPhotoSelectorProps {
  photos: PhotoItem[];
  onSubmit: (action: SelectorAction) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ANGLE_MAP: Record<string, string> = {
  frente: "Frente",
  perfil: "Perfil",
  costas: "Costas",
  frontal: "Frontal",
  posterior: "Posterior",
  lateral_direito: "Lat. Dir.",
  lateral_esquerdo: "Lat. Esq.",
  outro: "Outro",
};

const REQUIRED_ANGLES = new Set(["frente", "perfil", "costas"]);

function hasAllAngles(items: PhotoItem[]): boolean {
  const angles = new Set(items.map((p) => p.angle).filter(Boolean));
  return [...REQUIRED_ANGLES].every((a) => angles.has(a));
}

function getDistinctGroups(photos: PhotoItem[], selectedIds: Set<string>) {
  const selected = photos.filter((p) => selectedIds.has(p.id));
  const groupMap = new Map<string, PhotoItem[]>();
  for (const p of selected) {
    const key = p.sessao_id || `date-${p.date}`;
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(p);
  }
  return groupMap;
}

export function EvolutionPhotoSelector({
  photos,
  onSubmit,
  onCancel,
  isLoading = false,
}: EvolutionPhotoSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const togglePhoto = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === photos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(photos.map((p) => p.id)));
    }
  };

  // Group photos by sessao_id or date for display
  const displayGroups = useMemo(() => {
    const groups: Record<string, PhotoItem[]> = {};
    for (const photo of photos) {
      const key = photo.sessao_id || `date-${photo.date}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(photo);
    }
    return Object.entries(groups).sort(
      ([, a], [, b]) => b[0].date.localeCompare(a[0].date)
    );
  }, [photos]);

  // Determine available action based on selection
  const actionInfo = useMemo(() => {
    const selected = photos.filter((p) => selectedIds.has(p.id));
    if (selected.length === 0) return null;

    const distinctGroups = getDistinctGroups(photos, selectedIds);
    const groupCount = distinctGroups.size;
    const groupEntries = [...distinctGroups.values()];

    // Single group with exactly 3 required angles → Composição
    if (groupCount === 1 && selected.length === 3 && hasAllAngles(selected)) {
      return { type: "composicao" as const, label: "Gerar Relatório de Composição", icon: Sparkles };
    }

    // Two groups, each with all 3 angles → Evolução completa
    if (
      groupCount === 2 &&
      groupEntries.every((g) => g.length === 3 && hasAllAngles(g))
    ) {
      return { type: "evolucao_completa" as const, label: "Relatório de Evolução Completa", icon: FileBarChart };
    }

    // Exactly 2 photos from different groups → Comparar
    if (selected.length === 2 && groupCount === 2) {
      return { type: "comparar" as const, label: "Comparar Fotos", icon: GitCompareArrows };
    }

    return null;
  }, [photos, selectedIds]);

  // Hint text
  const hintText = useMemo(() => {
    const selected = photos.filter((p) => selectedIds.has(p.id));
    if (selected.length === 0) return "Selecione fotos para habilitar uma ação.";

    const distinctGroups = getDistinctGroups(photos, selectedIds);
    const groupCount = distinctGroups.size;

    if (groupCount === 1) {
      if (!hasAllAngles(selected)) {
        const angles = new Set(selected.map((p) => p.angle).filter(Boolean));
        const missing = [...REQUIRED_ANGLES].filter((a) => !angles.has(a));
        return `Para relatório de composição, selecione: ${missing.map((a) => ANGLE_MAP[a] || a).join(", ")}.`;
      }
      if (selected.length > 3) {
        return "Para composição, selecione exatamente 3 fotos (Frente, Perfil, Costas) de uma sessão.";
      }
    }

    if (groupCount === 2) {
      const groupEntries = [...distinctGroups.values()];
      const bothComplete = groupEntries.every((g) => g.length === 3 && hasAllAngles(g));
      if (!bothComplete && selected.length !== 2) {
        return "Para evolução completa, selecione 3 fotos (Frente, Perfil, Costas) em cada sessão. Ou selecione 2 fotos para comparar.";
      }
    }

    if (groupCount > 2) {
      return "Selecione fotos de no máximo 2 sessões diferentes.";
    }

    return null;
  }, [photos, selectedIds]);

  const handleSubmit = () => {
    if (!actionInfo) return;
    const paths = photos.filter((p) => selectedIds.has(p.id)).map((p) => p.image_path);
    onSubmit({ type: actionInfo.type, photoPaths: paths });
  };

  const ActionIcon = actionInfo?.icon || Sparkles;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Selecione as fotos para análise</p>
        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAll} disabled={isLoading}>
          {selectedIds.size === photos.length ? "Desmarcar todas" : "Selecionar todas"}
        </Button>
      </div>

      {/* Hint */}
      {hintText && !isLoading && (
        <p className="text-xs text-muted-foreground">{hintText}</p>
      )}

      {photos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Nenhuma foto de evolução cadastrada.</p>
          <p className="text-xs mt-1">Adicione registros de evolução primeiro.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayGroups.map(([groupKey, groupPhotos]) => {
            const groupDate = groupPhotos[0].date;
            const allSelected = groupPhotos.every((p) => selectedIds.has(p.id));
            const toggleGroup = () => {
              setSelectedIds((prev) => {
                const next = new Set(prev);
                if (allSelected) {
                  groupPhotos.forEach((p) => next.delete(p.id));
                } else {
                  groupPhotos.forEach((p) => next.add(p.id));
                }
                return next;
              });
            };

            return (
              <div key={groupKey} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Sessão de {groupDate} ({groupPhotos.length} foto{groupPhotos.length !== 1 ? "s" : ""})
                  </span>
                  <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" onClick={toggleGroup} disabled={isLoading}>
                    {allSelected ? "Desmarcar" : "Selecionar"} sessão
                  </Button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {groupPhotos.map((photo) => {
                    const isSelected = selectedIds.has(photo.id);
                    const angleLabel = photo.angle ? ANGLE_MAP[photo.angle] || photo.angle : null;
                    return (
                      <button
                        key={photo.id}
                        onClick={() => !isLoading && togglePhoto(photo.id)}
                        className={cn(
                          "relative group aspect-square rounded-md overflow-hidden border-2 transition-all",
                          isSelected
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border/50 hover:border-primary/40",
                          isLoading && "pointer-events-none opacity-60"
                        )}
                      >
                        <EvolutionPhotoImage
                          imagePath={photo.image_path}
                          alt={photo.label}
                          className="w-full h-full object-cover"
                        />
                        {/* Selection check */}
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-primary rounded-full p-0.5">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                        {/* Angle badge */}
                        {angleLabel && (
                          <Badge
                            variant="secondary"
                            className="absolute top-1 left-1 text-[8px] px-1 py-0 h-4 bg-background/80 backdrop-blur-sm"
                          >
                            {angleLabel}
                          </Badge>
                        )}
                        {/* Label overlay */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                          <p className="text-[9px] text-white truncate">{photo.label}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Status */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {selectedIds.size} de {photos.length} selecionada{selectedIds.size !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
          <span className="text-sm text-primary">Analisando fotos com IA…</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          size="sm"
          disabled={!actionInfo || isLoading}
          onClick={handleSubmit}
          className="gap-1.5"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ActionIcon className="h-3.5 w-3.5" />
          )}
          {isLoading ? "Analisando…" : actionInfo?.label || "Selecione fotos"}
        </Button>
      </div>
    </div>
  );
}
