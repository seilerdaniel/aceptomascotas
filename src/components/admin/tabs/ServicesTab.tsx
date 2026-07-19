import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import AdminTableToolbar from "@/components/admin/AdminTableToolbar";
import Pagination from "@/components/Pagination";
import SortableTableHead from "@/components/admin/SortableTableHead";
import type { AdminTableHandlers } from "@/hooks/useAdminTableHandlers";
import type { AdminTableState, ServiceStatusFilter } from "@/hooks/useAdminTables";
import type { AdminService } from "@/types/admin";

interface ServicesTabProps {
  services: AdminService[];
  isLoading: boolean;
  state: AdminTableState & { status: ServiceStatusFilter };
  handlers: AdminTableHandlers;
  pageCount: number;
  totalCount: number;
  onToggleApproval: (id: string, isApproved: boolean) => void;
  onToggleVerified: (id: string, isVerified: boolean) => void;
  onDelete: (id: string) => void;
}

const ServicesTab = ({
  services,
  isLoading,
  state,
  handlers,
  pageCount,
  totalCount,
  onToggleApproval,
  onToggleVerified,
  onDelete,
}: ServicesTabProps) => {
  return (
    <TabsContent value="services">
      <Card>
        <CardHeader>
          <CardTitle>Servicios para mascotas</CardTitle>
          <CardDescription>
            Aprobá los servicios enviados por veterinarias, paseadores y demás proveedores antes de que se
            publiquen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminTableToolbar
            searchValue={state.search}
            onSearchChange={handlers.onSearchChange}
            searchPlaceholder="Buscar por nombre, ciudad o email..."
            statusValue={state.status}
            onStatusChange={handlers.onStatusChange}
            statusOptions={[
              { value: "todos", label: "Todos los estados" },
              { value: "pendientes", label: "Pendientes de aprobación" },
              { value: "aprobados", label: "Aprobados" },
              { value: "verificados", label: "Verificados" },
            ]}
          />
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay servicios que coincidan con la búsqueda
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead
                      column="name"
                      label="Nombre"
                      activeSortBy={state.sortBy}
                      ascending={state.sortAscending}
                      onSort={handlers.onSort}
                    />
                    <TableHead>Categoría</TableHead>
                    <SortableTableHead
                      column="city"
                      label="Ciudad"
                      activeSortBy={state.sortBy}
                      ascending={state.sortAscending}
                      onSort={handlers.onSort}
                    />
                    <TableHead>Contacto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Aprobado</TableHead>
                    <TableHead>Verificado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell className="capitalize">{service.category?.replace(/_/g, " ")}</TableCell>
                      <TableCell>{service.city}</TableCell>
                      <TableCell>{service.whatsapp || service.phone || service.email || "—"}</TableCell>
                      <TableCell>
                        {service.is_approved ? (
                          <Badge className="bg-primary gap-1">Aprobado</Badge>
                        ) : (
                          <Badge variant="destructive">Pendiente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={!!service.is_approved}
                          onCheckedChange={(checked) => onToggleApproval(service.id, checked)}
                          aria-label="Aprobar servicio"
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={!!service.is_verified}
                          onCheckedChange={(checked) => onToggleVerified(service.id, checked)}
                          aria-label="Servicio verificado"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive-outline" size="icon" aria-label="Eliminar servicio">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar este servicio?</AlertDialogTitle>
                                <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(service.id)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
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

export default ServicesTab;
