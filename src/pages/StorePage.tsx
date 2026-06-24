import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, MessageCircle } from "lucide-react";
import logo from "@/assets/logo.png";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  colors?: string[];
}

const products: Product[] = [
  {
    id: "remera-1",
    name: "Remera Acepto Mascotas",
    description: "Remera de algodón 100% con el logo de Acepto Mascotas. Ideal para pasear con tu mascota.",
    price: 15000,
    image: logo,
    category: "Ropa",
    colors: ["Blanco", "Negro", "Verde"]
  },
  {
    id: "remera-2",
    name: "Remera 'Mi Casa Es Tu Casa'",
    description: "Remera con diseño exclusivo para amantes de las mascotas. Mensaje pet-friendly.",
    price: 15000,
    image: logo,
    category: "Ropa",
    colors: ["Blanco", "Gris"]
  },
  {
    id: "gorra-1",
    name: "Gorra Acepto Mascotas",
    description: "Gorra bordada con el logo de Acepto Mascotas. Perfecta para días soleados.",
    price: 12000,
    image: logo,
    category: "Accesorios",
    colors: ["Negro", "Verde", "Beige"]
  },
  {
    id: "taza-1",
    name: "Taza Acepto Mascotas",
    description: "Taza de cerámica con capacidad de 350ml. Diseño exclusivo Acepto Mascotas.",
    price: 8000,
    image: logo,
    category: "Hogar"
  },
  {
    id: "taza-2",
    name: "Taza 'Hogar Pet-Friendly'",
    description: "Taza con mensaje motivacional para tu café matutino. Cerámica de alta calidad.",
    price: 8000,
    image: logo,
    category: "Hogar"
  },
  {
    id: "tote-1",
    name: "Tote Bag Acepto Mascotas",
    description: "Bolsa de tela reutilizable con el logo. Ideal para compras o paseos.",
    price: 10000,
    image: logo,
    category: "Accesorios"
  }
];

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0
  }).format(price);
};

const StorePage = () => {
  const handleWhatsAppOrder = (product: Product) => {
    const message = encodeURIComponent(
      `¡Hola! Me interesa comprar: ${product.name} (${formatPrice(product.price)}). ¿Podrían darme más información?`
    );
    window.open(`https://wa.me/5491112345678?text=${message}`, '_blank');
  };

  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-pet-green-light to-background py-16">
          <div className="container text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tienda Acepto Mascotas
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Llevá con orgullo el mensaje pet-friendly. Cada compra ayuda a mantener la plataforma gratuita.
            </p>
          </div>
        </section>

        {/* Products */}
        <section className="container py-12">
          {categories.map(category => (
            <div key={category} className="mb-12">
              <h2 className="font-display text-2xl font-semibold mb-6">{category}</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.filter(p => p.category === category).map(product => (
                  <Card key={product.id} className="overflow-hidden group hover:shadow-hover transition-all duration-300">
                    <div className="aspect-square bg-secondary/50 flex items-center justify-center p-8">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="h-32 w-32 object-contain opacity-80 group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        <Badge variant="secondary">{product.category}</Badge>
                      </div>
                      <p className="text-muted-foreground text-sm mb-4">
                        {product.description}
                      </p>
                      {product.colors && (
                        <div className="flex gap-2 mb-4">
                          {product.colors.map(color => (
                            <span key={color} className="text-xs bg-muted px-2 py-1 rounded-full">
                              {color}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xl text-primary">
                          {formatPrice(product.price)}
                        </span>
                        <Button 
                          size="sm" 
                          onClick={() => handleWhatsAppOrder(product)}
                          className="gap-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Consultar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Info */}
        <section className="bg-secondary/50 py-12">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-display text-2xl font-semibold mb-4">
                ¿Cómo comprar?
              </h2>
              <p className="text-muted-foreground mb-6">
                Hacé clic en "Consultar" en el producto que te interesa y te contactaremos por WhatsApp 
                para coordinar el pago y envío. Enviamos a todo el país.
              </p>
              <div className="grid gap-4 md:grid-cols-3 text-center">
                <div className="bg-card rounded-xl p-6 border">
                  <div className="text-2xl mb-2">1️⃣</div>
                  <p className="text-sm text-muted-foreground">Elegí tu producto</p>
                </div>
                <div className="bg-card rounded-xl p-6 border">
                  <div className="text-2xl mb-2">2️⃣</div>
                  <p className="text-sm text-muted-foreground">Contactanos por WhatsApp</p>
                </div>
                <div className="bg-card rounded-xl p-6 border">
                  <div className="text-2xl mb-2">3️⃣</div>
                  <p className="text-sm text-muted-foreground">Recibí tu pedido</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default StorePage;
