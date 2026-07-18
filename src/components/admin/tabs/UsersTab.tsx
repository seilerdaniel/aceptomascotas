import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminTableToolbar from "@/components/admin/AdminTableToolbar";
import AdminTablePagination from "@/components/admin/AdminTablePagination";
import SortableTableHead from "@/components/admin/SortableTableHead";
import type { AdminTableHandlers } from "@/hooks/useAdminTableHandlers";
import type { AdminTableState, UserStatusFilter } from "@/hooks/useAdminTables";
import type { AdminProfile } from "@/types/admin";

interface UsersTabProps {
  profiles: AdminProfile[];
  isLoading: boolean;
  state: AdminTableState & { status: UserStatusFilter };
  handlers: AdminTableHandlers;
  pageCount: number;
  totalCount: number;
  onToggleVerification: (id: string, isVerified: boolean) => void;
}

const UsersTab = ({
  profiles,
  isLoading,
  state,
  handlers,
  pageCount,
  totalCount,
  onToggleVerification,
}: UsersTabProps) => {
  return (
    <TabsContent value="users">
      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
          <CardDescription>Perfiles de usuarios registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminTableToolbar
            searchValue={state.search}
            onSearchChange={handlers.onSearchChange}
            searchPlaceholder="Buscar por nombre o teléfono..."
            statusValue={state.status}
            onStatusChange={handlers.onStatusChange}
            statusOptions={[
              { value: "todos", label: "Todos los estados" },
              { value: "verificados", label: "Verificados" },
              { value: "sin_verificar", label: "Sin verificar" },
            ]}
          />
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay usuarios que coincidan con la búsqueda
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead
                      column="created_at"
                      label="Fecha de registro"
                      activeSortBy={state.sortBy}
                      ascending={state.sortAscending}
                      onSort={handlers.onSort}
                    />
                    <SortableTableHead
                      column="full_name"
                      label="Nombre"
                      activeSortBy={state.sortBy}
                      ascending={state.sortAscending}
                      onSort={handlers.onSort}
                    />
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Verificado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(profile.created_at).toLocaleDateString("es-AR")}
                      </TableCell>
                      <TableCell>{profile.full_name || "Sin nombre"}</TableCell>
                      <TableCell>{profile.phone || "Sin teléfono"}</TableCell>
                      <TableCell>
                        {profile.user_type ? (
                          <Badge variant="secondary" className="capitalize">
                            {profile.user_type}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {profile.user_type === "agencia" ? (
                          <Switch
                            checked={!!profile.is_verified}
                            onCheckedChange={(checked) => onToggleVerification(profile.id, checked)}
                          />
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <AdminTablePagination
                page={state.page}
                pageCount={pageCount}
                totalCount={totalCount}
                onPageChange={handlers.onPageChange}
              />
            </>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default UsersTab;
