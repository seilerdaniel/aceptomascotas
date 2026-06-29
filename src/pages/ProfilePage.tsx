import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { User, Phone, Loader2, Settings } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PropertyImageManager from '@/components/PropertyImageManager';
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
} from '@/components/ui/alert-dialog';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut, deleteAccount } = useAuth();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch user's properties
  const { data: userProperties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['user-properties', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Calculate user storage usage from Supabase Storage
  const { data: userStorageUsed = 0, refetch: refetchStorage } = useQuery({
    queryKey: ['user-storage', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      const { data, error } = await supabase.storage
        .from('property-images')
        .list(user.id, { limit: 1000 });

      if (error) {
        console.error('Storage list error:', error);
        return 0;
      }

      const totalBytes = (data || []).reduce((sum, file) => {
        return sum + (file.metadata?.size || 0);
      }, 0);

      return totalBytes;
    },
    enabled: !!user,
  });

  // Update profile form when data loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Perfil actualizado');
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
    onError: (error) => {
      toast.error('Error al guardar: ' + (error as Error).message);
    },
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await saveProfileMutation.mutateAsync();
    setIsSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast.success('Sesión cerrada');
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    const { error } = await deleteAccount();
    if (error) {
      toast.error('Error al eliminar la cuenta: ' + error.message);
      setIsDeleting(false);
    } else {
      toast.success('Tu cuenta fue eliminada correctamente');
      navigate('/');
    }
  };

  // Show login prompt if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="max-w-md mx-auto text-center">
            <h1 className="font-display text-2xl font-bold mb-4">
              Iniciá sesión
            </h1>
            <p className="text-muted-foreground mb-6">
              Necesitás iniciar sesión para acceder a tu perfil.
            </p>
            <Button variant="hero" onClick={() => navigate('/auth')}>
              Iniciar sesión
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (authLoading || profileLoading) {
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <h1 className="font-display text-3xl font-bold">Mi Cuenta</h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="properties">Mis Propiedades</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                  <CardDescription>
                    Actualizá tu información de perfil
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        El email no puede ser modificado
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nombre completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          placeholder="Tu nombre"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10"
                          maxLength={100}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+54 11 1234-5678"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-10"
                          maxLength={20}
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button type="submit" variant="hero" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar cambios
                      </Button>
                    </div>
                  </form>

                  {/* Zona de peligro */}
                  <div className="mt-8 pt-8 border-t space-y-4">
                    <h3 className="font-semibold text-destructive">Zona de peligro</h3>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button variant="outline" onClick={handleSignOut}>
                        Cerrar sesión
                      </Button>

                      <AlertDialog onOpenChange={() => setConfirmText('')}>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">
                            Eliminar cuenta
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar tu cuenta?</AlertDialogTitle>
                            <AlertDialogDescription className="space-y-3">
                              <span className="block">
                                Esta acción es <strong>permanente e irreversible</strong>. Se eliminarán:
                              </span>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                <li>Tu perfil y datos personales</li>
                                <li>Todas tus propiedades publicadas</li>
                                <li>Tus propiedades favoritas</li>
                                <li>Todas las imágenes cargadas</li>
                              </ul>
                              <span className="block pt-2">
                                Para confirmar, escribí <strong>ELIMINAR</strong> en el campo de abajo:
                              </span>
                              <Input
                                placeholder="Escribí ELIMINAR para confirmar"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                className="mt-2"
                              />
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteAccount}
                              disabled={confirmText !== 'ELIMINAR' || isDeleting}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Eliminar mi cuenta
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="properties">
              <Card>
                <CardHeader>
                  <CardTitle>Mis Propiedades</CardTitle>
                  <CardDescription>
                    Administrá tus propiedades publicadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {propertiesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : userProperties && userProperties.length > 0 ? (
                    <div className="space-y-6">
                      {userProperties.map((property) => (
                        <PropertyImageManager
                          key={property.id}
                          property={property}
                          onUpdate={() => queryClient.invalidateQueries({ queryKey: ['user-properties', user?.id] })}
                          userStorageUsed={userStorageUsed}
                          onStorageChange={() => refetchStorage()}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        Todavía no publicaste ninguna propiedad
                      </p>
                      <Button variant="hero" onClick={() => navigate('/publicar')}>
                        Publicar propiedad
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
