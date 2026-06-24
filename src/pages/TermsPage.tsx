import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FileText } from "lucide-react";

const TermsPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-pet-green-light text-primary mb-6">
              <FileText className="h-8 w-8" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Términos y Condiciones
            </h1>
            <p className="text-muted-foreground">
              Última actualización: Enero 2026
            </p>
          </div>

          <div className="prose prose-lg max-w-none text-foreground">
            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">1. Aceptación de los términos</h2>
              <p className="text-muted-foreground">
                Al acceder y utilizar Acepto Mascotas, aceptás estos términos y condiciones en su totalidad. Si no estás de acuerdo con alguna parte de estos términos, no deberías usar nuestra plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">2. Descripción del servicio</h2>
              <p className="text-muted-foreground">
                Acepto Mascotas es una plataforma que conecta a propietarios de inmuebles que aceptan mascotas con personas que buscan alquileres pet-friendly. Actuamos únicamente como intermediarios y no participamos en las transacciones entre usuarios.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">3. Uso de la plataforma</h2>
              <p className="text-muted-foreground mb-4">
                Los usuarios se comprometen a:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Proporcionar información veraz y actualizada en sus publicaciones</li>
                <li>No publicar contenido falso, engañoso o fraudulento</li>
                <li>Respetar a otros usuarios y comunicarse de manera apropiada</li>
                <li>No utilizar la plataforma para fines ilegales</li>
                <li>No intentar acceder de forma no autorizada a la plataforma</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">4. Publicación de contenido</h2>
              <p className="text-muted-foreground mb-4">
                Al publicar contenido en Acepto Mascotas:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Garantizás que tenés derecho a publicar dicho contenido</li>
                <li>Nos otorgás una licencia no exclusiva para mostrar tu contenido en la plataforma</li>
                <li>Aceptás que podemos moderar o eliminar contenido que viole estos términos</li>
                <li>Sos responsable de la veracidad de la información publicada</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">5. Limitación de responsabilidad</h2>
              <p className="text-muted-foreground">
                Acepto Mascotas no es responsable por las transacciones realizadas entre usuarios, la veracidad de las publicaciones, problemas derivados de la relación entre propietarios e inquilinos, ni daños directos o indirectos derivados del uso de la plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">6. Propiedad intelectual</h2>
              <p className="text-muted-foreground">
                El nombre, logo, diseño y contenido de Acepto Mascotas son propiedad de la plataforma y están protegidos por las leyes de propiedad intelectual. No está permitido su uso sin autorización expresa.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">7. Modificaciones</h2>
              <p className="text-muted-foreground">
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán efectivos desde su publicación en la plataforma. El uso continuado del servicio implica la aceptación de los términos modificados.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">8. Terminación</h2>
              <p className="text-muted-foreground">
                Podemos suspender o terminar tu acceso a la plataforma si violás estos términos o por cualquier otra razón a nuestra discreción, sin previo aviso.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">9. Ley aplicable</h2>
              <p className="text-muted-foreground">
                Estos términos se rigen por las leyes de la República Argentina. Cualquier disputa será sometida a los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">10. Contacto</h2>
              <p className="text-muted-foreground">
                Para consultas sobre estos términos, contactanos en{" "}
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

export default TermsPage;
