import { Heart, Mail, MapPin, Facebook, Instagram, Coffee, ShoppingBag, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.svg";

// TODO: número temporal (personal de Daniel). Reemplazar cuando esté
// disponible el número de WhatsApp Business dedicado a Acepto Mascotas.
const WHATSAPP_NUMBER = "5491131797343";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hola! Te escribo desde Acepto Mascotas, tengo una consulta."
)}`;

// Custom TikTok icon since lucide doesn't have it
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const Footer = () => {
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-white p-0.5 shrink-0 shadow-sm">
                <img loading="lazy" decoding="async" src={logo} alt="Acepto Mascotas" className="h-full w-full rounded-full object-cover" />
              </div>
              <span className="font-body text-xl font-bold text-foreground">
                Acepto Mascotas
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Conectamos familias con mascotas con hogares que las reciben con los brazos abiertos.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h3 className="font-body font-semibold text-foreground">Enlaces</h3>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary transition-colors">Inicio</Link>
              <Link to="/buscar" className="hover:text-primary transition-colors">Buscar Alquileres</Link>
              <Link to="/servicios" className="hover:text-primary transition-colors">Servicios</Link>
              <Link to="/tienda" className="hover:text-primary transition-colors flex items-center gap-1">
                <ShoppingBag className="h-3 w-3" /> Tienda
              </Link>
              <Link to="/faq" className="hover:text-primary transition-colors">Preguntas Frecuentes</Link>
              <Link to="/contacto" className="hover:text-primary transition-colors">Contacto</Link>
            </nav>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="font-body font-semibold text-foreground">Redes Sociales</h3>
            <nav className="flex items-center gap-4">
              <a 
                href="https://www.facebook.com/aceptomascotas" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="https://www.instagram.com/aceptomascotas" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://www.tiktok.com/@aceptomascotas?_r=1&_t=ZM-92szK72VIvj" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="TikTok"
              >
                <TikTokIcon className="h-5 w-5" />
              </a>
              <a 
                href="https://cafecito.app/aceptomascotas" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Cafecito"
              >
                <Coffee className="h-5 w-5" />
              </a>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-body font-semibold text-foreground">Contacto</h3>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a href="mailto:aceptomascotas@gmail.com" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Mail className="h-4 w-4" />
                <span>aceptomascotas@gmail.com</span>
              </a>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Argentina</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Links */}
        <div className="mt-8 pt-6 border-t flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <Link to="/privacidad" className="hover:text-primary transition-colors">
            Política de Privacidad
          </Link>
          <span className="hidden sm:inline">•</span>
          <Link to="/cookies" className="hover:text-primary transition-colors">
            Política de Cookies
          </Link>
          <span className="hidden sm:inline">•</span>
          <Link to="/terminos" className="hover:text-primary transition-colors">
            Términos y Condiciones
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Acepto Mascotas. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1">
            Hecho con <Heart className="h-4 w-4 text-accent fill-accent" /> para las mascotas
          </p>
        </div>

        <p className="mt-4 text-xs text-muted-foreground text-center max-w-2xl mx-auto">
          Acepto Mascotas es un espacio de conexión entre propietarios y buscadores de alquileres pet-friendly. No participamos en las transacciones ni garantizamos la veracidad de las publicaciones realizadas por los usuarios.
        </p>
      </div>
    </footer>
  );
};

export default Footer;