// Vercel Edge Middleware — soluciona un límite conocido de las SPA sin
// SSR: WhatsApp, Facebook, Twitter/X, LinkedIn, etc. generan la vista
// previa de un link leyendo el HTML estático de la primera respuesta,
// SIN ejecutar JavaScript — por eso, sin este middleware, compartir el
// link de una propiedad puntual siempre mostraba el título/imagen
// genéricos del Home (los de index.html), nunca los de esa propiedad.
//
// Esto NO reemplaza a SEOHead (que sigue sirviendo para el <title> real
// del navegador y para crawlers que sí ejecutan JS, como Google) — es
// un complemento específico para el caso de "vista previa al compartir
// un link", que solo se activa cuando detecta un User-Agent de bot
// conocido. Los usuarios reales nunca pasan por acá; siguen recibiendo
// la SPA normal.
//
// Ver también: la alternativa de fondo a esto (si algún día se quiere
// sacar del todo esta limitación) es migrar a un framework con SSR
// (Next.js) — ya está anotado como decisión pendiente en el banco de
// ideas. Este middleware es la solución práctica mientras tanto.

export const config = {
  matcher: ["/alquiler/:id", "/propiedad/:id", "/servicios/:id", "/agencia/:userId", "/mascota/:code"],
};

// Lista no exhaustiva pero cubre las apps de mensajería/redes más
// comunes en Argentina y el resto del mundo.
const BOT_USER_AGENT = /facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot|redditbot|Pinterest|vkShare|SkypeUriPreview|Applebot|W3C_Validator/i;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SITE_URL = "https://aceptomascotas.vercel.app";
const DEFAULT_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/mwfWjDRViCduZRi6ZxPNAxQmnKB3/social-images/social-1767833285974-ChatGPT Image 7 ene 2026, 21_47_54.png";

interface BotPageData {
  title: string;
  description: string;
  image?: string;
}

async function supabaseSelect(path: string): Promise<any> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data[0] ?? null : data;
  } catch {
    return null;
  }
}

async function getPropertyData(id: string): Promise<BotPageData | null> {
  const property = await supabaseSelect(
    `properties_public?id=eq.${id}&select=title,description,images,price,location`
  );
  if (!property) return null;
  return {
    title: `${property.title} — ${property.location} | Acepto Mascotas`,
    description:
      property.description?.slice(0, 155) ||
      `${property.title} en ${property.location}. Acepta mascotas.`,
    image: property.images?.[0],
  };
}

async function getServiceData(id: string): Promise<BotPageData | null> {
  const service = await supabaseSelect(
    `pet_services?id=eq.${id}&is_approved=eq.true&select=name,description,images,city,category`
  );
  if (!service) return null;
  return {
    title: `${service.name} — ${service.city} | Acepto Mascotas`,
    description: service.description?.slice(0, 155) || `${service.name} en ${service.city}.`,
    image: service.images?.[0],
  };
}

async function getAgencyData(userId: string): Promise<BotPageData | null> {
  const agency = await supabaseSelect(
    `profiles?user_id=eq.${userId}&select=full_name,avatar_url`
  );
  if (!agency) return null;
  return {
    title: `${agency.full_name || "Agencia"} — Acepto Mascotas`,
    description: `Propiedades pet-friendly publicadas por ${agency.full_name || "esta agencia"}.`,
    image: agency.avatar_url,
  };
}

async function getPetData(code: string): Promise<BotPageData | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_pet_by_qr_code`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const pet = Array.isArray(data) ? data[0] : data;
    if (!pet) return null;
    return {
      title: pet.is_lost ? `¿Viste a ${pet.pet_name}? | Acepto Mascotas` : `${pet.pet_name} | Acepto Mascotas`,
      description: pet.is_lost
        ? `${pet.pet_name} está perdido/a. Ayudanos a encontrarlo/a.`
        : `Perfil de ${pet.pet_name}, identificado con QR de Acepto Mascotas.`,
      image: pet.pet_images?.[0],
    };
  } catch {
    return null;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderBotHtml(data: BotPageData, url: string): string {
  const title = escapeHtml(data.title);
  const description = escapeHtml(data.description);
  const image = data.image || DEFAULT_IMAGE;

  return `<!doctype html>
<html lang="es-AR">
<head>
<meta charset="UTF-8" />
<title>${title}</title>
<meta name="description" content="${description}" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${image}" />
<meta property="og:site_name" content="Acepto Mascotas" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${image}" />
</head>
<body>
<p><a href="${url}">${title}</a></p>
</body>
</html>`;
}

export default async function middleware(request: Request) {
  const userAgent = request.headers.get("user-agent") || "";
  if (!BOT_USER_AGENT.test(userAgent)) {
    return; // No es un bot conocido: dejar pasar, la SPA se encarga normal.
  }

  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const [section, param] = segments;

  let data: BotPageData | null = null;
  if ((section === "alquiler" || section === "propiedad") && param) {
    data = await getPropertyData(param);
  } else if (section === "servicios" && param) {
    data = await getServiceData(param);
  } else if (section === "agencia" && param) {
    data = await getAgencyData(param);
  } else if (section === "mascota" && param) {
    data = await getPetData(param);
  }

  if (!data) {
    return; // No se encontró el recurso (o falló el fetch): dejar pasar a la SPA normal.
  }

  return new Response(renderBotHtml(data, `${SITE_URL}${url.pathname}`), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
