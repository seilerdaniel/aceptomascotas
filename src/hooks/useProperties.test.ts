import { buildPropertyQuery } from "./useProperties";

describe("buildPropertyQuery (F3/S6/S7)", () => {
  it("applies pet_size eq and max_pets lte together (S6)", () => {
    const predicates = buildPropertyQuery({ petSize: "grande", maxPets: 2 });

    expect(predicates).toContainEqual({ op: "eq", column: "pet_size", value: "grande" });
    expect(predicates).toContainEqual({ op: "lte", column: "max_pets", value: 2 });
  });

  it("applies pet_fee lte and amenities overlaps (S7)", () => {
    const predicates = buildPropertyQuery({ petFee: 5000, amenities: ["balcon", "jardin"] });

    expect(predicates).toContainEqual({ op: "lte", column: "pet_fee", value: 5000 });
    expect(predicates).toContainEqual({
      op: "overlaps",
      column: "amenities",
      value: ["balcon", "jardin"],
    });
  });

  it("matches properties overlapping at least one selected amenity (partial match, S7)", () => {
    const predicates = buildPropertyQuery({ amenities: ["pileta", "parrilla"] });

    const overlaps = predicates.find(
      (predicate) => predicate.op === "overlaps" && predicate.column === "amenities"
    );
    expect(overlaps).toBeDefined();
  });

  it("never emits a range/pagination predicate — pagination stays untouched (S6)", () => {
    const predicates = buildPropertyQuery({ page: 3, pageSize: 12 });

    // The predicate type cannot even express pagination; assert at runtime
    // that no range-like op shows up and that empty filters push nothing.
    expect(predicates.map((predicate) => predicate.op)).not.toContain("range");
    expect(predicates).toHaveLength(0);
  });

  it("keeps the existing location/price/property type/pet type predicates (regression)", () => {
    const predicates = buildPropertyQuery({
      location: "Palermo",
      maxPrice: 200000,
      minPrice: 50000,
      propertyTypes: ["casa"],
      petTypes: ["perro", "gato"],
    });

    expect(predicates).toContainEqual({ op: "ilike", column: "location", value: "%Palermo%" });
    expect(predicates).toContainEqual({ op: "lte", column: "price", value: 200000 });
    expect(predicates).toContainEqual({ op: "gte", column: "price", value: 50000 });
    expect(predicates).toContainEqual({ op: "in", column: "property_type", value: ["casa"] });
    expect(predicates).toContainEqual({
      op: "overlaps",
      column: "pet_types",
      value: ["perro", "gato"],
    });
  });

  it("combines simple + advanced property type values without duplicates", () => {
    const predicates = buildPropertyQuery({ propertyType: "casa", propertyTypes: ["casa", "ph"] });

    expect(predicates).toContainEqual({ op: "in", column: "property_type", value: ["casa", "ph"] });
  });

  it("omits pet predicates when no pet filters are provided", () => {
    const predicates = buildPropertyQuery({ location: "CABA" });

    const petPredicates = predicates.filter(
      (predicate) =>
        predicate.column === "pet_fee" ||
        predicate.column === "max_pets" ||
        predicate.column === "pet_size" ||
        predicate.column === "amenities"
    );
    expect(petPredicates).toHaveLength(0);
  });
});
