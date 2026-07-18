import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, Enums } from "@/integrations/supabase/types";
import { logAdminAction } from "@/lib/adminActionLog";

export type PetService = Tables<"pet_services">;
export type ServiceReview = Tables<"service_reviews">;
export type ServiceCategory = Enums<"service_category">;

export interface ServiceFilters {
  category?: ServiceCategory;
  city?: string;
  neighborhood?: string;
  is24h?: boolean;
  searchText?: string;
}

export const SERVICE_CATEGORIES: { value: ServiceCategory; label: string; icon: string }[] = [
  { value: "veterinaria", label: "Veterinarias", icon: "Stethoscope" },
  { value: "veterinaria_24h", label: "Veterinarias 24 hs", icon: "Clock" },
  { value: "seguro", label: "Seguros para mascotas", icon: "Shield" },
  { value: "guarderia", label: "Guarderías / Daycare", icon: "Home" },
  { value: "adiestrador", label: "Adiestradores", icon: "GraduationCap" },
  { value: "paseador", label: "Paseadores", icon: "Footprints" },
  { value: "mudanza", label: "Mudanzas Pet-Friendly", icon: "Truck" },
  { value: "ong_refugio", label: "ONGs y Refugios", icon: "Heart" },
  { value: "peluqueria", label: "Peluquerías", icon: "Scissors" },
  { value: "tienda", label: "Tiendas", icon: "Store" },
];

export const getCategoryLabel = (category: ServiceCategory): string => {
  return SERVICE_CATEGORIES.find((c) => c.value === category)?.label || category;
};

export const useServices = (filters?: ServiceFilters) => {
  return useQuery({
    queryKey: ["services", filters],
    queryFn: async () => {
      let query = supabase
        .from("pet_services")
        .select("*")
        .eq("is_active", true)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (filters?.category) {
        query = query.eq("category", filters.category);
      }

      if (filters?.city) {
        query = query.ilike("city", `%${filters.city}%`);
      }

      if (filters?.neighborhood) {
        query = query.ilike("neighborhood", `%${filters.neighborhood}%`);
      }

      if (filters?.is24h) {
        query = query.eq("is_24h", true);
      }

      if (filters?.searchText) {
        query = query.or(
          `name.ilike.%${filters.searchText}%,description.ilike.%${filters.searchText}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []) as PetService[];
    },
  });
};

export const useService = (id: string) => {
  return useQuery({
    queryKey: ["service", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pet_services")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as PetService | null;
    },
    enabled: !!id,
  });
};

export const useServiceReviews = (serviceId: string) => {
  return useQuery({
    queryKey: ["service-reviews", serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_reviews")
        .select("*")
        .eq("service_id", serviceId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []) as ServiceReview[];
    },
    enabled: !!serviceId,
  });
};

export const useServiceRating = (serviceId: string) => {
  return useQuery({
    queryKey: ["service-rating", serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_ratings")
        .select("*")
        .eq("service_id", serviceId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as { service_id: string; review_count: number; average_rating: number } | null;
    },
    enabled: !!serviceId,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (review: {
      service_id: string;
      user_name: string;
      rating: number;
      comment?: string;
      user_id?: string;
    }) => {
      // Use edge function for rate-limited review submission
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            ...(review.user_id ? {
              "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            } : {}),
          },
          body: JSON.stringify({
            service_id: review.service_id,
            user_name: review.user_name,
            rating: review.rating,
            comment: review.comment,
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Error al enviar la reseña");
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["service-reviews", variables.service_id] });
      queryClient.invalidateQueries({ queryKey: ["service-rating", variables.service_id] });
    },
  });
};

export const useCreateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: {
      name: string;
      category: ServiceCategory;
      description: string;
      city: string;
      neighborhood?: string;
      address?: string;
      phone?: string;
      whatsapp?: string;
      email?: string;
      website?: string;
      instagram?: string;
      facebook?: string;
      is_24h?: boolean;
      user_id?: string | null;
      images?: string[];
      opening_hours?: Record<string, string>;
      latitude?: number | null;
      longitude?: number | null;
      is_active?: boolean;
      banner_url?: string | null;
      logo_url?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("pet_services")
        .insert({
          name: service.name,
          category: service.category,
          description: service.description || null,
          city: service.city,
          neighborhood: service.neighborhood || null,
          address: service.address || null,
          phone: service.phone || null,
          whatsapp: service.whatsapp || null,
          email: service.email || null,
          website: service.website || null,
          instagram: service.instagram || null,
          facebook: service.facebook || null,
          is_24h: service.is_24h || false,
          user_id: service.user_id || null,
          images: service.images || [],
          opening_hours: service.opening_hours || {},
          latitude: service.latitude || null,
          longitude: service.longitude || null,
          is_active: true,
          is_approved: false,
          banner_url: service.banner_url || null,
          logo_url: service.logo_url || null,
        } as any)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
};

export const useFeaturedServices = (limit = 6) => {
  return useQuery({
    queryKey: ["featured-services", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pet_services")
        .select("*")
        .eq("is_active", true)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (data || []) as PetService[];
    },
  });
};

// Services belonging to the current user, regardless of approval status,
// so they can see and manage what they've submitted (RLS already allows
// owners to view their own rows even when not yet approved).
export const useUserServices = (userId?: string) => {
  return useQuery({
    queryKey: ["user-services", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("pet_services")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as PetService[];
    },
    enabled: !!userId,
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PetService> }) => {
      const { error } = await supabase.from("pet_services").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-services"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["admin-services-page"] });
    },
  });
};

export const useToggleServiceActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("pet_services")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-services"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["admin-services-page"] });
    },
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pet_services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["user-services"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["admin-services-page"] });
      queryClient.invalidateQueries({ queryKey: ["admin-services-pending-count"] });
      // Se usa tanto para que un proveedor borre su propio servicio como
      // para que un admin lo borre desde el panel. logAdminAction() solo
      // deja rastro si quien llama es realmente admin (lo verifica la
      // policy de RLS de admin_action_log); si es el dueño borrando su
      // propio servicio, el insert del log falla silenciosamente y no
      // pasa nada — no hace falta distinguir el caso acá.
      logAdminAction({ action: "delete_service", targetTable: "pet_services", targetId: id });
    },
  });
};
