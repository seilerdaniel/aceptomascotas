import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type PropertyReview = Tables<"property_reviews">;

// Pet-centric review dimensions (R3/S16): the three axes collected with a
// property review and rendered as structured badges by PropertyReviews.
export interface PetDimensions {
  pet_friendliness?: number | null;
  space?: number | null;
  owner_responsiveness?: number | null;
}

export const usePropertyReviews = (propertyId: string) => {
  return useQuery({
    queryKey: ["property-reviews", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_reviews")
        .select("*")
        .eq("property_id", propertyId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []) as PropertyReview[];
    },
    enabled: !!propertyId,
  });
};

export const usePropertyRating = (propertyId: string) => {
  return useQuery({
    queryKey: ["property-ratings", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_ratings")
        .select("*")
        .eq("property_id", propertyId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as {
        property_id: string | null;
        review_count: number | null;
        average_rating: number | null;
      } | null;
    },
    enabled: !!propertyId,
  });
};

export const useCreatePropertyReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (review: {
      property_id: string;
      user_name: string;
      rating: number;
      comment?: string;
      pet_dimensions?: PetDimensions;
      user_id?: string;
    }) => {
      // Use the same edge function as service reviews: it applies the 3/24h
      // rate limit, rejects duplicates and forces is_approved = false.
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            ...(review.user_id
              ? {
                  Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                }
              : {}),
          },
          body: JSON.stringify({
            property_id: review.property_id,
            user_name: review.user_name,
            rating: review.rating,
            comment: review.comment,
            pet_dimensions: review.pet_dimensions ?? null,
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
      queryClient.invalidateQueries({ queryKey: ["property-reviews", variables.property_id] });
      queryClient.invalidateQueries({ queryKey: ["property-ratings", variables.property_id] });
    },
  });
};
