import { Link } from "react-router-dom";
import { Loader2, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react";
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
import AdminTablePagination from "@/components/admin/AdminTablePagination";
import SortableTableHead from "@/components/admin/SortableTableHead";
import type { AdminTableHandlers } from "@/hooks/useAdminTableHandlers";
import type { AdminTableState, PropertyStatusFilter } from "@/hooks/useAdminTables";
import type { AdminProperty } from "@/types/admin";

interface PropertiesTabProps {
  properties: AdminProperty[];
  isLoading: boolean;
  state: AdminTableState & { status: PropertyStatusFilter };
  handlers: AdminTableHandlers;
  pageCount: number;
  totalCount: number;
  onToggleActive: (id: string, currentStatus: boolean) => void;
  onToggleVerified: (id: string, isVerified: boolean) => void;
  onDelete: (id: string) => void;
}

const PropertiesTab = ({
  properties,
  isLoading,
  state,
  handlers,
  pageCount,
  totalCount,
  onToggleActive,
  onToggleVerified,
  onDelete,
}: PropertiesTabProps) => {
  return (
    <TabsContent value="properties">
      <Card>
        <CardHeader>
          <CardTitle>Propiedades</CardTitle>
          <CardDescription>Todas las propiedades publicadas</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminTableToolbar
            searchValue={state.search}
            onSearchChange={handlers.onSearchChange}
            searchPlaceholder="Buscar por título, ubicación o email..."
            statusValue={state.status}
            onStatusChange={handlers.onStatusChange}
            statusOptions={[
              { value: "todas", label: "Todos los estados" },
              { value: "activas", label: "Activas" },
              { value: "inactivas", label: "Inactivas" },
              { value: "verificadas", label: "Verificadas" },
              { value: "sin_verificar", label: "Sin verificar" },
            ]}
          />
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay propiedades que coincidan con la búsqueda
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead
                      column="created_at"
                      label="Fecha"
                      activeSortBy={state.sortBy}
                      ascending={state.sortAscending}
                      onSort={handlers.onSort}
                    />
                    <SortableTableHead
                      column="title"
                      label="Título"
                      activeSortBy={state.sortBy}
                      ascending={state.sortAscending}
                      onSort={handlers.onSort}
                    />
                    <TableHead>Usuario</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <SortableTableHead
                      column="price"
                      label="Precio"
                      activeSortBy={state.sortBy}
                      ascending={state.sortAscending}
                      onSort={handlers.onSort}
                    />
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(property.created_at).toLocaleDateString("es-AR")}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{property.title}</TableCell>
                      <TableCell>
                        {property.owner_full_name ? (
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[120px]">{property.owner_full_name}</span>
                            {property.owner_user_type && (
                              <Badge variant="secondary" className="capitalize text-[10px] px-1.5 py-0 shrink-0">
                                {property.owner_user_type}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Sin dueño</span>
                        )}
                      </TableCell>
                      <TableCell>{property.location}</TableCell>
                      <TableCell>${property.price.toLocaleString("es-AR")}</TableCell>
                      <TableCell>
                        <Badge variant={property.is_active ? "default" : "secondary"}>
                          {property.is_active ? "Activa" : "Inactiva"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Switch
                          checked={property.property_is_verified}
                          onCheckedChange={(checked) => onToggleVerified(property.id, checked)}
                          aria-label="Propiedad verificada"
                          className="align-middle mr-1"
                        />
                        <Link to={`/propiedad/${property.id}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" title="Ver publicación">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Mostrar u ocultar propiedad"
                          onClick={() => onToggleActive(property.id, property.is_active || false)}
                        >
                          {property.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive-outline" size="icon" aria-label="Eliminar propiedad">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar propiedad?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará la propiedad permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(property.id)}>
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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

export default PropertiesTab;
