import { MapPin, DollarSign, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import PetTypeSelector from "@/components/PetTypeSelector";

const SearchBar = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [petType, setPetType] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set("ubicacion", location);
    if (price) params.set("precio", price);
    if (propertyType) params.set("tipo", propertyType);
    if (petType) params.set("mascota", petType);
    navigate(`/buscar?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="bg-card rounded-2xl shadow-hover p-4 md:p-6 border space-y-4">
        {/* Pet type — primer control: "¿para quién buscás?" antes que "dónde" */}
        <PetTypeSelector value={petType} onChange={setPetType} />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Location */}
          <div className="relative lg:col-span-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Ciudad o barrio..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Price */}
          <div className="relative lg:col-span-1">
            <Select value={price} onValueChange={setPrice}>
              <SelectTrigger className="h-11">
                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
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
          </div>

          {/* Property Type */}
          <div className="relative lg:col-span-1">
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger className="h-11">
                <Home className="h-4 w-4 mr-2 text-muted-foreground" />
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
          </div>

          {/* Search Button */}
          <Button type="submit" variant="hero" size="lg" className="lg:col-span-1">
            Buscar
          </Button>
        </div>
      </div>
    </form>
  );
};

export default SearchBar;
