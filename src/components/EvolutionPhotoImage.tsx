import { useEvolutionPhotoUrl } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface EvolutionPhotoImageProps {
  imagePath: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export function EvolutionPhotoImage({ imagePath, alt, className, onClick }: EvolutionPhotoImageProps) {
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
    <img
      src={url}
      alt={alt}
      className={cn("w-full h-full object-cover", className)}
      onClick={onClick}
    />
  );
}
