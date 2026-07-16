import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { stories } from "@/data/stories";

// Antes de mostrar el catálogo, el usuario necesita creer que el
// problema (rechazo por tener mascota) es real y resoluble. Ver
// sección 3 y 11 de rediseno-home-aceptomascotas.md.
//
// Si todavía no hay historias reales cargadas (src/data/stories.ts),
// no renderiza nada — nunca mostrar testimonios de relleno.
const StoryCarousel = () => {
  if (stories.length === 0) return null;

  return (
    <section className="container py-16">
      <div className="text-center space-y-4 mb-12">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
          Así se vive con mascota
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Historias reales de familias que ya encontraron su hogar
        </p>
      </div>

      <Carousel className="max-w-3xl mx-auto">
        <CarouselContent>
          {stories.map((story) => (
            <CarouselItem key={story.id}>
              <figure className="bg-card rounded-2xl border overflow-hidden md:grid md:grid-cols-2 md:items-stretch">
                <div className="aspect-[4/3] md:aspect-auto bg-muted">
                  <img
                    src={story.imageUrl}
                    alt={`${story.familyName} en su nuevo hogar`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-8 flex flex-col justify-center">
                  <blockquote className="font-display text-xl md:text-2xl text-foreground leading-snug">
                    "{story.quote}"
                  </blockquote>
                  <figcaption className="mt-4 text-sm text-muted-foreground">
                    — {story.familyName}
                  </figcaption>
                </div>
              </figure>
            </CarouselItem>
          ))}
        </CarouselContent>
        {stories.length > 1 && (
          <>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </>
        )}
      </Carousel>
    </section>
  );
};

export default StoryCarousel;
