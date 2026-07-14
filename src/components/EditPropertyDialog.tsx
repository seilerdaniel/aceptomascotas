import { useState } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const PET_TYPES = [
  { value: "perro", label: "Perros" },
  { value: "gato", label: "Gatos" },
  { value: "aves", label: "Aves" },
  { value: "peces", label: "Peces" },
  { value: "otros", label: "Otros" },
];

const PROPERTY_TYPES = [
  { value: "departamento", label: "Departamento" },
  { value: "casa", label: "Casa" },
  { value: "ph", label: "PH" },
  { value: "loft", label: "Loft" },
  { value: "monoambiente", label: "Monoambiente" },
];

interface EditPropertyDialogProps {
  property: {
    id: string;
    title: string;
    description: string | null;
    requirements?: string | null;
    price: number;
    property_type: string;
    location: string;
    pet_types: string[];
  };
}

const EditPropertyDialog = ({ property }: EditPropertyDialogProps) => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(property.title);
  const [description, setDescription] = useState(property.description || "");
  const [requirements, setRequirements] = useState(property.requirements || "");
  const [price, setPrice] = useState(String(property.price));
  const [propertyType, setPropertyType] = useState(property.property_type);
  const [location, setLocation] = useState(property.location);
  const [petTypes, setPetTypes] = useState<string[]>(property.pet_types || []);

  const togglePetType = (value: string) => {
    setPetTypes((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );
  };

  const handleSave = async () => {
    if (!title.trim() || title.trim().length < 10) {
      toast.error("El título debe tener al menos 10 caracteres");
      return;
    }
    if (!price || Number(price) <= 0) {
      toast.error("Ingresá un precio válido");
      return;
    }
    if (petTypes.length === 0) {
      toast.error("Elegí al menos un tipo de mascota");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("properties")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          requirements: requirements.trim() || null,
          price: Math.floor(Number(price)),
          property_type: propertyType,
          location: location.trim(),
          pet_types: petTypes,
        } as any)
        .eq("id", property.id);

      if (error) throw error;

      toast.success("Propiedad actualizada");
      queryClient.invalidateQueries({ queryKey: ["user-properties"] });
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      setOpen(false);
    } catch (error) {
      console.error("Error updating property:", error);
      toast.error("No se pudo actualizar la propiedad");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Editar propiedad">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar propiedad</DialogTitle>
          <DialogDescription>
            Los cambios se aplican de inmediato — la publicación sigue visible mientras editás.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="prop-title">Título</Label>
            <Input id="prop-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prop-description">Descripción</Label>
            <Textarea
              id="prop-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prop-requirements">Requisitos para alquilar</Label>
            <Textarea
              id="prop-requirements"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="prop-price">Precio mensual (ARS)</Label>
              <Input
                id="prop-price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de propiedad</Label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prop-location">Ubicación</Label>
            <Input id="prop-location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Acepta</Label>
            <div className="grid grid-cols-2 gap-2">
              {PET_TYPES.map((pt) => (
                <div key={pt.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`pet-${pt.value}`}
                    checked={petTypes.includes(pt.value)}
                    onCheckedChange={() => togglePetType(pt.value)}
                  />
                  <Label htmlFor={`pet-${pt.value}`} className="font-normal cursor-pointer">
                    {pt.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Para cambiar fotos o la ubicación en el mapa, escribinos y te ayudamos — todavía no
            está disponible desde acá.
          </p>

          <Button variant="hero" className="w-full" onClick={handleSave} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPropertyDialog;
