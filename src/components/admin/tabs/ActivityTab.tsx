import { Loader2 } from "lucide-react";
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
import ActionLogDetails from "@/components/admin/ActionLogDetails";
import { getActionLabel } from "@/hooks/useAdminActionLog";
import type { AdminActionLogEntry } from "@/types/admin";

interface ActivityTabProps {
  entries: AdminActionLogEntry[] | undefined;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

const ActivityTab = ({ entries, isLoading, hasMore, onLoadMore }: ActivityTabProps) => {
  return (
    <TabsContent value="activity">
      <Card>
        <CardHeader>
          <CardTitle>Actividad del admin</CardTitle>
          <CardDescription>
            Quién verificó, aprobó o eliminó qué, y cuándo. Registro de solo lectura.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !entries || entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Todavía no hay acciones registradas</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(entry.created_at).toLocaleString("es-AR")}
                      </TableCell>
                      <TableCell>{entry.admin_full_name || "—"}</TableCell>
                      <TableCell>{getActionLabel(entry.action)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div>
                          {entry.target_id ? `${entry.target_table}: ${entry.target_id.slice(0, 8)}…` : "—"}
                        </div>
                        <ActionLogDetails details={entry.details} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {hasMore && (
                <div className="flex justify-center mt-4">
                  <Button variant="outline" size="sm" onClick={onLoadMore}>
                    Cargar más
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default ActivityTab;
