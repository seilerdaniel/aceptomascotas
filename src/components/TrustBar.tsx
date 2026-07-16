import { useEffect, useRef, useState } from "react";
import { Home, Users } from "lucide-react";

interface TrustBarProps {
  properties: number;
  searchers: number;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Cuenta de 0 al valor final una sola vez, cuando la franja entra en
// viewport. Respeta prefers-reduced-motion (salta directo al valor final).
const useCountUp = (target: number, active: boolean) => {
  const [value, setValue] = useState(active || prefersReducedMotion() ? target : 0);

  useEffect(() => {
    if (!active || prefersReducedMotion()) {
      setValue(target);
      return;
    }
    const durationMs = 800;
    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      setValue(Math.round(target * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target]);

  return value;
};

// Franja horizontal en línea, no "cards de dashboard": el objetivo es que
// el dato se sienta como un hecho al pasar, no como un widget de métricas.
// Ver sección 1 (microinteracciones) y 12 (confianza) del doc de rediseño.
const TrustBar = ({ properties, searchers }: TrustBarProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const propertiesCount = useCountUp(properties, inView);
  const searchersCount = useCountUp(searchers, inView);

  return (
    <div
      ref={ref}
      className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-foreground"
    >
      <div className="flex items-center gap-2">
        <Home className="h-5 w-5 text-primary" />
        <span className="font-display text-2xl font-bold">{propertiesCount}</span>
        <span className="text-sm text-muted-foreground">propiedades publicadas</span>
      </div>
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <span className="font-display text-2xl font-bold">{searchersCount}</span>
        <span className="text-sm text-muted-foreground">familias buscando</span>
      </div>
    </div>
  );
};

export default TrustBar;
