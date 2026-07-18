import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AdminActionLogEntry } from "@/types/admin";

const PAGE_SIZE = 25;

const ACTION_LABELS: Record<string, string> = {
  delete_contact_message: "Eliminó mensaje de contacto",
  activate_property: "Activó propiedad",
  deactivate_property: "Desactivó propiedad",
  delete_property: "Eliminó propiedad",
  verify_profile: "Verificó perfil",
  unverify_profile: "Quitó verificación de perfil",
  update_report_status: "Actualizó estado de reporte",
  delete_property_report: "Eliminó reporte",
  verify_property: "Verificó propiedad",
  unverify_property: "Quitó verificación de propiedad",
  approve_service: "Aprobó servicio",
  unapprove_service: "Quitó aprobación de servicio",
  delete_service: "Eliminó servicio",
  delete_ad: "Eliminó anuncio",
};

export const getActionLabel = (action: string): string => ACTION_LABELS[action] ?? action;

export const useAdminActionLog = () => {
  const [limit, setLimit] = useState(PAGE_SIZE);

  const query = useQuery({
    queryKey: ["admin-action-log", limit],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from("admin_action_log")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(0, limit - 1);

      if (error) throw error;

      const rows = data || [];
      const adminIds = [...new Set(rows.map((r) => r.admin_user_id).filter(Boolean))];
      let namesById: Record<string, string | null> = {};

      if (adminIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", adminIds);

        namesById = Object.fromEntries((profilesData || []).map((p) => [p.user_id, p.full_name]));
      }

      return {
        rows: rows.map(
          (r): AdminActionLogEntry => ({
            ...r,
            admin_full_name: namesById[r.admin_user_id] ?? null,
          })
        ),
        totalCount: count ?? 0,
      };
    },
  });

  return {
    ...query,
    loadMore: () => setLimit((l) => l + PAGE_SIZE),
    hasMore: (query.data?.totalCount ?? 0) > limit,
  };
};
