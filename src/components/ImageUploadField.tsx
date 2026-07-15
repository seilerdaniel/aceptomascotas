import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Camera, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

interface ImageUploadFieldProps {
  bucket: string;
  /** Folder path within the bucket, e.g. `${userId}` or `${userId}/services/${serviceId}` */
  folderPath: string;
  filePrefix: string;
  currentUrl: string | null;
  onUploaded: (url: string) => void;
  onRemove?: () => void;
  shape?: 'banner' | 'square';
  label?: string;
}

const ImageUploadField = ({
  bucket,
  folderPath,
  filePrefix,
  currentUrl,
  onUploaded,
  onRemove,
  shape = 'banner',
  label,
}: ImageUploadFieldProps) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error('La imagen debe ser menor a 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folderPath}/${filePrefix}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
      onUploaded(urlData.publicUrl);
      toast.success('Imagen actualizada');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  if (shape === 'square') {
    return (
      <div className="relative inline-block">
        <div className="h-20 w-20 rounded-xl overflow-hidden border-2 border-primary/20 bg-muted flex items-center justify-center">
          {currentUrl ? (
            <img src={currentUrl} alt={label || 'Imagen'} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        {currentUrl && onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            title="Quitar imagen"
            className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-md"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : (
          <label className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-md">
            <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </label>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden border-2 border-dashed border-border bg-muted flex items-center justify-center">
        {currentUrl ? (
          <img src={currentUrl} alt={label || 'Banner'} className="w-full h-full object-cover" />
        ) : (
          <label className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground cursor-pointer hover:bg-foreground/5 transition-colors">
            <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
            {uploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <ImageIcon className="h-8 w-8" />}
            <span className="text-xs">{uploading ? 'Subiendo...' : 'Subir imagen'}</span>
          </label>
        )}

        {currentUrl && (
          <button
            type="button"
            onClick={onRemove}
            title="Quitar imagen"
            className="absolute bottom-2 right-2 h-9 w-9 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-md"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ImageUploadField;
