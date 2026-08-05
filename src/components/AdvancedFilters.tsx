import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AMENITIES,
  MAX_PRICE,
  PET_FEE_BUCKETS,
  PET_SIZES,
  PET_TYPES,
  PROPERTY_TYPES,
} from "@/data/taxonomy";

export interface FilterState {
  minPrice: number;
  maxPrice: number;
  propertyTypes: string[];
  petTypes: string[];
  amenities: string[];
  petSize: string;
  maxPets: string;
  petFee: string;
}

export const DEFAULT_ADVANCED_FILTERS: FilterState = {
  minPrice: 0,
  maxPrice: MAX_PRICE,
  propertyTypes: [],
  petTypes: [],
  amenities: [],
  petSize: "",
  maxPets: "",
  petFee: "",
};

// Fully controlled (design U1): the parent owns the filter truth (synced to
// the URL on SearchPage) and this panel renders it. `mode` tells the parent
// how to write back — continuous inputs (slider, free text) use "replace" so
// history is not flooded, discrete toggles use "push" so back/forward works.
interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState, mode?: "push" | "replace") => void;
}

const AdvancedFilters = ({ filters, onFiltersChange }: AdvancedFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
    mode: "push" | "replace" = "push"
  ) => {
    onFiltersChange({ ...filters, [key]: value }, mode);
  };

  const toggleArrayFilter = (
    key: "propertyTypes" | "petTypes" | "amenities",
    value: string
  ) => {
    const current = filters[key];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilter(key, next);
  };

  const clearFilters = () => {
    onFiltersChange(DEFAULT_ADVANCED_FILTERS, "push");
  };

  const hasActiveFilters =
    filters.minPrice > 0 ||
    filters.maxPrice < MAX_PRICE ||
    filters.propertyTypes.length > 0 ||
    filters.petTypes.length > 0 ||
    filters.amenities.length > 0 ||
    filters.petSize !== "" ||
    filters.maxPets !== "" ||
    filters.petFee !== "";

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center justify-between mb-4">
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="gap-2">
            Filtros Avanzados
            {hasActiveFilters && (
              <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                {filters.propertyTypes.length +
                  filters.petTypes.length +
                  filters.amenities.length +
                  (filters.petSize ? 1 : 0) +
                  (filters.maxPets ? 1 : 0) +
                  (filters.petFee ? 1 : 0)}
              </span>
            )}
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="h-4 w-4" />
            Limpiar filtros
          </Button>
        )}
      </div>

      <CollapsibleContent className="space-y-6 animate-fade-in">
        <div className="bg-card rounded-xl border p-6 space-y-6">
          {/* Price Range */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Rango de Precio</h4>
            <div className="px-2">
              <Slider
                value={[filters.minPrice, filters.maxPrice]}
                max={MAX_PRICE}
                step={10000}
                onValueChange={([min, max]) => {
                  // Continuous drag → replace so dragging does not spam history.
                  onFiltersChange({ ...filters, minPrice: min, maxPrice: max }, "replace");
                }}
                className="mb-2"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatPrice(filters.minPrice)}</span>
                <span>{formatPrice(filters.maxPrice)}</span>
              </div>
            </div>
          </div>

          {/* Property Types */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">Tipo de Propiedad</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PROPERTY_TYPES.map((type) => (
                <label
                  key={type.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={filters.propertyTypes.includes(type.value)}
                    onCheckedChange={() => toggleArrayFilter("propertyTypes", type.value)}
                  />
                  <span className="text-sm">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Pet Types */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">Mascotas Permitidas</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PET_TYPES.map((type) => (
                <label
                  key={type.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={filters.petTypes.includes(type.value)}
                    onCheckedChange={() => toggleArrayFilter("petTypes", type.value)}
                  />
                  <span className="text-sm">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Pet-friendly details */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">Detalles pet-friendly</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label htmlFor="advanced-pet-size" className="text-sm font-medium text-foreground">
                  Tamaño de mascota
                </label>
                <Select
                  value={filters.petSize}
                  onValueChange={(value) => updateFilter("petSize", value)}
                >
                  <SelectTrigger id="advanced-pet-size">
                    <SelectValue placeholder="Cualquier tamaño" />
                  </SelectTrigger>
                  <SelectContent>
                    {PET_SIZES.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="advanced-max-pets" className="text-sm font-medium text-foreground">
                  Máximo de mascotas
                </label>
                <Input
                  id="advanced-max-pets"
                  type="text"
                  inputMode="numeric"
                  placeholder="Ej: 2"
                  value={filters.maxPets}
                  // Continuous typing → replace so history is not flooded.
                  onChange={(e) => updateFilter("maxPets", e.target.value, "replace")}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="advanced-pet-fee" className="text-sm font-medium text-foreground">
                  Cargo por mascota
                </label>
                <Select
                  value={filters.petFee}
                  onValueChange={(value) => updateFilter("petFee", value)}
                >
                  <SelectTrigger id="advanced-pet-fee">
                    <SelectValue placeholder="Cualquier cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {PET_FEE_BUCKETS.map((bucket) => (
                      <SelectItem key={bucket.value} value={bucket.value}>
                        {bucket.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">Comodidades</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {AMENITIES.map((amenity) => (
                <label
                  key={amenity.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={filters.amenities.includes(amenity.value)}
                    onCheckedChange={() => toggleArrayFilter("amenities", amenity.value)}
                  />
                  <span className="text-sm">{amenity.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default AdvancedFilters;
