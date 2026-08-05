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
import type { AdminTableState, ReviewStatusFilter } from "@/hooks/useAdminTables";
import type { AdminPropertyReview } from "@/types/admin";

interface ReviewsTabProps {
  reviews: AdminPropertyReview[];
  isLoading: boolean;
  state: AdminTableState & { status: ReviewStatusFilter };
  handlers: AdminTableHandlers;
  pageCount: number;
  totalCount: number;
  onToggleApproval: (id: string, isApproved: boolean) => void;
  onDelete: (id: string) => void;
}

const ReviewsTab = ({
  reviews,
  isLoading,
  state,
  handlers,
  pageCount,
  totalCount,
  onToggleApproval,
  onDelete,
}: ReviewsTabProps) => {
  return (
    <TabsContent value="reviews">
      <Card>
        <CardHeader>
          <CardTitle>Reseñas de propiedades</CardTitle>
          <CardDescription>
            Aprobá las reseñas de propiedades antes de que se publiquen. Las
            reseñas aprobadas actualizan el promedio público de la propiedad.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminTableToolbar
            searchValue={state.search}
            onSearchChange={handlers.onSearchChange}
            searchPlaceholder="Buscar por nombre o comentario..."
            statusValue={state.status}
            onStatusChange={handlers.onStatusChange}
            statusOptions={[
              { value: "todas", label: "Todos los estados" },
              { value: "pendientes", label: "Pendientes de aprobación" },
              { value: "aprobadas", label: "Aprobadas" },
            ]}
          />
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay reseñas que coincidan con la búsqueda
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead
                      column="user_name"
                      label="Usuario"
                      activeSortBy={state.sortBy}
                      ascending={state.sortAscending}
                      onSort={handlers.onSort}
                    />
                    <TableHead>Propiedad</TableHead>
                    <TableHead>Calificación</TableHead>
                    <TableHead>Comentario</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Aprobada</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">{review.user_name}</TableCell>
                      <TableCell>{review.properties?.title ?? "—"}</TableCell>
                      <TableCell>{review.rating} / 5</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {review.comment || "—"}
                      </TableCell>
                      <TableCell>
                        {review.is_approved ? (
                          <Badge className="bg-primary gap-1">Aprobada</Badge>
                        ) : (
                          <Badge variant="destructive">Pendiente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={!!review.is_approved}
                          onCheckedChange={(checked) => onToggleApproval(review.id, checked)}
                          aria-label="Aprobar reseña"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive-outline" size="icon" aria-label="Eliminar reseña">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar esta reseña?</AlertDialogTitle>
                                <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(review.id)}>
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

export default ReviewsTab;
