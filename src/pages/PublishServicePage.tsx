import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Store,
  ArrowLeft,
  Clock,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useCreateService, SERVICE_CATEGORIES, ServiceCategory } from "@/hooks/useServices";
import ImageUploadField from "@/components/ImageUploadField";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const CITIES = [
  "Buenos Aires",
  "CABA",
  "Córdoba",
  "Rosario",
  "Mendoza",
  "La Plata",
  "Mar del Plata",
  "Tucumán",
  "Salta",
  "Santa Fe",
];

const serviceSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede superar los 100 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-\.]+$/, "El nombre contiene caracteres inválidos"),
  category: z.enum([
    "veterinaria",
    "veterinaria_24h",
    "seguro",
    "guarderia",
    "adiestrador",
    "paseador",
    "mudanza",
    "ong_refugio",
    "peluqueria",
    "tienda",
  ] as const),
  city: z.string().min(1, "Seleccioná una ciudad"),
  neighborhood: z.string().max(100).optional(),
  address: z.string().max(200).optional(),
  phone: z
    .string()
    .max(30)
    .regex(/^[\d\s\-\+\(\)]*$/, "Número de teléfono inválido")
    .optional()
    .or(z.literal("")),
  whatsapp: z
    .string()
    .max(30)
    .regex(/^[\d\s\-\+\(\)]*$/, "Número de WhatsApp inválido")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  instagram: z.string().max(50).optional(),
  facebook: z.string().url("URL de Facebook inválida").optional().or(z.literal("")),
  description: z
    .string()
    .min(20, "La descripción debe tener al menos 20 caracteres")
    .max(2000, "La descripción no puede superar los 2000 caracteres"),
  is_24h: z.boolean().default(false),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

const PublishServicePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const createService = useCreateService();
  const [submitted, setSubmitted] = useState(false);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      category: undefined,
      city: "",
      neighborhood: "",
      address: "",
      phone: "",
      whatsapp: "",
      email: "",
      website: "",
      instagram: "",
      facebook: "",
      description: "",
      is_24h: false,
    },
  });

  const onSubmit = async (data: ServiceFormData) => {
    try {
      await createService.mutateAsync({
        name: data.name,
        category: data.category,
        description: data.description,
        city: data.city,
        neighborhood: data.neighborhood || undefined,
        address: data.address || undefined,
        phone: data.phone || undefined,
        whatsapp: data.whatsapp || undefined,
        email: data.email || undefined,
        website: data.website || undefined,
        instagram: data.instagram || undefined,
        facebook: data.facebook || undefined,
        is_24h: data.is_24h,
        user_id: user?.id || null,
        images: [],
        opening_hours: {},
        latitude: null,
        longitude: null,
        is_active: true,
        banner_url: bannerUrl,
        logo_url: logoUrl,
      });

      setSubmitted(true);
      toast({
        title: "¡Servicio enviado!",
        description: "Tu servicio será revisado antes de publicarse.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el servicio. Intentá de nuevo.",
        variant: "destructive",
      });
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16">
          <div className="max-w-lg mx-auto text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Check className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold">
              ¡Gracias por tu envío!
            </h1>
            <p className="text-muted-foreground">
              Tu servicio fue recibido y será revisado por nuestro equipo antes de
              publicarse. Te notificaremos cuando esté activo.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/servicios">
                <Button variant="outline">Ver servicios</Button>
              </Link>
              <Link to="/">
                <Button>Volver al inicio</Button>
              </Link>
            </div>
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
        {/* Back Button */}
        <Link
          to="/servicios"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a servicios
        </Link>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Store className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="font-display text-2xl">
                Agregar mi servicio pet-friendly
              </CardTitle>
              <CardDescription>
                Completá el formulario para publicar tu servicio. Será revisado
                antes de aparecer en el directorio.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Imágenes */}
                  {user && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg border-b pb-2">
                        Imágenes
                      </h3>
                      <ImageUploadField
                        bucket="service-images"
                        folderPath={user.id}
                        filePrefix="banner"
                        currentUrl={bannerUrl}
                        shape="banner"
                        label="Imagen de portada"
                        onUploaded={setBannerUrl}
                        onRemove={() => setBannerUrl(null)}
                      />
                      <div>
                        <p className="text-sm font-medium mb-2">Logo</p>
                        <ImageUploadField
                          bucket="service-images"
                          folderPath={user.id}
                          filePrefix="logo"
                          currentUrl={logoUrl}
                          shape="square"
                          onUploaded={setLogoUrl}
                        />
                      </div>
                    </div>
                  )}

                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">
                      Información básica
                    </h3>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del negocio *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Veterinaria San Martín" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoría *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccioná una categoría" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SERVICE_CATEGORIES.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describí los servicios que ofrecés..."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Mínimo 20 caracteres, máximo 2000
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_24h"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-accent" />
                              Atención 24 horas
                            </FormLabel>
                            <FormDescription>
                              Marcá esta opción si tu servicio está disponible las
                              24 horas del día
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">
                      Ubicación
                    </h3>

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ciudad *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccioná una ciudad" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CITIES.map((city) => (
                                <SelectItem key={city} value={city}>
                                  {city}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="neighborhood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Barrio</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Palermo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Av. Santa Fe 1234" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Contact */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">
                      Contacto
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: 011 1234-5678" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="whatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>WhatsApp</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: 54 9 11 1234-5678" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="email@ejemplo.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sitio web</FormLabel>
                          <FormControl>
                            <Input placeholder="https://tusitio.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="instagram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instagram</FormLabel>
                            <FormControl>
                              <Input placeholder="@tunegocio" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="facebook"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Facebook</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://facebook.com/tunegocio"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      variant="hero"
                      className="w-full"
                      disabled={createService.isPending}
                    >
                      {createService.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Store className="h-4 w-4" />
                          Enviar para revisión
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-4">
                      Al enviar, aceptás que tu servicio sea revisado antes de su
                      publicación.
                    </p>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PublishServicePage;
