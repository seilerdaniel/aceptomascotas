import { communityPhotos } from "@/data/communityPhotos";

// TODO(Daniel): completar con el link real al grupo de Facebook cuando
// se cargue contenido acá, para que la Home funcione como puerta de
// entrada a la comunidad existente (ver sección 13 del doc de rediseño).
const FACEBOOK_GROUP_URL: string | null = null;

// Cierre de conversión social antes del CTA final. No renderiza nada si
// todavía no hay fotos curadas cargadas en src/data/communityPhotos.ts.
const CommunityGrid = () => {
  if (communityPhotos.length === 0) return null;

  return (
    <section className="container py-16">
      <div className="text-center space-y-4 mb-12">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
          Se ven en Acepto Mascotas
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Mascotas de nuestra comunidad
          {FACEBOOK_GROUP_URL && (
            <>
              {" "}
              ·{" "}
              <a
                href={FACEBOOK_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2"
              >
                sumate al grupo
              </a>
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {communityPhotos.map((photo) => (
          <div key={photo.id} className="aspect-square rounded-2xl overflow-hidden bg-muted">
            <img
              src={photo.imageUrl}
              alt={photo.alt}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default CommunityGrid;
