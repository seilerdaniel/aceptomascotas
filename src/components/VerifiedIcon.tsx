import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedIconProps {
  className?: string;
  label?: string;
}

// Insignia de verificado unificada para todo el sitio: solo el ícono, en
// azul, sin fondo de color ni texto — se ubica junto al nombre/título
// (propiedad, servicio, agencia, propietario). Antes cada lugar mostraba
// una versión distinta (badge naranja con texto, pill verde con texto,
// etc.) — este componente es el único punto de verdad de cómo se ve
// "verificado" en toda la plataforma.
const VerifiedIcon = ({ className, label = "Verificado" }: VerifiedIconProps) => (
  <ShieldCheck
    className={cn("h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0", className)}
    aria-label={label}
  />
);

export default VerifiedIcon;
