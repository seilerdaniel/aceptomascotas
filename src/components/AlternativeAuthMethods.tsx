import { useState } from "react";
import { Mail, Phone, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Mode = "picker" | "magic-link-form" | "magic-link-sent" | "phone-form" | "phone-otp";

const AlternativeAuthMethods = () => {
  const [mode, setMode] = useState<Mode>("picker");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendMagicLink = async () => {
    if (!email.trim()) {
      toast.error("Ingresá tu email");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setLoading(false);
    if (error) {
      console.error("Magic link error:", error);
      toast.error(error.message || "No se pudo enviar el link. Revisá la consola para más detalle.");
      return;
    }
    setMode("magic-link-sent");
  };

  const handleSendPhoneOtp = async () => {
    if (!phone.trim()) {
      toast.error("Ingresá tu número de teléfono con código de país (ej: +5491122334455)");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: phone.trim() });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Te enviamos un código por SMS");
    setMode("phone-otp");
  };

  const handleVerifyPhoneOtp = async () => {
    if (otpCode.trim().length < 4) {
      toast.error("Ingresá el código completo");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: phone.trim(),
      token: otpCode.trim(),
      type: "sms",
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    }
    // On success, useAuth's session listener picks it up and AuthPage redirects.
  };

  if (mode === "picker") {
    return (
      <div className="flex items-center justify-center gap-4 text-sm">
        <button
          type="button"
          onClick={() => setMode("magic-link-form")}
          className="text-primary hover:underline inline-flex items-center gap-1"
        >
          <Mail className="h-3.5 w-3.5" />
          Link mágico
        </button>
        <span className="text-muted-foreground">·</span>
        <button
          type="button"
          onClick={() => setMode("phone-form")}
          className="text-primary hover:underline inline-flex items-center gap-1"
        >
          <Phone className="h-3.5 w-3.5" />
          Con teléfono
        </button>
      </div>
    );
  }

  const BackButton = ({ onClick }: { onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
    >
      <ArrowLeft className="h-3 w-3" />
      Volver
    </button>
  );

  if (mode === "magic-link-form") {
    return (
      <div className="space-y-3">
        <BackButton onClick={() => setMode("picker")} />
        <p className="text-xs text-muted-foreground">
          Te mandamos un link a tu email — lo abrís y entrás, sin contraseña.
        </p>
        <Input
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button variant="outline" className="w-full" onClick={handleSendMagicLink} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enviar link mágico
        </Button>
      </div>
    );
  }

  if (mode === "magic-link-sent") {
    return (
      <div className="text-center space-y-2 text-sm">
        <Mail className="h-8 w-8 text-primary mx-auto" />
        <p className="font-medium">Revisá tu email</p>
        <p className="text-muted-foreground text-xs">
          Te mandamos un link a <strong>{email}</strong>. Abrilo desde este mismo dispositivo para entrar.
        </p>
        <BackButton onClick={() => setMode("picker")} />
      </div>
    );
  }

  if (mode === "phone-form") {
    return (
      <div className="space-y-3">
        <BackButton onClick={() => setMode("picker")} />
        <p className="text-xs text-muted-foreground">
          Te mandamos un código por SMS para entrar sin contraseña.
        </p>
        <Input
          type="tel"
          placeholder="+5491122334455"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Button variant="outline" className="w-full" onClick={handleSendPhoneOtp} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enviar código por SMS
        </Button>
      </div>
    );
  }

  // phone-otp
  return (
    <div className="space-y-3">
      <BackButton onClick={() => setMode("phone-form")} />
      <p className="text-xs text-muted-foreground">
        Ingresá el código que te llegó por SMS a {phone}
      </p>
      <Input
        inputMode="numeric"
        placeholder="123456"
        value={otpCode}
        onChange={(e) => setOtpCode(e.target.value)}
        maxLength={6}
      />
      <Button variant="hero" className="w-full" onClick={handleVerifyPhoneOtp} disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Confirmar código
      </Button>
    </div>
  );
};

export default AlternativeAuthMethods;
