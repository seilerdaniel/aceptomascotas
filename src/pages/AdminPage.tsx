import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  useAllProfiles 
} from "@/hooks/useAdmin";
import { toast } from "sonner";

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: messages = [], isLoading: messagesLoading } = useContactMessages();
  const { data: properties = [], isLoading: propertiesLoading } = useAllProperties();
  const { data: profiles = [], isLoading: profilesLoading } = useAllProfiles();
  
  const deleteMessage = useDeleteContactMessage();
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

  const handleDeleteProperty = async (id: string) => {
    try {
      await deleteProperty.mutateAsync(id);
      toast.success("Propiedad eliminada");
    } catch (error) {
      toast.error("Error al eliminar la propiedad");
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
            <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
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
            <TabsTrigger value="properties" className="gap-2">
              <Home className="h-4 w-4" />
              Propiedades
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuarios
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
                                  <Trash2 className="h-4 w-4 text-destructive" />
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
                          <TableCell>{property.location}</TableCell>
                          <TableCell>${property.price.toLocaleString("es-AR")}</TableCell>
                          <TableCell>
                            <Badge variant={property.is_active ? "default" : "secondary"}>
                              {property.is_active ? "Activa" : "Inactiva"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-1">
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
                                  <Trash2 className="h-4 w-4 text-destructive" />
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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