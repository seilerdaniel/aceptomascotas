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
import { User, Phone, Loader2, Settings, PawPrint, Plus, Pencil, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PropertyImageManager from '@/components/PropertyImageManager';
import PetForm from '@/components/PetForm';
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

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  age_years: number | null;
  weight_kg: number | null;
  description: string | null;
  images: string[];
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut, deleteAccount } = useAuth();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [showPetForm, setShowPetForm] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);

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

  // Fetch user's pets (solo para buscadores)
  const { data: userPets, isLoading: petsLoading } = useQuery({
    queryKey: ['user-pets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Pet[];
    },
    enabled: !!user && profile?.user_type === 'buscador',
  });

  // Storage usage
  const { data: userStorageUsed = 0, refetch: refetchStorage } = useQuery({
    queryKey: ['user-storage', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await supabase.storage
        .from('property-images')
        .list(user.id, { limit: 1000 });
      if (error) return 0;
      return (data || []).reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user');
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() || null, phone: phone.trim() || null })
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

  const handleDeletePet = async (petId: string) => {
    const { error } = await supabase.from('pets').delete().eq('id', petId);
    if (error) {
      toast.error('Error al eliminar la mascota');
    } else {
      toast.success('Mascota eliminada');
      queryClient.invalidateQueries({ queryKey: ['user-pets', user?.id] });
    }
  };

  const userTypeLabel = {
    buscador: '🐾 Buscador',
    propietario: '🏠 Propietario',
    agencia: '🏢 Agencia',
  };

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="max-w-md mx-auto text-center">
            <h1 className="font-display text-2xl font-bold mb-4">Iniciá sesión</h1>
            <p className="text-muted-foreground mb-6">Necesitás iniciar sesión para acceder a tu perfil.</p>
            <Button variant="hero" onClick={() => navigate('/auth')}>Iniciar sesión</Button>
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

  const isBuscador = profile?.user_type === 'buscador';
  const tabCount = isBuscador ? 3 : 2;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <h1 className="font-display text-3xl font-bold">Mi Cuenta</h1>
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground">{user?.email}</p>
                {profile?.user_type && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    {userTypeLabel[profile.user_type as keyof typeof userTypeLabel]}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className={`grid w-full max-w-lg ${tabCount === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="properties">Mis Propiedades</TabsTrigger>
              {isBuscador && (
                <TabsTrigger value="pets">Mis Mascotas</TabsTrigger>
              )}
            </TabsList>

            {/* TAB: Perfil */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                  <CardDescription>Actualizá tu información de perfil</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={user?.email || ''} disabled className="bg-muted" />
                      <p className="text-xs text-muted-foreground">El email no puede ser modificado</p>
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
                    <Button type="submit" variant="hero" disabled={isSaving}>
                      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Guardar cambios
                    </Button>
                  </form>

                  <div className="mt-8 pt-8 border-t space-y-4">
                    <h3 className="font-semibold text-destructive">Zona de peligro</h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button variant="outline" onClick={handleSignOut}>Cerrar sesión</Button>
                      <AlertDialog onOpenChange={() => setConfirmText('')}>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">Eliminar cuenta</Button>
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
                                <li>Tus mascotas registradas</li>
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

            {/* TAB: Mis Propiedades */}
            <TabsContent value="properties">
              <Card>
                <CardHeader>
                  <CardTitle>Mis Propiedades</CardTitle>
                  <CardDescription>Administrá tus propiedades publicadas</CardDescription>
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
                      <p className="text-muted-foreground mb-4">Todavía no publicaste ninguna propiedad</p>
                      <Button variant="hero" onClick={() => navigate('/publicar')}>
                        Publicar propiedad
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Mis Mascotas (solo buscadores) */}
            {isBuscador && (
              <TabsContent value="pets">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <PawPrint className="h-5 w-5 text-primary" />
                          Mis Mascotas
                        </CardTitle>
                        <CardDescription>
                          Registrá a tus mascotas para facilitar la búsqueda de alquiler
                        </CardDescription>
                      </div>
                      {!showPetForm && !editingPet && (
                        <Button variant="hero" size="sm" onClick={() => setShowPetForm(true)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Agregar
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {showPetForm && (
                      <PetForm
                        onSave={() => {
                          setShowPetForm(false);
                          queryClient.invalidateQueries({ queryKey: ['user-pets', user?.id] });
                        }}
                        onCancel={() => setShowPetForm(false)}
                      />
                    )}

                    {editingPet && (
                      <PetForm
                        pet={editingPet}
                        onSave={() => {
                          setEditingPet(null);
                          queryClient.invalidateQueries({ queryKey: ['user-pets', user?.id] });
                        }}
                        onCancel={() => setEditingPet(null)}
                      />
                    )}

                    {petsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : userPets && userPets.length > 0 ? (
                      <div className="space-y-3">
                        {userPets.map((pet) => (
                          <div
                            key={pet.id}
                            className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">
                                {pet.species === 'perro' ? '🐶' : pet.species === 'gato' ? '🐱' : '🐾'}
                              </div>
                              <div>
                                <p className="font-semibold">{pet.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {[pet.breed, pet.age_years ? `${pet.age_years} años` : null, pet.weight_kg ? `${pet.weight_kg} kg` : null]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </p>
                                {pet.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{pet.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setEditingPet(pet); setShowPetForm(false); }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar a {pet.name}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción no se puede deshacer.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeletePet(pet.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      !showPetForm && (
                        <div className="text-center py-8">
                          <PawPrint className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                          <p className="text-muted-foreground mb-4">Todavía no registraste ninguna mascota</p>
                          <Button variant="hero" onClick={() => setShowPetForm(true)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Agregar mi primera mascota
                          </Button>
                        </div>
                      )
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
