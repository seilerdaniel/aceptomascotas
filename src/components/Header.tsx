import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, Plus, Search, User, LogOut, Heart, Settings, PawPrint } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";
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

  const navLinks = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/buscar", label: "Buscar", icon: Search },
    { href: "/servicios", label: "Servicios", icon: PawPrint },
    { href: "/publicar", label: "Publicar", icon: Plus },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 transition-transform hover:scale-105">
          <img src={logo} alt="Acepto Mascotas" className="h-10 w-10" />
          <div className="flex flex-col">
            <span className="font-body text-lg font-bold leading-tight text-foreground">
              Acepto Mascotas
            </span>
            <span className="text-[10px] text-muted-foreground leading-none">
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
                    <DropdownMenuItem asChild>
                      <Link to="/favoritos" className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Mis Favoritos
                      </Link>
                    </DropdownMenuItem>
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

          <Link to="/publicar" className="ml-2">
            <Button variant="hero" size="sm">
              <Plus className="h-4 w-4" />
              Publicar Gratis
            </Button>
          </Link>
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
                    <Link to="/favoritos" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <Heart className="h-4 w-4" />
                        Mis Favoritos
                      </Button>
                    </Link>
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

            <Link to="/publicar" onClick={() => setIsMenuOpen(false)}>
              <Button variant="hero" className="w-full mt-2">
                <Plus className="h-4 w-4" />
                Publicar Gratis
              </Button>
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
