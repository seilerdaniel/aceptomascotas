import type { Tables } from "@/integrations/supabase/types";

// Reutiliza los tipos ya generados por Supabase (Tables<'x'>) como base,
// extendiéndolos solo con los campos que se calculan/joinean del lado del
// cliente (ej. owner_full_name, admin_full_name) — no se redefine nada
// que la DB ya tipa correctamente.

export type AdminContactMessage = Tables<"contact_messages">;

export type ReportStatus = "pending" | "reviewed" | "dismissed";

export type AdminPropertyReport = Omit<Tables<"property_reports">, "status"> & {
  status: ReportStatus;
  // Viene del join `.select("*, properties(title)")` en usePropertyReports.
  // Puede ser null si la propiedad reportada ya fue eliminada.
  properties: { title: string } | null;
};

export type AdminService = Tables<"pet_services">;

export type AdminProperty = Tables<"properties"> & {
  // Calculados en useAdminPropertiesPaginated: properties.user_id y
  // profiles.user_id no tienen FK directa, así que el nombre/tipo del
  // dueño se resuelve con un segundo query y se mergea acá.
  owner_full_name: string | null;
  owner_user_type: string | null;
};

export type AdminProfile = Tables<"profiles">;

export type AdminAd = Tables<"advertisements">;

export type AdminActionLogEntry = Tables<"admin_action_log"> & {
  // Resuelto en useAdminActionLog vía join client-side a profiles.
  admin_full_name: string | null;
};
