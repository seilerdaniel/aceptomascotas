import { Dog, Cat, PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";

interface PetTypeOption {
  value: string;
  label: string;
}

const OPTIONS: PetTypeOption[] = [
  { value: "", label: "Todas" },
  { value: "perro", label: "Perro" },
  { value: "gato", label: "Gato" },
  { value: "perro-gato", label: "Ambos" },
];

interface PetTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// Chips grandes en vez de un <select> escondido: es la primera decisión
// que le pedimos al usuario (¿para quién buscás?), no un filtro más entre
// varios. Ver "Hero" y "Buscador" en rediseno-home-aceptomascotas.md.
const PetTypeSelector = ({ value, onChange, className }: PetTypeSelectorProps) => {
  return (
    <div
      role="group"
      aria-label="Filtrar por tipo de mascota"
      className={cn("flex flex-wrap gap-2", className)}
    >
      {OPTIONS.map((option) => {
        const isSelected = value === option.value;
        const Icon =
          option.value === "perro"
            ? Dog
            : option.value === "gato"
            ? Cat
            : option.value === "perro-gato"
            ? null
            : PawPrint;

        return (
          <button
            key={option.value || "todas"}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 min-h-11 text-sm font-medium transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary/50"
            )}
          >
            {option.value === "perro-gato" ? (
              <span className="flex items-center -space-x-1">
                <Dog className="h-4 w-4" />
                <Cat className="h-4 w-4" />
              </span>
            ) : (
              Icon && <Icon className="h-4 w-4" />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default PetTypeSelector;
