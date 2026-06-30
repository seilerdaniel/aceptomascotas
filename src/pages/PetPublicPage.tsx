import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, PawPrint, MessageCircle, Phone, ArrowLeft } from 'lucide-react';
import logo from '@/assets/logo.svg';

interface PetPublicData {
  pet_name: string;
  pet_species: string;
  pet_breed: string | null;
  pet_images: string[];
  pet_description: string | null;
  owner_phone: string | null;
  owner_has_whatsapp: boolean | null;
  owner_alternative_phone: string | null;
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
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <img src={logo} alt="Acepto Mascotas" className="h-10 w-10" />
          <span className="font-body font-bold text-lg">Acepto Mascotas</span>
        </Link>

        <Card className="overflow-hidden shadow-hover">
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
                ¿Encontraste a {pet.pet_name}? 🙏
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
                <p className="text-xs text-destructive">
                  No hay un teléfono de contacto disponible
                </p>
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
