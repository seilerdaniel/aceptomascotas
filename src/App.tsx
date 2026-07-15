import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import SearchPage from "./pages/SearchPage";
import PropertyDetail from "./pages/PropertyDetail";
import PublishPage from "./pages/PublishPage";
import BulkImportPage from "./pages/BulkImportPage";
import AgencyPage from "./pages/AgencyPage";
import LostPetsPage from "./pages/LostPetsPage";
import AuthPage from "./pages/AuthPage";
import FavoritesPage from "./pages/FavoritesPage";
import ContactPage from "./pages/ContactPage";
import AdminPage from "./pages/AdminPage";
import ProfilePage from "./pages/ProfilePage";
import ServicesPage from "./pages/ServicesPage";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import PublishServicePage from "./pages/PublishServicePage";
import FAQPage from "./pages/FAQPage";
import PrivacyPage from "./pages/PrivacyPage";
import CookiesPage from "./pages/CookiesPage";
import TermsPage from "./pages/TermsPage";
// import StorePage from "./pages/StorePage"; // Tienda oculta hasta que la pasarela de pagos esté lista
import PetPublicPage from "./pages/PetPublicPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AboutPage from "./pages/AboutPage";
import NotFound from "./pages/NotFound";
// import AIChatbot from "./components/AIChatbot"; // Desactivado temporalmente
import RouteTracker from "./components/RouteTracker";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RouteTracker />
          <ScrollToTop />
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
          {/* AIChatbot desactivado temporalmente hasta que esté funcionando completamente */}
          {/* <AIChatbot /> */}
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
