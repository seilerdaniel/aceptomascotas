import { toPropertyCard } from "./propertyTransform";

// Shared transform coverage (spec: DB→client transforms). Null columns map
// to null, real amenities pass through, and the existing verification /
// coordinate fallbacks are preserved.
describe("toPropertyCard", () => {
  it("maps null pet columns to null", () => {
    const card = toPropertyCard({
      id: "p1",
      title: "Depto",
      pet_fee: null,
      max_pets: null,
      pet_size: null,
    });

    expect(card.pet_fee).toBeNull();
    expect(card.max_pets).toBeNull();
    expect(card.pet_size).toBeNull();
  });

  it("maps pet columns when present", () => {
    const card = toPropertyCard({
      id: "p1",
      title: "Depto",
      pet_fee: 5000,
      max_pets: 2,
      pet_size: "grande",
    });

    expect(card.pet_fee).toBe(5000);
    expect(card.max_pets).toBe(2);
    expect(card.pet_size).toBe("grande");
  });

  it("passes amenities through instead of hardcoding an empty array", () => {
    const card = toPropertyCard({
      id: "p1",
      title: "Depto",
      amenities: ["Balcón", "Parrilla"],
    });

    expect(card.amenities).toEqual(["Balcón", "Parrilla"]);
  });

  it("defaults missing amenities to an empty array", () => {
    const card = toPropertyCard({ id: "p1", title: "Depto", amenities: null });

    expect(card.amenities).toEqual([]);
  });

  it("maps core fields, verification flags and coordinates", () => {
    const card = toPropertyCard({
      id: "p1",
      title: "Depto luminoso",
      description: "Acepta mascotas",
      location: "Palermo, CABA",
      price: 120000,
      property_type: "departamento",
      pet_types: ["perro", "gato"],
      images: ["/img.jpg"],
      contact_name: "Ana",
      contact_phone: "+54 11 1234",
      contact_email: "ana@mail.com",
      owner_is_verified: true,
      property_is_verified: false,
      agency_id: "ag-1",
      latitude: -34.6,
      longitude: -58.4,
    });

    expect(card).toMatchObject({
      id: "p1",
      title: "Depto luminoso",
      description: "Acepta mascotas",
      location: "Palermo, CABA",
      price: 120000,
      propertyType: "departamento",
      petTypes: ["perro", "gato"],
      images: ["/img.jpg"],
      contactName: "Ana",
      contactPhone: "+54 11 1234",
      contactEmail: "ana@mail.com",
      isVerified: true,
      propertyIsVerified: false,
      agencyId: "ag-1",
      latitude: -34.6,
      longitude: -58.4,
    });
  });

  it("falls back for missing core fields without throwing", () => {
    const card = toPropertyCard({});

    expect(card.id).toBe("");
    expect(card.title).toBe("");
    expect(card.price).toBe(0);
    expect(card.images).toEqual([]);
    expect(card.petTypes).toEqual([]);
    expect(card.isVerified).toBe(false);
    expect(card.agencyId).toBeNull();
  });
});