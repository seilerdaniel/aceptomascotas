import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  initialFilters?: FilterState;
}

export interface FilterState {
  minPrice: number;
  maxPrice: number;
  propertyTypes: string[];
  petTypes: string[];
  amenities: string[];
}

const PROPERTY_TYPES = [
  { value: 'departamento', label: 'Departamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'ph', label: 'PH' },
  { value: 'loft', label: 'Loft' },
  { value: 'monoambiente', label: 'Monoambiente' },
];

const PET_TYPES = [
  { value: 'perro', label: 'Perro' },
  { value: 'gato', label: 'Gato' },
  { value: 'aves', label: 'Aves' },
  { value: 'peces', label: 'Peces' },
  { value: 'otros', label: 'Otros' },
];

const AMENITIES = [
  { value: 'balcon', label: 'Balcón' },
  { value: 'terraza', label: 'Terraza' },
  { value: 'jardin', label: 'Jardín' },
  { value: 'cochera', label: 'Cochera' },
  { value: 'pileta', label: 'Pileta' },
  { value: 'parrilla', label: 'Parrilla' },
  { value: 'gimnasio', label: 'Gimnasio' },
  { value: 'seguridad', label: 'Seguridad 24hs' },
];

const AdvancedFilters = ({ onFiltersChange, initialFilters }: AdvancedFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(
    initialFilters || {
      minPrice: 0,
      maxPrice: 500000,
      propertyTypes: [],
      petTypes: [],
      amenities: [],
    }
  );

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const toggleArrayFilter = (key: 'propertyTypes' | 'petTypes' | 'amenities', value: string) => {
    const current = filters[key];
    const newValue = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilter(key, newValue);
  };

  const clearFilters = () => {
    const defaultFilters: FilterState = {
      minPrice: 0,
      maxPrice: 500000,
      propertyTypes: [],
      petTypes: [],
      amenities: [],
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters =
    filters.minPrice > 0 ||
    filters.maxPrice < 500000 ||
    filters.propertyTypes.length > 0 ||
    filters.petTypes.length > 0 ||
    filters.amenities.length > 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
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
                {filters.propertyTypes.length + filters.petTypes.length + filters.amenities.length}
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
                max={500000}
                step={10000}
                onValueChange={([min, max]) => {
                  updateFilter('minPrice', min);
                  updateFilter('maxPrice', max);
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
                    onCheckedChange={() => toggleArrayFilter('propertyTypes', type.value)}
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
                    onCheckedChange={() => toggleArrayFilter('petTypes', type.value)}
                  />
                  <span className="text-sm">{type.label}</span>
                </label>
              ))}
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
                    onCheckedChange={() => toggleArrayFilter('amenities', amenity.value)}
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
