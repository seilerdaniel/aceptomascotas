import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  /** Variante compacta para usar dentro de una Card que ya tiene su propio
   * borde/fondo (ej. las pestañas de "Mis Propiedades"/"Mis Servicios"),
   * para no duplicar el borde+fondo dos veces. */
  compact?: boolean;
}

// Patrón ya probado en FavoritesPage.tsx y SearchPage.tsx (icono + título +
// descripción + acción opcional), extraído acá para no seguir
// duplicándolo a mano cada vez que aparece una lista vacía en el sitio.
const EmptyState = ({ icon: Icon, title, description, action, compact = false }: EmptyStateProps) => (
  <div className={compact ? "text-center py-8" : "text-center py-16 bg-card rounded-2xl border"}>
    <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
    <h2 className="font-body text-xl font-semibold text-foreground mb-2">{title}</h2>
    {description && <p className="text-muted-foreground mb-6">{description}</p>}
    {action}
  </div>
);

export default EmptyState;
