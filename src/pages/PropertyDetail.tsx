import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Dog, Cat, Phone, Mail, User, Check, Share2, Loader2, Bird, Fish, Lock } from "lucide-react";
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

const PropertyDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: dbProperty, isLoading, error } = useProperty(id || "");
  const [selectedImage, setSelectedImage] = useState(0);

  // Fallback to mock data if no database property found
  const mockProperty = mockProperties.find((p) => p.id === id);

  // Transform database property to match expected format
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

  const handleShare = async () => {
    try {
      await navigator.share({
        title: property.title,
        text: `${property.title} - ${formatPrice(property.price)}/mes`,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado al portapapeles");
    }
  };

  const handleContact = () => {
    const message = encodeURIComponent(
      `Hola! Me interesa la propiedad "${property.title}" publicada en Acepto.Mascotas.`
    );
    const phone = property.contactPhone.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  const getPetIcon = (petType: string) => {
    switch (petType) {
      case "perro":
        return <Dog className="h-4 w-4" />;
      case "gato":
        return <Cat className="h-4 w-4" />;
      case "aves":
        return <Bird className="h-4 w-4" />;
      case "peces":
        return <Fish className="h-4 w-4" />;
      default:
        return <Check className="h-4 w-4" />;
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
          {/* Back Button */}
          <Link to="/buscar" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Volver a resultados
          </Link>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
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
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-4 right-4"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
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
                  <div>
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
                        <div
                          key={amenity}
                          className="flex items-center gap-2 text-muted-foreground"
                        >
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
                      <p className="font-semibold text-foreground">
                        {property.contactName}
                      </p>
                      <p className="text-sm text-muted-foreground">Propietario</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Show contact info only for authenticated users */}
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
                      <div className="flex items-center gap-2 text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                        <Lock className="h-4 w-4" />
                        <span className="text-sm">Iniciá sesión para ver la información de contacto</span>
                      </div>
                    )}
                  </div>

                  {user && property.contactPhone ? (
                    <Button
                      variant="hero"
                      size="lg"
                      className="w-full"
                      onClick={handleContact}
                    >
                      <Phone className="h-4 w-4" />
                      Contactar por WhatsApp
                    </Button>
                  ) : !user ? (
                    <Link to="/auth" className="block">
                      <Button
                        variant="hero"
                        size="lg"
                        className="w-full"
                      >
                        <Lock className="h-4 w-4" />
                        Iniciar sesión para contactar
                      </Button>
                    </Link>
                  ) : null}

                  <p className="text-xs text-center text-muted-foreground">
                    Mencioná que encontraste esta propiedad en Acepto.Mascotas
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PropertyDetail;