// Fotos reales de mascotas de usuarios de la plataforma (curado manual
// inicialmente por Giselle desde el grupo de Facebook). Vacío a propósito:
// CommunityGrid no renderiza nada si este array está vacío.
//
// Requiere permiso del usuario para publicar su foto acá.
//
// Para agregar una foto:
// 1. Poné la imagen en src/assets/community/
// 2. Importala acá arriba y agregá un objeto al array de abajo
//
// import fotoRocco from "@/assets/community/rocco.jpg";
//
// export const communityPhotos: CommunityPhoto[] = [
//   { id: "rocco", imageUrl: fotoRocco, alt: "Rocco, un ovejero mestizo, en su balcón nuevo" },
// ];

export interface CommunityPhoto {
  id: string;
  imageUrl: string;
  alt: string;
}

export const communityPhotos: CommunityPhoto[] = [];
