import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, Home, Heart, Shield, Clock, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import SearchBar from "@/components/SearchBar";
import PropertyCard from "@/components/PropertyCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CafecitoSection from "@/components/CafecitoSection";
import { useFeaturedProperties, usePlatformStats } from "@/hooks/useProperties";
import { useActiveAds } from "@/hooks/useAdvertisements";
import { trackEvent } from "@/lib/analytics";
import { mockProperties } from "@/data/properties";
import heroImage from "@/assets/hero-image.jpg";
import logo from "@/assets/logo.svg";

const Index = () => {
  const navigate = useNavigate();
  const { data: dbProperties = [], isLoading } = useFeaturedProperties(6);
  const { data: stats } = usePlatformStats();
  const { data: ads = [] } = useActiveAds();

  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
  // Same rule as the navbar CTA: only propietario/agencia get to publish,
  // never buscador, and never admin (their workspace is /admin).
  const canPublish =
    !isAdmin && (profile?.user_type === "propietario" || profile?.user_type === "agencia");

  const [adsApi, setAdsApi] = useState<CarouselApi>();

  // Auto-advance the ads carousel every 5s, only when there's more than one ad.
  useEffect(() => {
    if (!adsApi || ads.length <= 1) return;
    const interval = setInterval(() => {
      if (adsApi.canScrollNext()) {
        adsApi.scrollNext();
      } else {
        adsApi.scrollTo(0);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [adsApi, ads.length]);

  // Only show the public counter once numbers are meaningful enough to
  // build trust rather than look empty. Tune this as volume grows.
  const STATS_MIN_PROPERTIES = 5;
  const showStats = (stats?.properties ?? 0) >= STATS_MIN_PROPERTIES;

  // Transform database properties to match PropertyCard format
  const transformedDbProperties = dbProperties.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description || "",
    location: p.location,
    price: p.price,
    propertyType: p.property_type,
    petTypes: p.pet_types,
    images: p.images || [],
    contactName: p.contact_name,
    contactPhone: p.contact_phone || "",
    contactEmail: p.contact_email || "",
    amenities: [],
  }));

  // Use database properties if available, otherwise fall back to mock data
  const featuredProperties = transformedDbProperties.length > 0 
    ? transformedDbProperties 
    : mockProperties.slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center gradient-hero overflow-hidden">
          {/* Background Image with overlay */}
          <div className="absolute inset-0">
            <img 
              src={heroImage} 
              alt="Hogar pet-friendly con mascotas felices" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
          </div>

          <div className="container relative z-10 py-16 md:py-24">
            <div className="max-w-2xl space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-pet-green-light/80 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium text-primary animate-fade-up">
                <div className="h-5 w-5 rounded-full bg-white p-0.5 shrink-0">
                  <img src={logo} alt="Acepto Mascotas" className="h-full w-full rounded-full object-cover" />
                </div>
                <span>El marketplace pet-friendly de Argentina</span>
              </div>

              {/* Title */}
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight animate-fade-up" style={{ animationDelay: "0.1s" }}>
                Alquileres donde tus mascotas también son{" "}
                <span className="text-primary">bienvenidas</span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg animate-fade-up" style={{ animationDelay: "0.2s" }}>
                Encontrá tu próximo hogar sin tener que elegir entre tu familia y tus compañeros peludos. 
                Porque ellos también merecen un lugar donde ser felices.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
                <Link to="/buscar">
                  <Button variant="hero" size="xl">
                    <Search className="h-5 w-5" />
                    Buscar alquileres
                  </Button>
                </Link>
                {canPublish && (
                  <Link to="/publicar">
                    <Button variant="hero-outline" size="xl">
                      <Plus className="h-5 w-5" />
                      Publicar alquiler
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Floating decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* Search Section */}
        <section className="container -mt-12 relative z-20 pb-16">
          <SearchBar />
        </section>

        {/* Stats Section */}
        {showStats && (
          <section className="container pb-16">
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-center">
              <div className="bg-card rounded-2xl border p-6">
                <div className="flex items-center justify-center gap-2 text-primary mb-1">
                  <Home className="h-5 w-5" />
                  <span className="font-display text-3xl font-bold">{stats?.properties}</span>
                </div>
                <p className="text-sm text-muted-foreground">Propiedades publicadas</p>
              </div>
              <div className="bg-card rounded-2xl border p-6">
                <div className="flex items-center justify-center gap-2 text-primary mb-1">
                  <Users className="h-5 w-5" />
                  <span className="font-display text-3xl font-bold">{stats?.searchers}</span>
                </div>
                <p className="text-sm text-muted-foreground">Familias buscando</p>
              </div>
            </div>
          </section>
        )}

        {/* Ad Banner */}
        {ads.length > 0 && (
          <section className="container pb-12">
            <div className="max-w-4xl mx-auto">
              <p className="text-xs text-muted-foreground text-center mb-2">Publicidad</p>
              <Carousel setApi={setAdsApi} className="relative">
                <CarouselContent>
                  {ads.map((ad) => (
                    <CarouselItem key={ad.id}>
                      <a
                        href={ad.link_url || "#"}
                        target={ad.link_url ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        onClick={() => trackEvent("ad_banner_click", { advertiser: ad.advertiser_name })}
                        className="block rounded-2xl overflow-hidden border hover:opacity-90 transition-opacity"
                      >
                        <div className="w-full aspect-[3/1] bg-secondary">
                          <img
                            src={ad.image_url}
                            alt={ad.alt_text}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </a>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {ads.length > 1 && (
                  <>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </>
                )}
              </Carousel>
            </div>
          </section>
        )}

        {/* Featured Properties */}
        <section className="container py-16">
          <div className="text-center space-y-4 mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Propiedades destacadas
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explorá alquileres verificados que aceptan mascotas en las mejores zonas
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card rounded-2xl border h-80 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/buscar">
              <Button variant="outline" size="lg">
                Ver todas las propiedades
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-secondary/50 py-16">
          <div className="container">
            <div className="text-center space-y-4 mb-12">
              <h2 className="font-body text-3xl md:text-4xl font-bold text-foreground">
                ¿Por qué Acepto Mascotas?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Una plataforma pensada para familias con mascotas
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  icon: Heart,
                  title: "100% Pet-Friendly",
                  description: "Todas las propiedades aceptan mascotas. Sin sorpresas ni rechazos.",
                },
                {
                  icon: Shield,
                  title: "Publicación Gratuita",
                  description: "Publicá tu propiedad sin costo. Conectamos propietarios con inquilinos.",
                },
                {
                  icon: Clock,
                  title: "Simple y Rápido",
                  description: "Sin registro obligatorio. Buscá, contactá y mudáte con tu mascota.",
                },
              ].map((feature, i) => (
                <div
                  key={feature.title}
                  className="bg-card rounded-2xl p-8 text-center shadow-soft hover:shadow-hover transition-all duration-300"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-pet-green-light text-primary mb-6">
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cafecito Section */}
        <CafecitoSection />

        {/* CTA Section — only relevant to propietario/agencia */}
        {canPublish && (
        <section className="container py-20">
          <div className="bg-primary rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10">
                <div className="h-32 w-32 rounded-full bg-white p-2">
                  <img src={logo} alt="" className="h-full w-full rounded-full object-cover opacity-50" />
                </div>
              </div>
              <div className="absolute bottom-10 right-10">
                <Home className="h-24 w-24" />
              </div>
            </div>
            <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground">
                ¿Tenés una propiedad que acepta mascotas?
              </h2>
              <p className="text-primary-foreground/80 text-lg">
                Publicá gratis y conectá con inquilinos responsables que buscan un hogar para toda su familia.
              </p>
              <Link to="/publicar">
                <Button variant="secondary" size="xl" className="mt-4">
                  <Plus className="h-5 w-5" />
                  Publicar ahora
                </Button>
              </Link>
            </div>
          </div>
        </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;