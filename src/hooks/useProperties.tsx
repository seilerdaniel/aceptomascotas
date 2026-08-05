import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export type Property = Tables<"properties">;

// Counts are aggregate-only (no PII), so this calls a SECURITY DEFINER
// RPC to safely read past the profiles table's owner-only RLS policy.
export const usePlatformStats = () => {
  return useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_platform_stats");
      if (error) throw error;
      const stats = Array.isArray(data) ? data[0] : data;
      return {
        properties: stats?.properties_count ?? 0,
        searchers: stats?.searchers_count ?? 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes, no need to refetch constantly
  });
};

export interface PropertyFilters {
  location?: string;
  maxPrice?: number;
  minPrice?: number;
  // Selección simple de la barra de filtros (un solo valor) y selección
  // múltiple del panel de filtros avanzados: se combinan en una sola
  // lista antes de armar la query (ver combineFilterValues).
  propertyType?: string;
  propertyTypes?: string[];
  petType?: string;
  petTypes?: string[];
  // Pet-friendly attributes (spec F3): petFee applies `lte`, maxPets `lte`,
  // petSize `eq` and amenities `overlaps` (partial match, S7). All of them
  // run server-side against properties_public, before range() pagination.
  petSize?: string;
  maxPets?: number;
  petFee?: number;
  amenities?: string[];
  page?: number;
  pageSize?: number;
}

export interface PropertiesPage {
  rows: Property[];
  totalCount: number;
  pageCount: number;
}

const DEFAULT_PAGE_SIZE = 12;

// Combina el filtro simple (un valor) con el avanzado (varios), sin
// duplicar el mismo valor dos veces si el usuario tocó ambos controles.
const combineFilterValues = (single?: string, multiple?: string[]): string[] => {
  const values = new Set(multiple ?? []);
  if (single) values.add(single);
  return Array.from(values);
};

// Pure, unit-testable description of the WHERE predicates that useProperties
// applies (spec F3/S6/S7). Pagination (range) is applied separately, after
// the predicates, so totals stay correct — buildPropertyQuery never emits a
// range predicate.
export type PropertyQueryPredicate =
  | { op: "ilike"; column: "location"; value: string }
  | { op: "lte"; column: "price" | "pet_fee" | "max_pets"; value: number }
  | { op: "gte"; column: "price"; value: number }
  | { op: "in"; column: "property_type"; value: string[] }
  | { op: "eq"; column: "pet_size"; value: string }
  | { op: "contains"; column: "pet_types"; value: string[] }
  | { op: "overlaps"; column: "pet_types" | "amenities"; value: string[] };

export const buildPropertyQuery = (filters?: PropertyFilters): PropertyQueryPredicate[] => {
  const predicates: PropertyQueryPredicate[] = [];

  if (filters?.location) {
    predicates.push({ op: "ilike", column: "location", value: `%${filters.location}%` });
  }

  if (filters?.maxPrice) {
    predicates.push({ op: "lte", column: "price", value: filters.maxPrice });
  }

  if (filters?.minPrice) {
    predicates.push({ op: "gte", column: "price", value: filters.minPrice });
  }

  const propertyTypes = combineFilterValues(filters?.propertyType, filters?.propertyTypes);
  if (propertyTypes.length > 0) {
    predicates.push({ op: "in", column: "property_type", value: propertyTypes });
  }

  // "perro-gato" significa "acepta ambos", no un valor literal en el
  // array pet_types (que solo contiene "perro" y/o "gato" por
  // separado). "todas" no filtra nada.
  const petTypes = combineFilterValues(
    filters?.petType && filters.petType !== "todas" ? filters.petType : undefined,
    filters?.petTypes
  );
  if (petTypes.includes("perro-gato")) {
    predicates.push({ op: "contains", column: "pet_types", value: ["perro", "gato"] });
  } else if (petTypes.length > 0) {
    // .overlaps() matchea si el array de la propiedad comparte AL
    // MENOS UNO de los tipos pedidos (a diferencia de .contains(),
    // que exigiría tenerlos todos).
    predicates.push({ op: "overlaps", column: "pet_types", value: petTypes });
  }

  // Pet-friendly predicates (F3/S6/S7): "up to" buckets map to lte, pet size
  // to eq, and amenities to overlaps so a property matching at least one
  // selected amenity qualifies.
  if (filters?.petFee !== undefined && filters.petFee !== null) {
    predicates.push({ op: "lte", column: "pet_fee", value: filters.petFee });
  }
  if (filters?.maxPets !== undefined && filters.maxPets !== null) {
    predicates.push({ op: "lte", column: "max_pets", value: filters.maxPets });
  }
  if (filters?.petSize) {
    predicates.push({ op: "eq", column: "pet_size", value: filters.petSize });
  }
  if (filters?.amenities && filters.amenities.length > 0) {
    predicates.push({ op: "overlaps", column: "amenities", value: filters.amenities });
  }

  return predicates;
};

const buildBaseQuery = () =>
  supabase
    .from("properties_public")
    .select("*", { count: "exact" })
    .eq("is_active", true)
    .order("created_at", { ascending: false });

// Applies the pure predicates onto the live query builder. Column and value
// are widened through `never` because supabase-js constrains them to the
// view's generated types, which the descriptors already respect.
const applyPredicate = (
  query: ReturnType<typeof buildBaseQuery>,
  predicate: PropertyQueryPredicate
) => {
  const column = predicate.column as never;
  switch (predicate.op) {
    case "ilike":
      return query.ilike(column, predicate.value as never);
    case "lte":
      return query.lte(column, predicate.value as never);
    case "gte":
      return query.gte(column, predicate.value as never);
    case "in":
      return query.in(column, predicate.value as never);
    case "eq":
      return query.eq(column, predicate.value as never);
    case "contains":
      return query.contains(column, predicate.value as never);
    case "overlaps":
      return query.overlaps(column, predicate.value as never);
  }
};

// Use the public view that masks contact info for unauthenticated users.
// Todo el filtrado (incluidos los que antes se aplicaban del lado del
// cliente en SearchPage) vive acá para que la paginación con range() sea
// correcta — si algún filtro se aplicara después de traer la página,
// una página podría mostrar menos resultados de los que en realidad hay.
export const useProperties = (filters?: PropertyFilters) => {
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? DEFAULT_PAGE_SIZE;

  return useQuery({
    queryKey: ["properties", filters],
    queryFn: async (): Promise<PropertiesPage> => {
      let query = buildBaseQuery();

      for (const predicate of buildPropertyQuery(filters)) {
        query = applyPredicate(query, predicate);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      const totalCount = count ?? 0;
      return {
        // properties_public is a projection of `properties` that masks
        // contact PII; its row type differs slightly from Property (no
        // agency_id / owner_is_agency), so cast through unknown.
        rows: (data || []) as unknown as Property[],
        totalCount,
        pageCount: Math.max(1, Math.ceil(totalCount / pageSize)),
      };
    },
  });
};

// Use the public view that masks contact info for unauthenticated users
export const useProperty = (id: string) => {
  return useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties_public")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      // See above: properties_public row shape ≠ Property; cast through unknown.
      return data as unknown as Property | null;
    },
    enabled: !!id,
  });
};

// Use the public view that masks contact info for unauthenticated users
export const useFeaturedProperties = (limit = 6) => {
  return useQuery({
    queryKey: ["featured-properties", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties_public")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      // See above: properties_public row shape ≠ Property; cast through unknown.
      return (data || []) as unknown as Property[];
    },
  });
};
