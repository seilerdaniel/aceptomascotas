import { useState } from "react";
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
  useDeleteContactMessage,
  useAllProperties,
  useTogglePropertyActive,
  useDeleteProperty,
  useAllProfiles,
  usePropertyReports,
  useUpdatePropertyReportStatus,
  useDeletePropertyReport,
  useToggleProfileVerification,
  useAllServices,
  useToggleServiceApproval,
  useTogglePropertyVerified,
  useAllAds,
  useCreateAd,
  useUpdateAd,
  useDeleteAd
} from "@/hooks/useAdmin";
import { useDeleteService } from "@/hooks/useServices";
import ImageUploadField from "@/components/ImageUploadField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: messages = [], isLoading: messagesLoading } = useContactMessages();
  const { data: properties = [], isLoading: propertiesLoading } = useAllProperties();
  const { data: profiles = [], isLoading: profilesLoading } = useAllProfiles();
  const { data: reports = [], isLoading: reportsLoading } = usePropertyReports();
  const { data: services = [], isLoading: servicesLoading } = useAllServices();
  const { data: ads = [], isLoading: adsLoading } = useAllAds();

  const deleteMessage = useDeleteContactMessage();
  const updateReportStatus = useUpdatePropertyReportStatus();
  const deleteReport = useDeletePropertyReport();
  const toggleVerification = useToggleProfileVerification();
  const toggleServiceApproval = useToggleServiceApproval();
  const togglePropertyVerified = useTogglePropertyVerified();
  const deleteService = useDeleteService();
  const createAd = useCreateAd();
  const updateAd = useUpdateAd();
  const deleteAd = useDeleteAd();

  const [newAdName, setNewAdName] = useState("");
  const [newAdImage, setNewAdImage] = useState<string | null>(null);
  const [newAdLink, setNewAdLink] = useState("");
  const [newAdAlt, setNewAdAlt] = useState("");
  const togglePropertyActive = useTogglePropertyActive();
  const deleteProperty = useDeleteProperty();

  const handleDeleteMessage = async (id: string) => {
    try {
      await deleteMessage.mutateAsync(id);
      toast.success("Mensaje eliminado");
    } catch (error) {
      toast.error("Error al eliminar el mensaje");
    }
  };

  const handleToggleProperty = async (id: string, currentStatus: boolean) => {
    try {
      await togglePropertyActive.mutateAsync({ id, is_active: !currentStatus });
      toast.success(currentStatus ? "Propiedad desactivada" : "Propiedad activada");
    } catch (error) {
      toast.error("Error al actualizar la propiedad");
    }
  };

  const handleToggleVerified = async (id: string, isVerified: boolean) => {
    try {
      await togglePropertyVerified.mutateAsync({ id, isVerified });
      toast.success(isVerified ? "Propiedad verificada" : "Verificación removida");
    } catch (error) {
      toast.error("Error al actualizar la verificación");
    }
  };

  const handleDeleteProperty = async (id: string) => {
    try {
      await deleteProperty.mutateAsync(id);
      toast.success("Propiedad eliminada");
    } catch (error) {
      toast.error("Error al eliminar la propiedad");
    }
  };

  const handleUpdateReportStatus = async (
    id: string,
    status: "pending" | "reviewed" | "dismissed"
  ) => {
    try {
      await updateReportStatus.mutateAsync({ id, status });
      toast.success("Estado del reporte actualizado");
    } catch (error) {
      toast.error("Error al actualizar el reporte");
    }
  };

  const handleDeleteReport = async (id: string) => {
    try {
      await deleteReport.mutateAsync(id);
      toast.success("Reporte eliminado");
    } catch (error) {
      toast.error("Error al eliminar el reporte");
    }
  };

  const handleToggleVerification = async (id: string, isVerified: boolean) => {
    try {
      await toggleVerification.mutateAsync({ id, isVerified });
      toast.success(isVerified ? "Agencia verificada" : "Verificación removida");
    } catch (error) {
      toast.error("Error al actualizar la verificación");
    }
  };

  const handleToggleServiceApproval = async (id: string, isApproved: boolean) => {
    try {
      await toggleServiceApproval.mutateAsync({ id, isApproved });
      toast.success(isApproved ? "Servicio aprobado y publicado" : "Servicio despublicado");
    } catch (error) {
      toast.error("Error al actualizar el servicio");
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      await deleteService.mutateAsync(id);
      toast.success("Servicio eliminado");
    } catch (error) {
      toast.error("Error al eliminar el servicio");
    }
  };

  const handleCreateAd = async () => {
    if (!newAdName.trim() || !newAdImage || !newAdAlt.trim()) {
      toast.error("Completá nombre, imagen y texto alternativo");
      return;
    }
    try {
      await createAd.mutateAsync({
        advertiser_name: newAdName.trim(),
        image_url: newAdImage,
        link_url: newAdLink.trim() || null,
        alt_text: newAdAlt.trim(),
        sort_order: ads.length,
      });
      toast.success("Publicidad creada");
      setNewAdName("");
      setNewAdImage(null);
      setNewAdLink("");
      setNewAdAlt("");
    } catch (error) {
      toast.error("Error al crear la publicidad");
    }
  };

  const handleToggleAdActive = async (id: string, isActive: boolean) => {
    try {
      await updateAd.mutateAsync({ id, updates: { is_active: isActive } });
      toast.success(isActive ? "Publicidad activada" : "Publicidad pausada");
    } catch (error) {
      toast.error("Error al actualizar la publicidad");
    }
  };

  const handleDeleteAd = async (id: string) => {
    try {
      await deleteAd.mutateAsync(id);
      toast.success("Publicidad eliminada");
    } catch (error) {
      toast.error("Error al eliminar la publicidad");
    }
  };

  // Loading state
  if (authLoading || adminLoading) {
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
              <div className="text-2xl font-bold">{properties.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profiles.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="messages" className="space-y-4">
          <TabsList>
            <TabsTrigger value="messages" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Mensajes
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <Flag className="h-4 w-4" />
              Reportes
              {reports.filter((r) => r.status === "pending").length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {reports.filter((r) => r.status === "pending").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-2">
              <Stethoscope className="h-4 w-4" />
              Servicios
              {services.filter((s: any) => !s.is_approved).length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {services.filter((s: any) => !s.is_approved).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="properties" className="gap-2">
              <Home className="h-4 w-4" />
              Propiedades
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="utm" className="gap-2">
              <Link2 className="h-4 w-4" />
              Links UTM
            </TabsTrigger>
            <TabsTrigger value="ads" className="gap-2">
              <Megaphone className="h-4 w-4" />
              Publicidad
            </TabsTrigger>
          </TabsList>

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
                                <Button variant="ghost" size="icon">
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
                      {reports.map((report: any) => (
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
                                <Button variant="ghost" size="icon">
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
                {servicesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : services.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay servicios publicados todavía
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Ciudad</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((service: any) => (
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
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-2">
                              <Switch
                                checked={!!service.is_approved}
                                onCheckedChange={(checked) =>
                                  handleToggleServiceApproval(service.id, checked)
                                }
                                aria-label="Aprobar servicio"
                              />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
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
                {propertiesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : properties.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay propiedades
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead>Precio</TableHead>
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
                              checked={!!(property as any).property_is_verified}
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
                                <Button variant="ghost" size="icon">
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
                {profilesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : profiles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay usuarios
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha de registro</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Verificado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profiles.map((profile: any) => (
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
                <Button variant="hero" onClick={handleCreateAd} disabled={createAd.isPending}>
                  {createAd.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                    {ads.map((ad: any) => (
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
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteAd(ad.id)}>
                          <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
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