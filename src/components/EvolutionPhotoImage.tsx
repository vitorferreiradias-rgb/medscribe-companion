import { useEvolutionPhotoUrl } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface EvolutionPhotoImageProps {
  imagePath: string;
  alt: string;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
  marker?: { x: number; y: number };
  onMarkerClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function EvolutionPhotoImage({ imagePath, alt, className, onClick, marker, onMarkerClick }: EvolutionPhotoImageProps) {
  const { data: url, isLoading } = useEvolutionPhotoUrl(imagePath);

  if (isLoading) {
    return <Skeleton className={cn("w-full h-full", className)} />;
  }

  if (!url) {
    return (
      <div className={cn("w-full h-full flex items-center justify-center bg-muted/30 text-xs text-muted-foreground", className)}>
        Imagem indisponível
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <img
        src={url}
        alt={alt}
        className={cn("w-full h-full object-contain", className)}
        onClick={onClick}
      />
      {marker && (
        <div
          className="absolute z-10 pointer-events-auto cursor-pointer"
          style={{ left: `${marker.x}%`, top: `${marker.y}%`, transform: 'translate(-50%, -50%)' }}
          onClick={onMarkerClick}
          title="Foco da análise"
        >
          {/* Pulsing ring */}
          <div className="absolute inset-0 w-6 h-6 -ml-3 -mt-3 rounded-full bg-red-500/30 animate-ping" />
          {/* Solid dot */}
          <div className="w-4 h-4 -ml-2 -mt-2 rounded-full bg-red-500 border-2 border-white shadow-lg" />
        </div>
      )}
    </div>
  );
}
