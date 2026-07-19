import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Dog, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Página no encontrada"
        description="La página que buscás no existe."
        path={location.pathname}
        noIndex
      />
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-pet-green-light text-primary mx-auto">
            <Dog className="h-12 w-12" />
          </div>
          <div>
            <h1 className="font-display text-6xl font-bold text-foreground mb-2">404</h1>
            <p className="text-xl text-muted-foreground">
              ¡Ups! Esta página se fue a pasear
            </p>
          </div>
          <Link to="/">
            <Button variant="hero" size="lg">
              <Home className="h-5 w-5" />
              Volver al inicio
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
