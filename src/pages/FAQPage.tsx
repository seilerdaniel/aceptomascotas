import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "¿Qué es Acepto Mascotas?",
    answer: "Acepto Mascotas es una plataforma gratuita que conecta a familias con mascotas con propietarios que aceptan animales en sus alquileres. Nuestro objetivo es que nadie tenga que elegir entre su hogar y sus compañeros peludos."
  },
  {
    question: "¿Es gratis publicar mi propiedad?",
    answer: "Sí, publicar tu propiedad en Acepto Mascotas es completamente gratuito. No cobramos comisiones ni tarifas por conectar propietarios con inquilinos."
  },
  {
    question: "¿Qué tipos de mascotas se aceptan?",
    answer: "Cada propietario define qué mascotas acepta en su propiedad. Pueden ser perros, gatos, aves, pequeños mamíferos u otros animales. Esta información está detallada en cada publicación."
  },
  {
    question: "¿Cómo publico mi alquiler?",
    answer: "Simplemente hacé clic en 'Publicar Alquiler', completá el formulario con los datos de tu propiedad, agregá fotos y especificá qué mascotas aceptás. Tu publicación estará disponible una vez aprobada."
  },
  {
    question: "¿Necesito crear una cuenta para buscar alquileres?",
    answer: "No, podés buscar y ver propiedades sin registrarte. Solo necesitás una cuenta si querés guardar favoritos, publicar propiedades o acceder a funciones adicionales."
  },
  {
    question: "¿Cómo contacto a un propietario?",
    answer: "Cada publicación incluye información de contacto del propietario (teléfono, email o WhatsApp). Podés comunicarte directamente con ellos para coordinar visitas y consultas."
  },
  {
    question: "¿Acepto Mascotas verifica las propiedades?",
    answer: "Realizamos una revisión básica de las publicaciones antes de aprobarlas. Sin embargo, recomendamos siempre visitar la propiedad personalmente antes de tomar cualquier decisión."
  },
  {
    question: "¿Qué hago si tengo un problema con una publicación?",
    answer: "Podés contactarnos a través del formulario de contacto o enviarnos un email a aceptomascotas@gmail.com. Revisaremos tu consulta lo antes posible."
  },
  {
    question: "¿Puedo publicar servicios para mascotas?",
    answer: "Sí, tenemos una sección dedicada a servicios pet-friendly como veterinarias, guarderías, peluquerías caninas, paseadores y más. Visitá la sección Servicios para explorar o publicar."
  },
  {
    question: "¿Cómo puedo apoyar el proyecto?",
    answer: "Podés apoyarnos comprando un cafecito en cafecito.app/aceptomascotas o compartiendo la plataforma con personas que buscan alquileres pet-friendly. ¡Cada aporte ayuda!"
  }
];

const FAQPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-pet-green-light text-primary mb-6">
              <HelpCircle className="h-8 w-8" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Preguntas Frecuentes
            </h1>
            <p className="text-muted-foreground text-lg">
              Encontrá respuestas a las dudas más comunes sobre Acepto Mascotas
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-card rounded-xl border px-6 data-[state=open]:shadow-soft"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 text-center p-8 bg-secondary/50 rounded-2xl">
            <p className="text-muted-foreground mb-4">
              ¿No encontraste lo que buscabas?
            </p>
            <a 
              href="/contacto" 
              className="text-primary font-semibold hover:underline"
            >
              Contactanos y te ayudamos
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQPage;
