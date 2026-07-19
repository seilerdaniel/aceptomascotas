import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import { Cookie } from "lucide-react";

const CookiesPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Política de cookies"
        description="Información sobre el uso de cookies en Acepto Mascotas."
        path="/cookies"
      />
      <Header />
      
      <main className="flex-1 container py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-pet-green-light text-primary mb-6">
              <Cookie className="h-8 w-8" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Política de Cookies
            </h1>
            <p className="text-muted-foreground">
              Última actualización: Julio 2026
            </p>
          </div>

          <div className="prose prose-lg max-w-none text-foreground">
            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">¿Qué son las cookies?</h2>
              <p className="text-muted-foreground">
                Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitás un sitio web. Nos ayudan a recordar tus preferencias y mejorar tu experiencia de navegación.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">Tipos de cookies que utilizamos</h2>
              
              <div className="space-y-6">
                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-2">Cookies esenciales</h3>
                  <p className="text-muted-foreground text-sm">
                    Necesarias para el funcionamiento básico del sitio. Incluyen cookies de sesión y autenticación.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-2">Cookies de preferencias</h3>
                  <p className="text-muted-foreground text-sm">
                    Guardan tus preferencias como el tema (claro/oscuro) y filtros de búsqueda seleccionados.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-2">Cookies analíticas</h3>
                  <p className="text-muted-foreground text-sm">
                    Utilizamos Google Analytics para entender cómo se usa el sitio (páginas visitadas, tiempo de permanencia, origen del tráfico) y así mejorar nuestros servicios. Google puede procesar estos datos según su propia política de privacidad.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">Control de cookies</h2>
              <p className="text-muted-foreground mb-4">
                Podés controlar y eliminar las cookies a través de la configuración de tu navegador. Ten en cuenta que deshabilitar ciertas cookies puede afectar la funcionalidad del sitio.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Chrome: Configuración → Privacidad y seguridad → Cookies</li>
                <li>Firefox: Opciones → Privacidad y seguridad → Cookies</li>
                <li>Safari: Preferencias → Privacidad</li>
                <li>Edge: Configuración → Cookies y permisos del sitio</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">Cookies de terceros</h2>
              <p className="text-muted-foreground">
                Utilizamos servicios de terceros como Mapbox para mostrar mapas. Estos servicios pueden establecer sus propias cookies. Te recomendamos revisar sus políticas de privacidad para más información.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">Contacto</h2>
              <p className="text-muted-foreground">
                Si tenés preguntas sobre nuestra política de cookies, contactanos en{" "}
                <a href="mailto:aceptomascotas@gmail.com" className="text-primary hover:underline">
                  aceptomascotas@gmail.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CookiesPage;
