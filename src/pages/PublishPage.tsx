import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Upload, Dog, Cat, Check, X, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import LocationPicker from "@/components/LocationPicker";

const DRAFT_STORAGE_KEY = "am_publish_property_draft";

// No persistimos imageFiles/imagePreviews (son Files, no serializables) ni
// isSubmitting — solo los campos de texto/selección y la ubicación del
// mapa, que es lo que de verdad duele volver a escribir si se cierra la
// pestaña o se cuelga el formulario a mitad de camino.
interface PublishDraft {
  formData: {
    title: string;
    description: string;
    requirements: string;
    price: string;
    propertyType: string;
    location: string;
    petTypes: string[];
    contactName: string;
    contactPhone: string;
    contactEmail: string;
  };
  latitude: number | null;
  longitude: number | null;
  savedAt: number;
}

const loadDraft = (): PublishDraft | null => {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PublishDraft;
  } catch {
    return null;
  }
};

const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // localStorage no disponible (modo privado, etc.) — no es crítico.
  }
};

const PublishPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [draftRestored] = useState(() => loadDraft() !== null);
  const [formData, setFormData] = useState(() => {
    const draft = loadDraft();
    return (
      draft?.formData || {
        title: "",
        description: "",
        requirements: "",
        price: "",
        propertyType: "",
        location: "",
        petTypes: [] as string[],
        contactName: "",
        contactPhone: "",
        contactEmail: "",
      }
    );
  });
  const [latitude, setLatitude] = useState<number | null>(() => loadDraft()?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(() => loadDraft()?.longitude ?? null);

  // Autoguardado: cada cambio en el formulario (con debounce) se persiste
  // en localStorage, para no perder el progreso si se cierra la pestaña o
  // el navegador se cuelga a mitad de completar el formulario. Se limpia
  // al publicar con éxito (ver handleSubmit) o si el usuario descarta el
  // borrador manualmente.
  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({ formData, latitude, longitude, savedAt: Date.now() } satisfies PublishDraft)
        );
      } catch {
        // localStorage lleno o no disponible — no es crítico, seguimos sin guardar.
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [formData, latitude, longitude]);

  const handleDiscardDraft = () => {
    clearDraft();
    setFormData({
      title: "",
      description: "",
      requirements: "",
      price: "",
      propertyType: "",
      location: "",
      petTypes: [],
      contactName: profile?.full_name || "",
      contactPhone: profile?.phone || "",
      contactEmail: user?.email || "",
    });
    setLatitude(null);
    setLongitude(null);
    toast.success("Borrador descartado");
  };

  // Pre-fill contact info from the profile (name, phone) and auth session
  // (email), so propietario/agencia don't have to retype it on every
  // listing. Still editable per-listing (useful for agencies with
  // multiple agents), just no longer starts blank every time.
  useEffect(() => {
    if (!profile && !user) return;
    setFormData((prev) => ({
      ...prev,
      contactName: prev.contactName || profile?.full_name || "",
      contactPhone: prev.contactPhone || profile?.phone || "",
      contactEmail: prev.contactEmail || user?.email || "",
    }));
  }, [profile, user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePetTypeToggle = (petType: string) => {
    setFormData((prev) => ({
      ...prev,
      petTypes: prev.petTypes.includes(petType)
        ? prev.petTypes.filter((p) => p !== petType)
        : [...prev.petTypes, petType],
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).slice(0, 5 - imageFiles.length);
      
      newFiles.forEach((file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error("Solo se permiten imágenes");
          return;
        }
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error("Las imágenes deben ser menores a 5MB");
          return;
        }
        
        setImageFiles((prev) => [...prev, file]);
        
        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (userId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Error al subir imagen');
      }

      const { data: urlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      uploadedUrls.push(urlData.publicUrl);
    }
    
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check authentication
    if (!user) {
      toast.error("Debés iniciar sesión para publicar una propiedad");
      navigate("/auth");
      return;
    }

    // Client-side validation (server will re-validate)
    if (!formData.title || formData.title.length < 10) {
      toast.error("El título debe tener al menos 10 caracteres");
      return;
    }

    if (!formData.price || Number(formData.price) <= 0) {
      toast.error("El precio debe ser mayor a 0");
      return;
    }

    if (!formData.propertyType) {
      toast.error("Seleccioná un tipo de propiedad");
      return;
    }

    if (!formData.location || formData.location.length < 3) {
      toast.error("La ubicación debe tener al menos 3 caracteres");
      return;
    }

    if (formData.petTypes.length === 0) {
      toast.error("Seleccioná al menos un tipo de mascota permitida");
      return;
    }

    if (!formData.contactName || formData.contactName.length < 2) {
      toast.error("El nombre de contacto debe tener al menos 2 caracteres");
      return;
    }

    const phoneRegex = /^\+?[\d\s\-()]{6,20}$/;
    if (!formData.contactPhone || !phoneRegex.test(formData.contactPhone)) {
      toast.error("Ingresá un número de teléfono válido");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.contactEmail || !emailRegex.test(formData.contactEmail)) {
      toast.error("Ingresá un email válido");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Tu sesión expiró. Por favor, iniciá sesión nuevamente.");
        navigate("/auth");
        return;
      }

      // Upload images to storage first
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        imageUrls = await uploadImages(user.id);
      }

      // Call edge function with server-side validation
      const response = await supabase.functions.invoke("create-property", {
        body: {
          title: formData.title,
          description: formData.description || null,
          requirements: formData.requirements || null,
          price: Number(formData.price),
          propertyType: formData.propertyType.toLowerCase(),
          location: formData.location,
          petTypes: formData.petTypes,
          contactName: formData.contactName,
          contactPhone: formData.contactPhone,
          contactEmail: formData.contactEmail,
          images: imageUrls,
          latitude,
          longitude,
        },
      });

      if (response.error) {
        // supabase-js no expone el mensaje real del error en
        // response.error.message para errores HTTP de una Edge Function —
        // ese campo trae el genérico "Edge Function returned a non-2xx
        // status code" sin importar la causa real. El motivo específico
        // (ej. "Title must be at least 10 characters") viene en el cuerpo
        // de la respuesta, que hay que leer aparte desde error.context.
        let detailedMessage = response.error.message || "Error al publicar";
        try {
          const context = (response.error as { context?: Response }).context;
          if (context) {
            const body = await context.clone().json();
            if (body?.error) detailedMessage = body.error;
          }
        } catch {
          // Si no se puede parsear el cuerpo, seguimos con el mensaje genérico.
        }
        throw new Error(detailedMessage);
      }

      toast.success("¡Tu propiedad fue publicada exitosamente!");
      clearDraft();
      trackEvent("property_published", { property_type: formData.propertyType });
      navigate("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al publicar la propiedad";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const petOptions = [
    { id: "perro", label: "Perros", icon: Dog },
    { id: "gato", label: "Gatos", icon: Cat },
    { id: "otras", label: "Otras mascotas", icon: Check },
  ];

  // Show login prompt if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <SEOHead title="Publicar propiedad" description="Publicá tu propiedad pet-friendly en Acepto Mascotas." path="/publicar" noIndex />
      <Header />
        <main className="flex-1 container py-8">
          <div className="max-w-md mx-auto text-center">
            <h1 className="font-display text-2xl font-bold mb-4">
              Iniciá sesión para publicar
            </h1>
            <p className="text-muted-foreground mb-6">
              Necesitás tener una cuenta para publicar propiedades.
            </p>
            <Button variant="hero" onClick={() => navigate("/auth")}>
              Iniciar sesión
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Only propietario/agencia accounts can publish — a buscador reaching
  // this page directly by URL should not see the form.
  if (user && profile && profile.user_type !== "propietario" && profile.user_type !== "agencia") {
    return (
      <div className="min-h-screen flex flex-col">
        <SEOHead title="Publicar propiedad" description="Publicá tu propiedad pet-friendly en Acepto Mascotas." path="/publicar" noIndex />
      <Header />
        <main className="flex-1 container py-8 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">
            Publicar propiedades es para propietarios y agencias
          </h1>
          <p className="text-muted-foreground mb-6">
            Tu cuenta está registrada como buscador. Si sos propietario o representás una
            agencia, actualizá tu tipo de cuenta desde tu perfil para poder publicar.
          </p>
          <Button variant="outline" onClick={() => navigate("/buscar")}>
            Buscar propiedades
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead title="Publicar propiedad" description="Publicá tu propiedad pet-friendly en Acepto Mascotas." path="/publicar" noIndex />
      <Header />

      <main className="flex-1 container py-8">
        <div className="max-w-3xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Publicar Alquiler
            </h1>
            <p className="text-muted-foreground">
              Conectá con inquilinos responsables que buscan un hogar para su familia
            </p>
          </div>

          {profile?.user_type === "agencia" && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-secondary/50 border rounded-xl p-4 mb-8">
              <p className="text-sm text-foreground">
                ¿Tenés varias propiedades para cargar? Importalas todas juntas desde un CSV.
              </p>
              <Link to="/publicar/importar" className="shrink-0">
                <Button variant="outline" size="sm">
                  Importar por CSV
                </Button>
              </Link>
            </div>
          )}

          {draftRestored && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/50 border rounded-xl p-4 mb-8">
              <p className="text-sm text-foreground">
                Recuperamos el borrador de tu última visita. Las fotos no se guardan, tenés que volver a subirlas.
              </p>
              <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={handleDiscardDraft}>
                Empezar de cero
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Property Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información de la propiedad</CardTitle>
                <CardDescription>
                  Describí tu propiedad para atraer a los inquilinos ideales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Título del anuncio *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Ej: Departamento luminoso en Palermo con balcón"
                    value={formData.title}
                    onChange={handleInputChange}
                    maxLength={200}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Contá sobre tu propiedad, sus características y por qué es ideal para familias con mascotas..."
                    value={formData.description}
                    onChange={handleInputChange}
                    maxLength={2000}
                    rows={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements">Requisitos para alquilar (opcional)</Label>
                  <Textarea
                    id="requirements"
                    name="requirements"
                    placeholder="Ej: recibo de sueldo, garantía propietaria, depósito de un mes..."
                    value={formData.requirements}
                    onChange={handleInputChange}
                    maxLength={1000}
                    rows={3}
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio mensual (ARS) *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      placeholder="150000"
                      value={formData.price}
                      onChange={handleInputChange}
                      min={1}
                      max={100000000}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de propiedad *</Label>
                    <Select
                      value={formData.propertyType}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, propertyType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="departamento">Departamento</SelectItem>
                        <SelectItem value="casa">Casa</SelectItem>
                        <SelectItem value="ph">PH</SelectItem>
                        <SelectItem value="loft">Loft</SelectItem>
                        <SelectItem value="monoambiente">Monoambiente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación *</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="Ej: Palermo, CABA"
                    value={formData.location}
                    onChange={handleInputChange}
                    maxLength={200}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Marcar en el mapa (opcional)</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Le permite a quien vea la publicación abrir la ubicación exacta en Google Maps.
                  </p>
                  <LocationPicker
                    initialLat={latitude}
                    initialLng={longitude}
                    onChange={(lat, lng) => {
                      setLatitude(lat);
                      setLongitude(lng);
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pet Types */}
            <Card>
              <CardHeader>
                <CardTitle>Mascotas permitidas *</CardTitle>
                <CardDescription>
                  Seleccioná qué tipo de mascotas aceptás en tu propiedad
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  {petOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.petTypes.includes(option.id)
                          ? "border-primary bg-pet-green-light"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Checkbox
                        checked={formData.petTypes.includes(option.id)}
                        onCheckedChange={() => handlePetTypeToggle(option.id)}
                      />
                      <option.icon className="h-5 w-5 text-primary" />
                      <span className="font-medium">{option.label}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Imágenes</CardTitle>
                <CardDescription>
                  Subí fotos de tu propiedad (máximo 5 imágenes)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
                  {imagePreviews.map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img
                        src={image}
                        alt={`Imagen ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {imagePreviews.length < 5 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Agregar</span>
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Datos de contacto *</CardTitle>
                <CardDescription>
                  Ya completamos esto con los datos de tu perfil — podés cambiarlos para esta publicación puntual si querés.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Nombre completo *</Label>
                  <Input
                    id="contactName"
                    name="contactName"
                    placeholder="Tu nombre"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Teléfono / WhatsApp *</Label>
                    <Input
                      id="contactPhone"
                      name="contactPhone"
                      type="tel"
                      placeholder="+54 11 1234-5678"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      maxLength={20}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email *</Label>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      placeholder="tu@email.com"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      maxLength={255}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Button
                type="submit"
                variant="hero"
                size="xl"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Publicar gratis
                  </>
                )}
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Al publicar, aceptás que tu propiedad acepta mascotas y que la información es veraz.
            </p>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PublishPage;