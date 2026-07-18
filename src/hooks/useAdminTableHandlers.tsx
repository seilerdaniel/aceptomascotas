import { useMemo, type Dispatch, type SetStateAction } from "react";
import type { AdminTableState } from "@/hooks/useAdminTables";

// Handlers compartidos por las 3 tablas paginadas del admin: buscar y
// filtrar por estado vuelven a la página 1; ordenar por la misma columna
// invierte la dirección en vez de resetearla.
//
// Memoizado con useMemo: sin esto, propertiesHandlers/servicesHandlers/
// usersHandlers se recreaban como objetos (y funciones) nuevas en cada
// render de AdminPage, aunque setState (de useState) ya es estable entre
// renders. Con setState como única dependencia, el objeto de handlers se
// crea una sola vez por tabla.
export const useAdminTableHandlers = <S extends AdminTableState & { status: string }>(
  setState: Dispatch<SetStateAction<S>>
) => {
  return useMemo(
    () => ({
      onSearchChange: (search: string) => setState((s) => ({ ...s, search, page: 1 })),
      onStatusChange: (status: string) =>
        setState((s) => ({ ...s, status: status as S["status"], page: 1 })),
      onSort: (column: string) =>
        setState((s) => ({
          ...s,
          sortBy: column,
          sortAscending: s.sortBy === column ? !s.sortAscending : true,
          page: 1,
        })),
      onPageChange: (page: number) => setState((s) => ({ ...s, page })),
    }),
    [setState]
  );
};
