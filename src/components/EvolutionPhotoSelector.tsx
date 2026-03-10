import { useState, useMemo } from "react";
import { Check, Sparkles, Loader2, ArrowLeftRight, TrendingUp } from "lucide-react";
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

export type AnalysisAction = "composition" | "compare" | "evolution";

interface EvolutionPhotoSelectorProps {
  photos: PhotoItem[];
  onSubmit: (selectedPhotoPaths: string[], action: AnalysisAction) => void;
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

const ANGLE_BADGE: Record<string, { letter: string; color: string }> = {
  frente: { letter: "F", color: "bg-blue-500" },
  frontal: { letter: "F", color: "bg-blue-500" },
  perfil: { letter: "P", color: "bg-amber-500" },
  lateral_direito: { letter: "P", color: "bg-amber-500" },
  lateral_esquerdo: { letter: "P", color: "bg-amber-500" },
  costas: { letter: "C", color: "bg-emerald-500" },
  posterior: { letter: "C", color: "bg-emerald-500" },
  outro: { letter: "?", color: "bg-muted-foreground" },
};

const REQUIRED_ANGLES = new Set(["frente", "perfil", "costas"]);

function detectAction(
  selected: PhotoItem[]
): { action: AnalysisAction; label: string; icon: typeof Sparkles } | null {
  // 1. Composition: exactly 3 photos, same sessao_id, angles frente+perfil+costas
  if (selected.length === 3) {
    const sessaoIds = new Set(selected.map((p) => p.sessao_id).filter(Boolean));
    const angles = new Set(selected.map((p) => p.angle || ""));
    if (
      sessaoIds.size === 1 &&
      REQUIRED_ANGLES.size === angles.size &&
      [...REQUIRED_ANGLES].every((a) => angles.has(a))
    ) {
      return { action: "composition", label: "Gerar Relatório de Composição", icon: Sparkles };
    }
  }

  // 2. Compare: exactly 2 photos from different dates
  if (selected.length === 2) {
    const dates = new Set(selected.map((p) => p.date));
    if (dates.size === 2) {
      return { action: "compare", label: "Comparar Fotos Selecionadas", icon: ArrowLeftRight };
    }
  }

  // 3. Evolution: exactly 2 complete sessions (6 photos)
  if (selected.length === 6) {
    const bySession = selected.reduce<Record<string, Set<string>>>((acc, p) => {
      const key = p.sessao_id || p.date;
      if (!acc[key]) acc[key] = new Set();
      if (p.angle) acc[key].add(p.angle);
      return acc;
    }, {});
    const sessions = Object.values(bySession);
    if (
      sessions.length === 2 &&
      sessions.every(
        (angles) =>
          angles.size >= 3 && [...REQUIRED_ANGLES].every((a) => angles.has(a))
      )
    ) {
      return { action: "evolution", label: "Relatório de Evolução Completa", icon: TrendingUp };
    }
  }

  return null;
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

  const selectedPhotos = useMemo(
    () => photos.filter((p) => selectedIds.has(p.id)),
    [photos, selectedIds]
  );

  const currentAction = useMemo(() => detectAction(selectedPhotos), [selectedPhotos]);

  // Group photos by sessao_id or date
  const groups = photos.reduce<Record<string, PhotoItem[]>>((acc, photo) => {
    const key = photo.sessao_id || photo.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(photo);
    return acc;
  }, {});

  const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
    const dateA = groups[a][0].date;
    const dateB = groups[b][0].date;
    return dateB.localeCompare(dateA);
  });

  const hintText = useMemo(() => {
    if (selectedIds.size === 0) return "Selecione fotos para habilitar uma ação.";
    if (currentAction) return null;
    return "Combinação não reconhecida. Selecione 3 fotos (F+P+C) da mesma sessão, 2 fotos de datas diferentes, ou 2 sessões completas.";
  }, [selectedIds.size, currentAction]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Selecione as fotos para análise</p>
        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAll} disabled={isLoading}>
          {selectedIds.size === photos.length ? "Desmarcar todas" : "Selecionar todas"}
        </Button>
      </div>

      {/* Legend */}
      <div className="flex gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="inline-block w-3.5 h-3.5 rounded bg-blue-500 text-white text-center leading-[14px] text-[9px] font-bold">F</span> Frente</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3.5 h-3.5 rounded bg-amber-500 text-white text-center leading-[14px] text-[9px] font-bold">P</span> Perfil</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3.5 h-3.5 rounded bg-emerald-500 text-white text-center leading-[14px] text-[9px] font-bold">C</span> Costas</span>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Nenhuma foto de evolução cadastrada.</p>
          <p className="text-xs mt-1">Adicione registros de evolução primeiro.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedGroupKeys.map((groupKey) => {
            const groupPhotos = groups[groupKey];
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
                    const badge = photo.angle ? ANGLE_BADGE[photo.angle] : ANGLE_BADGE.outro;
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
                        {/* Angle badge */}
                        <div className={cn(
                          "absolute top-1 left-1 w-4 h-4 rounded text-[9px] font-bold text-white flex items-center justify-center",
                          badge?.color || "bg-muted-foreground"
                        )}>
                          {badge?.letter || "?"}
                        </div>
                        {/* Selection check */}
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-primary rounded-full p-0.5">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                          <p className="text-[9px] text-white truncate">{photo.label}</p>
                          {photo.angle && ANGLE_MAP[photo.angle] && (
                            <p className="text-[8px] text-white/70">{ANGLE_MAP[photo.angle]}</p>
                          )}
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

      {/* Hint */}
      {hintText && (
        <p className="text-xs text-muted-foreground italic">{hintText}</p>
      )}

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
        {currentAction && (
          <Button
            size="sm"
            disabled={isLoading}
            onClick={() => {
              const paths = selectedPhotos.map((p) => p.image_path);
              onSubmit(paths, currentAction.action);
            }}
            className="gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <currentAction.icon className="h-3.5 w-3.5" />
            )}
            {isLoading ? "Analisando…" : currentAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
