import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, X, Map as MapIcon, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PropertyCard from "@/components/PropertyCard";
import PropertyCardSkeleton from "@/components/PropertyCardSkeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Map from "@/components/Map";
import AdvancedFilters, { FilterState } from "@/components/AdvancedFilters";
import { useProperties, Property } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
  const canPublish =
    !isAdmin && (profile?.user_type === "propietario" || profile?.user_type === "agencia");

  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [location, setLocation] = useState(searchParams.get("ubicacion") || "");
  const [price, setPrice] = useState(searchParams.get("precio") || "");
  const [propertyType, setPropertyType] = useState(searchParams.get("tipo") || "");
  const [petType, setPetType] = useState(searchParams.get("mascota") || "");
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    minPrice: 0,
    maxPrice: 500000,
    propertyTypes: [],
    petTypes: [],
    amenities: [],
  });

  // Build filters for the query
  const queryFilters = useMemo(() => ({
    location: location || undefined,
    maxPrice: price ? parseInt(price) : undefined,
    propertyType: propertyType || undefined,
    petType: petType || undefined,
    minPrice: advancedFilters.minPrice > 0 ? advancedFilters.minPrice : undefined,
  }), [location, price, propertyType, petType, advancedFilters.minPrice]);

  // Fetch properties from database
  const { data: properties = [], isLoading, error } = useProperties(queryFilters);

  // Apply additional client-side filters that can't be done in the query
  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      // Advanced price filter (max)
      if (advancedFilters.maxPrice < 500000 && property.price > advancedFilters.maxPrice) {
        return false;
      }
      // Advanced property types filter
      if (advancedFilters.propertyTypes.length > 0 && 
          !advancedFilters.propertyTypes.includes(property.property_type)) {
        return false;
      }
      // Advanced pet types filter
      if (advancedFilters.petTypes.length > 0 && 
          !property.pet_types.some(pt => advancedFilters.petTypes.includes(pt))) {
        return false;
      }
      return true;
    });
  }, [properties, advancedFilters]);

  const clearFilters = () => {
    setLocation("");
    setPrice("");
    setPropertyType("");
    setPetType("");
    setAdvancedFilters({
      minPrice: 0,
      maxPrice: 500000,
      propertyTypes: [],
      petTypes: [],
      amenities: [],
    });
  };

  const hasActiveFilters = location || price || propertyType || petType || 
    advancedFilters.propertyTypes.length > 0 || 
    advancedFilters.petTypes.length > 0 || 
    advancedFilters.amenities.length > 0;

  const handlePropertyClick = (id: string) => {
    navigate(`/alquiler/${id}`);
  };

  // Transform properties for PropertyCard component
  const transformedProperties = filteredProperties.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description || "",
    location: p.location,
    price: p.price,
    propertyType: p.property_type,
    petTypes: p.pet_types,
    images: p.images || [],
    contactName: p.contact_name,
    contactPhone: p.contact_phone || "",
    contactEmail: p.contact_email || "",
    amenities: [],
    // TODO: remove the `as any` cast once `npm run gen:types` picks up
    // the owner_is_verified column added by the verification migration.
    isVerified: (p as any).owner_is_verified ?? false,
    propertyIsVerified: (p as any).property_is_verified ?? false,
    agencyId: (p as any).agency_id ?? null,
    latitude: (p as any).latitude ?? null,
    longitude: (p as any).longitude ?? null,
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Buscar alquileres pet-friendly"
        description={
          propertiesPage?.totalCount
            ? `${propertiesPage.totalCount} propiedades pet-friendly disponibles para alquilar en Argentina.`
            : "Buscá y filtrá alquileres que acepten perros y gatos en toda Argentina."
        }
        path="/buscar"
      />
      <Header />

      <main className="flex-1 container py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-body text-3xl md:text-4xl font-bold text-foreground mb-2">
              Buscar Alquileres Pet-Friendly
            </h1>
            <p className="text-muted-foreground">
              {isLoading ? "Buscando..." : `${filteredProperties.length} propiedades encontradas`}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={showMap ? "soft" : "outline"}
              size="sm"
              onClick={() => setShowMap(!showMap)}
              className="gap-2"
            >
              {showMap ? <List className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
              {showMap ? "Ver Lista" : "Ver Mapa"}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-2xl border p-4 md:p-6 mb-8">
          {/* Mobile Filter Toggle */}
          <Button
            variant="outline"
            className="md:hidden w-full justify-between mb-4"
            onClick={() => setShowFilters(!showFilters)}
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
            </span>
            {hasActiveFilters && (
              <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                Activos
              </span>
            )}
          </Button>

          {/* Filter Fields */}
          <div className={`grid gap-4 md:grid-cols-5 ${showFilters ? "block" : "hidden md:grid"}`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ubicación..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={price} onValueChange={setPrice}>
              <SelectTrigger>
                <SelectValue placeholder="Precio máx." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50000">Hasta $50.000</SelectItem>
                <SelectItem value="100000">Hasta $100.000</SelectItem>
                <SelectItem value="150000">Hasta $150.000</SelectItem>
                <SelectItem value="200000">Hasta $200.000</SelectItem>
                <SelectItem value="300000">Hasta $300.000</SelectItem>
                <SelectItem value="500000">Hasta $500.000</SelectItem>
              </SelectContent>
            </Select>

            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de propiedad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="departamento">Departamento</SelectItem>
                <SelectItem value="casa">Casa</SelectItem>
                <SelectItem value="ph">PH</SelectItem>
                <SelectItem value="loft">Loft</SelectItem>
                <SelectItem value="monoambiente">Monoambiente</SelectItem>
              </SelectContent>
            </Select>

            <Select value={petType} onValueChange={setPetType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de mascota" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="perro">Perro</SelectItem>
                <SelectItem value="gato">Gato</SelectItem>
                <SelectItem value="aves">Aves</SelectItem>
                <SelectItem value="peces">Peces</SelectItem>
                <SelectItem value="otros">Otros</SelectItem>
                <SelectItem value="todas">Todas las mascotas</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Limpiar
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          <div className="mt-4">
            <AdvancedFilters
              onFiltersChange={setAdvancedFilters}
              initialFilters={advancedFilters}
            />
          </div>
        </div>

        {/* Map View */}
        {showMap && (
          <div className="mb-8">
            <Map
              properties={transformedProperties.map((p) => ({
                id: p.id,
                title: p.title,
                price: p.price,
                location: p.location,
                lat: p.latitude ?? undefined,
                lng: p.longitude ?? undefined,
              }))}
              onMarkerClick={handlePropertyClick}
            />
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-card rounded-2xl border">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-body text-xl font-semibold text-foreground mb-2">
              Error al cargar propiedades
            </h2>
            <p className="text-muted-foreground mb-6">
              Hubo un problema al buscar las propiedades. Intentá de nuevo.
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {transformedProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-2xl border">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-body text-xl font-semibold text-foreground mb-2">
              No encontramos propiedades
            </h2>
            <p className="text-muted-foreground mb-6">
              {hasActiveFilters 
                ? "Intentá ajustar los filtros para ver más resultados"
                : "Aún no hay propiedades publicadas. ¡Sé el primero en publicar!"
              }
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            ) : canPublish ? (
              <Button variant="hero" onClick={() => navigate("/publicar")}>
                Publicar propiedad
              </Button>
            ) : null}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SearchPage;