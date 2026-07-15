import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, PawPrint, X, Plus } from 'lucide-react';

const MAX_IMAGES = 3;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  age_years: number | null;
  weight_kg: number | null;
  description: string | null;
  images: string[];
}

interface PetFormProps {
  pet?: Pet;
  onSave: () => void;
  onCancel: () => void;
}

const PetForm = ({ pet, onSave, onCancel }: PetFormProps) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [name, setName] = useState(pet?.name || '');
  const [species, setSpecies] = useState(pet?.species || '');
  const [breed, setBreed] = useState(pet?.breed || '');
  const [ageYears, setAgeYears] = useState(pet?.age_years?.toString() || '');
  const [weightKg, setWeightKg] = useState(pet?.weight_kg?.toString() || '');
  const [description, setDescription] = useState(pet?.description || '');
  const [images, setImages] = useState<string[]>(pet?.images || []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      toast.error(`Máximo ${MAX_IMAGES} imágenes por mascota`);
      return;
    }

    setIsUploading(true);
    const newUrls: string[] = [];

    try {
      const filesToUpload = Array.from(files).slice(0, remainingSlots);

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
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('pet-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('pet-images')
          .getPublicUrl(fileName);

        newUrls.push(urlData.publicUrl);
      }

      if (newUrls.length > 0) {
        setImages((prev) => [...prev, ...newUrls]);
        toast.success(`${newUrls.length} imagen(es) agregada(s)`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error al subir imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    setImages((prev) => prev.filter((img) => img !== imageUrl));

    try {
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/storage/v1/object/public/pet-images/');
      if (pathParts[1]) {
        await supabase.storage.from('pet-images').remove([decodeURIComponent(pathParts[1])]);
      }
    } catch {
      // Ignorar errores de borrado en storage
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!name.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (!species) { toast.error('La especie es obligatoria'); return; }

    setSaving(true);

    const payload = {
      user_id: user.id,
      name: name.trim(),
      species,
      breed: breed.trim() || null,
      age_years: ageYears ? parseInt(ageYears) : null,
      weight_kg: weightKg ? parseFloat(weightKg) : null,
      description: description.trim() || null,
      images,
    };

    let error;

    if (pet) {
      const result = await supabase.from('pets').update(payload).eq('id', pet.id);
      error = result.error;
    } else {
      const result = await supabase.from('pets').insert(payload);
      error = result.error;
    }

    if (error) {
      toast.error('Error al guardar: ' + error.message);
    } else {
      toast.success(pet ? 'Mascota actualizada' : '¡Mascota agregada!');
      onSave();
    }

    setSaving(false);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <PawPrint className="h-4 w-4 text-primary" />
            {pet ? 'Editar mascota' : 'Agregar mascota'}
          </CardTitle>
          <Button variant="ghost" size="icon" aria-label="Cerrar formulario" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input
              placeholder="Ej: Ringo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label>Especie *</Label>
            <Select value={species} onValueChange={setSpecies}>
              <SelectTrigger>
                <SelectValue placeholder="Elegí..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="perro">🐶 Perro</SelectItem>
                <SelectItem value="gato">🐱 Gato</SelectItem>
                <SelectItem value="otro">🐾 Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Raza</Label>
            <Input
              placeholder="Ej: Caniche"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label>Edad (años)</Label>
            <Input
              type="number"
              min={0}
              max={30}
              placeholder="Ej: 3"
              value={ageYears}
              onChange={(e) => setAgeYears(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Peso (kg)</Label>
            <Input
              type="number"
              min={0}
              max={150}
              step={0.1}
              placeholder="Ej: 8.5"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Descripción</Label>
          <Textarea
            placeholder="Contá algo sobre tu mascota: su carácter, si es tranquila, si juega mucho..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            rows={3}
          />
          <p className="text-xs text-muted-foreground text-right">
            {description.length}/300
          </p>
        </div>

        {/* Carga de imágenes */}
        <div className="space-y-2">
          <Label>Fotos (máximo {MAX_IMAGES})</Label>
          <div className="grid grid-cols-3 gap-2">
            {images.map((image, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                <img src={image} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(image)}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {images.length < MAX_IMAGES && (
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

        <div className="flex gap-3 pt-2">
          <Button variant="hero" onClick={handleSubmit} disabled={saving || isUploading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {pet ? 'Guardar cambios' : 'Agregar mascota'}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PetForm;
