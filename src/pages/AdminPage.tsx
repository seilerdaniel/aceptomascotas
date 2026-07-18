import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  MessageSquare,
  Home,
  Users,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Calendar,
  Shield,
  Flag,
  Link2,
  Stethoscope,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import UtmLinkGenerator from "@/components/UtmLinkGenerator";
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
import { Switch } from "@/components/ui/switch";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import {
  useIsAdmin,
  useContactMessages,
  usePropertyReports,
  useAllAds,
} from "@/hooks/useAdmin";
import { useAdminMutations } from "@/hooks/useAdminMutations";

import {
  useAdminPropertiesPaginated,
  useAdminServicesPaginated,
  useAdminUsersPaginated,
  useAdminPendingServicesCount,
  type PropertyStatusFilter,
  type ServiceStatusFilter,
  type UserStatusFilter,
  type AdminTableState,
} from "@/hooks/useAdminTables";
import { useAdminActionLog, getActionLabel } from "@/hooks/useAdminActionLog";
import AdminTableToolbar from "@/components/admin/AdminTableToolbar";
import AdminTablePagination from "@/components/admin/AdminTablePagination";
import SortableTableHead from "@/components/admin/SortableTableHead";
import ImageUploadField from "@/components/ImageUploadField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Megaphone, History } from "lucide-react";
import { toast } from "sonner";
import { useAdminTableHandlers } from "@/hooks/useAdminTableHandlers";

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: messages = [], isLoading: messagesLoading } = useContactMessages();
  const { data: reports = [], isLoading: reportsLoading } = usePropertyReports();
  const { data: ads = [], isLoading: adsLoading } = useAllAds();
  const {
    data: actionLogData,
    isLoading: actionLogLoading,
    loadMore: loadMoreActionLog,
    hasMore: hasMoreActionLog,
  } = useAdminActionLog();

  const [propertiesState, setPropertiesState] = useState<
    AdminTableState & { status: PropertyStatusFilter }
  >({ page: 1, search: "", sortBy: "created_at", sortAscending: false, status: "todas" });
  const { data: propertiesPage, isLoading: propertiesLoading } =
    useAdminPropertiesPaginated(propertiesState);
  const properties = propertiesPage?.rows ?? [];
  const propertiesHandlers = useAdminTableHandlers(setPropertiesState);

  const [servicesState, setServicesState] = useState<
    AdminTableState & { status: ServiceStatusFilter }
  >({ page: 1, search: "", sortBy: "created_at", sortAscending: false, status: "todos" });
  const { data: servicesPage, isLoading: servicesLoading } = useAdminServicesPaginated(servicesState);
  const services = servicesPage?.rows ?? [];
  const servicesHandlers = useAdminTableHandlers(setServicesState);

  const [usersState, setUsersState] = useState<AdminTableState & { status: UserStatusFilter }>({
    page: 1,
    search: "",
    sortBy: "created_at",
    sortAscending: false,
    status: "todos",
  });
  const { data: usersPage, isLoading: profilesLoading } = useAdminUsersPaginated(usersState);
  const profiles = usersPage?.rows ?? [];
  const usersHandlers = useAdminTableHandlers(setUsersState);

  // Conteo real de servicios pendientes para el badge del tab: independiente
  // de la búsqueda/filtro/página actual de la tabla de Servicios.
  const { data: pendingServicesCount = 0 } = useAdminPendingServicesCount();

  const pendingReportsCount = useMemo(
    () => reports.filter((report) => report.status === "pending").length,
    [reports]
  );

  const nextAdSortOrder = useMemo(
    () => Math.max(0, ...ads.map((ad) => Number(ad.sort_order ?? 0))) + 1,
    [ads]
  );

  const mutations = useAdminMutations();
  const {
    handleDeleteMessage,
    handleToggleProperty,
    handleToggleVerified,
    handleDeleteProperty,
    handleUpdateReportStatus,
    handleDeleteReport,
    handleToggleVerification,
    handleToggleServiceApproval,
    handleToggleServiceVerified,
    handleDeleteService,
    handleToggleAdActive,
    handleDeleteAd,
  } = mutations;

  const [newAdName, setNewAdName] = useState("");
  const [newAdImage, setNewAdImage] = useState<string | null>(null);
  const [newAdLink, setNewAdLink] = useState("");
  const [newAdAlt, setNewAdAlt] = useState("");

  // Validación de UI + limpieza del formulario: es lógica de esta página
  // (depende del estado local newAdName/newAdImage/etc.), no de la
  // mutación en sí — por eso no vive dentro de useAdminMutations.
  const handleCreateAd = async () => {
    if (!newAdName.trim() || !newAdImage || !newAdAlt.trim()) {
      toast.error("Completá nombre, imagen y texto alternativo");
      return;
    }
    const success = await mutations.handleCreateAd({
      advertiser_name: newAdName.trim(),
      image_url: newAdImage,
      link_url: newAdLink.trim() || null,
      alt_text: newAdAlt.trim(),
      sort_order: nextAdSortOrder,
    });
    if (success) {
      setNewAdName("");
      setNewAdImage(null);
      setNewAdLink("");
      setNewAdAlt("");
    }
  };

  // Loading state
  if (authLoading || adminLoading || isAdmin === undefined) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="max-w-md mx-auto text-center">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-4">Acceso restringido</h1>
            <p className="text-muted-foreground mb-6">
              Debés iniciar sesión para acceder a esta página.
            </p>
            <Button variant="hero" onClick={() => navigate("/auth")}>
              Iniciar sesión
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="max-w-md mx-auto text-center">
            <Shield className="h-16 w-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-4">Acceso denegado</h1>
            <p className="text-muted-foreground mb-6">
              No tenés permisos de administrador para acceder a esta página.
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              Volver al inicio
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Panel de Administración
          </h1>
          <p className="text-muted-foreground">
            Gestioná mensajes, propiedades y usuarios
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensajes</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{messages.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Propiedades</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{propertiesPage?.totalCount ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usersPage?.totalCount ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="messages" className="space-y-4">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-2">
            <TabsList className="w-max sm:w-auto">
              <TabsTrigger value="messages" className="gap-2 shrink-0">
                <MessageSquare className="h-4 w-4" />
                Mensajes
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2 shrink-0">
                <Flag className="h-4 w-4" />
                Reportes
                {pendingReportsCount > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {pendingReportsCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="services" className="gap-2 shrink-0">
                <Stethoscope className="h-4 w-4" />
                Servicios
                {pendingServicesCount > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {pendingServicesCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="properties" className="gap-2 shrink-0">
                <Home className="h-4 w-4" />
                Propiedades
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2 shrink-0">
                <Users className="h-4 w-4" />
                Usuarios
              </TabsTrigger>
              <TabsTrigger value="utm" className="gap-2 shrink-0">
                <Link2 className="h-4 w-4" />
                Links UTM
              </TabsTrigger>
              <TabsTrigger value="ads" className="gap-2 shrink-0">
                <Megaphone className="h-4 w-4" />
                Publicidad
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2 shrink-0">
                <History className="h-4 w-4" />
                Actividad
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Mensajes de contacto</CardTitle>
                <CardDescription>
                  Mensajes recibidos a través del formulario de contacto
                </CardDescription>
              </CardHeader>
              <CardContent>
                {messagesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay mensajes
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Asunto</TableHead>
                        <TableHead>Mensaje</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {messages.map((message) => (
                        <TableRow key={message.id}>
                          <TableCell className="whitespace-nowrap">
                            {new Date(message.created_at).toLocaleDateString("es-AR")}
                          </TableCell>
                          <TableCell>{message.name}</TableCell>
                          <TableCell>
                            <a href={`mailto:${message.email}`} className="text-primary hover:underline">
                              {message.email}
                            </a>
                          </TableCell>
                          <TableCell>{message.subject}</TableCell>
                          <TableCell className="max-w-xs truncate">{message.message}</TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="Eliminar mensaje">
                                  <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar mensaje?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteMessage(message.id)}>
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Reportes de publicaciones</CardTitle>
                <CardDescription>
                  Reportes enviados por usuarios sobre publicaciones que consideran problemáticas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay reportes
                  </div>
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
                          <TableCell className="max-w-xs truncate">
                            {report.details || "—"}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={report.status}
                              onValueChange={(value) =>
                                handleUpdateReportStatus(
                                  report.id,
                                  value as "pending" | "reviewed" | "dismissed"
                                )
                              }
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
                                <Button variant="ghost" size="icon" aria-label="Eliminar reporte">
                                  <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar reporte?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteReport(report.id)}>
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Servicios para mascotas</CardTitle>
                <CardDescription>
                  Aprobá los servicios enviados por veterinarias, paseadores y demás proveedores antes de que se publiquen.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminTableToolbar
                  searchValue={servicesState.search}
                  onSearchChange={servicesHandlers.onSearchChange}
                  searchPlaceholder="Buscar por nombre, ciudad o email..."
                  statusValue={servicesState.status}
                  onStatusChange={servicesHandlers.onStatusChange}
                  statusOptions={[
                    { value: "todos", label: "Todos los estados" },
                    { value: "pendientes", label: "Pendientes de aprobación" },
                    { value: "aprobados", label: "Aprobados" },
                    { value: "verificados", label: "Verificados" },
                  ]}
                />
                {servicesLoading ? (
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
                            activeSortBy={servicesState.sortBy}
                            ascending={servicesState.sortAscending}
                            onSort={servicesHandlers.onSort}
                          />
                          <TableHead>Categoría</TableHead>
                          <SortableTableHead
                            column="city"
                            label="Ciudad"
                            activeSortBy={servicesState.sortBy}
                            ascending={servicesState.sortAscending}
                            onSort={servicesHandlers.onSort}
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
                                onCheckedChange={(checked) =>
                                  handleToggleServiceApproval(service.id, checked)
                                }
                                aria-label="Aprobar servicio"
                              />
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={!!service.is_verified}
                                onCheckedChange={(checked) =>
                                  handleToggleServiceVerified(service.id, checked)
                                }
                                aria-label="Servicio verificado"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end items-center gap-2">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label="Eliminar servicio">
                                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Eliminar este servicio?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta acción no se puede deshacer.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteService(service.id)}>
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
                    <AdminTablePagination
                      page={servicesState.page}
                      pageCount={servicesPage?.pageCount ?? 1}
                      totalCount={servicesPage?.totalCount ?? 0}
                      onPageChange={servicesHandlers.onPageChange}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties">
            <Card>
              <CardHeader>
                <CardTitle>Propiedades</CardTitle>
                <CardDescription>
                  Todas las propiedades publicadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminTableToolbar
                  searchValue={propertiesState.search}
                  onSearchChange={propertiesHandlers.onSearchChange}
                  searchPlaceholder="Buscar por título, ubicación o email..."
                  statusValue={propertiesState.status}
                  onStatusChange={propertiesHandlers.onStatusChange}
                  statusOptions={[
                    { value: "todas", label: "Todos los estados" },
                    { value: "activas", label: "Activas" },
                    { value: "inactivas", label: "Inactivas" },
                    { value: "verificadas", label: "Verificadas" },
                    { value: "sin_verificar", label: "Sin verificar" },
                  ]}
                />
                {propertiesLoading ? (
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
                            activeSortBy={propertiesState.sortBy}
                            ascending={propertiesState.sortAscending}
                            onSort={propertiesHandlers.onSort}
                          />
                          <SortableTableHead
                            column="title"
                            label="Título"
                            activeSortBy={propertiesState.sortBy}
                            ascending={propertiesState.sortAscending}
                            onSort={propertiesHandlers.onSort}
                          />
                          <TableHead>Usuario</TableHead>
                          <TableHead>Ubicación</TableHead>
                          <SortableTableHead
                            column="price"
                            label="Precio"
                            activeSortBy={propertiesState.sortBy}
                            ascending={propertiesState.sortAscending}
                            onSort={propertiesHandlers.onSort}
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
                                onCheckedChange={(checked) => handleToggleVerified(property.id, checked)}
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
                                onClick={() => handleToggleProperty(property.id, property.is_active || false)}
                              >
                                {property.is_active ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" aria-label="Eliminar propiedad">
                                    <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
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
                                    <AlertDialogAction onClick={() => handleDeleteProperty(property.id)}>
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
                      page={propertiesState.page}
                      pageCount={propertiesPage?.pageCount ?? 1}
                      totalCount={propertiesPage?.totalCount ?? 0}
                      onPageChange={propertiesHandlers.onPageChange}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Usuarios</CardTitle>
                <CardDescription>
                  Perfiles de usuarios registrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminTableToolbar
                  searchValue={usersState.search}
                  onSearchChange={usersHandlers.onSearchChange}
                  searchPlaceholder="Buscar por nombre o teléfono..."
                  statusValue={usersState.status}
                  onStatusChange={usersHandlers.onStatusChange}
                  statusOptions={[
                    { value: "todos", label: "Todos los estados" },
                    { value: "verificados", label: "Verificados" },
                    { value: "sin_verificar", label: "Sin verificar" },
                  ]}
                />
                {profilesLoading ? (
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
                            activeSortBy={usersState.sortBy}
                            ascending={usersState.sortAscending}
                            onSort={usersHandlers.onSort}
                          />
                          <SortableTableHead
                            column="full_name"
                            label="Nombre"
                            activeSortBy={usersState.sortBy}
                            ascending={usersState.sortAscending}
                            onSort={usersHandlers.onSort}
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
                                  onCheckedChange={(checked) =>
                                    handleToggleVerification(profile.id, checked)
                                  }
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
                      page={usersState.page}
                      pageCount={usersPage?.pageCount ?? 1}
                      totalCount={usersPage?.totalCount ?? 0}
                      onPageChange={usersHandlers.onPageChange}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* UTM Link Generator Tab */}
          <TabsContent value="utm">
            <UtmLinkGenerator />
          </TabsContent>

          {/* Ads Tab */}
          <TabsContent value="ads" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Nueva publicidad</CardTitle>
                <CardDescription>
                  Se muestra en la home. Coordinás el pago con la marca/agencia por fuera de la plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {user && (
                  <div className="space-y-1.5">
                    <ImageUploadField
                      bucket="ad-images"
                      folderPath="ads"
                      filePrefix={user.id}
                      currentUrl={newAdImage}
                      shape="banner"
                      label="Imagen del anuncio"
                      onUploaded={setNewAdImage}
                      onRemove={() => setNewAdImage(null)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tamaño recomendado: 1200×400px (relación 3:1) — es la proporción con la que se muestra en la home. Formato JPG o PNG, hasta 5MB.
                    </p>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ad-name">Nombre del anunciante</Label>
                    <Input
                      id="ad-name"
                      value={newAdName}
                      onChange={(e) => setNewAdName(e.target.value)}
                      placeholder="Ej: Veterinaria San Martín"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ad-link">Link de destino (opcional)</Label>
                    <Input
                      id="ad-link"
                      value={newAdLink}
                      onChange={(e) => setNewAdLink(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ad-alt">Texto alternativo (accesibilidad)</Label>
                  <Input
                    id="ad-alt"
                    value={newAdAlt}
                    onChange={(e) => setNewAdAlt(e.target.value)}
                    placeholder="Ej: Promoción de descuento en consultas veterinarias"
                  />
                </div>
                <Button variant="hero" onClick={handleCreateAd} disabled={mutations.isCreatingAd}>
                  {mutations.isCreatingAd && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear publicidad
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Publicidades activas</CardTitle>
              </CardHeader>
              <CardContent>
                {adsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : ads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay publicidades cargadas todavía
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ads.map((ad) => (
                      <div
                        key={ad.id}
                        className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30 flex-wrap"
                      >
                        <img
                          src={ad.image_url}
                          alt={ad.alt_text}
                          className="h-16 w-28 object-cover rounded-md shrink-0"
                        />
                        <div className="flex-1 min-w-[150px]">
                          <p className="font-medium">{ad.advertiser_name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {ad.link_url || "Sin link"}
                          </p>
                        </div>
                        <Switch
                          checked={!!ad.is_active}
                          onCheckedChange={(checked) => handleToggleAdActive(ad.id, checked)}
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Eliminar publicidad">
                              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar esta publicidad?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. El anuncio de "{ad.advertiser_name}" dejará de mostrarse.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteAd(ad.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Actividad del admin</CardTitle>
                <CardDescription>
                  Quién verificó, aprobó o eliminó qué, y cuándo. Registro de solo lectura.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {actionLogLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : !actionLogData || actionLogData.rows.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Todavía no hay acciones registradas
                  </div>
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
                        {actionLogData.rows.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                              {new Date(entry.created_at).toLocaleString("es-AR")}
                            </TableCell>
                            <TableCell>{entry.admin_full_name || "—"}</TableCell>
                            <TableCell>{getActionLabel(entry.action)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {entry.target_id ? `${entry.target_table}: ${entry.target_id.slice(0, 8)}…` : "—"}
                              {entry.details ? ` (${JSON.stringify(entry.details)})` : ""}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {hasMoreActionLog && (
                      <div className="flex justify-center mt-4">
                        <Button variant="outline" size="sm" onClick={loadMoreActionLog}>
                          Cargar más
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default AdminPage;