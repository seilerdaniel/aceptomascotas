import {
  AMENITIES,
  MAX_PRICE,
  PET_FEE_BUCKETS,
  PET_SIZES,
  PET_TYPES,
  PRICE_BUCKETS,
  PROPERTY_TYPES,
} from "@/data/taxonomy";

// Canonical filter state for the search page, serialized to the URL via
// useSearchParams (spec U1, design URL contract). Simple bar and advanced
// panel converge on ONE contract so a refresh, a shared deep link and
// back/forward all restore identical results (S27-S29).
//
// Param map: ubicacion, precio (simple max), min/max (slider), tipo (csv
// property types), mascota (csv pet types), comodidades (csv amenities),
// tamano, mascotas_max, pet_fee. Defaults are omitted from the URL; unknown
// or malformed values are ignored with defaults (S30).
export interface SearchFilters {
  ubicacion: string;
  /** Simple "Precio máx." select value — one of PRICE_BUCKETS, "" = none. */
  precio: string;
  minPrice: number;
  maxPrice: number;
  propertyTypes: string[];
  petTypes: string[];
  amenities: string[];
  petSize: string;
  /** Raw string so the controlled input can show the typed value. */
  maxPets: string;
  /** One of PET_FEE_BUCKETS ("up to" bucket, lte semantics), "" = none. */
  petFee: string;
}

export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  ubicacion: "",
  precio: "",
  minPrice: 0,
  maxPrice: MAX_PRICE,
  propertyTypes: [],
  petTypes: [],
  amenities: [],
  petSize: "",
  maxPets: "",
  petFee: "",
};

const PROPERTY_TYPE_VALUES = new Set(PROPERTY_TYPES.map((type) => type.value));
// "perro-gato" is the combined chip value produced by PetTypeSelector.
const PET_TYPE_VALUES = new Set([...PET_TYPES.map((type) => type.value), "perro-gato"]);
const AMENITY_VALUES = new Set(AMENITIES.map((amenity) => amenity.value));
const PET_SIZE_VALUES = new Set(PET_SIZES.map((size) => size.value));
const PET_FEE_VALUES = new Set(PET_FEE_BUCKETS.map((bucket) => bucket.value));
const PRICE_BUCKET_VALUES = new Set(PRICE_BUCKETS.map((bucket) => bucket.value));

const parseCsv = (raw: string | null, valid: Set<string>): string[] => {
  if (!raw) return [];
  const values = raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value !== "" && valid.has(value));
  return Array.from(new Set(values));
};

// Malformed numeric params are ignored (S30): NaN, decimals and negatives
// do not survive as filter values.
const parseNonNegativeInt = (raw: string | null): number | undefined => {
  if (raw === null || raw.trim() === "") return undefined;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) return undefined;
  return value;
};

export const parseSearchFilters = (params: URLSearchParams): SearchFilters => {
  const precio = params.get("precio") ?? "";
  const minPrice = parseNonNegativeInt(params.get("min")) ?? 0;
  const maxPrice = parseNonNegativeInt(params.get("max")) ?? MAX_PRICE;
  const maxPetsRaw = params.get("mascotas_max");
  return {
    ubicacion: params.get("ubicacion") ?? "",
    precio: PRICE_BUCKET_VALUES.has(precio) ? precio : "",
    // A malformed range (min > max) is ignored wholesale (S30).
    minPrice: minPrice <= maxPrice ? minPrice : 0,
    maxPrice: minPrice <= maxPrice ? maxPrice : MAX_PRICE,
    propertyTypes: parseCsv(params.get("tipo"), PROPERTY_TYPE_VALUES),
    petTypes: parseCsv(params.get("mascota"), PET_TYPE_VALUES),
    amenities: parseCsv(params.get("comodidades"), AMENITY_VALUES),
    petSize: PET_SIZE_VALUES.has(params.get("tamano") ?? "") ? params.get("tamano")! : "",
    maxPets:
      maxPetsRaw !== null && parseNonNegativeInt(maxPetsRaw) !== undefined ? maxPetsRaw : "",
    petFee: PET_FEE_VALUES.has(params.get("pet_fee") ?? "") ? params.get("pet_fee")! : "",
  };
};

const setIfPresent = (params: URLSearchParams, key: string, value: string) => {
  if (value) params.set(key, value);
  else params.delete(key);
};

const setCsv = (params: URLSearchParams, key: string, values: string[]) => {
  if (values.length > 0) params.set(key, values.join(","));
  else params.delete(key);
};

// Serializes filter state into the given URLSearchParams (mutates and
// returns it). Default values are omitted so the URL stays clean.
export const writeSearchFilters = (
  params: URLSearchParams,
  filters: SearchFilters
): URLSearchParams => {
  setIfPresent(params, "ubicacion", filters.ubicacion);
  setIfPresent(params, "precio", filters.precio);
  setIfPresent(params, "min", filters.minPrice > 0 ? String(filters.minPrice) : "");
  setIfPresent(params, "max", filters.maxPrice < MAX_PRICE ? String(filters.maxPrice) : "");
  setCsv(params, "tipo", filters.propertyTypes);
  setCsv(params, "mascota", filters.petTypes);
  setCsv(params, "comodidades", filters.amenities);
  setIfPresent(params, "tamano", filters.petSize);
  setIfPresent(params, "mascotas_max", filters.maxPets);
  setIfPresent(params, "pet_fee", filters.petFee);
  return params;
};
