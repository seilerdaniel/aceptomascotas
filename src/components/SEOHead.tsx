import { Helmet } from "react-helmet-async";

const SITE_NAME = "Acepto Mascotas";
const SITE_URL = "https://aceptomascotas.vercel.app";
const DEFAULT_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/mwfWjDRViCduZRi6ZxPNAxQmnKB3/social-images/social-1767833285974-ChatGPT Image 7 ene 2026, 21_47_54.png";

interface SEOHeadProps {
  /** Sin el sufijo del sitio — se agrega automáticamente. */
  title: string;
  description: string;
  /** Path relativo (ej. "/buscar") — se arma la URL completa acá adentro. */
  path: string;
  image?: string;
  /** "website" para listados/páginas generales, "product" para una propiedad o servicio puntual. */
  type?: "website" | "product";
  /** JSON-LD adicional específico de la página (ej. un solo Product/Service), además del
   * Organization/WebSite globales que ya viven en index.html. */
  structuredData?: Record<string, unknown>;
  /** No indexar esta página (ej. dashboards privados, checkout). */
  noIndex?: boolean;
}

// Componente central de SEO por ruta. index.html mantiene metadatos
// estáticos como fallback (lo que ven los crawlers que NO ejecutan
// JavaScript, como WhatsApp/Facebook/Twitter al generar la vista previa
// de un link compartido) — este componente los sobreescribe en tiempo
// de ejecución para crawlers que sí renderizan JS (Google, Bing) y para
// la pestaña del navegador. Ver nota en el commit: sin SSR/prerendering,
// los links compartidos en apps de mensajería van a seguir mostrando el
// og:image genérico del Home, no el de la propiedad/servicio puntual.
const SEOHead = ({
  title,
  description,
  path,
  image = DEFAULT_IMAGE,
  type = "website",
  structuredData,
  noIndex = false,
}: SEOHeadProps) => {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const url = `${SITE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content={type === "product" ? "product" : "website"} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {structuredData && (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      )}
    </Helmet>
  );
};

export default SEOHead;
