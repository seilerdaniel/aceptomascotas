import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Stethoscope,
  Clock,
  Shield,
  Home,
  GraduationCap,
  Footprints,
  Truck,
  Heart,
  Scissors,
  Store,
  PawPrint,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { SERVICE_CATEGORIES, ServiceCategory } from "@/hooks/useServices";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Stethoscope,
  Clock,
  Shield,
  Home,
  GraduationCap,
  Footprints,
  Truck,
  Heart,
  Scissors,
  Store,
};

interface ServicesMobileMenuProps {
  onCategorySelect?: (category: ServiceCategory) => void;
}

const ServicesMobileMenu = ({ onCategorySelect }: ServicesMobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
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
  const canAddService = profile?.user_type === "proveedor";

  const handleCategoryClick = (category: ServiceCategory) => {
    onCategorySelect?.(category);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 md:hidden"
        >
          <PawPrint className="h-4 w-4" />
          Servicios
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-primary" />
            Servicios para Mascotas
          </SheetTitle>
        </SheetHeader>

        <nav className="mt-6 space-y-1">
          {SERVICE_CATEGORIES.map((category) => {
            const Icon = iconMap[category.icon] || PawPrint;
            const isVet24 = category.value === "veterinaria_24h";

            return (
              <Link
                key={category.value}
                to={`/servicios?categoria=${category.value}`}
                onClick={() => setIsOpen(false)}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-auto py-3 px-3",
                    isVet24 && "border-l-2 border-accent"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0",
                      isVet24 && "text-accent"
                    )}
                  />
                  <span className="flex-1 text-left">{category.label}</span>
                  {isVet24 && (
                    <span className="text-[10px] font-bold bg-accent text-accent-foreground px-1.5 py-0.5 rounded">
                      24H
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Link>
            );
          })}
        </nav>

        {canAddService && (
        <div className="mt-6 pt-6 border-t">
          <Link to="/servicios/publicar" onClick={() => setIsOpen(false)}>
            <Button variant="hero" className="w-full gap-2">
              <Store className="h-4 w-4" />
              Agregar mi servicio
            </Button>
          </Link>
        </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ServicesMobileMenu;
