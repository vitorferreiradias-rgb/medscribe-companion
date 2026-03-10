import { useState, useRef } from "react";
import { X, ImagePlus, Sparkles, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SelectedPhoto {
  id: string;
  file: File;
  preview: string;
}

interface MultiPhotoUploaderProps {
  onSubmit: (photos: File[]) => void;
  onCancel: () => void;
  minPhotos?: number;
  isLoading?: boolean;
}

export function MultiPhotoUploader({ onSubmit, onCancel, minPhotos = 3, isLoading = false }: MultiPhotoUploaderProps) {
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newPhotos: SelectedPhoto[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) URL.revokeObjectURL(photo.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const canSubmit = photos.length >= minPhotos && !isLoading;

  return (
    <div className="space-y-4">
      {/* Drop zone / upload area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5",
          isLoading && "pointer-events-none opacity-50"
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleFiles(e.dataTransfer.files); }}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Clique ou arraste fotos aqui
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Mínimo de {minPhotos} fotos (diferentes ângulos)
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {photos.length} foto{photos.length !== 1 ? "s" : ""} selecionada{photos.length !== 1 ? "s" : ""}
            </span>
            {!canSubmit && !isLoading && (
              <Badge variant="outline" className="text-xs">
                Faltam {minPhotos - photos.length}
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group aspect-square rounded-md overflow-hidden border bg-muted/20">
                <img
                  src={photo.preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                {!isLoading && (
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-1 right-1 bg-background/80 backdrop-blur-sm rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3.5 w-3.5 text-destructive" />
                  </button>
                )}
              </div>
            ))}
            {/* Add more button */}
            {!isLoading && (
              <button
                onClick={() => inputRef.current?.click()}
                className="aspect-square rounded-md border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Mais</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
          <span className="text-sm text-primary">Enviando fotos e analisando com IA…</span>
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
          onClick={() => onSubmit(photos.map((p) => p.file))}
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
