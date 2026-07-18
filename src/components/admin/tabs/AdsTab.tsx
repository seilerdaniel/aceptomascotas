import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/alert-dialog";
import ImageUploadField from "@/components/ImageUploadField";
import type { AdminAd } from "@/types/admin";
import type { TablesInsert } from "@/integrations/supabase/types";

interface AdsTabProps {
  ads: AdminAd[];
  isLoading: boolean;
  nextSortOrder: number;
  isCreating: boolean;
  userId: string | undefined;
  onCreate: (ad: TablesInsert<"advertisements">) => Promise<boolean>;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

const AdsTab = ({
  ads,
  isLoading,
  nextSortOrder,
  isCreating,
  userId,
  onCreate,
  onToggleActive,
  onDelete,
}: AdsTabProps) => {
  // Estado del formulario de "nuevo anuncio": es UI local del tab, no
  // necesita vivir en AdminPage — nadie más lo consume.
  const [name, setName] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [alt, setAlt] = useState("");

  const handleCreate = async () => {
    if (!name.trim() || !image || !alt.trim()) {
      toast.error("Completá nombre, imagen y texto alternativo");
      return;
    }
    const success = await onCreate({
      advertiser_name: name.trim(),
      image_url: image,
      link_url: link.trim() || null,
      alt_text: alt.trim(),
      sort_order: nextSortOrder,
    });
    if (success) {
      setName("");
      setImage(null);
      setLink("");
      setAlt("");
    }
  };

  return (
    <TabsContent value="ads" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nueva publicidad</CardTitle>
          <CardDescription>
            Se muestra en la home. Coordinás el pago con la marca/agencia por fuera de la plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userId && (
            <div className="space-y-1.5">
              <ImageUploadField
                bucket="ad-images"
                folderPath="ads"
                filePrefix={userId}
                currentUrl={image}
                shape="banner"
                label="Imagen del anuncio"
                onUploaded={setImage}
                onRemove={() => setImage(null)}
              />
              <p className="text-xs text-muted-foreground">
                Tamaño recomendado: 1200×400px (relación 3:1) — es la proporción con la que se muestra en la
                home. Formato JPG o PNG, hasta 5MB.
              </p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ad-name">Nombre del anunciante</Label>
              <Input
                id="ad-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Veterinaria San Martín"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ad-link">Link de destino (opcional)</Label>
              <Input
                id="ad-link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ad-alt">Texto alternativo (accesibilidad)</Label>
            <Input
              id="ad-alt"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Ej: Promoción de descuento en consultas veterinarias"
            />
          </div>
          <Button variant="hero" onClick={handleCreate} disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear publicidad
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Publicidades activas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : ads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay publicidades cargadas todavía</div>
          ) : (
            <div className="space-y-3">
              {ads.map((ad) => (
                <div key={ad.id} className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30 flex-wrap">
                  <img
                    src={ad.image_url}
                    alt={ad.alt_text}
                    className="h-16 w-28 object-cover rounded-md shrink-0"
                  />
                  <div className="flex-1 min-w-[150px]">
                    <p className="font-medium">{ad.advertiser_name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-xs">
                      {ad.link_url || "Sin link"}
                    </p>
                  </div>
                  <Switch
                    checked={!!ad.is_active}
                    onCheckedChange={(checked) => onToggleActive(ad.id, checked)}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive-outline" size="icon" aria-label="Eliminar publicidad">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar esta publicidad?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. El anuncio de "{ad.advertiser_name}" dejará de
                          mostrarse.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(ad.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default AdsTab;
