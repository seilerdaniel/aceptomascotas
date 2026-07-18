import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Plus, X, Loader2, Eye, EyeOff, Trash2, ExternalLink, HardDrive } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import EditPropertyDialog from '@/components/EditPropertyDialog';
import { useNavigate } from 'react-router-dom';
import type { Tables } from '@/integrations/supabase/types';

// Storage quota: 50MB per user
const STORAGE_QUOTA_BYTES = 50 * 1024 * 1024;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

interface PropertyImageManagerProps {
  property: Tables<'properties'>;
  onUpdate: () => void;
  userStorageUsed?: number;
  onStorageChange?: () => void;
}

const PropertyImageManager = ({ property, onUpdate, userStorageUsed = 0, onStorageChange }: PropertyImageManagerProps) => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const storagePercentage = Math.min((userStorageUsed / STORAGE_QUOTA_BYTES) * 100, 100);
  const remainingStorage = Math.max(STORAGE_QUOTA_BYTES - userStorageUsed, 0);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentImages = property.images || [];
    const remainingSlots = 5 - currentImages.length;
    
    if (remainingSlots <= 0) {
      toast.error('Máximo 5 imágenes por propiedad');
      return;
    }

    setIsUploading(true);
    const newUrls: string[] = [];

    try {
      const filesToUpload = Array.from(files).slice(0, remainingSlots);

      // Check total size against remaining quota
      const totalUploadSize = filesToUpload.reduce((sum, f) => sum + f.size, 0);
      if (totalUploadSize > remainingStorage) {
        toast.error(`Espacio insuficiente. Disponible: ${formatBytes(remainingStorage)}`);
        setIsUploading(false);
        return;
      }

      for (const file of filesToUpload) {
        if (!file.type.startsWith('image/')) {
          toast.error('Solo se permiten imágenes');
          continue;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          toast.error('Las imágenes deben ser menores a 5MB');
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${property.user_id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        newUrls.push(urlData.publicUrl);
      }

      if (newUrls.length > 0) {
        const { error: updateError } = await supabase
          .from('properties')
          .update({ images: [...currentImages, ...newUrls] })
          .eq('id', property.id);

        if (updateError) throw updateError;

        toast.success(`${newUrls.length} imagen(es) agregada(s)`);
        onUpdate();
        onStorageChange?.();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error al subir imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    try {
      const currentImages = property.images || [];
      const updatedImages = currentImages.filter((img) => img !== imageUrl);

      const { error } = await supabase
        .from('properties')
        .update({ images: updatedImages })
        .eq('id', property.id);

      if (error) throw error;

      // Try to delete from storage (extract path from URL)
      try {
        const url = new URL(imageUrl);
        const pathParts = url.pathname.split('/storage/v1/object/public/property-images/');
        if (pathParts[1]) {
          await supabase.storage.from('property-images').remove([decodeURIComponent(pathParts[1])]);
        }
      } catch {
        // Ignore storage deletion errors
      }

      toast.success('Imagen eliminada');
      onUpdate();
      onStorageChange?.();
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Error al eliminar imagen');
    }
  };

  const handleToggleActive = async () => {
    setIsToggling(true);
    try {
      const { error } = await supabase
        .from('properties')
        .update({ is_active: !property.is_active })
        .eq('id', property.id);

      if (error) throw error;

      toast.success(property.is_active ? 'Propiedad ocultada' : 'Propiedad activada');
      onUpdate();
    } catch (error) {
      toast.error('Error al actualizar estado');
    } finally {
      setIsToggling(false);
    }
  };

  const handleDeleteProperty = async () => {
    setIsDeleting(true);
    try {
      // Delete images from storage
      const images = property.images || [];
      for (const imageUrl of images) {
        try {
          const url = new URL(imageUrl);
          const pathParts = url.pathname.split('/storage/v1/object/public/property-images/');
          if (pathParts[1]) {
            await supabase.storage.from('property-images').remove([decodeURIComponent(pathParts[1])]);
          }
        } catch {
          // Ignore storage deletion errors
        }
      }

      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', property.id);

      if (error) throw error;

      toast.success('Propiedad eliminada');
      onUpdate();
      onStorageChange?.();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Error al eliminar propiedad');
    } finally {
      setIsDeleting(false);
    }
  };

  const images = property.images || [];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Storage Quota Indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <HardDrive className="h-3 w-3" />
            <span>{formatBytes(userStorageUsed)} / {formatBytes(STORAGE_QUOTA_BYTES)}</span>
            <Progress value={storagePercentage} className="flex-1 h-1.5" />
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate">{property.title}</h3>
                <Badge variant={property.is_active ? 'default' : 'secondary'}>
                  {property.is_active ? 'Activa' : 'Oculta'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{property.location}</p>
              <p className="text-sm font-medium text-primary">
                ${property.price.toLocaleString('es-AR')}/mes
              </p>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/propiedad/${property.id}`)}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <EditPropertyDialog property={property as any} />
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleActive}
                disabled={isToggling}
              >
                {isToggling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : property.is_active ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive-outline"
                    size="sm"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar esta propiedad?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. "{property.title}" se va a borrar por completo, junto con sus fotos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteProperty}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Images Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {images.map((image, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                <img
                  src={image}
                  alt={`Imagen ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(image)}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {images.length < 5 && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Plus className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">Agregar</span>
                  </>
                )}
              </label>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyImageManager;
