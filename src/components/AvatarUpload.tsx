import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Camera, Loader2, User, X } from 'lucide-react';

const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3MB

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  onUploaded: (url: string) => void;
  onRemove?: () => void;
}

const AvatarUpload = ({ userId, currentAvatarUrl, onUploaded, onRemove }: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error('La imagen debe ser menor a 3MB');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      onUploaded(urlData.publicUrl);
      toast.success('Foto de perfil actualizada');
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', userId);
      if (error) throw error;
      onRemove?.();
      toast.success('Foto de perfil eliminada');
    } catch (error) {
      console.error('Avatar remove error:', error);
      toast.error('Error al eliminar la imagen');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="relative group">
      <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-primary/20 bg-muted flex items-center justify-center">
        {currentAvatarUrl ? (
          <img src={currentAvatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
        ) : (
          <User className="h-8 w-8 text-muted-foreground" />
        )}
      </div>

      <label className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-md">
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
      </label>

      {currentAvatarUrl && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={removing}
          title="Quitar foto de perfil"
          className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-md"
        >
          {removing ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
        </button>
      )}
    </div>
  );
};

export default AvatarUpload;
