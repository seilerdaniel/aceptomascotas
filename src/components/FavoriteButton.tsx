import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  propertyId: string;
  variant?: 'icon' | 'full';
  className?: string;
}

const FavoriteButton = ({ propertyId, variant = 'icon', className }: FavoriteButtonProps) => {
  const { isFavorite, toggleFavorite, loading } = useFavorites();
  const isFav = isFavorite(propertyId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(propertyId);
  };

  if (variant === 'full') {
    return (
      <Button
        variant={isFav ? 'soft' : 'outline'}
        onClick={handleClick}
        disabled={loading}
        className={cn('gap-2', className)}
      >
        <Heart className={cn('h-4 w-4', isFav && 'fill-accent text-accent')} />
        {isFav ? 'Guardado' : 'Guardar'}
      </Button>
    );
  }

  return (
    <Button
      variant="secondary"
      size="icon"
      aria-label={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
      onClick={handleClick}
      disabled={loading}
      className={cn('rounded-full', className)}
    >
      <Heart className={cn('h-4 w-4', isFav && 'fill-accent text-accent')} />
    </Button>
  );
};

export default FavoriteButton;
