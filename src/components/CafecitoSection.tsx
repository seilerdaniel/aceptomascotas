import { Coffee, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const CafecitoSection = () => {
  return (
    <section className="container py-16">
      <div className="bg-gradient-to-r from-pet-coral-light via-secondary to-pet-green-light rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-10 text-6xl">☕</div>
          <div className="absolute bottom-4 right-10 text-6xl">🐾</div>
        </div>
        
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20 text-accent mb-4">
            <Coffee className="h-8 w-8" />
          </div>
          
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            ¿Te gusta lo que hacemos?
          </h2>
          
          <p className="text-muted-foreground text-lg">
            Acepto Mascotas es un proyecto sin fines de lucro. Con tu cafecito nos ayudás a mantener 
            la plataforma gratuita y seguir conectando familias con mascotas con hogares que las reciben.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a 
              href="https://cafecito.app/aceptomascotas" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="default" size="lg" className="gap-2 bg-accent hover:bg-accent/90">
                <Coffee className="h-5 w-5" />
                Invitanos un cafecito
              </Button>
            </a>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Heart className="h-4 w-4 text-accent" />
              Cada aporte suma
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CafecitoSection;
