import {
  useDeleteContactMessage,
  useTogglePropertyActive,
  useDeleteProperty,
  useUpdatePropertyReportStatus,
  useDeletePropertyReport,
  useToggleProfileVerification,
  useToggleServiceApproval,
  useToggleServiceVerified,
  useTogglePropertyVerified,
  useCreateAd,
  useUpdateAd,
  useDeleteAd,
} from "@/hooks/useAdmin";
import { useDeleteService } from "@/hooks/useServices";
import { executeMutation } from "@/lib/executeMutation";
import type { ReportStatus } from "@/types/admin";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

// Agrupa TODAS las mutaciones del panel de admin y devuelve handlers ya
// envueltos con executeMutation() (mensajes de éxito/error consistentes,
// sin repetir try/catch en cada uno). AdminPage.tsx (y en el futuro cada
// tab) solo consume este hook — no arma sus propios handlers.
//
// El logging de auditoría (logAdminAction) NO se agrega acá: ya vive
// dentro del onSuccess de cada mutation hook en useAdmin.tsx / useServices.tsx,
// así que loguea sin importar desde qué handler se dispare la mutación.
export const useAdminMutations = () => {
  const deleteMessageMutation = useDeleteContactMessage();
  const togglePropertyActiveMutation = useTogglePropertyActive();
  const deletePropertyMutation = useDeleteProperty();
  const updateReportStatusMutation = useUpdatePropertyReportStatus();
  const deleteReportMutation = useDeletePropertyReport();
  const toggleVerificationMutation = useToggleProfileVerification();
  const toggleServiceApprovalMutation = useToggleServiceApproval();
  const toggleServiceVerifiedMutation = useToggleServiceVerified();
  const togglePropertyVerifiedMutation = useTogglePropertyVerified();
  const deleteServiceMutation = useDeleteService();
  const createAdMutation = useCreateAd();
  const updateAdMutation = useUpdateAd();
  const deleteAdMutation = useDeleteAd();

  return {
    // Flags de carga que la UI necesita (ej. spinner en el botón "Crear publicidad")
    isCreatingAd: createAdMutation.isPending,

    handleDeleteMessage: (id: string) =>
      executeMutation(
        () => deleteMessageMutation.mutateAsync(id),
        "Mensaje eliminado",
        "Error al eliminar el mensaje"
      ),

    handleToggleProperty: (id: string, currentStatus: boolean) =>
      executeMutation(
        () => togglePropertyActiveMutation.mutateAsync({ id, is_active: !currentStatus }),
        currentStatus ? "Propiedad desactivada" : "Propiedad activada",
        "Error al actualizar la propiedad"
      ),

    handleToggleVerified: (id: string, isVerified: boolean) =>
      executeMutation(
        () => togglePropertyVerifiedMutation.mutateAsync({ id, isVerified }),
        isVerified ? "Propiedad verificada" : "Verificación removida",
        "Error al actualizar la verificación"
      ),

    handleDeleteProperty: (id: string) =>
      executeMutation(
        () => deletePropertyMutation.mutateAsync(id),
        "Propiedad eliminada",
        "Error al eliminar la propiedad"
      ),

    handleUpdateReportStatus: (id: string, status: ReportStatus) =>
      executeMutation(
        () => updateReportStatusMutation.mutateAsync({ id, status }),
        "Estado del reporte actualizado",
        "Error al actualizar el reporte"
      ),

    handleDeleteReport: (id: string) =>
      executeMutation(
        () => deleteReportMutation.mutateAsync(id),
        "Reporte eliminado",
        "Error al eliminar el reporte"
      ),

    handleToggleVerification: (id: string, isVerified: boolean) =>
      executeMutation(
        () => toggleVerificationMutation.mutateAsync({ id, isVerified }),
        isVerified ? "Agencia verificada" : "Verificación removida",
        "Error al actualizar la verificación"
      ),

    handleToggleServiceApproval: (id: string, isApproved: boolean) =>
      executeMutation(
        () => toggleServiceApprovalMutation.mutateAsync({ id, isApproved }),
        isApproved ? "Servicio aprobado y publicado" : "Servicio despublicado",
        "Error al actualizar el servicio"
      ),

    handleToggleServiceVerified: (id: string, isVerified: boolean) =>
      executeMutation(
        () => toggleServiceVerifiedMutation.mutateAsync({ id, isVerified }),
        isVerified ? "Servicio verificado" : "Verificación removida",
        "Error al actualizar la verificación"
      ),

    handleDeleteService: (id: string) =>
      executeMutation(
        () => deleteServiceMutation.mutateAsync(id),
        "Servicio eliminado",
        "Error al eliminar el servicio"
      ),

    handleCreateAd: (ad: TablesInsert<"advertisements">) =>
      executeMutation(
        () => createAdMutation.mutateAsync(ad),
        "Publicidad creada",
        "Error al crear la publicidad"
      ),

    handleToggleAdActive: (id: string, isActive: boolean) =>
      executeMutation(
        () =>
          updateAdMutation.mutateAsync({
            id,
            updates: { is_active: isActive } as TablesUpdate<"advertisements">,
          }),
        isActive ? "Publicidad activada" : "Publicidad pausada",
        "Error al actualizar la publicidad"
      ),

    handleDeleteAd: (id: string) =>
      executeMutation(
        () => deleteAdMutation.mutateAsync(id),
        "Publicidad eliminada",
        "Error al eliminar la publicidad"
      ),
  };
};
