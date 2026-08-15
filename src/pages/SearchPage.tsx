import { useState, useEffect, useMemo } from "react";
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
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Map from "@/components/Map";
import AdvancedFilters, { type FilterState } from "@/components/AdvancedFilters";
import { useProperties, Property } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PRICE_BUCKETS, PROPERTY_TYPES, PET_TYPES, MAX_PRICE } from "@/data/taxonomy";
import {
  parseSearchFilters,
  writeSearchFilters,
  type SearchFilters,
} from "@/lib/searchFilters";
import { toPropertyCard } from "@/lib/propertyTransform";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [page, setPage] = useState(1);

  // The URL is the single source of truth for filter state (spec U1): the
  // params are parsed on every render, so initial load (S28), a refresh
  // (S27) and back/forward navigation (S29) all restore identical results.
  const filters = useMemo(() => parseSearchFilters(searchParams), [searchParams]);

  // Location is a text input: keep a local draft so typing is immediate, and
  // write it back debounced (design U1) with replace so pauses do not flood
  // history.
  const [locationDraft, setLocationDraft] = useState(filters.ubicacion);
  useEffect(() => {
    setLocationDraft(filters.ubicacion);
  }, [filters.ubicacion]);
  useEffect(() => {
    if (locationDraft === filters.ubicacion) return;
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      writeSearchFilters(params, { ...filters, ubicacion: locationDraft });
      setSearchParams(params, { replace: true });
    }, 400);
    return () => clearTimeout(timeout);
  }, [locationDraft, filters, searchParams, setSearchParams]);

  const writeFilters = (next: SearchFilters, mode: "push" | "replace" = "push") => {
    const params = new URLSearchParams(searchParams);
    writeSearchFilters(params, next);
    setSearchParams(params, { replace: mode === "replace" });
  };

  const advancedFilters: FilterState = useMemo(
    () => ({
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      propertyTypes: filters.propertyTypes,
      petTypes: filters.petTypes,
      amenities: filters.amenities,
      petSize: filters.petSize,
      maxPets: filters.maxPets,
      petFee: filters.petFee,
    }),
    [filters]
  );

  const handleAdvancedChange = (next: FilterState, mode: "push" | "replace" = "push") => {
    writeFilters(
      {
        ...filters,
        minPrice: next.minPrice,
        maxPrice: next.maxPrice,
        propertyTypes: next.propertyTypes,
        petTypes: next.petTypes,
        amenities: next.amenities,
        petSize: next.petSize,
        maxPets: next.maxPets,
        petFee: next.petFee,
      },
      mode
    );
  };

  // Build filters for the query — todo el filtrado vive del lado del
  // servidor (ver useProperties) para que la paginación con range() sea
  // correcta. maxPrice combina el select simple con el slider avanzado
  // (el más restrictivo de los dos aplica).
  const queryFilters = useMemo(() => {
    const advancedMaxPrice = filters.maxPrice < MAX_PRICE ? filters.maxPrice : undefined;
    const simpleMaxPrice = filters.precio ? parseInt(filters.precio, 10) : undefined;
    const maxPrice = [advancedMaxPrice, simpleMaxPrice].filter((v): v is number => v !== undefined);

    return {
      location: filters.ubicacion || undefined,
      maxPrice: maxPrice.length > 0 ? Math.min(...maxPrice) : undefined,
      minPrice: filters.minPrice > 0 ? filters.minPrice : undefined,
      propertyTypes: filters.propertyTypes.length > 0 ? filters.propertyTypes : undefined,
      petTypes: filters.petTypes.length > 0 ? filters.petTypes : undefined,
      petSize: filters.petSize || undefined,
      maxPets: filters.maxPets !== "" ? Number(filters.maxPets) : undefined,
      petFee: filters.petFee !== "" ? Number(filters.petFee) : undefined,
      amenities: filters.amenities.length > 0 ? filters.amenities : undefined,
      page,
      pageSize: 12,
    };
  }, [filters, page]);

  // Fetch properties from database (ya filtradas y paginadas del lado del servidor)
  const { data: propertiesPage, isLoading, error } = useProperties(queryFilters);
  const properties = propertiesPage?.rows ?? [];

  // Volver a la página 1 cada vez que cambia algún filtro — si no, se
  // podría quedar en una página que ya no existe para el nuevo resultado.
  const filtersKey = JSON.stringify(filters);
  const [previousFiltersKey, setPreviousFiltersKey] = useState(filtersKey);
  if (filtersKey !== previousFiltersKey) {
    setPreviousFiltersKey(filtersKey);
    if (page !== 1) setPage(1);
  }

  const hasActiveFilters =
    filters.ubicacion !== "" ||
    filters.precio !== "" ||
    filters.minPrice > 0 ||
    filters.maxPrice < MAX_PRICE ||
    filters.propertyTypes.length > 0 ||
    filters.petTypes.length > 0 ||
    filters.amenities.length > 0 ||
    filters.petSize !== "" ||
    filters.maxPets !== "" ||
    filters.petFee !== "";

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  // Simple selects are single-value views of the merged URL params: the
  // select shows a value only when the shared param holds exactly one of it.
  const simplePropertyType = filters.propertyTypes.length === 1 ? filters.propertyTypes[0] : "";
  const simplePetType =
    filters.petTypes.length === 0 ? "todas" : filters.petTypes.length === 1 ? filters.petTypes[0] : "";

  const handlePropertyClick = (id: string) => {
    navigate(`/alquiler/${id}`);
  };

  // Transform properties for PropertyCard component. properties_public
  // rows are cast to Property; agency_id is a derived view column, so the
  // row type is widened once (instead of per-field `as any` casts) and the
  // shared toPropertyCard mapper (D8) does the null-safe field mapping.
  const transformedProperties = properties.map((p) => {
    const row = p as Property & { agency_id: string | null };
    return toPropertyCard(row);
  });

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
              {isLoading ? "Buscando..." : `${propertiesPage?.totalCount ?? 0} propiedades encontradas`}
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
                value={locationDraft}
                onChange={(e) => setLocationDraft(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filters.precio} onValueChange={(value) => writeFilters({ ...filters, precio: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Precio máx." />
              </SelectTrigger>
              <SelectContent>
                {PRICE_BUCKETS.map((bucket) => (
                  <SelectItem key={bucket.value} value={bucket.value}>
                    {bucket.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={simplePropertyType}
              onValueChange={(value) => writeFilters({ ...filters, propertyTypes: value ? [value] : [] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de propiedad" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={simplePetType}
              onValueChange={(value) =>
                writeFilters({ ...filters, petTypes: value && value !== "todas" ? [value] : [] })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de mascota" />
              </SelectTrigger>
              <SelectContent>
                {PET_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
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
            <AdvancedFilters filters={advancedFilters} onFiltersChange={handleAdvancedChange} />
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
        ) : transformedProperties.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {transformedProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
            <Pagination
              page={page}
              pageCount={propertiesPage?.pageCount ?? 1}
              totalCount={propertiesPage?.totalCount ?? 0}
              onPageChange={(newPage) => {
                setPage(newPage);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </>
        ) : (
          <EmptyState
            icon={Search}
            title="No encontramos propiedades"
            description={
              hasActiveFilters
                ? "Intentá ajustar los filtros para ver más resultados"
                : "Aún no hay propiedades publicadas. ¡Sé el primero en publicar!"
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              ) : canPublish ? (
                <Button variant="hero" onClick={() => navigate("/publicar")}>
                  Publicar propiedad
                </Button>
              ) : undefined
            }
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SearchPage;
