import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Reemplaza el patrón .select("*") sin límite que traía la tabla completa
// al navegador en cada carga. Con volumen (cientos/miles de filas) esto
// se rompe; range() + count exacto lo resuelve para las 3 tablas del
// admin de una sola vez. Ver nota "rediseño de tablas del admin" en el
// backlog.
export const ADMIN_PAGE_SIZE = 20;

export interface PaginatedResult<T> {
  rows: T[];
  totalCount: number;
  pageCount: number;
}

interface FetchPaginatedParams {
  table: string;
  page: number;
  pageSize?: number;
  search?: string;
  searchColumns?: string[];
  sortBy?: string;
  sortAscending?: boolean;
  // Para filtros de estado (ej. is_active, is_approved) que no son búsqueda
  // de texto: recibe el query builder y le aplica .eq()/.is(), etc.
  applyFilters?: (query: any) => any;
}

const fetchPaginated = async <T,>({
  table,
  page,
  pageSize = ADMIN_PAGE_SIZE,
  search,
  searchColumns = [],
  sortBy = "created_at",
  sortAscending = false,
  applyFilters,
}: FetchPaginatedParams): Promise<PaginatedResult<T>> => {
  let query = (supabase.from(table as any) as any).select("*", { count: "exact" });

  if (applyFilters) {
    query = applyFilters(query);
  }

  if (search && searchColumns.length > 0) {
    const orExpr = searchColumns.map((col) => `${col}.ilike.%${search}%`).join(",");
    query = query.or(orExpr);
  }

  query = query.order(sortBy, { ascending: sortAscending });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  const totalCount = count ?? 0;
  return {
    rows: (data || []) as T[],
    totalCount,
    pageCount: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
};

export interface AdminTableState {
  page: number;
  search: string;
  sortBy: string;
  sortAscending: boolean;
}

// ---------- Propiedades ----------
export type PropertyStatusFilter = "todas" | "activas" | "inactivas" | "verificadas" | "sin_verificar";

export const useAdminPropertiesPaginated = (
  state: AdminTableState & { status: PropertyStatusFilter }
) => {
  return useQuery({
    queryKey: ["admin-properties-page", state],
    queryFn: async () => {
      const result = await fetchPaginated<any>({
        table: "properties",
        page: state.page,
        search: state.search,
        searchColumns: ["title", "location", "contact_email"],
        sortBy: state.sortBy,
        sortAscending: state.sortAscending,
        applyFilters: (query) => {
          if (state.status === "activas") return query.eq("is_active", true);
          if (state.status === "inactivas") return query.eq("is_active", false);
          if (state.status === "verificadas") return query.eq("property_is_verified", true);
          if (state.status === "sin_verificar") return query.eq("property_is_verified", false);
          return query;
        },
      });

      // properties.user_id y profiles.user_id no tienen FK directa entre sí
      // (mismo motivo que useAllProperties), así que el join se arma acá
      // pero solo para las filas de esta página, no de toda la tabla.
      const ownerIds = [...new Set(result.rows.map((p: any) => p.user_id).filter(Boolean))];
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

      return {
        ...result,
        rows: result.rows.map((p: any) => ({
          ...p,
          owner_full_name: p.user_id ? profilesById[p.user_id]?.full_name ?? null : null,
          owner_user_type: p.user_id ? profilesById[p.user_id]?.user_type ?? null : null,
        })),
      };
    },
  });
};

// ---------- Servicios ----------
export type ServiceStatusFilter = "todos" | "pendientes" | "aprobados" | "verificados";

export const useAdminServicesPaginated = (
  state: AdminTableState & { status: ServiceStatusFilter }
) => {
  return useQuery({
    queryKey: ["admin-services-page", state],
    queryFn: () =>
      fetchPaginated<any>({
        table: "pet_services",
        page: state.page,
        search: state.search,
        searchColumns: ["name", "city", "email"],
        sortBy: state.sortBy,
        sortAscending: state.sortAscending,
        applyFilters: (query) => {
          if (state.status === "pendientes") return query.eq("is_approved", false);
          if (state.status === "aprobados") return query.eq("is_approved", true);
          if (state.status === "verificados") return query.eq("is_verified", true);
          return query;
        },
      }),
  });
};

// ---------- Usuarios ----------
export type UserStatusFilter = "todos" | "verificados" | "sin_verificar";

export const useAdminUsersPaginated = (
  state: AdminTableState & { status: UserStatusFilter }
) => {
  return useQuery({
    queryKey: ["admin-users-page", state],
    // profiles no tiene columna de email (vive en auth.users, no accesible
    // desde el cliente), así que la búsqueda acá es por nombre y teléfono.
    queryFn: () =>
      fetchPaginated<any>({
        table: "profiles",
        page: state.page,
        search: state.search,
        searchColumns: ["full_name", "phone"],
        sortBy: state.sortBy,
        sortAscending: state.sortAscending,
        applyFilters: (query) => {
          if (state.status === "verificados") return query.eq("is_verified", true);
          if (state.status === "sin_verificar") return query.eq("is_verified", false);
          return query;
        },
      }),
  });
};

// ---------- Conteos livianos para badges (independientes de la búsqueda
// y filtros locales de cada tabla: cuentan sobre la tabla completa) ----------
export const useAdminPendingServicesCount = () => {
  return useQuery({
    queryKey: ["admin-services-pending-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("pet_services")
        .select("*", { count: "exact", head: true })
        .eq("is_approved", false);
      if (error) throw error;
      return count ?? 0;
    },
  });
};
