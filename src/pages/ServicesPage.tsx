import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, X, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ServicesSidebar from "@/components/ServicesSidebar";
import ServicesMobileMenu from "@/components/ServicesMobileMenu";
import ServiceCard from "@/components/ServiceCard";
import { useServices, SERVICE_CATEGORIES, ServiceCategory, getCategoryLabel } from "@/hooks/useServices";

const CITIES = [
  "Buenos Aires",
  "CABA",
  "Córdoba",
  "Rosario",
  "Mendoza",
  "La Plata",
  "Mar del Plata",
  "Tucumán",
  "Salta",
  "Santa Fe",
];

const ServicesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("categoria") as ServiceCategory | null;

  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(
    initialCategory
  );
  const [searchText, setSearchText] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [is24hOnly, setIs24hOnly] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const { data: services = [], isLoading } = useServices({
    category: selectedCategory || undefined,
    city: selectedCity || undefined,
    is24h: is24hOnly || undefined,
    searchText: searchText || undefined,
  });

  const handleCategoryChange = (category: ServiceCategory | null) => {
    setSelectedCategory(category);
    if (category) {
      setSearchParams({ categoria: category });
    } else {
      setSearchParams({});
    }
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSearchText("");
    setSelectedCity("");
    setIs24hOnly(false);
    setSearchParams({});
  };

  const activeFiltersCount = [
    selectedCategory,
    searchText,
    selectedCity,
    is24hOnly,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Servicios para Mascotas
          </h1>
          <p className="text-muted-foreground">
            Encontrá veterinarias, guarderías, paseadores y más servicios pet-friendly
          </p>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24">
              <ServicesSidebar
                isOpen={true}
                selectedCategory={selectedCategory}
                onCategorySelect={handleCategoryChange}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Search and Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <ServicesMobileMenu onCategorySelect={(cat) => handleCategoryChange(cat)} />
              </div>

              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar servicios..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* City Select */}
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Ciudad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las ciudades</SelectItem>
                  {CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 24h Filter */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="24h-filter"
                  checked={is24hOnly}
                  onCheckedChange={(checked) => setIs24hOnly(checked === true)}
                />
                <label
                  htmlFor="24h-filter"
                  className="text-sm font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Clock className="h-4 w-4 text-accent" />
                  Solo 24 hs
                </label>
              </div>

              {/* Mobile Filters Button */}
              <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden relative">
                    <Filter className="h-4 w-4" />
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <ServicesSidebar
                      isOpen={true}
                      selectedCategory={selectedCategory}
                      onCategorySelect={(cat) => {
                        handleCategoryChange(cat);
                        setShowMobileFilters(false);
                      }}
                      className="border-0 shadow-none p-0"
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Active Filters */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Filtros:</span>
                {selectedCategory && (
                  <Badge variant="secondary" className="gap-1">
                    {getCategoryLabel(selectedCategory)}
                    <button onClick={() => handleCategoryChange(null)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedCity && selectedCity !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedCity}
                    <button onClick={() => setSelectedCity("")}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {is24hOnly && (
                  <Badge variant="secondary" className="gap-1">
                    24 hs
                    <button onClick={() => setIs24hOnly(false)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {searchText && (
                  <Badge variant="secondary" className="gap-1">
                    "{searchText}"
                    <button onClick={() => setSearchText("")}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-destructive"
                >
                  Limpiar todo
                </Button>
              </div>
            )}

            {/* Results */}
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-card rounded-2xl border h-72 animate-pulse"
                  />
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-16 bg-muted/50 rounded-2xl">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">
                  No encontramos servicios
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Probá ajustando los filtros o buscando en otra ciudad.
                  {selectedCategory && (
                    <>
                      {" "}
                      O podés{" "}
                      <button
                        onClick={clearFilters}
                        className="text-primary underline"
                      >
                        ver todos los servicios
                      </button>
                      .
                    </>
                  )}
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {services.length}{" "}
                  {services.length === 1 ? "servicio encontrado" : "servicios encontrados"}
                </p>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {services.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ServicesPage;
