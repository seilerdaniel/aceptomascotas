import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface StickyMobileContactBarProps {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  to?: string;
  helperText?: string;
}

// Solo visible en mobile (md:hidden): en desktop el CTA de contacto ya
// está siempre visible en la sidebar sticky. En mobile, esa misma card
// queda al final del scroll — el usuario tiene que bajar toda la página
// para volver a encontrar el botón de contactar. Esta barra lo mantiene
// siempre a mano.
//
// Nota para cuando se reactive el AIChatbot (hoy comentado en App.tsx):
// van a compartir posición/espacio en la esquina inferior de la pantalla
// en mobile, coordinar el layout de los dos en ese momento.
const StickyMobileContactBar = ({ label, icon, onClick, to, helperText }: StickyMobileContactBarProps) => {
  const button = (
    <Button variant="hero" size="lg" className="w-full" onClick={onClick}>
      {icon}
      {label}
    </Button>
  );

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      {helperText && (
        <p className="text-xs text-center text-muted-foreground mb-2">{helperText}</p>
      )}
      {to ? <Link to={to}>{button}</Link> : button}
    </div>
  );
};

export default StickyMobileContactBar;
