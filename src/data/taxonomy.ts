// Single source of truth for property taxonomy (spec F1). Every filter and
// publish component sources its options from here — no duplicated literal
// arrays stay in components (spec S1).
//
// Values follow the database enums/columns so they can be used directly in
// Supabase queries; labels are the user-facing Spanish copy.

export interface TaxonomyOption {
  value: string;
  label: string;
}

export const PROPERTY_TYPES: TaxonomyOption[] = [
  { value: "departamento", label: "Departamento" },
  { value: "casa", label: "Casa" },
  { value: "ph", label: "PH" },
  { value: "loft", label: "Loft" },
  { value: "monoambiente", label: "Monoambiente" },
];

export const PET_TYPES: TaxonomyOption[] = [
  { value: "perro", label: "Perro" },
  { value: "gato", label: "Gato" },
  { value: "aves", label: "Aves" },
  { value: "peces", label: "Peces" },
  { value: "otros", label: "Otros" },
];

export const PET_SIZES: TaxonomyOption[] = [
  { value: "pequeno", label: "Pequeño" },
  { value: "mediano", label: "Mediano" },
  { value: "grande", label: "Grande" },
];

// Pet-fee filter buckets: each is a single "up to" value — the server
// applies `lte` against pet_fee. "0" means free-only (Sin cargo).
export const PET_FEE_BUCKETS: TaxonomyOption[] = [
  { value: "0", label: "Sin cargo" },
  { value: "5000", label: "Hasta $5.000" },
  { value: "10000", label: "Hasta $10.000" },
  { value: "15000", label: "Hasta $15.000" },
  { value: "20000", label: "Hasta $20.000" },
];

export const AMENITIES: TaxonomyOption[] = [
  { value: "balcon", label: "Balcón" },
  { value: "terraza", label: "Terraza" },
  { value: "jardin", label: "Jardín" },
  { value: "cochera", label: "Cochera" },
  { value: "pileta", label: "Pileta" },
  { value: "parrilla", label: "Parrilla" },
  { value: "gimnasio", label: "Gimnasio" },
  { value: "seguridad", label: "Seguridad 24hs" },
];

// Monthly rent buckets used by the simple "Precio máx." select on SearchBar
// and SearchPage.
export const PRICE_BUCKETS: TaxonomyOption[] = [
  { value: "50000", label: "Hasta $50.000" },
  { value: "100000", label: "Hasta $100.000" },
  { value: "150000", label: "Hasta $150.000" },
  { value: "200000", label: "Hasta $200.000" },
  { value: "300000", label: "Hasta $300.000" },
  { value: "500000", label: "Hasta $500.000" },
];

// Ceiling of the advanced price slider — derived from the top price bucket
// so both controls always agree.
export const MAX_PRICE = Number(PRICE_BUCKETS[PRICE_BUCKETS.length - 1].value);
