import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";
import property4 from "@/assets/property-4.jpg";
import property5 from "@/assets/property-5.jpg";

export interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  propertyType: string;
  petTypes: string[];
  images: string[];
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  amenities: string[];
  isVerified?: boolean;
  agencyId?: string | null;
}

export const mockProperties: Property[] = [
  {
    id: "1",
    title: "Luminoso departamento en Palermo con balcón",
    description: "Hermoso departamento de 2 ambientes completamente amoblado. Ideal para parejas o profesionales con mascotas. Cuenta con balcón amplio, perfecto para que tu mascota tome sol. Edificio con amenities: SUM, parrilla y lavadero. Muy buena ubicación, cerca de parques y transporte.",
    location: "Palermo, CABA",
    price: 180000,
    propertyType: "Departamento",
    petTypes: ["perro", "gato"],
    images: [property1, property1, property1],
    contactName: "María González",
    contactPhone: "+54 11 1234-5678",
    contactEmail: "maria@email.com",
    amenities: ["Balcón", "Amoblado", "Luminoso", "Cerca de parques"],
  },
  {
    id: "2",
    title: "Casa con jardín ideal para mascotas",
    description: "Encantadora casa de 3 ambientes con amplio jardín. Perfecta para familias con perros que necesitan espacio para correr y jugar. Zona tranquila y segura, cerca de veterinarias y pet shops. La propiedad cuenta con parrilla, cochera y mucha luz natural.",
    location: "Martínez, Buenos Aires",
    price: 350000,
    propertyType: "Casa",
    petTypes: ["perro", "gato"],
    images: [property2, property2, property2],
    contactName: "Carlos Rodríguez",
    contactPhone: "+54 11 9876-5432",
    contactEmail: "carlos@email.com",
    amenities: ["Jardín amplio", "Parrilla", "Cochera", "Zona tranquila"],
  },
  {
    id: "3",
    title: "Loft moderno en San Telmo con terraza privada",
    description: "Espectacular loft de diseño con techos altos y terraza privada. Ambiente único con ladrillo a la vista y mucha personalidad. Acepta mascotas de todo tipo. Ubicación inmejorable en el corazón de San Telmo, a pasos de la feria y los mejores bares.",
    location: "San Telmo, CABA",
    price: 220000,
    propertyType: "Loft",
    petTypes: ["perro", "gato"],
    images: [property3, property3, property3],
    contactName: "Ana Martínez",
    contactPhone: "+54 11 5555-1234",
    contactEmail: "ana@email.com",
    amenities: ["Terraza privada", "Techos altos", "Diseño moderno", "Ladrillo a la vista"],
  },
  {
    id: "4",
    title: "Monoambiente luminoso en Belgrano",
    description: "Acogedor monoambiente ideal para estudiantes o jóvenes profesionales con un gatito o perro pequeño. Muy luminoso, con balcón y cocina integrada. Edificio con seguridad 24hs. Excelente ubicación, cerca de universidades y comercios.",
    location: "Belgrano, CABA",
    price: 120000,
    propertyType: "Monoambiente",
    petTypes: ["gato"],
    images: [property4, property4, property4],
    contactName: "Pedro Sánchez",
    contactPhone: "+54 11 4444-5678",
    contactEmail: "pedro@email.com",
    amenities: ["Balcón", "Seguridad 24hs", "Cocina integrada", "Luminoso"],
  },
  {
    id: "5",
    title: "PH reciclado con patio en Villa Crespo",
    description: "Hermoso PH completamente reciclado con patio propio. Ideal para quienes buscan privacidad y espacio para sus mascotas. Cuenta con 2 dormitorios, living comedor amplio y cocina equipada. Sin expensas. Barrio tranquilo con mucha onda.",
    location: "Villa Crespo, CABA",
    price: 250000,
    propertyType: "PH",
    petTypes: ["perro", "gato"],
    images: [property5, property5, property5],
    contactName: "Laura Fernández",
    contactPhone: "+54 11 3333-9999",
    contactEmail: "laura@email.com",
    amenities: ["Patio propio", "Sin expensas", "2 dormitorios", "Reciclado"],
  },
];
