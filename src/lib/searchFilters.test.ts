import {
  DEFAULT_SEARCH_FILTERS,
  parseSearchFilters,
  writeSearchFilters,
} from "./searchFilters";
import { MAX_PRICE } from "@/data/taxonomy";

describe("parseSearchFilters", () => {
  it("parses the full URL contract into filter state (S27/S28)", () => {
    const filters = parseSearchFilters(
      new URLSearchParams(
        "ubicacion=Palermo&precio=150000&min=50000&max=300000&tipo=casa,ph&mascota=perro&tamano=grande&mascotas_max=2&pet_fee=5000&comodidades=balcon,jardin"
      )
    );

    expect(filters).toEqual({
      ubicacion: "Palermo",
      precio: "150000",
      minPrice: 50000,
      maxPrice: 300000,
      propertyTypes: ["casa", "ph"],
      petTypes: ["perro"],
      amenities: ["balcon", "jardin"],
      petSize: "grande",
      maxPets: "2",
      petFee: "5000",
    });
  });

  it("keeps the perro-gato combined pet type value", () => {
    const filters = parseSearchFilters(new URLSearchParams("mascota=perro-gato"));
    expect(filters.petTypes).toEqual(["perro-gato"]);
  });

  it("ignores malformed and unknown values with defaults (S30)", () => {
    const filters = parseSearchFilters(
      new URLSearchParams(
        "min=abc&max=-5&tipo=castle,xyz&mascota=unicornio&tamano=kolossal&mascotas_max=two&pet_fee=-1&precio=99999999"
      )
    );

    expect(filters).toEqual(DEFAULT_SEARCH_FILTERS);
  });

  it("ignores a malformed price range (min > max) wholesale (S30)", () => {
    const filters = parseSearchFilters(new URLSearchParams("min=400000&max=10000"));
    expect(filters.minPrice).toBe(0);
    expect(filters.maxPrice).toBe(MAX_PRICE);
  });

  it("deduplicates csv values and drops empty segments", () => {
    const filters = parseSearchFilters(new URLSearchParams("tipo=casa,casa,,ph"));
    expect(filters.propertyTypes).toEqual(["casa", "ph"]);
  });
});

describe("writeSearchFilters", () => {
  it("serializes filters to the URL contract, omitting defaults (S27)", () => {
    const params = new URLSearchParams();
    writeSearchFilters(params, {
      ...DEFAULT_SEARCH_FILTERS,
      ubicacion: "Palermo",
      minPrice: 50000,
      maxPrice: 300000,
      propertyTypes: ["casa", "ph"],
      amenities: ["balcon"],
      petSize: "grande",
      maxPets: "2",
      petFee: "5000",
    });

    expect(params.get("ubicacion")).toBe("Palermo");
    expect(params.get("min")).toBe("50000");
    expect(params.get("max")).toBe("300000");
    expect(params.get("tipo")).toBe("casa,ph");
    expect(params.get("comodidades")).toBe("balcon");
    expect(params.get("tamano")).toBe("grande");
    expect(params.get("mascotas_max")).toBe("2");
    expect(params.get("pet_fee")).toBe("5000");
    expect(params.has("precio")).toBe(false);
    expect(params.has("mascota")).toBe(false);
  });

  it("removes params when filters return to defaults", () => {
    const params = new URLSearchParams("min=50000&tipo=casa&ubicacion=Palermo");
    writeSearchFilters(params, DEFAULT_SEARCH_FILTERS);
    expect(params.has("min")).toBe(false);
    expect(params.has("tipo")).toBe(false);
    expect(params.has("ubicacion")).toBe(false);
  });

  it("round-trips: parse(write(filters)) restores identical state", () => {
    const filters = {
      ...DEFAULT_SEARCH_FILTERS,
      ubicacion: "CABA",
      precio: "150000",
      minPrice: 10000,
      maxPrice: 400000,
      propertyTypes: ["casa"],
      petTypes: ["perro", "gato"],
      amenities: ["terraza", "jardin"],
      petSize: "mediano",
      maxPets: "3",
      petFee: "10000",
    };
    const params = writeSearchFilters(new URLSearchParams(), filters);
    expect(parseSearchFilters(params)).toEqual(filters);
  });
});
