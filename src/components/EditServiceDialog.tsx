import { useState } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useUpdateService, PetService } from "@/hooks/useServices";
import ImageUploadField from "@/components/ImageUploadField";

interface EditServiceDialogProps {
  service: PetService;
}

const EditServiceDialog = ({ service }: EditServiceDialogProps) => {
  const [open, setOpen] = useState(false);
  const updateService = useUpdateService();

  const [name, setName] = useState(service.name);
  const [description, setDescription] = useState(service.description || "");
  const [city, setCity] = useState(service.city);
  const [neighborhood, setNeighborhood] = useState(service.neighborhood || "");
  const [phone, setPhone] = useState(service.phone || "");
  const [whatsapp, setWhatsapp] = useState(service.whatsapp || "");
  const [is24h, setIs24h] = useState(service.is_24h || false);
  const [bannerUrl, setBannerUrl] = useState<string | null>((service as any).banner_url || null);
  const [logoUrl, setLogoUrl] = useState<string | null>((service as any).logo_url || null);

  const handleSave = async () => {
    try {
      await updateService.mutateAsync({
        id: service.id,
        // TODO: remove `as any` once `npm run gen:types` picks up
        // banner_url/logo_url from the service-images migration.
        updates: {
          name: name.trim(),
          description: description.trim() || null,
          city: city.trim(),
          neighborhood: neighborhood.trim() || null,
          phone: phone.trim() || null,
          whatsapp: whatsapp.trim() || null,
          is_24h: is24h,
          banner_url: bannerUrl,
          logo_url: logoUrl,
          // Editing sends it back for re-approval, since the details changed.
          is_approved: false,
        } as any,
      });
      toast.success("Servicio actualizado. Quedará pendiente de aprobación nuevamente.");
      setOpen(false);
    } catch {
      toast.error("Error al actualizar el servicio");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Editar servicio">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar servicio</DialogTitle>
          <DialogDescription>
            Los cambios vuelven a quedar pendientes de aprobación antes de publicarse.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <ImageUploadField
            bucket="service-images"
            folderPath={service.user_id || "shared"}
            filePrefix="banner"
            currentUrl={bannerUrl}
            shape="banner"
            label="Imagen de portada"
            onUploaded={setBannerUrl}
            onRemove={() => setBannerUrl(null)}
          />

          <div>
            <p className="text-sm font-medium mb-2">Logo</p>
            <ImageUploadField
              bucket="service-images"
              folderPath={service.user_id || "shared"}
              filePrefix="logo"
              currentUrl={logoUrl}
              shape="square"
              onUploaded={setLogoUrl}
              onRemove={() => setLogoUrl(null)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-name">Nombre</Label>
            <Input id="service-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-description">Descripción</Label>
            <Textarea
              id="service-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="service-city">Ciudad</Label>
              <Input id="service-city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-neighborhood">Barrio</Label>
              <Input
                id="service-neighborhood"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="service-phone">Teléfono</Label>
              <Input id="service-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-whatsapp">WhatsApp</Label>
              <Input id="service-whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="service-24h" checked={is24h} onCheckedChange={(c) => setIs24h(!!c)} />
            <Label htmlFor="service-24h" className="font-normal cursor-pointer">
              Atención las 24 horas
            </Label>
          </div>

          <Button variant="hero" className="w-full" onClick={handleSave} disabled={updateService.isPending}>
            {updateService.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditServiceDialog;
