import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import LocationPicker from '@/components/LocationPicker';

interface MarkPetLostDialogProps {
  petName: string;
  onConfirm: (lat: number | null, lng: number | null) => Promise<void>;
}

const MarkPetLostDialog = ({ petName, onConfirm }: MarkPetLostDialogProps) => {
  const [open, setOpen] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    await onConfirm(lat, lng);
    setSubmitting(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-1">
          <AlertTriangle className="h-3.5 w-3.5" />
          Perdida
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Marcar a {petName} como perdida
          </DialogTitle>
          <DialogDescription>
            Marcá en el mapa dónde la viste por última vez (opcional). Ayuda a que la comunidad
            la busque en la zona correcta.
          </DialogDescription>
        </DialogHeader>

        <LocationPicker
          initialLat={lat}
          initialLng={lng}
          onChange={(newLat, newLng) => {
            setLat(newLat);
            setLng(newLng);
          }}
        />

        <Button variant="hero" className="w-full" onClick={handleConfirm} disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirmar, está perdida
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default MarkPetLostDialog;
