import { useState } from 'react';
import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { QrCode, Download, Loader2, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PetQRCodeProps {
  petId: string;
  petName: string;
  existingQrCode: string | null;
  onGenerated: () => void;
}

const PetQRCode = ({ petId, petName, existingQrCode, onGenerated }: PetQRCodeProps) => {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(existingQrCode);

  const publicUrl = qrCode ? `${window.location.origin}/mascota/${qrCode}` : null;

  const buildQrImage = async (code: string) => {
    const url = `${window.location.origin}/mascota/${code}`;
    const dataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: { dark: '#1B2A4A', light: '#FFFFFF' },
    });
    setQrImageUrl(dataUrl);
  };

  const handleOpen = async () => {
    setOpen(true);
    if (qrCode) {
      await buildQrImage(qrCode);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.rpc('generate_pet_qr_code', {
        pet_id_input: petId,
      });

      if (error) throw error;

      const newCode = data as string;
      setQrCode(newCode);
      await buildQrImage(newCode);
      toast.success('¡Código QR generado!');
      onGenerated();
    } catch (error) {
      console.error('Error generating QR:', error);
      toast.error('Error al generar el código QR');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!qrImageUrl) return;
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = `qr-${petName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.click();
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen} className="gap-2">
        <QrCode className="h-4 w-4" />
        {qrCode ? 'Ver QR' : 'Generar QR'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Código QR de {petName}
            </DialogTitle>
            <DialogDescription>
              Imprimí este código y colocalo en la chapita del collar o pretal.
              Si {petName} se pierde, cualquiera que lo encuentre puede escanearlo
              para contactarte.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            {!qrCode ? (
              <div className="text-center space-y-4">
                <div className="w-48 h-48 rounded-lg border-2 border-dashed border-border flex items-center justify-center mx-auto">
                  <QrCode className="h-12 w-12 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Todavía no generaste un código QR para esta mascota
                </p>
                <Button variant="hero" onClick={handleGenerate} disabled={generating}>
                  {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generar código QR
                </Button>
              </div>
            ) : (
              <>
                {qrImageUrl ? (
                  <img
                    src={qrImageUrl}
                    alt={`Código QR de ${petName}`}
                    className="w-48 h-48 rounded-lg border"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}

                <div className="flex flex-col gap-2 w-full">
                  <Button variant="hero" onClick={handleDownload} className="gap-2">
                    <Download className="h-4 w-4" />
                    Descargar imagen
                  </Button>
                  {publicUrl && (
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Ver página pública
                      </Button>
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PetQRCode;
