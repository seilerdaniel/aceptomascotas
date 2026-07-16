import { Link } from "react-router-dom";
import { Dog, Cat, PawPrint, ArrowRight } from "lucide-react";

interface Tile {
  href: string;
  icon: typeof Dog;
  title: string;
  description: string;
}

const TILES: Tile[] = [
  {
    href: "/buscar?mascota=perro",
    icon: Dog,
    title: "Perros",
    description: "De cualquier tamaño y raza, sin restricciones que descarten al tuyo.",
  },
  {
    href: "/buscar?mascota=gato",
    icon: Cat,
    title: "Gatos",
    description: "Propiedades pensadas para convivir con uno o varios gatos.",
  },
  {
    href: "/buscar?mascota=perro-gato",
    icon: PawPrint,
    title: "Sin restricciones",
    description: "Hogares que aceptan cualquier combinación de mascotas.",
  },
];

// Cada tile es un link real (no solo onClick) a resultados ya filtrados:
// es la acción de bajo compromiso que invita a seguir explorando sin
// tener que completar el buscador. Ver sección 6, 14 y 16 del doc de
// rediseño (rediseno-home-aceptomascotas.md).
const PetCategoryTiles = () => {
  return (
    <section className="container py-16">
      <div className="text-center space-y-4 mb-12">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
          Buscá por tu compañero
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Elegí quién te acompaña y te mostramos los hogares pensados para eso
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {TILES.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            to={href}
            className="group bg-card rounded-2xl border p-8 text-center shadow-soft hover:shadow-hover transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-pet-green-light text-primary mb-6 transition-transform duration-300 group-hover:scale-105">
              <Icon className="h-8 w-8" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              {title}
            </h3>
            <p className="text-muted-foreground mb-4">{description}</p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              Ver propiedades
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default PetCategoryTiles;
