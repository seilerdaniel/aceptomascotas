import type { Property } from "@/data/properties";

// Structural superset of the `properties` / `properties_public` columns the
// Home and Search transforms consume (D8). Every field is optional so both
// callers pass rows without per-field `as any` casts; the mapper is
// null-safe on every column.
export interface PropertyRowInput {
  id?: string | null;
  title?: string | null;
  description?: string | null;
  location?: string | null;
  price?: number | null;
  property_type?: string | null;
  pet_types?: string[] | null;
  images?: string[] | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  amenities?: string[] | null;
  owner_is_verified?: boolean | null;
  property_is_verified?: boolean | null;
  agency_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  pet_fee?: number | null;
  max_pets?: number | null;
  pet_size?: "pequeno" | "mediano" | "grande" | null;
}

// Shared DB→client transform used by Index and SearchPage: maps the pet
// attributes (pet_fee/max_pets/pet_size) null-safely and passes real
// `amenities` through — fixing the previously hardcoded `amenities: []` in
// both pages. Verification flags and coordinates keep their existing
// fallbacks (`?? false` / `?? null`).
export const toPropertyCard = (row: PropertyRowInput): Property => ({
  id: row.id ?? "",
  title: row.title ?? "",
  description: row.description ?? "",
  location: row.location ?? "",
  price: row.price ?? 0,
  propertyType: row.property_type ?? "",
  petTypes: row.pet_types ?? [],
  images: row.images ?? [],
  contactName: row.contact_name ?? "",
  contactPhone: row.contact_phone ?? "",
  contactEmail: row.contact_email ?? "",
  amenities: row.amenities ?? [],
  isVerified: row.owner_is_verified ?? false,
  propertyIsVerified: row.property_is_verified ?? false,
  agencyId: row.agency_id ?? null,
  latitude: row.latitude ?? null,
  longitude: row.longitude ?? null,
  pet_fee: row.pet_fee ?? null,
  max_pets: row.max_pets ?? null,
  pet_size: row.pet_size ?? null,
});