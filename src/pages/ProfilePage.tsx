import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import SEOHead from "@/components/SEOHead";
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { User, Phone, Loader2, Settings, PawPrint, Plus, Pencil, Trash2, MessageCircle, Info, Eye, EyeOff, AlertTriangle, LayoutDashboard, LogOut, Search, ShieldCheck, ShieldAlert, Upload } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PropertyImageManager from '@/components/PropertyImageManager';
import PetForm from '@/components/PetForm';
import PetQRCode from '@/components/PetQRCode';
import AvatarUpload from '@/components/AvatarUpload';
import { trackEvent } from '@/lib/analytics';
import { useFavorites } from '@/hooks/useFavorites';
import { useUserServices, useToggleServiceActive, useDeleteService, getCategoryLabel } from '@/hooks/useServices';
import EditServiceDialog from '@/components/EditServiceDialog';
import ImageUploadField from '@/components/ImageUploadField';
import ThemeToggle from '@/components/ThemeToggle';
import MarkPetLostDialog from '@/components/MarkPetLostDialog';
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
  qr_code: string | null;
  is_lost?: boolean;
  lost_since?: string | null;
}

// Componente interno para cambiar contraseña
const ChangePasswordForm = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<string[]>([]);

  const checkStrength = (pwd: string) => {
    const missing: string[] = [];
    if (pwd.length < 8) missing.push('8+ caracteres');
    if (!/[A-Z]/.test(pwd)) missing.push('mayúscula');
    if (!/[a-z]/.test(pwd)) missing.push('minúscula');
    if (!/[0-9]/.test(pwd)) missing.push('número');
    if (!/[^A-Za-z0-9]/.test(pwd)) missing.push('símbolo');
    setPasswordStrength(missing);
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Completá todos los campos');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (passwordStrength.length > 0) {
      toast.error('La contraseña no cumple los requisitos de seguridad');
      return;
    }

    setSaving(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error('Error al cambiar la contraseña: ' + error.message);
    } else {
      toast.success('Contraseña actualizada correctamente');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStrength([]);
    }

    setSaving(false);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="newPassword">Nueva contraseña</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showPasswords ? 'text' : 'password'}
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); checkStrength(e.target.value); }}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3"
            aria-label={showPasswords ? "Ocultar contraseña" : "Mostrar contraseña"}
            onClick={() => setShowPasswords(!showPasswords)}
          >
            {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {newPassword && passwordStrength.length > 0 && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Falta:</span> {passwordStrength.join(', ')}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
        <Input
          id="confirmPassword"
          type={showPasswords ? 'text' : 'password'}
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {confirmPassword && newPassword !== confirmPassword && (
          <p className="text-xs text-red-600 dark:text-red-400">Las contraseñas no coinciden</p>
        )}
      </div>
      <Button
        variant="outline"
        onClick={handleChangePassword}
        disabled={saving || !newPassword || !confirmPassword}
      >
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Actualizar contraseña
      </Button>
    </div>
  );
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut, deleteAccount } = useAuth();
  const queryClient = useQueryClient();
  const { favorites } = useFavorites();
  const { data: isAdmin } = useIsAdmin();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [hasWhatsapp, setHasWhatsapp] = useState(true);
  const [alternativePhone, setAlternativePhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
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
    staleTime: 0,
    refetchOnMount: 'always',
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

  // Fetch user's own services (any status, so they can see pending ones too)
  const { data: userServices, isLoading: servicesLoading } = useUserServices(user?.id);
  const toggleServiceActive = useToggleServiceActive();
  const deleteService = useDeleteService();

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
      setHasWhatsapp(profile.has_whatsapp ?? true);
      setAlternativePhone(profile.alternative_phone || '');
      setAvatarUrl(profile.avatar_url || null);
      setBannerUrl((profile as any).banner_url || null);
    }
  }, [profile]);

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user');
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
          has_whatsapp: hasWhatsapp,
          alternative_phone: alternativePhone.trim() || null,
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
    if (!phone.trim()) {
      toast.error('El teléfono es obligatorio. Es clave para que puedan contactarte si tu mascota se pierde.');
      return;
    }
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

  const handleToggleLost = async (
    petId: string,
    petName: string,
    markAsLost: boolean,
    lostLat?: number | null,
    lostLng?: number | null
  ) => {
    const { error } = await supabase
      .from('pets')
      .update({
        is_lost: markAsLost,
        lost_since: markAsLost ? new Date().toISOString() : null,
        lost_latitude: markAsLost ? lostLat ?? null : null,
        lost_longitude: markAsLost ? lostLng ?? null : null,
      } as any)
      .eq('id', petId);

    if (error) {
      toast.error('Error al actualizar el estado');
      return;
    }

    if (markAsLost) {
      toast.success(`${petName} fue marcada como perdida. Compartí su QR para correr la voz.`);
      trackEvent('pet_marked_lost', { pet_id: petId });
    } else {
      toast.success(`¡Qué alegría! ${petName} fue marcada como encontrada.`);
      trackEvent('pet_marked_found', { pet_id: petId });
    }
    queryClient.invalidateQueries({ queryKey: ['user-pets', user?.id] });
  };

  const handleToggleServiceActive = async (id: string, isActive: boolean) => {
    try {
      await toggleServiceActive.mutateAsync({ id, isActive });
      toast.success(isActive ? 'Servicio reactivado' : 'Servicio pausado');
    } catch {
      toast.error('Error al actualizar el servicio');
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      await deleteService.mutateAsync(id);
      toast.success('Servicio eliminado');
    } catch {
      toast.error('Error al eliminar el servicio');
    }
  };

  const userTypeLabel = {
    buscador: '🐾 Buscador',
    propietario: '🏠 Propietario',
    agencia: '🏢 Agencia',
    proveedor: '🩺 Proveedor de servicios',
  };

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <SEOHead title="Mi cuenta" description="Administrá tu perfil, propiedades, servicios y mascotas." path="/perfil" noIndex />
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
        <SEOHead title="Mi cuenta" description="Administrá tu perfil, propiedades, servicios y mascotas." path="/perfil" noIndex />
      <Header />
        <main className="flex-1 container py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  const isBuscador = !isAdmin && profile?.user_type === 'buscador';
  const showProperties = !isAdmin && (profile?.user_type === 'propietario' || profile?.user_type === 'agencia');
  const isProveedor = !isAdmin && profile?.user_type === 'proveedor';
  const showServices = isProveedor; // cuenta dedicada a ofrecer servicios, no todos los roles

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead title="Mi cuenta" description="Administrá tu perfil, propiedades, servicios y mascotas." path="/perfil" noIndex />
      <Header />
      {!isAdmin && profile?.user_type === 'agencia' && bannerUrl && (
        <div className="w-full aspect-[5/1] bg-secondary overflow-hidden">
          <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            {user && (
              <AvatarUpload
                userId={user.id}
                currentAvatarUrl={avatarUrl}
                onUploaded={(url) => setAvatarUrl(url)}
                onRemove={() => setAvatarUrl(null)}
              />
            )}
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-primary" />
              <div>
                <h1 className="font-display text-3xl font-bold">Mi Cuenta</h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <p className="text-muted-foreground truncate">{user?.email}</p>
                  {profile?.user_type && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium w-fit">
                      {isAdmin ? '🛡️ Administrador' : userTypeLabel[profile.user_type as keyof typeof userTypeLabel]}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue={isAdmin ? 'profile' : 'resumen'} className="space-y-6">
            <TabsList className="flex flex-wrap h-auto justify-start gap-1 w-full max-w-2xl">
              {!isAdmin && <TabsTrigger value="resumen">Resumen</TabsTrigger>}
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              {showProperties && (
                <TabsTrigger value="properties">Mis Propiedades</TabsTrigger>
              )}
              {isBuscador && (
                <TabsTrigger value="pets">Mis Mascotas</TabsTrigger>
              )}
              {showServices && (
                <TabsTrigger value="services">Mis Servicios</TabsTrigger>
              )}
              <TabsTrigger value="settings">Configuración</TabsTrigger>
            </TabsList>

            {/* TAB: Resumen (no aplica para admin, ver pestaña Configuración) */}
            {!isAdmin && (
            <TabsContent value="resumen" className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-xl font-semibold">
                    {isBuscador ? 'Tu panel' : isProveedor ? 'Panel de proveedor' : profile?.user_type === 'agencia' ? 'Panel de agencia' : 'Panel de propietario'}
                  </h2>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </Button>
              </div>

              {/* Estado de verificación (solo agencias, no admin) */}
              {!isAdmin && profile?.user_type === 'agencia' && (
                <Card className={(profile as any).is_verified ? 'border-primary/40 bg-primary/5' : ''}>
                  <CardContent className="pt-6 flex items-center gap-3">
                    {(profile as any).is_verified ? (
                      <>
                        <ShieldCheck className="h-8 w-8 text-primary shrink-0" />
                        <div>
                          <p className="font-semibold">Agencia verificada</p>
                          <p className="text-sm text-muted-foreground">
                            Tus publicaciones muestran el badge de verificación.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="h-8 w-8 text-muted-foreground shrink-0" />
                        <div>
                          <p className="font-semibold">Verificación pendiente</p>
                          <p className="text-sm text-muted-foreground">
                            Escribinos por WhatsApp o email para solicitar la verificación de tu cuenta.
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Banner de vidriera pública (solo agencias, no admin) */}
              {!isAdmin && profile?.user_type === 'agencia' && user && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Imagen de portada de tu vidriera</CardTitle>
                    <CardDescription>
                      Se muestra en tu página pública de agencia, junto a tu foto de perfil.{' '}
                      <Link to={`/agencia/${user.id}`} className="text-primary hover:underline">
                        Ver mi página pública
                      </Link>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ImageUploadField
                      bucket="avatars"
                      folderPath={user.id}
                      filePrefix="banner"
                      currentUrl={bannerUrl}
                      shape="banner"
                      onUploaded={async (url) => {
                        setBannerUrl(url);
                        const { error } = await supabase
                          .from('profiles')
                          .update({ banner_url: url } as any)
                          .eq('user_id', user.id);
                        if (error) toast.error('Error al guardar la portada');
                      }}
                      onRemove={async () => {
                        setBannerUrl(null);
                        const { error } = await supabase
                          .from('profiles')
                          .update({ banner_url: null } as any)
                          .eq('user_id', user.id);
                        if (error) toast.error('Error al quitar la portada');
                      }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Stats + accesos rápidos */}
              <div className="grid gap-4 sm:grid-cols-2">
                {isBuscador ? (
                  <>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-3xl font-bold text-primary">{userPets?.length ?? 0}</p>
                        <p className="text-sm text-muted-foreground">Mascotas registradas</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-3xl font-bold text-primary">{favorites?.length ?? 0}</p>
                        <p className="text-sm text-muted-foreground">Propiedades favoritas</p>
                      </CardContent>
                    </Card>
                  </>
                ) : isProveedor ? (
                  <>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-3xl font-bold text-primary">
                          {userServices?.filter((s: any) => s.is_approved).length ?? 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Servicios aprobados</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-3xl font-bold text-primary">{userServices?.length ?? 0}</p>
                        <p className="text-sm text-muted-foreground">Servicios publicados</p>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-3xl font-bold text-primary">
                          {userProperties?.filter((p: any) => p.is_active).length ?? 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Propiedades activas</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-3xl font-bold text-primary">{userProperties?.length ?? 0}</p>
                        <p className="text-sm text-muted-foreground">Propiedades totales</p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {/* Accesos rápidos por rol */}
              <div className="flex flex-wrap gap-3">
                {isBuscador ? (
                  <>
                    <Link to="/buscar">
                      <Button variant="outline" className="gap-2">
                        <Search className="h-4 w-4" />
                        Buscar alquileres
                      </Button>
                    </Link>
                    <Link to="/favoritos">
                      <Button variant="outline" className="gap-2">
                        <PawPrint className="h-4 w-4" />
                        Ver mis favoritos
                      </Button>
                    </Link>
                  </>
                ) : isProveedor ? (
                  <Link to="/servicios/publicar">
                    <Button variant="hero" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Publicar nuevo servicio
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/publicar">
                      <Button variant="hero" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Publicar nueva propiedad
                      </Button>
                    </Link>
                    {profile?.user_type === 'agencia' && (
                      <Link to="/publicar/importar">
                        <Button variant="outline" className="gap-2">
                          <Upload className="h-4 w-4" />
                          Importar por CSV
                        </Button>
                      </Link>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
            )}

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
                      <Label htmlFor="phone">
                        Teléfono <span className="text-red-600 dark:text-red-400">*</span>
                      </Label>
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
                          required
                        />
                      </div>
                      <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3 mt-2">
                        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          Recomendamos cargar tu teléfono: si tu mascota se pierde, es la forma en que
                          otras personas van a poder contactarte rápidamente.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <Checkbox
                          id="hasWhatsapp"
                          checked={hasWhatsapp}
                          onCheckedChange={(checked) => setHasWhatsapp(checked === true)}
                        />
                        <Label htmlFor="hasWhatsapp" className="flex items-center gap-1.5 font-normal cursor-pointer">
                          <MessageCircle className="h-4 w-4 text-green-600" />
                          Este teléfono tiene WhatsApp
                        </Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alternativePhone">
                        Teléfono alternativo <span className="text-muted-foreground font-normal">(opcional)</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="alternativePhone"
                          type="tel"
                          placeholder="Otro número de contacto"
                          value={alternativePhone}
                          onChange={(e) => setAlternativePhone(e.target.value)}
                          className="pl-10"
                          maxLength={20}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Útil si tu teléfono principal no tiene WhatsApp
                      </p>
                    </div>
                    <Button type="submit" variant="hero" disabled={isSaving}>
                      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Guardar cambios
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Configuración (disponible para todos los roles, incluido admin) */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Apariencia</CardTitle>
                  <CardDescription>Elegí cómo querés ver Acepto Mascotas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ThemeToggle />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cambiar contraseña</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChangePasswordForm />
                </CardContent>
              </Card>

              <Card className="border-destructive/30">
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400">Zona de peligro</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Mis Propiedades (solo propietario/agencia) */}
            {showProperties && (
              <TabsContent value="properties">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <CardTitle>Mis Propiedades</CardTitle>
                        <CardDescription>Administrá tus propiedades publicadas</CardDescription>
                      </div>
                      <Link to="/publicar">
                        <Button variant="hero" size="sm" className="gap-2">
                          <Plus className="h-4 w-4" />
                          Publicar propiedad
                        </Button>
                      </Link>
                    </div>
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
                        <p className="text-muted-foreground">Todavía no publicaste ninguna propiedad</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* TAB: Mis Mascotas (solo buscadores) */}
            {isBuscador && (
              <TabsContent value="pets">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-3">
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
                            className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border ${
                              pet.is_lost ? 'bg-destructive/5 border-destructive/30' : 'bg-muted/30'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">
                                {pet.species === 'perro' ? '🐶' : pet.species === 'gato' ? '🐱' : '🐾'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">{pet.name}</p>
                                  {pet.is_lost && (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full">
                                      <AlertTriangle className="h-3 w-3" />
                                      Perdida
                                    </span>
                                  )}
                                </div>
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
                            <div className="flex flex-wrap gap-2">
                              {pet.qr_code && (
                                pet.is_lost ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                    onClick={() => handleToggleLost(pet.id, pet.name, false)}
                                  >
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Encontrada
                                  </Button>
                                ) : (
                                  <MarkPetLostDialog
                                    petName={pet.name}
                                    onConfirm={(lat, lng) => handleToggleLost(pet.id, pet.name, true, lat, lng)}
                                  />
                                )
                              )}
                              <PetQRCode
                                petId={pet.id}
                                petName={pet.name}
                                existingQrCode={pet.qr_code}
                                onGenerated={() => queryClient.invalidateQueries({ queryKey: ['user-pets', user?.id] })}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                aria-label="Editar mascota"
                                onClick={() => { setEditingPet(pet); setShowPetForm(false); }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive-outline" size="icon" aria-label="Eliminar mascota">
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

            {/* TAB: Mis Servicios (disponible para cualquier usuario, excepto admin) */}
            {showServices && (
            <TabsContent value="services">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <CardTitle>Mis Servicios</CardTitle>
                      <CardDescription>
                        Publicá tu veterinaria, paseos, adiestramiento u otro servicio pet-friendly
                      </CardDescription>
                    </div>
                    <Link to="/servicios/publicar">
                      <Button variant="hero" size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Publicar servicio
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {servicesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : userServices && userServices.length > 0 ? (
                    <div className="space-y-3">
                      {userServices.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 flex-wrap gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold">{service.name}</p>
                              {service.is_approved ? (
                                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                  Aprobado
                                </span>
                              ) : (
                                <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                                  Pendiente de aprobación
                                </span>
                              )}
                              {!service.is_active && (
                                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                  Pausado
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {getCategoryLabel(service.category)} · {service.city}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleServiceActive(service.id, !service.is_active)}
                            >
                              {service.is_active ? 'Pausar' : 'Reactivar'}
                            </Button>
                            <EditServiceDialog service={service} />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive-outline" size="icon" aria-label="Eliminar servicio">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar este servicio?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. La publicación de "{service.name}" se va a borrar por completo.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteService(service.id)}
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
                    <div className="text-center py-8 space-y-3">
                      <p className="text-muted-foreground">Todavía no publicaste ningún servicio</p>
                      <Link to="/servicios/publicar">
                        <Button variant="outline" className="gap-2">
                          <Plus className="h-4 w-4" />
                          Publicar mi primer servicio
                        </Button>
                      </Link>
                    </div>
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
