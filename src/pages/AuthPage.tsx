import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useQuery } from '@tanstack/react-query';
import SocialAuthButtons from '@/components/SocialAuthButtons';
import AlternativeAuthMethods from '@/components/AlternativeAuthMethods';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowLeft, PawPrint, Home, Building2, Stethoscope } from 'lucide-react';
import logo from "@/assets/logo.svg";
import loginBrandImage from "@/assets/login-brand.png";
import { z } from 'zod';
import SEOHead from '@/components/SEOHead';

const emailSchema = z.string().email('Email inválido').max(255, 'Email muy largo');

const passwordSchema = z.string()
  .min(8, 'Mínimo 8 caracteres')
  .max(72, 'Máximo 72 caracteres')
  .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
  .regex(/[a-z]/, 'Debe incluir al menos una minúscula')
  .regex(/[0-9]/, 'Debe incluir al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe incluir al menos un símbolo');

const fullNameSchema = z.string()
  .min(2, 'Mínimo 2 caracteres')
  .max(100, 'Máximo 100 caracteres')
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/, 'Solo letras, espacios y guiones')
  .transform(val => val.trim().replace(/\s+/g, ' '));

type UserType = 'buscador' | 'propietario' | 'agencia' | 'proveedor';

const userTypeOptions = [
  {
    value: 'buscador' as UserType,
    icon: PawPrint,
    title: 'Tengo mascotas',
    description: 'Busco alquiler que acepte mis mascotas',
  },
  {
    value: 'propietario' as UserType,
    icon: Home,
    title: 'Soy propietario',
    description: 'Tengo una propiedad y acepto mascotas',
  },
  {
    value: 'agencia' as UserType,
    icon: Building2,
    title: 'Soy agencia',
    description: 'Represento una inmobiliaria o agencia',
  },
  {
    value: 'proveedor' as UserType,
    icon: Stethoscope,
    title: 'Ofrezco un servicio',
    description: 'Soy veterinario/a, paseador/a u otro servicio para mascotas',
  },
];

// Shared split-screen layout for all 3 auth screens (form, user-type,
// forgot-password). Image + branding on the left (hidden on small screens),
// scrollable content on the right so a tall form never fights the page
// scroll — only this right panel scrolls.
const AuthLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex bg-background">
    <SEOHead
      title="Iniciar sesión / Registrarse"
      description="Ingresá o creá tu cuenta en Acepto Mascotas."
      path="/auth"
      noIndex
    />
    <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
      <img src={loginBrandImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent" />
      <div className="relative z-10 h-full flex flex-col justify-end p-12 text-primary-foreground">
        <div className="h-14 w-14 rounded-full bg-white p-1 shadow-sm mb-6">
          <img src={logo} alt="Acepto Mascotas" className="h-full w-full rounded-full object-cover" />
        </div>
        <h2 className="font-display text-3xl font-bold mb-3">
          Tu hogar, tu familia, tus mascotas
        </h2>
        <p className="text-primary-foreground/90 max-w-sm">
          Encontrá alquileres pet-friendly en toda Argentina, sin tener que elegir entre tu familia y tus mascotas.
        </p>
      </div>
    </div>

    <div
      className="flex-1 overflow-y-auto"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%231B2A4A' fill-opacity='0.04'%3E%3Cellipse cx='40' cy='48' rx='11' ry='9'/%3E%3Cellipse cx='27' cy='30' rx='4.2' ry='5.2'/%3E%3Cellipse cx='37' cy='24' rx='4.2' ry='5.2'/%3E%3Cellipse cx='48' cy='24' rx='4.2' ry='5.2'/%3E%3Cellipse cx='58' cy='30' rx='4.2' ry='5.2'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '80px 80px',
      }}
    >
      <div className="min-h-full flex items-center justify-center p-4 py-6">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  </div>
);

const AuthPage = () => {
  const navigate = useNavigate();
  const { user, signUp, signIn, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [step, setStep] = useState<'form' | 'user-type'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedUserType, setSelectedUserType] = useState<UserType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  const [passwordStrength, setPasswordStrength] = useState<string[]>([]);

  // Used to know whether a logged-in user still needs to pick a role —
  // relevant for accounts created via OAuth/magic link/phone, which skip
  // the normal signup form where user_type is set.
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();

  useEffect(() => {
    if (!user || profileLoading || isAdminLoading) return;
    if (!profile?.user_type) {
      // New account (OAuth/magic link/phone) without a role yet.
      setStep('user-type');
    } else {
      navigate(isAdmin ? '/admin' : '/');
    }
  }, [user, profile, profileLoading, isAdmin, isAdminLoading, navigate]);

  const checkPasswordStrength = (pwd: string) => {
    const missing: string[] = [];
    if (pwd.length < 8) missing.push('8+ caracteres');
    if (!/[A-Z]/.test(pwd)) missing.push('mayúscula');
    if (!/[a-z]/.test(pwd)) missing.push('minúscula');
    if (!/[0-9]/.test(pwd)) missing.push('número');
    if (!/[^A-Za-z0-9]/.test(pwd)) missing.push('símbolo (!@#$%)');
    setPasswordStrength(missing);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (!isLogin) checkPasswordStrength(newPassword);
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; fullName?: string } = {};

    try { emailSchema.parse(email); }
    catch (e) { if (e instanceof z.ZodError) newErrors.email = e.errors[0]?.message || 'Email inválido'; }

    try { passwordSchema.parse(password); }
    catch (e) { if (e instanceof z.ZodError) newErrors.password = e.errors[0]?.message || 'Contraseña inválida'; }

    if (!isLogin) {
      try { fullNameSchema.parse(fullName); }
      catch (e) { if (e instanceof z.ZodError) newErrors.fullName = e.errors[0]?.message || 'Nombre inválido'; }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email o contraseña incorrectos');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('¡Bienvenido de vuelta!');
        // No navigate() here on purpose — the useEffect above waits for
        // both the profile and isAdmin queries to settle before deciding
        // where to go, avoiding a race where isAdmin is still loading.
      }
    } else {
      // Registro: primero mostrar pantalla de tipo de usuario
      if (!validateForm()) return;
      setStep('user-type');
    }

    setSubmitting(false);
  };

  const handleUserTypeConfirm = async () => {
    if (!selectedUserType) {
      toast.error('Por favor seleccioná un tipo de cuenta');
      return;
    }

    setSubmitting(true);

    // Already-authenticated users (OAuth/magic link/phone) just need their
    // profile's user_type set — they don't go through signUp again.
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ user_type: selectedUserType })
        .eq('user_id', user.id);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('¡Bienvenido a Acepto Mascotas!');
        navigate(isAdmin ? '/admin' : '/');
      }
      setSubmitting(false);
      return;
    }

    const { error } = await signUp(email, password, fullName, selectedUserType);
    if (error) {
      if (error.message.includes('User already registered')) {
        toast.error('Este email ya está registrado');
        setStep('form');
      } else {
        toast.error(error.message);
        setStep('form');
      }
    } else {
      toast.success('¡Bienvenido a Acepto Mascotas!');
      navigate('/');
    }
    setSubmitting(false);
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      toast.error('Ingresá tu email para continuar');
      return;
    }
    try {
      emailSchema.parse(forgotEmail);
    } catch {
      toast.error('Email inválido');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error('Error al enviar el email: ' + error.message);
    } else {
      setForgotSent(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <SEOHead
          title="Iniciar sesión / Registrarse"
          description="Ingresá o creá tu cuenta en Acepto Mascotas."
          path="/auth"
          noIndex
        />
        <div className="animate-pulse">Cargando...</div>
      </div>
    );
  }

  // Pantalla de selección de tipo de usuario
  if (step === 'user-type') {
    return (
      <AuthLayout>
          <button
            onClick={() => setStep('form')}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>

          <Card className="shadow-hover">
            <CardHeader className="text-center space-y-4">
              <Link to="/" className="flex items-center justify-center gap-2">
                <div className="h-16 w-16 rounded-full bg-white p-1 shadow-sm">
                  <img src={logo} alt="Acepto Mascotas" className="h-full w-full rounded-full object-cover" />
                </div>
              </Link>
              <div>
                <CardTitle className="font-body text-2xl font-bold">
                  ¿Cómo vas a usar Acepto Mascotas?
                </CardTitle>
                <CardDescription className="mt-2">
                  Elegí el tipo de cuenta para personalizar tu experiencia
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {userTypeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedUserType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedUserType(option.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${isSelected ? 'bg-primary text-white' : 'bg-muted'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{option.title}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </button>
                );
              })}

              <Button
                variant="hero"
                className="w-full mt-2"
                onClick={handleUserTypeConfirm}
                disabled={!selectedUserType || submitting}
              >
                {submitting ? 'Creando cuenta...' : 'Crear mi cuenta'}
              </Button>
            </CardContent>
          </Card>
      </AuthLayout>
    );
  }

  // Pantalla de olvidé mi contraseña
  if (isForgotPassword) {
    return (
      <AuthLayout>
          <button
            onClick={() => { setIsForgotPassword(false); setForgotSent(false); setForgotEmail(''); }}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio de sesión
          </button>

          <Card className="shadow-hover">
            <CardHeader className="text-center space-y-4">
              <Link to="/" className="flex items-center justify-center gap-2">
                <div className="h-16 w-16 rounded-full bg-white p-1 shadow-sm">
                  <img src={logo} alt="Acepto Mascotas" className="h-full w-full rounded-full object-cover" />
                </div>
              </Link>
              <div>
                <CardTitle className="font-body text-2xl font-bold">
                  Recuperar contraseña
                </CardTitle>
                <CardDescription className="mt-2">
                  {forgotSent
                    ? 'Revisá tu casilla de email'
                    : 'Te enviamos un link para restablecer tu contraseña'}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {forgotSent ? (
                <div className="text-center space-y-4 py-4">
                  <div className="text-5xl">📬</div>
                  <p className="text-sm text-muted-foreground">
                    Te enviamos un email a <strong>{forgotEmail}</strong> con las instrucciones para restablecer tu contraseña.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Si no lo ves, revisá la carpeta de spam.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { setIsForgotPassword(false); setForgotSent(false); setForgotEmail(''); }}
                  >
                    Volver al inicio de sesión
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      placeholder="tu@email.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>
                  <Button variant="hero" className="w-full" onClick={handleForgotPassword}>
                    Enviar instrucciones
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
      </AuthLayout>
    );
  }

  // Pantalla principal de login/registro
  return (
    <AuthLayout>
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        <Card className="shadow-hover">
          <CardHeader className="text-center space-y-2 pb-4">
            <Link to="/" className="flex items-center justify-center gap-2">
              <div className="h-12 w-12 rounded-full bg-white p-1 shadow-sm">
                  <img src={logo} alt="Acepto Mascotas" className="h-full w-full rounded-full object-cover" />
                </div>
            </Link>
            <div>
              <CardTitle className="font-body text-xl font-bold">
                {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                {isLogin
                  ? 'Ingresá a tu cuenta para guardar favoritos'
                  : 'Registrate para guardar propiedades favoritas'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <SocialAuthButtons disabled={submitting} />

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">O con email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre completo</label>
                  <Input
                    type="text"
                    placeholder="Tu nombre"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Contraseña</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={handlePasswordChange}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
                {!isLogin && password && passwordStrength.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Falta:</span> {passwordStrength.join(', ')}
                  </div>
                )}
                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(true); setForgotEmail(email); }}
                      className="text-xs text-primary hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                variant="hero"
                className="w-full"
                disabled={submitting}
              >
                {submitting
                  ? 'Cargando...'
                  : isLogin
                  ? 'Iniciar Sesión'
                  : 'Continuar'}
              </Button>
            </form>

            {isLogin && (
              <div className="mt-4 pt-4 border-t">
                <AlternativeAuthMethods />
              </div>
            )}

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">
                {isLogin ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}
              </span>{' '}
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setErrors({}); setStep('form'); }}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? 'Registrate' : 'Iniciá sesión'}
              </button>
            </div>
          </CardContent>
        </Card>
    </AuthLayout>
  );
};

export default AuthPage;
