import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PropertyCard from '@/components/PropertyCard';
import VerifiedIcon from '@/components/VerifiedIcon';
import { Loader2, User, Building2 } from 'lucide-react';

const AgencyPage = () => {
  const { userId } = useParams<{ userId: string }>();

  const { data: agency, isLoading: agencyLoading } = useQuery({
    queryKey: ['agency-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .rpc('get_agency_public_profile' as any, { agency_user_id: userId })
        .maybeSingle();
      if (error) throw error;
      return data as {
        full_name: string | null;
        avatar_url: string | null;
        banner_url: string | null;
        is_verified: boolean;
      } | null;
    },
    enabled: !!userId,
  });

  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['agency-properties', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.rpc('get_agency_properties' as any, {
        agency_user_id: userId,
      });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!userId,
  });

  const transformedProperties = properties.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description || '',
    location: p.location,
    price: p.price,
    propertyType: p.property_type,
    petTypes: p.pet_types,
    images: p.images || [],
    contactName: p.contact_name,
    contactPhone: p.contact_phone || '',
    contactEmail: p.contact_email || '',
    amenities: [],
    isVerified: p.owner_is_verified ?? false,
  }));

  if (agencyLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Agencia no encontrada
          </h1>
          <p className="text-muted-foreground">
            Esta página no existe o la cuenta ya no es una agencia activa.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Banner */}
        <div className="w-full aspect-[4/1] bg-secondary overflow-hidden">
          {agency.banner_url ? (
            <img src={agency.banner_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10" />
          )}
        </div>

        {/* Header con avatar + nombre */}
        <div className="container">
          <div className="flex items-end gap-4 -mt-10 mb-6">
            <div className="h-20 w-20 rounded-2xl overflow-hidden border-4 border-background bg-muted flex items-center justify-center shrink-0">
              {agency.avatar_url ? (
                <img src={agency.avatar_url} alt={agency.full_name || ''} className="w-full h-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl font-bold text-foreground">
                  {agency.full_name || 'Agencia'}
                </h1>
                {agency.is_verified && <VerifiedIcon label="Agencia verificada" />}
              </div>
              <p className="text-sm text-muted-foreground">
                {transformedProperties.length} {transformedProperties.length === 1 ? 'propiedad publicada' : 'propiedades publicadas'}
              </p>
            </div>
          </div>

          {/* Listado de propiedades */}
          <div className="pb-12">
            {propertiesLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : transformedProperties.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {transformedProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                Esta agencia no tiene propiedades activas en este momento.
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AgencyPage;
