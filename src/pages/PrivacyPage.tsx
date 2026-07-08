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
              Última actualización: Julio 2026
            </p>
          </div>

          <div className="prose prose-lg max-w-none text-foreground">
            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">1. Responsable del tratamiento</h2>
              <p className="text-muted-foreground">
                El responsable del tratamiento de los datos personales recopilados a través de Acepto Mascotas es Daniel Seiler, en carácter de titular del proyecto. Ante cualquier consulta, solicitud o reclamo relacionado con tus datos personales, podés contactarte a{" "}
                <a href="mailto:aceptomascotas@gmail.com" className="text-primary hover:underline">
                  aceptomascotas@gmail.com
                </a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">2. Información que recopilamos</h2>
              <p className="text-muted-foreground mb-4">
                En Acepto Mascotas recopilamos la siguiente información cuando utilizás nuestra plataforma:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Información de contacto (nombre, email, teléfono) al publicar propiedades o servicios</li>
                <li>Datos de ubicación de las propiedades publicadas</li>
                <li>Información de la cuenta si decidís registrarte</li>
                <li>Datos de mascotas (nombre, foto, información de identificación) cuando generás un código QR</li>
                <li>Cookies y datos de navegación para mejorar tu experiencia, incluyendo datos analíticos recopilados por Google Analytics</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">3. Base legal y finalidad del tratamiento</h2>
              <p className="text-muted-foreground mb-4">
                Tratamos tus datos personales en base a tu consentimiento, otorgado al registrarte o publicar contenido en la plataforma, con las siguientes finalidades:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Publicar y mostrar propiedades y servicios en la plataforma</li>
                <li>Facilitar la comunicación entre propietarios e inquilinos</li>
                <li>Permitir la identificación de mascotas mediante código QR en caso de pérdida</li>
                <li>Mejorar nuestros servicios y experiencia de usuario mediante analítica web</li>
                <li>Enviarte comunicaciones importantes sobre tu cuenta o publicaciones</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">4. Código QR de identificación de mascotas</h2>
              <p className="text-muted-foreground">
                Si generás un código QR para tu mascota, cualquier persona que lo escanee podrá ver la información de contacto que hayas decidido incluir para que puedan avisarte en caso de que tu mascota se pierda. Esta exposición es intencional y depende de tu decisión de generar y colocar el código; podés eliminar el código QR o los datos asociados en cualquier momento desde tu cuenta.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">5. Compartir información y transferencia internacional</h2>
              <p className="text-muted-foreground mb-4">
                La información de contacto que proporcionás en tus publicaciones será visible para otros usuarios de la plataforma. No vendemos ni compartimos tu información personal con terceros para fines de marketing.
              </p>
              <p className="text-muted-foreground">
                Utilizamos proveedores de infraestructura (como Supabase y Google Analytics) que pueden almacenar o procesar datos en servidores ubicados fuera de la Argentina. Estos proveedores cuentan con sus propias políticas de seguridad y privacidad, y tomamos recaudos razonables para que el tratamiento de tus datos sea consistente con esta política.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">6. Retención de datos</h2>
              <p className="text-muted-foreground">
                Conservamos tus datos personales mientras mantengas una cuenta activa en la plataforma. Si solicitás la eliminación de tu cuenta, eliminaremos o anonimizaremos tus datos personales, salvo que debamos conservar cierta información por obligaciones legales.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">7. Seguridad</h2>
              <p className="text-muted-foreground">
                Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal contra acceso no autorizado, pérdida o alteración.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">8. Tus derechos</h2>
              <p className="text-muted-foreground mb-4">
                De acuerdo con la Ley 25.326 de Protección de Datos Personales, tenés derecho a:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Acceder a tu información personal</li>
                <li>Solicitar la rectificación o actualización de datos inexactos</li>
                <li>Solicitar la supresión de tu cuenta y datos (derecho de habeas data)</li>
                <li>Retirar tu consentimiento en cualquier momento</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                La Agencia de Acceso a la Información Pública (AAIP), en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold mb-4">9. Contacto</h2>
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
