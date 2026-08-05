import {
  PROPERTY_TYPES,
  PET_TYPES,
  PET_SIZES,
  PET_FEE_BUCKETS,
  AMENITIES,
  PRICE_BUCKETS,
  MAX_PRICE,
} from "./taxonomy";

describe("taxonomy contract (F1/S1)", () => {
  const optionSets = [
    PROPERTY_TYPES,
    PET_TYPES,
    PET_SIZES,
    PET_FEE_BUCKETS,
    AMENITIES,
    PRICE_BUCKETS,
  ];

  it("defines non-empty value+label options for every set", () => {
    for (const set of optionSets) {
      expect(set.length).toBeGreaterThan(0);
      for (const option of set) {
        expect(option.value).toBeTruthy();
        expect(option.label).toBeTruthy();
      }
    }
  });

  it("lists unique option values per set", () => {
    for (const set of optionSets) {
      const values = set.map((option) => option.value);
      expect(new Set(values).size).toBe(values.length);
    }
  });

  it("covers the five property types used across the app", () => {
    expect(PROPERTY_TYPES.map((type) => type.value)).toEqual([
      "departamento",
      "casa",
      "ph",
      "loft",
      "monoambiente",
    ]);
  });

  it("covers the pet sizes pequeno/mediano/grande", () => {
    expect(PET_SIZES.map((size) => size.value)).toEqual([
      "pequeno",
      "mediano",
      "grande",
    ]);
  });

  it("sources the pet type options from taxonomy", () => {
    expect(PET_TYPES.map((type) => type.value)).toEqual([
      "perro",
      "gato",
      "aves",
      "peces",
      "otros",
    ]);
  });

  it("exposes MAX_PRICE matching the top price bucket", () => {
    const topBucket = Number(PRICE_BUCKETS[PRICE_BUCKETS.length - 1].value);
    expect(MAX_PRICE).toBe(topBucket);
    expect(MAX_PRICE).toBe(500000);
  });
});
