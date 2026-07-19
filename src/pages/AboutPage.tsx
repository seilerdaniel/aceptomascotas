import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import SEOHead from '@/components/SEOHead';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Heart, Home, PawPrint, Shield } from 'lucide-react';

const PHOTO_FOUNDER = 'https://xqxbzqufbfdjckcyxfyq.supabase.co/storage/v1/object/public/public-assets/perfil.jpg';
const PHOTO_DOGS = 'https://xqxbzqufbfdjckcyxfyq.supabase.co/storage/v1/object/public/public-assets/ringo-roco.jpg';

const AboutPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Quiénes somos"
        description="Conocé la historia detrás de Acepto Mascotas: una plataforma creada por y para familias con mascotas."
        path="/quienes-somos"
      />
      <Header />

      <main className="flex-1">

        {/* Hero */}
        <section className="bg-primary text-white py-20 px-4">
          <div className="container max-w-3xl mx-auto text-center space-y-4">
            <div className="flex justify-center mb-4">
              <PawPrint className="h-12 w-12 opacity-80" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold">
              Quiénes somos
            </h1>
            <p className="text-lg text-white/80 max-w-xl mx-auto">
              Una historia que nació de una necesidad real, con dos perros pequeños y mucho amor de por medio.
            </p>
          </div>
        </section>

        {/* Historia */}
        <section className="py-16 px-4">
          <div className="container max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="font-display text-3xl font-bold text-foreground">
                El origen de Acepto Mascotas
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                En noviembre de 2022, finalizó el contrato de alquiler donde vivía. Como muchas familias argentinas, salieron a buscar un nuevo hogar — pero con una particularidad: tenían dos perros pequeños, <strong>Ringo</strong> y <strong>Roco</strong>.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Encontrar un alquiler que los aceptara fue una experiencia frustrante y agotadora. Cuando finalmente lo lograron, Daniel pensó: <em>"¿Cuántas familias más están pasando por lo mismo?"</em>
              </p>
              <p className="text-muted-foreground leading-relaxed">
                En diciembre de 2022 nació <strong>Acepto Mascotas</strong>: un portal donde solo aparezcan propiedades verificadas y seguras para personas y familias con mascotas.
              </p>
            </div>

            {/* Cards de los tres perros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="rounded-2xl overflow-hidden shadow-lg bg-card border">
                <img loading="lazy" decoding="async"
                  src={PHOTO_DOGS}
                  alt="Ringo y Roco"
                  className="w-full aspect-square object-cover"
                />
                <div className="p-4 text-center">
                  <p className="font-semibold">Ringo y Roco</p>
                  <p className="text-xs text-muted-foreground mt-1">Los que inspiraron todo 🐾</p>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden shadow-lg bg-card border">
                <img loading="lazy" decoding="async"
                  src="https://xqxbzqufbfdjckcyxfyq.supabase.co/storage/v1/object/public/public-assets/reina.jpg"
                  alt="Reina"
                  className="w-full aspect-square object-cover"
                />
                <div className="p-4 text-center">
                  <p className="font-semibold">Reina</p>
                  <p className="text-xs text-muted-foreground mt-1">La última en sumarse a la familia 🌭👑</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Founder */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="rounded-2xl overflow-hidden shadow-lg order-2 md:order-1">
                <img loading="lazy" decoding="async"
                  src={PHOTO_FOUNDER}
                  alt="Soy Daniel, fundador de Acepto Mascotas"
                  className="w-full h-full object-cover aspect-square"
                />
              </div>
              <div className="space-y-5 order-1 md:order-2">
                <h2 className="font-display text-3xl font-bold text-foreground">
                  Daniel, fundador de Acepto Mascotas
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Soy Daniel, un desarrollador de Buenos Aires y creador de Acepto Mascotas.

                  La idea nació a partir de una experiencia personal: encontrar un lugar donde vivir junto a mis mascotas no siempre fue sencillo. Esa dificultad se transformó en la motivación para crear una plataforma pensada para ayudar a miles de familias argentinas que buscan alquileres donde sus compañeros de cuatro patas también sean bienvenidos.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Estoy construyendo este proyecto con dedicación, aprendiendo y mejorando cada día para crear una solución que genere un impacto real.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Mi inspiración también viene de casa: <strong>Ringo, Roco y Reina</strong> mi perrita salchicha, son parte fundamental de esta historia y del motivo por el que Acepto Mascotas existe. 🌭👑
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Valores */}
        <section className="py-16 px-4">
          <div className="container max-w-4xl mx-auto">
            <h2 className="font-display text-3xl font-bold text-center mb-12">
              Lo que nos mueve
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
              <div className="text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Las mascotas son familia</h3>
                <p className="text-sm text-muted-foreground">
                  Creemos que tener una mascota no debería ser un obstáculo para encontrar un hogar digno.
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Confianza y verificación</h3>
                <p className="text-sm text-muted-foreground">
                  Cada propiedad publicada está verificada. No queremos cantidad, queremos calidad y seguridad.
                </p>
              </div>
              <div className="text-center space-y-3 sm:col-span-2 md:col-span-1">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Home className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Un hogar para todos</h3>
                <p className="text-sm text-muted-foreground">
                  Conectamos familias con propietarios que entienden que una mascota bien cuidada es un buen inquilino.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-primary text-white">
          <div className="container max-w-2xl mx-auto text-center space-y-6">
            <PawPrint className="h-10 w-10 mx-auto opacity-80" />
            <h2 className="font-display text-3xl font-bold">
              ¿Tenés una mascota y buscás alquiler?
            </h2>
            <p className="text-white/80">
              Encontrá propiedades que aceptan mascotas en toda Argentina.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/buscar">
                <Button variant="secondary" size="lg">
                  Buscar propiedades
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  Crear cuenta gratis
                </Button>
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
