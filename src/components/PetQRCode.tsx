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
import logo from '@/assets/logo.png';

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

    // High error-correction level so the code stays scannable
    // even with the logo covering part of the center.
    const qr = QRCode.create(url, { errorCorrectionLevel: 'H' });
    const dataUrl = await drawQr(qr.modules.size, qr.modules.data);
    setQrImageUrl(dataUrl);
  };

  // Draws the QR code module-by-module onto a canvas, rendering the three
  // finder patterns (corner squares) with subtle rounded corners, then
  // overlays the Acepto Mascotas logo in a white rounded badge at the center.
  const drawQr = (moduleCount: number, moduleData: Uint8Array): Promise<string> => {
    return new Promise((resolve) => {
      const size = 400;
      const dark = '#1B2A4A';
      const light = '#FFFFFF';
      const margin = 2; // quiet zone modules
      const totalModules = moduleCount + margin * 2;
      const cell = size / totalModules;
      const overlap = 0.75; // px overlap between modules to avoid anti-aliasing seams

      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }

      ctx.fillStyle = light;
      ctx.fillRect(0, 0, size, size);

      const isDark = (r: number, c: number) => {
        if (r < 0 || c < 0 || r >= moduleCount || c >= moduleCount) return false;
        return (moduleData[r * moduleCount + c] & 1) === 1;
      };

      const finderRegions = [
        { r0: 0, c0: 0 },
        { r0: 0, c0: moduleCount - 7 },
        { r0: moduleCount - 7, c0: 0 },
      ];
      const inFinderRegion = (r: number, c: number) =>
        finderRegions.some((f) => r >= f.r0 && r < f.r0 + 7 && c >= f.c0 && c < f.c0 + 7);

      // Regular modules as plain (slightly overlapping) squares
      ctx.fillStyle = dark;
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (inFinderRegion(r, c) || !isDark(r, c)) continue;
          const x = (c + margin) * cell - overlap / 2;
          const y = (r + margin) * cell - overlap / 2;
          ctx.fillRect(x, y, cell + overlap, cell + overlap);
        }
      }

      // Helper to draw a rounded square
      const roundedRect = (x: number, y: number, s: number, r: number, color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + s, y, x + s, y + s, r);
        ctx.arcTo(x + s, y + s, x, y + s, r);
        ctx.arcTo(x, y + s, x, y, r);
        ctx.arcTo(x, y, x + s, y, r);
        ctx.closePath();
        ctx.fill();
      };

      // Subtly rounded finder patterns (outer ring, white gap, inner eye)
      for (const f of finderRegions) {
        const x0 = (f.c0 + margin) * cell;
        const y0 = (f.r0 + margin) * cell;
        const outerSize = 7 * cell;
        roundedRect(x0, y0, outerSize, outerSize * 0.16, dark);
        const ringSize = 5 * cell;
        roundedRect(x0 + cell, y0 + cell, ringSize, ringSize * 0.16, light);
        const eyeSize = 3 * cell;
        roundedRect(x0 + cell * 2, y0 + cell * 2, eyeSize, eyeSize * 0.16, dark);
      }

      const logoImg = new Image();
      logoImg.onload = () => {
        const badgeSize = size * 0.3; // safe max with 'H' error correction
        const badgeX = (size - badgeSize) / 2;
        const badgeY = (size - badgeSize) / 2;
        roundedRect(badgeX, badgeY, badgeSize, badgeSize * 0.2, light);

        const logoPadding = badgeSize * 0.08;
        const logoSize = badgeSize - logoPadding * 2;
        ctx.drawImage(logoImg, badgeX + logoPadding, badgeY + logoPadding, logoSize, logoSize);

        resolve(canvas.toDataURL('image/png'));
      };
      logoImg.onerror = () => resolve(canvas.toDataURL('image/png'));
      logoImg.src = logo;
    });
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
