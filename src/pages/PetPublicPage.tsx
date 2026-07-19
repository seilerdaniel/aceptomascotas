import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, PawPrint, MessageCircle, Phone, ArrowLeft, AlertTriangle, Share2, Copy } from 'lucide-react';
import logo from '@/assets/logo.svg';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';
import { googleMapsLink } from '@/lib/googleMaps';
import SEOHead from '@/components/SEOHead';

interface PetPublicData {
  pet_name: string;
  pet_species: string;
  pet_breed: string | null;
  pet_images: string[];
  pet_description: string | null;
  owner_phone: string | null;
  owner_has_whatsapp: boolean | null;
  owner_alternative_phone: string | null;
  is_lost?: boolean;
  lost_since?: string | null;
  lost_latitude?: number | null;
  lost_longitude?: number | null;
}

const speciesEmoji: Record<string, string> = {
  perro: '🐶',
  gato: '🐱',
  otro: '🐾',
};

const PetPublicPage = () => {
  const { code } = useParams<{ code: string }>();
  const [pet, setPet] = useState<PetPublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPet = async () => {
      if (!code) return;

      const { data, error } = await supabase.rpc('get_pet_by_qr_code', { code });

      if (error || !data || data.length === 0) {
        setNotFound(true);
      } else {
        setPet(data[0] as PetPublicData);
      }
      setLoading(false);
    };

    fetchPet();
  }, [code]);

  const buildWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `¡Hola! Encontré a tu mascota mediante el código QR de Acepto Mascotas 🐾`
    );
    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  const handleShareLostAlert = async () => {
    if (!pet) return;
    const shareUrl = window.location.href;
    const shareText = `🚨 ${pet.pet_name} está perdid${pet.pet_species === 'gata' ? 'a' : 'o'}. Si lo ves, contactá a su familia acá:`;

    trackEvent('lost_pet_share_click', { pet_name: pet.pet_name });

    if (navigator.share) {
      try {
        await navigator.share({ title: `${pet.pet_name} está perdido/a`, text: shareText, url: shareUrl });
      } catch {
        // User cancelled the share sheet; nothing to do.
      }
    } else {
      const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
      window.open(whatsappShareUrl, '_blank');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado');
    } catch {
      toast.error('No se pudo copiar el link');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !pet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <PawPrint className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Código no encontrado</h1>
            <p className="text-muted-foreground mb-6">
              Este código QR no corresponde a ninguna mascota registrada.
            </p>
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ir a Acepto Mascotas
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasPrimaryWhatsapp = pet.owner_phone && pet.owner_has_whatsapp;
  const showAlternative = !hasPrimaryWhatsapp && pet.owner_alternative_phone;

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <SEOHead
        title={pet.is_lost ? `¿Viste a ${pet.pet_name}?` : pet.pet_name}
        description={
          pet.is_lost
            ? `${pet.pet_name} está perdido/a. Ayudanos a encontrarlo/a — contactá al dueño desde acá.`
            : `Perfil de ${pet.pet_name}, con QR de identificación de Acepto Mascotas.`
        }
        path={`/mascota/${code}`}
        image={pet.pet_images?.[0]}
      />
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-full bg-white p-0.5 shadow-sm">
            <img src={logo} alt="Acepto Mascotas" className="h-full w-full rounded-full object-cover" />
          </div>
          <span className="font-body font-bold text-lg">Acepto Mascotas</span>
        </Link>

        <Card className="overflow-hidden shadow-hover">
          {pet.is_lost && (
            <div className="bg-destructive text-destructive-foreground text-center py-2 px-4 flex items-center justify-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4" />
              MASCOTA PERDIDA{pet.lost_since ? ` · desde el ${new Date(pet.lost_since).toLocaleDateString('es-AR')}` : ''}
            </div>
          )}
          {pet.is_lost && pet.lost_latitude && pet.lost_longitude && (
            <a
              href={googleMapsLink(pet.lost_latitude, pet.lost_longitude)}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-destructive/10 text-destructive text-center py-2 px-4 text-sm font-medium hover:underline"
            >
              📍 Ver última ubicación vista en Google Maps
            </a>
          )}

          {pet.pet_images && pet.pet_images.length > 0 ? (
            <div className="aspect-square w-full">
              <img
                src={pet.pet_images[0]}
                alt={pet.pet_name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-square w-full bg-muted flex items-center justify-center">
              <span className="text-6xl">{speciesEmoji[pet.pet_species] || '🐾'}</span>
            </div>
          )}

          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
                {speciesEmoji[pet.pet_species] || '🐾'} {pet.pet_name}
              </h1>
              {pet.pet_breed && (
                <p className="text-muted-foreground">{pet.pet_breed}</p>
              )}
            </div>

            {pet.pet_description && (
              <p className="text-sm text-center text-muted-foreground border-t border-b py-3">
                {pet.pet_description}
              </p>
            )}

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center space-y-3">
              <p className="text-sm font-medium">
                {pet.is_lost ? `¿Viste a ${pet.pet_name}? 🙏` : `¿Encontraste a ${pet.pet_name}? 🙏`}
              </p>
              <p className="text-xs text-muted-foreground">
                Contactá a su familia para que puedan reencontrarse
              </p>

              {hasPrimaryWhatsapp && pet.owner_phone && (
                <a href={buildWhatsAppLink(pet.owner_phone)} target="_blank" rel="noopener noreferrer">
                  <Button variant="hero" className="w-full gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Contactar por WhatsApp
                  </Button>
                </a>
              )}

              {!hasPrimaryWhatsapp && pet.owner_phone && (
                <a href={`tel:${pet.owner_phone}`}>
                  <Button variant="hero" className="w-full gap-2">
                    <Phone className="h-4 w-4" />
                    Llamar por teléfono
                  </Button>
                </a>
              )}

              {showAlternative && pet.owner_alternative_phone && (
                <a href={`tel:${pet.owner_alternative_phone}`}>
                  <Button variant="outline" className="w-full gap-2">
                    <Phone className="h-4 w-4" />
                    Teléfono alternativo
                  </Button>
                </a>
              )}

              {!pet.owner_phone && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  No hay un teléfono de contacto disponible
                </p>
              )}

              {pet.is_lost && (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2" onClick={handleShareLostAlert}>
                    <Share2 className="h-4 w-4" />
                    Compartir alerta
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleCopyLink} aria-label="Copiar link">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Identificación generada en{' '}
          <Link to="/" className="text-primary hover:underline">
            Acepto Mascotas
          </Link>
        </p>
      </div>
    </div>
  );
};

export default PetPublicPage;
