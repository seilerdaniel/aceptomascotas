import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type OAuthProvider = "google" | "azure" | "apple" | "facebook";

const PROVIDERS: { id: OAuthProvider; label: string; logo: JSX.Element }[] = [
  {
    id: "google",
    label: "Google",
    logo: (
      <svg viewBox="0 0 24 24" className="h-4 w-4">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
  },
  {
    id: "azure",
    label: "Microsoft",
    logo: (
      <svg viewBox="0 0 24 24" className="h-4 w-4">
        <path fill="#F25022" d="M1 1h10v10H1z" />
        <path fill="#7FBA00" d="M13 1h10v10H13z" />
        <path fill="#00A4EF" d="M1 13h10v10H1z" />
        <path fill="#FFB900" d="M13 13h10v10H13z" />
      </svg>
    ),
  },
  {
    id: "apple",
    label: "Apple",
    logo: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M16.365 1.43c0 1.14-.415 2.203-1.244 3.19-.998 1.166-2.205 1.84-3.512 1.733a3.93 3.93 0 0 1-.03-.475c0-1.09.475-2.253 1.32-3.203.42-.478.955-.876 1.604-1.193.65-.312 1.264-.484 1.842-.517.02.155.02.31.02.465zm4.203 15.02c-.6 1.383-.888 2-1.665 3.227-1.086 1.71-2.617 3.837-4.518 3.855-1.69.017-2.126-1.1-4.421-1.09-2.294.012-2.772 1.107-4.464 1.09-1.9-.017-3.35-1.94-4.436-3.65C-1.13 15.98-.5 9.36 3.02 6.845c1.27-.9 2.65-1.44 3.9-1.44 1.29 0 2.1.71 3.17.71 1.03 0 1.66-.71 3.15-.71 1.15 0 2.37.63 3.24 1.72-2.85 1.56-2.39 5.63.09 6.62-.42 1.24-.62 1.79-1 2.72z" />
      </svg>
    ),
  },
  {
    id: "facebook",
    label: "Facebook",
    logo: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#1877F2">
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.13 8.44 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99C18.34 21.13 22 16.99 22 12z" />
      </svg>
    ),
  },
];

interface SocialAuthButtonsProps {
  disabled?: boolean;
}

const SocialAuthButtons = ({ disabled }: SocialAuthButtonsProps) => {
  const handleOAuth = async (provider: OAuthProvider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth`,
      },
    });
    if (error) {
      toast.error(`No se pudo iniciar sesión con ${provider}: ${error.message}`);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {PROVIDERS.map((p) => (
        <Button
          key={p.id}
          type="button"
          variant="outline"
          className="gap-2"
          disabled={disabled}
          onClick={() => handleOAuth(p.id)}
        >
          {p.logo}
          {p.label}
        </Button>
      ))}
    </div>
  );
};

export default SocialAuthButtons;
