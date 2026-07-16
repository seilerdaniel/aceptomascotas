// Historias reales de familias que encontraron hogar en Acepto Mascotas.
// Vacío a propósito: StoryCarousel no renderiza nada si este array está
// vacío, para no mostrar contenido de relleno en producción.
//
// NO inventar historias ni citas. Cada entrada debe ser una historia real,
// con permiso explícito de la familia para publicar su nombre y foto
// (coordinar con Giselle vía el grupo de Facebook, ver
// rediseno-home-aceptomascotas.md sección 12).
//
// Para agregar una historia:
// 1. Poné la foto en src/assets/stories/ (ej. rocco-balcon.jpg)
// 2. Importala acá arriba y agregá un objeto al array de abajo
//
// import roccoImg from "@/assets/stories/rocco-balcon.jpg";
//
// export const stories: Story[] = [
//   {
//     id: "rocco",
//     quote: "Después de que nos rechazaran seis veces, encontramos un depto con balcón para Rocco.",
//     familyName: "Familia Gómez",
//     imageUrl: roccoImg,
//   },
// ];

export interface Story {
  id: string;
  quote: string;
  familyName: string;
  imageUrl: string;
}

export const stories: Story[] = [];
