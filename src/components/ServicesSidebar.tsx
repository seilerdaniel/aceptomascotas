import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
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
  ChevronDown,
  ChevronUp,
  PawPrint,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SERVICE_CATEGORIES, ServiceCategory } from "@/hooks/useServices";

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

interface ServicesSidebarProps {
  isOpen?: boolean;
  onCategorySelect?: (category: ServiceCategory | null) => void;
  selectedCategory?: ServiceCategory | null;
  className?: string;
}

const ServicesSidebar = ({
  isOpen = true,
  onCategorySelect,
  selectedCategory,
  className,
}: ServicesSidebarProps) => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleCategoryClick = (category: ServiceCategory) => {
    if (onCategorySelect) {
      onCategorySelect(selectedCategory === category ? null : category);
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      className={cn(
        "bg-card border rounded-2xl p-4 space-y-4 shadow-soft",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <PawPrint className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            Servicios
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Categories */}
      {isExpanded && (
        <nav className="space-y-1 animate-fade-in">
          {SERVICE_CATEGORIES.map((category) => {
            const Icon = iconMap[category.icon] || PawPrint;
            const isActive = selectedCategory === category.value;
            const isVet24 = category.value === "veterinaria_24h";

            return (
              <Button
                key={category.value}
                variant={isActive ? "soft" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-auto py-2.5 px-3",
                  isVet24 && "border-l-2 border-accent ml-2 pl-3",
                  isActive && "bg-primary/10 text-primary"
                )}
                onClick={() => handleCategoryClick(category.value)}
              >
                <Icon className={cn("h-4 w-4 flex-shrink-0", isVet24 && "text-accent")} />
                <span className="text-sm text-left">{category.label}</span>
                {isVet24 && (
                  <span className="ml-auto text-[10px] font-bold bg-accent text-accent-foreground px-1.5 py-0.5 rounded">
                    24H
                  </span>
                )}
              </Button>
            );
          })}
        </nav>
      )}

      {/* CTA */}
      {isExpanded && (
        <div className="pt-4 border-t">
          <Link to="/servicios/publicar">
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Store className="h-4 w-4" />
              Agregar mi servicio
            </Button>
          </Link>
        </div>
      )}
    </aside>
  );
};

export default ServicesSidebar;
