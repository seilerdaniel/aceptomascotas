import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  MessageCircle,
  ExternalLink,
  Instagram,
  Facebook,
  Star,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ServiceReviews from "@/components/ServiceReviews";
import StickyMobileContactBar from "@/components/StickyMobileContactBar";
import SEOHead from "@/components/SEOHead";
import { useService, useServiceRating, getCategoryLabel } from "@/hooks/useServices";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useState } from "react";

const ServiceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: service, isLoading, error } = useService(id || "");
  const { data: rating } = useServiceRating(id || "");
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: service?.name,
          text: `Mirá este servicio: ${service?.name}`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "¡Enlace copiado!",
        description: "Podés compartirlo donde quieras",
      });
    }
  };

  const openGoogleMaps = () => {
    if (service?.address && service?.city) {
      const query = encodeURIComponent(`${service.address}, ${service.city}, Argentina`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
    }
  };

  const openWhatsApp = () => {
    if (service?.whatsapp) {
      const phone = service.whatsapp.replace(/\D/g, "");
      const message = encodeURIComponent(
        `Hola! Vi tu servicio "${service.name}" en Acepto Mascotas y me gustaría consultar.`
      );
      window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-96 bg-muted rounded-2xl" />
            <div className="h-32 bg-muted rounded-2xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="text-center py-16">
            <h1 className="font-display text-2xl font-bold mb-4">
              Servicio no encontrado
            </h1>
            <p className="text-muted-foreground mb-6">
              El servicio que buscás no existe o fue eliminado.
            </p>
            <Link to="/servicios">
              <Button>Ver todos los servicios</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const images = service.images?.length ? service.images : ["/placeholder.svg"];
  const isRecommended = rating && rating.average_rating >= 4 && rating.review_count >= 3;
  const metaDescription = service.description
    ? service.description.length > 155
      ? `${service.description.slice(0, 152)}...`
      : service.description
    : `${service.name} — ${getCategoryLabel(service.category)} en ${service.city}.`;

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={`${service.name} — ${getCategoryLabel(service.category)} en ${service.city}`}
        description={metaDescription}
        path={`/servicios/${service.id}`}
        image={images[0] !== "/placeholder.svg" ? images[0] : undefined}
        type="product"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: service.name,
          description: metaDescription,
          image: images[0] !== "/placeholder.svg" ? images[0] : undefined,
          address: {
            "@type": "PostalAddress",
            addressLocality: service.city,
            addressCountry: "AR",
          },
          ...(rating?.average_rating && {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: rating.average_rating,
              reviewCount: rating.review_count,
            },
          }),
        }}
      />
      <Header />

      <main className="flex-1 container py-8 pb-24 md:pb-8">
        {/* Back Button */}
        <Link to="/servicios" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Volver a servicios
        </Link>

        {(service as any).banner_url && (
          <div className="w-full aspect-[4/1] rounded-2xl overflow-hidden mb-6 bg-secondary">
            <img src={(service as any).banner_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-2xl">
                <img
                  src={images[selectedImage]}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
                {service.is_24h && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="accent" className="text-lg px-4 py-1 gap-2">
                      <Clock className="h-4 w-4" />
                      Abierto 24 hs
                    </Badge>
                  </div>
                )}
                {isRecommended && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1 gap-1">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      Recomendado
                    </Badge>
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={cn(
                        "relative flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all",
                        selectedImage === idx
                          ? "border-primary"
                          : "border-transparent opacity-70 hover:opacity-100"
                      )}
                    >
                      <img
                        src={img}
                        alt={`${service.name} ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Service Info */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {(service as any).logo_url && (
                    <div className="h-14 w-14 rounded-full overflow-hidden border bg-muted shrink-0">
                      <img src={(service as any).logo_url} alt={service.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      {getCategoryLabel(service.category)}
                    </Badge>
                    <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                      {service.name}
                    </h1>
                  </div>
                </div>
                <Button variant="ghost" size="icon" aria-label="Compartir servicio" onClick={handleShare}>
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {service.neighborhood && `${service.neighborhood}, `}
                  {service.city}
                </span>
              </div>

              {rating && rating.review_count > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-4 w-4",
                          star <= Math.round(rating.average_rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-muted text-muted"
                        )}
                      />
                    ))}
                  </div>
                  <span className="font-semibold">{rating.average_rating}</span>
                  <span className="text-muted-foreground">
                    ({rating.review_count} {rating.review_count === 1 ? "reseña" : "reseñas"})
                  </span>
                </div>
              )}
            </div>

            <Separator />

            {/* Description */}
            {service.description && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-semibold">Descripción</h2>
                <p className="text-muted-foreground whitespace-pre-line">
                  {service.description}
                </p>
              </div>
            )}

            {/* Hours */}
            {service.opening_hours && Object.keys(service.opening_hours as object).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Horarios de atención
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {Object.entries(service.opening_hours as Record<string, string>).map(
                      ([day, hours]) => (
                        <div key={day} className="flex justify-between text-sm">
                          <span className="capitalize">{day}</span>
                          <span className="text-muted-foreground">{hours}</span>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews Section */}
            <ServiceReviews serviceId={service.id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Primary CTA */}
                {service.whatsapp ? (
                  <Button
                    variant="hero"
                    className="w-full gap-2"
                    onClick={openWhatsApp}
                  >
                    <MessageCircle className="h-5 w-5" />
                    Contactar por WhatsApp
                  </Button>
                ) : service.phone ? (
                  <Button
                    variant="hero"
                    className="w-full gap-2"
                    asChild
                  >
                    <a href={`tel:${service.phone}`}>
                      <Phone className="h-5 w-5" />
                      Llamar ahora
                    </a>
                  </Button>
                ) : null}

                <Separator />

                {/* Contact Details */}
                <div className="space-y-3">
                  {service.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm">{service.address}</p>
                        <p className="text-sm text-muted-foreground">{service.city}</p>
                      </div>
                    </div>
                  )}

                  {service.phone && (
                    <a
                      href={`tel:${service.phone}`}
                      className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                    >
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      {service.phone}
                    </a>
                  )}

                  {service.email && (
                    <a
                      href={`mailto:${service.email}`}
                      className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                    >
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      {service.email}
                    </a>
                  )}

                  {service.website && (
                    <a
                      href={service.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                    >
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      Sitio web
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* Social Media */}
                {(service.instagram || service.facebook) && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3">
                      {service.instagram && (
                        <a
                          href={`https://instagram.com/${service.instagram.replace("@", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                        >
                          <Instagram className="h-5 w-5" />
                        </a>
                      )}
                      {service.facebook && (
                        <a
                          href={service.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                        >
                          <Facebook className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  </>
                )}

                {/* Google Maps Button */}
                {service.address && (
                  <>
                    <Separator />
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={openGoogleMaps}
                    >
                      <MapPin className="h-4 w-4" />
                      Ver en Google Maps
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {service.whatsapp ? (
        <StickyMobileContactBar
          label="Contactar por WhatsApp"
          icon={<MessageCircle className="h-4 w-4" />}
          onClick={openWhatsApp}
        />
      ) : service.phone ? (
        <StickyMobileContactBar
          label="Llamar ahora"
          icon={<Phone className="h-4 w-4" />}
          onClick={() => window.open(`tel:${service.phone}`, "_self")}
        />
      ) : null}

      <Footer />
    </div>
  );
};

export default ServiceDetailPage;
