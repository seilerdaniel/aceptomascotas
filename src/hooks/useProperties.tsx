import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export type Property = Tables<"properties">;

export interface PropertyFilters {
  location?: string;
  maxPrice?: number;
  propertyType?: string;
  petType?: string;
  minPrice?: number;
}

// Use the public view that masks contact info for unauthenticated users
export const useProperties = (filters?: PropertyFilters) => {
  return useQuery({
    queryKey: ["properties", filters],
    queryFn: async () => {
      let query = supabase
        .from("properties_public")
        .select("*")
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

      if (filters?.propertyType) {
        const propType = filters.propertyType.toLowerCase() as "departamento" | "casa" | "ph" | "loft" | "monoambiente";
        query = query.eq("property_type", propType);
      }

      if (filters?.petType && filters.petType !== "todas") {
        query = query.contains("pet_types", [filters.petType]);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []) as Property[];
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