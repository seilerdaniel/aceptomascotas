import { useNavigate } from "react-router-dom";
import { Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type AccessState = "loading" | "unauthenticated" | "unauthorized";

interface AdminAccessGuardProps {
  state: AccessState;
}

// Los 3 estados en los que AdminPage no debe mostrar el panel todavía:
// cargando sesión/rol, sin sesión, o logueado pero sin rol de admin.
const AdminAccessGuard = ({ state }: AdminAccessGuardProps) => {
  const navigate = useNavigate();

  if (state === "loading") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (state === "unauthenticated") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="max-w-md mx-auto text-center">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-4">Acceso restringido</h1>
            <p className="text-muted-foreground mb-6">Debés iniciar sesión para acceder a esta página.</p>
            <Button variant="hero" onClick={() => navigate("/auth")}>
              Iniciar sesión
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="max-w-md mx-auto text-center">
          <Shield className="h-16 w-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-4">Acceso denegado</h1>
          <p className="text-muted-foreground mb-6">
            No tenés permisos de administrador para acceder a esta página.
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Volver al inicio
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminAccessGuard;
