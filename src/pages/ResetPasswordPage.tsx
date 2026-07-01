import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import logo from '@/assets/logo.svg';
import { z } from 'zod';

const passwordSchema = z.string()
  .min(8, 'Mínimo 8 caracteres')
  .max(72, 'Máximo 72 caracteres')
  .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
  .regex(/[a-z]/, 'Debe incluir al menos una minúscula')
  .regex(/[0-9]/, 'Debe incluir al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe incluir al menos un símbolo');

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const handleReset = async () => {
    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        toast.error(e.errors[0]?.message || 'Contraseña inválida');
        return;
      }
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error('Error al actualizar la contraseña: ' + error.message);
    } else {
      toast.success('¡Contraseña actualizada correctamente!');
      navigate('/');
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-hover">
          <CardHeader className="text-center space-y-4">
            <Link to="/" className="flex items-center justify-center gap-2">
              <img src={logo} alt="Acepto Mascotas" className="h-16 w-16" />
            </Link>
            <div>
              <CardTitle className="font-body text-2xl font-bold">
                Nueva contraseña
              </CardTitle>
              <CardDescription className="mt-2">
                Elegí una contraseña segura para tu cuenta
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nueva contraseña</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); checkStrength(e.target.value); }}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {password && passwordStrength.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Falta:</span> {passwordStrength.join(', ')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Confirmar contraseña</label>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">Las contraseñas no coinciden</p>
              )}
            </div>

            <Button
              variant="hero"
              className="w-full"
              onClick={handleReset}
              disabled={submitting || !password || !confirmPassword || passwordStrength.length > 0}
            >
              {submitting ? 'Guardando...' : 'Guardar nueva contraseña'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
