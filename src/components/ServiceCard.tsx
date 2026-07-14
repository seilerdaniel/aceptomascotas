import { Link } from "react-router-dom";
import { MapPin, Clock, Star, Phone, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PetService, getCategoryLabel, useServiceRating } from "@/hooks/useServices";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  service: PetService;
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  const { data: rating } = useServiceRating(service.id);
  const bannerUrl = (service as any).banner_url as string | null;
  const logoUrl = (service as any).logo_url as string | null;
  const imageUrl = bannerUrl || service.images?.[0] || "/placeholder.svg";

  return (
    <Link to={`/servicios/${service.id}`}>
      <Card className="group overflow-hidden cursor-pointer h-full hover:shadow-hover transition-all duration-300">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={imageUrl}
            alt={service.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />

          {/* Category Badge */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
            <Badge className="bg-primary text-primary-foreground shadow-lg">
              {getCategoryLabel(service.category)}
            </Badge>
            {(service as any).is_verified && (
              <Badge className="bg-accent text-accent-foreground shadow-lg gap-1">
                <ShieldCheck className="h-3 w-3" />
                Verificado
              </Badge>
            )}
          </div>

          {/* 24h Badge */}
          {service.is_24h && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-accent text-accent-foreground shadow-lg gap-1">
                <Clock className="h-3 w-3" />
                24 hs
              </Badge>
            </div>
          )}

          {/* Rating */}
          {rating && rating.average_rating > 0 && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm rounded-full px-2 py-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold">{rating.average_rating}</span>
              <span className="text-xs text-muted-foreground">
                ({rating.review_count})
              </span>
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            {logoUrl && (
              <div className="h-10 w-10 rounded-lg overflow-hidden border bg-muted shrink-0 -mt-8 shadow-md bg-card">
                <img src={logoUrl} alt={service.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <h3 className="font-body text-lg font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {service.name}
              </h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="line-clamp-1">
                  {service.neighborhood ? `${service.neighborhood}, ` : ""}
                  {service.city}
                </span>
              </div>
            </div>
          </div>

          {service.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {service.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            {service.phone && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span className="line-clamp-1">{service.phone}</span>
              </div>
            )}
            <Button variant="ghost" size="sm" className="ml-auto text-primary">
              Ver detalle
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ServiceCard;
