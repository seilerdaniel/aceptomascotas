import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Dog, Cat, Phone, Mail, User, Check, Share2, Loader2, Bird, Fish, Lock, MessageCircle, Facebook, Twitter, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useProperty } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
import { mockProperties } from "@/data/properties";
import { toast } from "sonner";
import { useState } from "react";
import ReportProperty from "@/components/ReportProperty";
import { trackEvent } from "@/lib/analytics";

const PropertyDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: dbProperty, isLoading, error } = useProperty(id || "");
  const [selectedImage, setSelectedImage] = useState(0);

  const mockProperty = mockProperties.find((p) => p.id === id);

  const property = dbProperty
    ? {
        id: dbProperty.id,
        title: dbProperty.title,
        description: dbProperty.description || "",
        location: dbProperty.location,
        price: dbProperty.price,
        propertyType: dbProperty.property_type,
        petTypes: dbProperty.pet_types,
        images: dbProperty.images || [],
        contactName: dbProperty.contact_name,
        contactPhone: dbProperty.contact_phone || "",
        contactEmail: dbProperty.contact_email || "",
        // TODO: remove the `as any` cast once `npm run gen:types` picks up
        // the owner_is_verified column added by the verification migration.
        isVerified: (dbProperty as any).owner_is_verified ?? false,
        agencyId: (dbProperty as any).agency_id ?? null,
        amenities: [],
      }
    : mockProperty;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">
            Propiedad no encontrada
          </h1>
          <Link to="/buscar">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a buscar
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const shareText = `${property.title} - ${formatPrice(property.price)}/mes | Acepto Mascotas`;
  const shareUrl = window.location.href;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // usuario canceló el share, no hacer nada
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copiado al portapapeles");
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`${shareText} ${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  const handleContact = () => {
    const message = encodeURIComponent(
      `Hola! Me interesa la propiedad "${property.title}" publicada en Acepto.Mascotas.`
    );
    const phone = property.contactPhone.replace(/\D/g, "");
    trackEvent("whatsapp_contact_click", { source: "property_detail", property_id: property.id });
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  const getPetIcon = (petType: string) => {
    switch (petType) {
      case "perro": return <Dog className="h-4 w-4" />;
      case "gato": return <Cat className="h-4 w-4" />;
      case "aves": return <Bird className="h-4 w-4" />;
      case "peces": return <Fish className="h-4 w-4" />;
      default: return <Check className="h-4 w-4" />;
    }
  };

  const getPetLabel = (petType: string) => {
    const labels: Record<string, string> = {
      perro: "Perros",
      gato: "Gatos",
      aves: "Aves",
      peces: "Peces",
      otros: "Otras mascotas",
    };
    return labels[petType] || petType;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container py-6">
          <Link to="/buscar" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Volver a resultados
          </Link>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <div className="space-y-4">
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-muted">
                  {property.images.length > 0 ? (
                    <img
                      src={property.images[selectedImage]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      Sin imágenes
                    </div>
                  )}
                </div>

                {property.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {property.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === index
                            ? "border-primary"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${property.title} - Imagen ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Property Info */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                      {property.title}
                    </h1>
                    <div className="flex items-center gap-2 text-muted-foreground mt-2">
                      <MapPin className="h-4 w-4" />
                      <span>{property.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-3xl font-bold text-primary">
                      {formatPrice(property.price)}
                    </div>
                    <span className="text-muted-foreground">por mes</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="capitalize">{property.propertyType}</Badge>
                  {property.petTypes.map((pet) => (
                    <Badge key={pet} variant="soft" className="gap-1">
                      {getPetIcon(pet)}
                      {getPetLabel(pet)}
                    </Badge>
                  ))}
                </div>

                {/* Compartir */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-sm text-muted-foreground">Compartir:</span>
                  <Button variant="outline" size="sm" onClick={handleShareWhatsApp} className="gap-2 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShareFacebook} className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShareTwitter} className="gap-2 text-sky-500 border-sky-200 hover:bg-sky-50 hover:text-sky-600">
                    <Twitter className="h-4 w-4" />
                    X
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleShare} className="gap-2 text-muted-foreground">
                    <Share2 className="h-4 w-4" />
                    Copiar link
                  </Button>
                </div>
              </div>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Descripción</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {property.description || "Sin descripción disponible."}
                  </p>
                </CardContent>
              </Card>

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Características</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {property.amenities.map((amenity) => (
                        <div key={amenity} className="flex items-center gap-2 text-muted-foreground">
                          <Check className="h-4 w-4 text-primary" />
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Contact */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Contactar al propietario</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-foreground">{property.contactName}</p>
                        {property.isVerified && (
                          <ShieldCheck className="h-4 w-4 text-accent shrink-0" aria-label="Agencia verificada" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {property.isVerified ? "Agencia verificada" : "Propietario"}
                      </p>
                      {property.agencyId && (
                        <Link
                          to={`/agencia/${property.agencyId}`}
                          className="text-xs text-primary hover:underline inline-block mt-0.5"
                        >
                          Ver todas sus propiedades
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {user ? (
                      <>
                        {property.contactPhone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{property.contactPhone}</span>
                          </div>
                        )}
                        {property.contactEmail && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{property.contactEmail}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="relative">
                        <div className="space-y-2 blur-sm select-none pointer-events-none" aria-hidden="true">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>+54 9 11 •••• ••••</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>•••••••@•••••.com</span>
                          </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center gap-2 text-muted-foreground bg-secondary/70 rounded-lg">
                          <Lock className="h-4 w-4" />
                          <span className="text-sm font-medium">Registrate para ver la información de contacto</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {user && property.contactPhone ? (
                    <Button variant="hero" size="lg" className="w-full" onClick={handleContact}>
                      <Phone className="h-4 w-4" />
                      Contactar por WhatsApp
                    </Button>
                  ) : !user ? (
                    <Link
                      to="/auth"
                      className="block"
                      onClick={() =>
                        trackEvent("register_cta_click", { source: "property_detail", property_id: property.id })
                      }
                    >
                      <Button variant="hero" size="lg" className="w-full">
                        <Lock className="h-4 w-4" />
                        Registrate para contactar
                      </Button>
                    </Link>
                  ) : null}

                  {!user && (
                    <p className="text-xs text-center text-muted-foreground">
                      Es gratis y te toma menos de un minuto
                    </p>
                  )}

                  <p className="text-xs text-center text-muted-foreground">
                    Mencioná que encontraste esta propiedad en Acepto.Mascotas
                  </p>
                </CardContent>
              </Card>

              <p className="text-xs text-muted-foreground text-center mt-4 px-2">
                Acepto Mascotas conecta propietarios y buscadores, pero no participa en los acuerdos de alquiler ni garantiza la veracidad de esta publicación. Verificá la información antes de coordinar una visita o firmar un contrato.
              </p>

              <div className="flex justify-center mt-2">
                <ReportProperty propertyId={property.id} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PropertyDetail;