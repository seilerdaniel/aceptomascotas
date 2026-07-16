import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { logAdminAction } from "@/lib/adminActionLog";

export const useIsAdmin = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }

      return !!data;
    },
    enabled: !!user,
  });
};

export const useContactMessages = () => {
  return useQuery({
    queryKey: ["contact-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    },
  });
};

export const useDeleteContactMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_messages")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["contact-messages"] });
      logAdminAction({ action: "delete_contact_message", targetTable: "contact_messages", targetId: id });
    },
  });
};

export const useAllProperties = () => {
  return useQuery({
    queryKey: ["admin-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const properties = data || [];

      // properties.user_id and profiles.user_id both point to auth.users
      // independently (no direct FK between the two tables), so PostgREST
      // can't embed this as a join — fetch owner profiles separately and
      // merge client-side instead.
      const ownerIds = [...new Set(properties.map((p: any) => p.user_id).filter(Boolean))];
      let profilesById: Record<string, { full_name: string | null; user_type: string | null }> = {};

      if (ownerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name, user_type")
          .in("user_id", ownerIds);

        profilesById = Object.fromEntries(
          (profilesData || []).map((p: any) => [p.user_id, { full_name: p.full_name, user_type: p.user_type }])
        );
      }

      return properties.map((p: any) => ({
        ...p,
        owner_full_name: p.user_id ? profilesById[p.user_id]?.full_name ?? null : null,
        owner_user_type: p.user_id ? profilesById[p.user_id]?.user_type ?? null : null,
      }));
    },
  });
};

export const useTogglePropertyActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("properties")
        .update({ is_active })
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: (_data, { id, is_active }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      queryClient.invalidateQueries({ queryKey: ["admin-properties-page"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      // Without this, the owner's own "Mis Propiedades" tab kept showing
      // stale active/inactive state within the same browser session.
      queryClient.invalidateQueries({ queryKey: ["user-properties"] });
      logAdminAction({
        action: is_active ? "activate_property" : "deactivate_property",
        targetTable: "properties",
        targetId: id,
      });
    },
  });
};

export const useDeleteProperty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      queryClient.invalidateQueries({ queryKey: ["admin-properties-page"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["user-properties"] });
      logAdminAction({ action: "delete_property", targetTable: "properties", targetId: id });
    },
  });
};

export const useAllProfiles = () => {
  return useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    },
  });
};

export const useToggleProfileVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isVerified }: { id: string; isVerified: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_verified: isVerified })
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: (_data, { id, isVerified }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-page"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      // Broad match: invalidates ["profile", anyUserId] too, which is what
      // ProfilePage's Resumen tab reads — without this, the agency's own
      // session kept showing "no verificada" until a hard refresh/relogin.
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      logAdminAction({
        action: isVerified ? "verify_profile" : "unverify_profile",
        targetTable: "profiles",
        targetId: id,
      });
    },
  });
};

export const usePropertyReports = () => {
  return useQuery({
    queryKey: ["property-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_reports")
        .select("*, properties(title)")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    },
  });
};

export const useUpdatePropertyReportStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "pending" | "reviewed" | "dismissed";
    }) => {
      const { error } = await supabase
        .from("property_reports")
        .update({ status })
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: (_data, { id, status }) => {
      queryClient.invalidateQueries({ queryKey: ["property-reports"] });
      logAdminAction({
        action: "update_report_status",
        targetTable: "property_reports",
        targetId: id,
        details: { status },
      });
    },
  });
};

export const useDeletePropertyReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("property_reports")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["property-reports"] });
      logAdminAction({ action: "delete_property_report", targetTable: "property_reports", targetId: id });
    },
  });
};

export const useAllServices = () => {
  return useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pet_services")
        .select("*")
        .order("is_approved", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    },
  });
};

export const useTogglePropertyVerified = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isVerified }: { id: string; isVerified: boolean }) => {
      const { error } = await supabase
        .from("properties")
        .update({ property_is_verified: isVerified })
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: (_data, { id, isVerified }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      queryClient.invalidateQueries({ queryKey: ["admin-properties-page"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["user-properties"] });
      logAdminAction({
        action: isVerified ? "verify_property" : "unverify_property",
        targetTable: "properties",
        targetId: id,
      });
    },
  });
};

export const useToggleServiceVerified = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isVerified }: { id: string; isVerified: boolean }) => {
      const { error } = await supabase
        .from("pet_services")
        .update({ is_verified: isVerified } as any)
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["admin-services-page"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["user-services"] });
    },
  });
};

export const useToggleServiceApproval = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isApproved }: { id: string; isApproved: boolean }) => {
      const { error } = await supabase
        .from("pet_services")
        .update({ is_approved: isApproved })
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: (_data, { id, isApproved }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["admin-services-page"] });
      queryClient.invalidateQueries({ queryKey: ["admin-services-pending-count"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["user-services"] });
      logAdminAction({
        action: isApproved ? "approve_service" : "unapprove_service",
        targetTable: "pet_services",
        targetId: id,
      });
    },
  });
};

export const useAllAds = () => {
  return useQuery({
    queryKey: ["admin-ads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("advertisements" as any)
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as any[];
    },
  });
};

export const useCreateAd = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ad: {
      advertiser_name: string;
      image_url: string;
      link_url?: string | null;
      alt_text: string;
      sort_order?: number;
    }) => {
      const { error } = await supabase.from("advertisements" as any).insert(ad as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ads"] });
      queryClient.invalidateQueries({ queryKey: ["active-ads"] });
    },
  });
};

export const useUpdateAd = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("advertisements" as any).update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ads"] });
      queryClient.invalidateQueries({ queryKey: ["active-ads"] });
    },
  });
};

export const useDeleteAd = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("advertisements" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["admin-ads"] });
      queryClient.invalidateQueries({ queryKey: ["active-ads"] });
      logAdminAction({ action: "delete_ad", targetTable: "advertisements", targetId: id });
    },
  });
};