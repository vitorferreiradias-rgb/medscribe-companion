import { useState } from "react";
import { Check, Sparkles, Loader2 } from "lucide-react";
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

interface EvolutionPhotoSelectorProps {
  photos: PhotoItem[];
  onSubmit: (selectedPhotoPaths: string[]) => void;
  onCancel: () => void;
  minPhotos?: number;
  isLoading?: boolean;
}

export function EvolutionPhotoSelector({
  photos,
  onSubmit,
  onCancel,
  minPhotos = 3,
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

  const canSubmit = selectedIds.size >= minPhotos && !isLoading;

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Selecione as fotos para análise</p>
        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAll} disabled={isLoading}>
          {selectedIds.size === photos.length ? "Desmarcar todas" : "Selecionar todas"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Escolha no mínimo {minPhotos} fotos de diferentes ângulos para a avaliação corporal.
      </p>

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
        {selectedIds.size > 0 && selectedIds.size < minPhotos && !isLoading && (
          <Badge variant="outline" className="text-xs">
            Faltam {minPhotos - selectedIds.size}
          </Badge>
        )}
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
          disabled={!canSubmit}
          onClick={() => {
            const paths = photos
              .filter((p) => selectedIds.has(p.id))
              .map((p) => p.image_path);
            onSubmit(paths);
          }}
          className="gap-1.5"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {isLoading ? "Analisando…" : "Enviar para Análise"}
        </Button>
      </div>
    </div>
  );
}
