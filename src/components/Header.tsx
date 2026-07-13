import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, Plus, Search, User, LogOut, Heart, Settings, PawPrint, Shield, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.svg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut, loading } = useAuth();
  const { data: isAdmin } = useIsAdmin();

  // Same queryKey ProfilePage uses, so React Query shares the cache
  // instead of firing a second network request.
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Publishing is only for propietario/agencia accounts. Admins don't get
  // the publish CTA even if their underlying profile has one of those
  // types, since the admin panel is their primary workspace.
  const canPublish =
    !isAdmin && (profile?.user_type === "propietario" || profile?.user_type === "agencia");

  const { data: lostPets = [] } = useQuery({
    queryKey: ["lost-pets"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_lost_pets" as any);
      if (error) throw error;
      return (data || []) as any[];
    },
    staleTime: 60 * 1000,
  });

  const navLinks = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/buscar", label: "Buscar", icon: Search },
    { href: "/servicios", label: "Servicios", icon: PawPrint },
    { href: "/quienes-somos", label: "Quiénes somos", icon: Heart },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 transition-transform hover:scale-105">
          <div className="h-10 w-10 rounded-full bg-white p-0.5 shrink-0 shadow-sm">
            <img src={logo} alt="Acepto Mascotas" className="h-full w-full rounded-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="font-body text-lg font-bold leading-tight text-foreground">
              Acepto Mascotas
            </span>
            <span className="text-[10px] text-muted-foreground leading-none min-[770px]:hidden min-[1020px]:block">
              Tu hogar, tu familia, tus mascotas
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.href} to={link.href}>
              <Button
                variant={isActive(link.href) ? "soft" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Button>
            </Link>
          ))}

          <Link to="/mascotas-perdidas">
            <Button
              variant={isActive("/mascotas-perdidas") ? "soft" : "ghost"}
              size="sm"
              className="gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 relative"
            >
              <AlertTriangle className="h-4 w-4" />
              Mascota Perdida
              {lostPets.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-600 dark:bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {lostPets.length}
                </span>
              )}
            </Button>
          </Link>
          
          {!loading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 ml-2">
                      <User className="h-4 w-4" />
                      Mi Cuenta
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/perfil" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Mi Perfil
                      </Link>
                    </DropdownMenuItem>
                    {!isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/favoritos" className="flex items-center gap-2">
                          <Heart className="h-4 w-4" />
                          Mis Favoritos
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Panel de Admin
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth" className="ml-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    Ingresar
                  </Button>
                </Link>
              )}
            </>
          )}

          {canPublish && (
            <Link to="/publicar" className="ml-2">
              <Button variant="hero" size="sm">
                <Plus className="h-4 w-4" />
                Publicar Gratis
              </Button>
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="md:hidden border-t bg-card animate-fade-in">
          <div className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href} onClick={() => setIsMenuOpen(false)}>
                <Button
                  variant={isActive(link.href) ? "soft" : "ghost"}
                  className="w-full justify-start gap-2"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Button>
              </Link>
            ))}

            <Link to="/mascotas-perdidas" onClick={() => setIsMenuOpen(false)}>
              <Button
                variant={isActive("/mascotas-perdidas") ? "soft" : "ghost"}
                className="w-full justify-start gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <AlertTriangle className="h-4 w-4" />
                Mascota Perdida
                {lostPets.length > 0 && (
                  <span className="ml-auto h-5 w-5 rounded-full bg-red-600 dark:bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                    {lostPets.length}
                  </span>
                )}
              </Button>
            </Link>
            
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link to="/perfil" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <Settings className="h-4 w-4" />
                        Mi Perfil
                      </Button>
                    </Link>
                    {!isAdmin && (
                      <Link to="/favoritos" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <Heart className="h-4 w-4" />
                          Mis Favoritos
                        </Button>
                      </Link>
                    )}
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <Shield className="h-4 w-4" />
                          Panel de Admin
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar Sesión
                    </Button>
                  </>
                ) : (
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full gap-2">
                      <User className="h-4 w-4" />
                      Ingresar
                    </Button>
                  </Link>
                )}
              </>
            )}

            {canPublish && (
              <Link to="/publicar" onClick={() => setIsMenuOpen(false)}>
                <Button variant="hero" className="w-full mt-2">
                  <Plus className="h-4 w-4" />
                  Publicar Gratis
                </Button>
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
