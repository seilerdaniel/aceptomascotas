import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Advertisement {
  id: string;
  advertiser_name: string;
  image_url: string;
  link_url: string | null;
  alt_text: string;
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export const useActiveAds = () => {
  return useQuery({
    queryKey: ["active-ads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("advertisements" as any)
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as Advertisement[];
    },
    staleTime: 5 * 60 * 1000,
  });
};
