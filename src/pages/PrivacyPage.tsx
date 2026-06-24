import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Shield } from "lucide-react";

const PrivacyPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-pet-green-light text-primary mb-6">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Política de Privacidad
            </h1>
            <p className="text-muted-foreground">
              Última actualización: Enero 2026
            </p>
          </div>

          <div className="prose prose-lg max-w-none text-foreground">
            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">1. Información que recopilamos</h2>
              <p className="text-muted-foreground mb-4">
                En Acepto Mascotas recopilamos la siguiente información cuando utilizás nuestra plataforma:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Información de contacto (nombre, email, teléfono) al publicar propiedades o servicios</li>
                <li>Datos de ubicación de las propiedades publicadas</li>
                <li>Información de la cuenta si decidís registrarte</li>
                <li>Cookies y datos de navegación para mejorar tu experiencia</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">2. Uso de la información</h2>
              <p className="text-muted-foreground mb-4">
                Utilizamos tu información para:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Publicar y mostrar propiedades y servicios en la plataforma</li>
                <li>Facilitar la comunicación entre propietarios e inquilinos</li>
                <li>Mejorar nuestros servicios y experiencia de usuario</li>
                <li>Enviarte comunicaciones importantes sobre tu cuenta o publicaciones</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">3. Compartir información</h2>
              <p className="text-muted-foreground">
                La información de contacto que proporcionás en tus publicaciones será visible para otros usuarios de la plataforma. No vendemos ni compartimos tu información personal con terceros para fines de marketing.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">4. Seguridad</h2>
              <p className="text-muted-foreground">
                Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal contra acceso no autorizado, pérdida o alteración.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">5. Tus derechos</h2>
              <p className="text-muted-foreground mb-4">
                Tenés derecho a:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Acceder a tu información personal</li>
                <li>Solicitar la corrección de datos inexactos</li>
                <li>Solicitar la eliminación de tu cuenta y datos</li>
                <li>Retirar tu consentimiento en cualquier momento</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">6. Contacto</h2>
              <p className="text-muted-foreground">
                Para cualquier consulta sobre esta política o ejercer tus derechos, podés contactarnos en{" "}
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

export default PrivacyPage;
