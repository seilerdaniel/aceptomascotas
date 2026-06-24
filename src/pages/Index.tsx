import { Search, Plus, Home, Heart, Shield, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/SearchBar";
import PropertyCard from "@/components/PropertyCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CafecitoSection from "@/components/CafecitoSection";
import { useFeaturedProperties } from "@/hooks/useProperties";
import { mockProperties } from "@/data/properties";
import heroImage from "@/assets/hero-image.jpg";
import logo from "@/assets/logo.png";

const Index = () => {
  const navigate = useNavigate();
  const { data: dbProperties = [], isLoading } = useFeaturedProperties(6);

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
                <img src={logo} alt="Acepto Mascotas" className="h-5 w-5" />
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
                <Link to="/publicar">
                  <Button variant="hero-outline" size="xl">
                    <Plus className="h-5 w-5" />
                    Publicar alquiler
                  </Button>
                </Link>
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

        {/* CTA Section */}
        <section className="container py-20">
          <div className="bg-primary rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10">
                <img src={logo} alt="" className="h-32 w-32 opacity-50" />
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
      </main>

      <Footer />
    </div>
  );
};

export default Index;