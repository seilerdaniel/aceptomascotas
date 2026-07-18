import { toast } from "sonner";

// Centraliza el patrón repetido en cada handler del admin:
//
//   try {
//     await mutation.mutateAsync(...)
//     toast.success(...)
//   } catch {
//     toast.error(...)
//   }
//
// Devuelve true/false en vez de relanzar, para que el que llama pueda
// decidir qué hacer según el resultado (ej. limpiar un formulario solo
// si la mutación realmente tuvo éxito) sin tener que envolver el propio
// llamado en otro try/catch.
export const executeMutation = async (
  mutationFn: () => Promise<unknown>,
  successMessage: string,
  errorMessage: string
): Promise<boolean> => {
  try {
    await mutationFn();
    toast.success(successMessage);
    return true;
  } catch (error) {
    toast.error(errorMessage);
    return false;
  }
};
