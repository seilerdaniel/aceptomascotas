import { Link } from "react-router-dom";
import { Loader2, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminPropertyReport, ReportStatus } from "@/types/admin";

interface ReportsTabProps {
  reports: AdminPropertyReport[];
  isLoading: boolean;
  onUpdateStatus: (id: string, status: ReportStatus) => void;
  onDelete: (id: string) => void;
}

const ReportsTab = ({ reports, isLoading, onUpdateStatus, onDelete }: ReportsTabProps) => {
  return (
    <TabsContent value="reports">
      <Card>
        <CardHeader>
          <CardTitle>Reportes de publicaciones</CardTitle>
          <CardDescription>
            Reportes enviados por usuarios sobre publicaciones que consideran problemáticas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay reportes</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Detalles</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(report.created_at).toLocaleDateString("es-AR")}
                    </TableCell>
                    <TableCell>
                      {report.property_id ? (
                        <Link
                          to={`/propiedad/${report.property_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {report.properties?.title || "Ver publicación"}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        report.properties?.title || "—"
                      )}
                    </TableCell>
                    <TableCell>{report.reason}</TableCell>
                    <TableCell className="max-w-xs truncate">{report.details || "—"}</TableCell>
                    <TableCell>
                      <Select
                        value={report.status}
                        onValueChange={(value) => onUpdateStatus(report.id, value as ReportStatus)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="reviewed">Revisado</SelectItem>
                          <SelectItem value="dismissed">Descartado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive-outline" size="icon" aria-label="Eliminar reporte">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar reporte?</AlertDialogTitle>
                            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(report.id)}>Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default ReportsTab;
