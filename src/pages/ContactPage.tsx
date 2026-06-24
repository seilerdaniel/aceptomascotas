import { useState } from "react";
import { Mail, Send, Loader2, MessageSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ContactPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.name || formData.name.length < 2) {
      toast.error("El nombre debe tener al menos 2 caracteres");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      toast.error("Ingresá un email válido");
      return;
    }

    if (!formData.subject || formData.subject.length < 3) {
      toast.error("El asunto debe tener al menos 3 caracteres");
      return;
    }

    if (!formData.message || formData.message.length < 10) {
      toast.error("El mensaje debe tener al menos 10 caracteres");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("contact_messages")
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        });

      if (error) {
        throw error;
      }

      toast.success("¡Mensaje enviado! Te responderemos pronto.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      toast.error("Error al enviar el mensaje. Por favor intentá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-8">
        <div className="max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Contactanos
            </h1>
            <p className="text-muted-foreground">
              ¿Tenés preguntas o sugerencias? Estamos acá para ayudarte.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Envianos un mensaje
              </CardTitle>
              <CardDescription>
                Completá el formulario y te responderemos a la brevedad.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        name="name"
                        placeholder="Tu nombre"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="pl-10"
                        maxLength={100}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10"
                        maxLength={255}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Asunto *</Label>
                  <Input
                    id="subject"
                    name="subject"
                    placeholder="¿Sobre qué querés hablar?"
                    value={formData.subject}
                    onChange={handleInputChange}
                    maxLength={200}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensaje *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Contanos en qué podemos ayudarte..."
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={5}
                    maxLength={2000}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Enviar mensaje
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact info */}
          <div className="mt-8 text-center text-muted-foreground">
            <p>También podés escribirnos directamente a:</p>
            <a 
              href="mailto:aceptomascotas@gmail.com" 
              className="text-primary hover:underline font-medium"
            >
              aceptomascotas@gmail.com
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;