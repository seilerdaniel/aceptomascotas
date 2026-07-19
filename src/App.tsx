import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
// Index es la ruta de mayor tráfico (el Home): se mantiene con import
// eager para que la primera carga no dependa de una request adicional.
// El resto de las rutas se cargan con React.lazy() + code-splitting por
// ruta, para que el bundle inicial no traiga páginas que la mayoría de
// las visitas nunca llega a ver (admin, publicar, checkout de servicios,
// legales, etc.). Esto es lo que baja el ~2.96MB del bundle principal.
import Index from "./pages/Index";
const SearchPage = lazyWithRetry(() => import("./pages/SearchPage"));
const PropertyDetail = lazyWithRetry(() => import("./pages/PropertyDetail"));
const PublishPage = lazyWithRetry(() => import("./pages/PublishPage"));
const BulkImportPage = lazyWithRetry(() => import("./pages/BulkImportPage"));
const AgencyPage = lazyWithRetry(() => import("./pages/AgencyPage"));
const LostPetsPage = lazyWithRetry(() => import("./pages/LostPetsPage"));
const AuthPage = lazyWithRetry(() => import("./pages/AuthPage"));
const FavoritesPage = lazyWithRetry(() => import("./pages/FavoritesPage"));
const ContactPage = lazyWithRetry(() => import("./pages/ContactPage"));
const AdminPage = lazyWithRetry(() => import("./pages/AdminPage"));
const ProfilePage = lazyWithRetry(() => import("./pages/ProfilePage"));
const ServicesPage = lazyWithRetry(() => import("./pages/ServicesPage"));
const ServiceDetailPage = lazyWithRetry(() => import("./pages/ServiceDetailPage"));
const PublishServicePage = lazyWithRetry(() => import("./pages/PublishServicePage"));
const FAQPage = lazyWithRetry(() => import("./pages/FAQPage"));
const PrivacyPage = lazyWithRetry(() => import("./pages/PrivacyPage"));
const CookiesPage = lazyWithRetry(() => import("./pages/CookiesPage"));
const TermsPage = lazyWithRetry(() => import("./pages/TermsPage"));
// import StorePage from "./pages/StorePage"; // Tienda oculta hasta que la pasarela de pagos esté lista
const PetPublicPage = lazyWithRetry(() => import("./pages/PetPublicPage"));
const ResetPasswordPage = lazyWithRetry(() => import("./pages/ResetPasswordPage"));
const AboutPage = lazyWithRetry(() => import("./pages/AboutPage"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
// import AIChatbot from "./components/AIChatbot"; // Desactivado temporalmente
import RouteTracker from "./components/RouteTracker";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

// Fallback simple y neutro: aparece solo durante la descarga del chunk de
// una ruta lazy (típicamente milisegundos con buena conexión). Mismo
// ícono que ya se usa en el resto del sitio (Loader2 + animate-spin).
const RouteLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RouteTracker />
          <ScrollToTop />
          <ErrorBoundary>
            <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/buscar" element={<SearchPage />} />
            <Route path="/alquiler/:id" element={<PropertyDetail />} />
            <Route path="/publicar" element={<PublishPage />} />
            <Route path="/publicar/importar" element={<BulkImportPage />} />
            <Route path="/agencia/:userId" element={<AgencyPage />} />
            <Route path="/mascotas-perdidas" element={<LostPetsPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/favoritos" element={<FavoritesPage />} />
            <Route path="/contacto" element={<ContactPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
            <Route path="/propiedad/:id" element={<PropertyDetail />} />
            <Route path="/servicios" element={<ServicesPage />} />
            <Route path="/servicios/:id" element={<ServiceDetailPage />} />
            <Route
              path="/servicios/publicar"
              element={<PublishServicePage />}
            />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/privacidad" element={<PrivacyPage />} />
            <Route path="/cookies" element={<CookiesPage />} />
            <Route path="/terminos" element={<TermsPage />} />
            {/* Tienda oculta hasta que la pasarela de pagos esté funcionando */}
            <Route path="/tienda" element={<Navigate to="/" replace />} />
            <Route path="/mascota/:code" element={<PetPublicPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/quienes-somos" element={<AboutPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </ErrorBoundary>
          {/* AIChatbot desactivado temporalmente hasta que esté funcionando completamente */}
          {/* <AIChatbot /> */}
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
