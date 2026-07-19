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
  // lista antes de armar la query (ver buildPropertyTypeList/buildPetTypeList).
  propertyType?: string;
  propertyTypes?: string[];
  petType?: string;
  petTypes?: string[];
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
      let query = supabase
        .from("properties_public")
        .select("*", { count: "exact" })
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (filters?.location) {
        query = query.ilike("location", `%${filters.location}%`);
      }

      if (filters?.maxPrice) {
        query = query.lte("price", filters.maxPrice);
      }

      if (filters?.minPrice) {
        query = query.gte("price", filters.minPrice);
      }

      const propertyTypes = combineFilterValues(filters?.propertyType, filters?.propertyTypes);
      if (propertyTypes.length > 0) {
        query = query.in(
          "property_type",
          propertyTypes as ("departamento" | "casa" | "ph" | "loft" | "monoambiente")[]
        );
      }

      // "perro-gato" significa "acepta ambos", no un valor literal en el
      // array pet_types (que solo contiene "perro" y/o "gato" por
      // separado). "todas" no filtra nada.
      const petTypes = combineFilterValues(
        filters?.petType && filters.petType !== "todas" ? filters.petType : undefined,
        filters?.petTypes
      );
      if (petTypes.includes("perro-gato")) {
        query = query.contains("pet_types", ["perro", "gato"]);
      } else if (petTypes.length > 0) {
        // .overlaps() matchea si el array de la propiedad comparte AL
        // MENOS UNO de los tipos pedidos (a diferencia de .contains(),
        // que exigiría tenerlos todos).
        query = query.overlaps("pet_types", petTypes);
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
        rows: (data || []) as Property[],
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

      return data as Property | null;
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

      return (data || []) as Property[];
    },
  });
};