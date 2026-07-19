import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { mockProperties } from "@/data/properties";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const FavoritesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { favorites, loading: favLoading } = useFavorites();

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <SEOHead title="Mis favoritos" description="Tus propiedades favoritas." path="/favoritos" noIndex />
        <Header />
        <main className="flex-1 container py-16 flex items-center justify-center">
          <div className="animate-pulse">Cargando...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <SEOHead title="Mis favoritos" description="Tus propiedades favoritas." path="/favoritos" noIndex />
        <Header />
        <main className="flex-1 container py-16">
          <div className="text-center max-w-md mx-auto">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="font-body text-2xl font-bold text-foreground mb-2">
              Iniciá sesión para ver tus favoritos
            </h1>
            <p className="text-muted-foreground mb-6">
              Guardá propiedades para verlas más tarde
            </p>
            <Link to="/auth">
              <Button variant="hero">Iniciar Sesión</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const favoriteProperties = mockProperties.filter((p) => favorites.includes(p.id));

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead title="Mis favoritos" description="Tus propiedades favoritas." path="/favoritos" noIndex />
      <Header />

      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="font-body text-3xl md:text-4xl font-bold text-foreground mb-2">
            Mis Favoritos
          </h1>
          <p className="text-muted-foreground">
            {favoriteProperties.length} propiedades guardadas
          </p>
        </div>

        {favLoading ? (
          <div className="text-center py-16">
            <div className="animate-pulse">Cargando favoritos...</div>
          </div>
        ) : favoriteProperties.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-2xl border">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-body text-xl font-semibold text-foreground mb-2">
              No tenés favoritos todavía
            </h2>
            <p className="text-muted-foreground mb-6">
              Explorá propiedades y guardá tus favoritas
            </p>
            <Link to="/buscar">
              <Button variant="outline">Ver propiedades</Button>
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default FavoritesPage;
