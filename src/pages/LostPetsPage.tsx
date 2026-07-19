import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import SEOHead from '@/components/SEOHead';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, PawPrint, MapPin } from 'lucide-react';
import { googleMapsLink } from '@/lib/googleMaps';

interface LostPet {
  qr_code: string;
  name: string;
  species: string;
  breed: string | null;
  images: string[] | null;
  lost_since: string | null;
  lost_latitude: number | null;
  lost_longitude: number | null;
}

const speciesEmoji = (species: string) => {
  if (species === 'perro') return '🐶';
  if (species === 'gato') return '🐱';
  return '🐾';
};

const LostPetsPage = () => {
  const { data: pets = [], isLoading } = useQuery({
    queryKey: ['lost-pets'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_lost_pets' as any);
      if (error) throw error;
      return (data || []) as LostPet[];
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Mascotas perdidas"
        description="Ayudanos a reunir a las mascotas perdidas con sus familias. Mirá los avisos activos en tu zona."
        path="/mascotas-perdidas"
      />
      <Header />

      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <AlertTriangle className="h-4 w-4" />
              Alerta comunitaria
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Mascotas perdidas
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Estas mascotas fueron reportadas como perdidas por sus familias. Si viste a alguna,
              tocá su tarjeta para contactar directamente a su dueño.
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden h-full">
                  <div className="aspect-square">
                    <Skeleton className="h-full w-full rounded-none" />
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pets.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <PawPrint className="h-12 w-12 text-muted-foreground/30 mx-auto" />
              <p className="text-lg font-medium text-foreground">
                No hay mascotas perdidas reportadas en este momento 🎉
              </p>
              <p className="text-muted-foreground text-sm">
                Ojalá se mantenga así.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pets.map((pet) => (
                <div key={pet.qr_code}>
                  <Link to={`/mascota/${pet.qr_code}`}>
                    <Card className="overflow-hidden hover:shadow-hover transition-shadow h-full border-destructive/20">
                      <div className="aspect-square bg-secondary overflow-hidden">
                        {pet.images && pet.images.length > 0 ? (
                          <img src={pet.images[0]} alt={pet.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-5xl">
                            {speciesEmoji(pet.species)}
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{pet.name}</p>
                          <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full shrink-0">
                            Perdida
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {pet.breed ? `${pet.breed} · ` : ''}
                          {speciesEmoji(pet.species)} {pet.species}
                        </p>
                        {pet.lost_since && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Perdida desde el {new Date(pet.lost_since).toLocaleDateString('es-AR')}
                          </p>
                        )}
                      </CardContent>
                  </Card>
                </Link>
                {pet.lost_latitude && pet.lost_longitude && (
                  <a
                    href={googleMapsLink(pet.lost_latitude, pet.lost_longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2 px-1"
                  >
                    <MapPin className="h-3 w-3" />
                    Ver última ubicación en Google Maps
                  </a>
                )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LostPetsPage;
