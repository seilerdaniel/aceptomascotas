import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

interface LogAdminActionParams {
  action: string;
  targetTable: string;
  targetId?: string | null;
  details?: Record<string, unknown>;
}

// Registra una acción de admin (verificar, aprobar, eliminar, etc.) para
// auditoría. Se llama desde el onSuccess de cada mutation del admin, nunca
// bloquea la acción principal: si el insert del log falla (red, RLS,
// lo que sea), solo se loguea en consola y la acción ya hecha sigue
// siendo válida — no tiene sentido revertir un "eliminar propiedad" que
// ya se ejecutó solo porque no se pudo dejar constancia.
export const logAdminAction = async ({
  action,
  targetTable,
  targetId,
  details,
}: LogAdminActionParams): Promise<void> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("admin_action_log").insert({
      admin_user_id: user.id,
      action,
      target_table: targetTable,
      target_id: targetId ?? null,
      // details is Record<string, unknown> but the log column is jsonb (Json);
      // cast through unknown — values at runtime are plain JSON-safe objects.
      details: (details as unknown as Json) ?? null,
    });

    if (error) {
      console.error("No se pudo registrar la acción de admin:", error);
    }
  } catch (error) {
    console.error("No se pudo registrar la acción de admin:", error);
  }
};
