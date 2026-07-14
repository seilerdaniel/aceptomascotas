import { Link } from "react-router-dom";
import { MapPin, Dog, Cat, Check, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FavoriteButton from "@/components/FavoriteButton";
import { Property } from "@/data/properties";

interface PropertyCardProps {
  property: Property;
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getPetIcon = (petType: string) => {
    switch (petType) {
      case "perro":
        return <Dog className="h-3 w-3" />;
      case "gato":
        return <Cat className="h-3 w-3" />;
      default:
        return <Check className="h-3 w-3" />;
    }
  };

  return (
    <Link to={`/alquiler/${property.id}`}>
      <Card className="group overflow-hidden cursor-pointer h-full">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {property.images[0] ? (
            <img
              src={property.images[0]}
              alt={property.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-secondary">
              <Dog className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
          
          {/* Pet Badge */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
            <Badge className="bg-primary text-primary-foreground gap-1 shadow-lg">
              <Dog className="h-3 w-3" />
              Acepta mascotas
            </Badge>
            {property.isVerified && (
              <Badge className="bg-accent text-accent-foreground gap-1 shadow-lg">
                <ShieldCheck className="h-3 w-3" />
                Agencia verificada
              </Badge>
            )}
            {property.propertyIsVerified && (
              <Badge className="bg-primary text-primary-foreground gap-1 shadow-lg">
                <ShieldCheck className="h-3 w-3" />
                Propiedad verificada
              </Badge>
            )}
          </div>

          {/* Favorite Button */}
          <div className="absolute top-3 right-3">
            <FavoriteButton propertyId={property.id} />
          </div>

          {/* Price */}
          <div className="absolute bottom-3 left-3 right-3">
            <span className="font-body text-2xl font-bold text-card">
              {formatPrice(property.price)}
              <span className="text-sm font-body font-normal opacity-80">/mes</span>
            </span>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-body text-lg font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {property.title}
            </h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{property.location}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {property.propertyType}
            </Badge>
            {property.petTypes.map((pet) => (
              <Badge key={pet} variant="outline" className="gap-1 text-xs border-primary/30 text-primary">
                {getPetIcon(pet)}
                {pet}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default PropertyCard;
