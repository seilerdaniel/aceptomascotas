import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import StorePage from "./pages/StorePage";
import PetPublicPage from "./pages/PetPublicPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AboutPage from "./pages/AboutPage";
import NotFound from "./pages/NotFound";
import AIChatbot from "./components/AIChatbot";
import RouteTracker from "./components/RouteTracker";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RouteTracker />
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
            <Route path="/tienda" element={<StorePage />} />
            <Route path="/mascota/:code" element={<PetPublicPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/quienes-somos" element={<AboutPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AIChatbot />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
