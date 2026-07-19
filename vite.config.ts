import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico"],
      manifest: {
        name: "Acepto Mascotas",
        short_name: "Acepto Mascotas",
        description: "Alquileres pet-friendly en Argentina: encontrá tu próximo hogar sin tener que elegir entre tu familia y tus mascotas.",
        theme_color: "#1B2A4A",
        background_color: "#FFFFFF",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Default limit is 2MB; the app's main bundle is currently ~3MB.
        // Raising this avoids failing the build, but the bundle size itself
        // is worth trimming down later (see note below).
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        // Se activa la versión nueva del Service Worker apenas se instala
        // (sin esperar a que se cierren todas las pestañas viejas) — es lo
        // mismo que ya hacía registerType:"autoUpdate" del lado del
        // cliente, pero puesto acá también de forma explícita.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Don't cache Supabase API calls — always fetch fresh data for
        // listings, messages, etc. Only static assets get cached offline.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkOnly",
          },
          {
            // Las navegaciones (cargar una página, incluido un reload)
            // van siempre a la red primero. Sin esto, precacheAndRoute
            // podía seguir sirviendo un index.html viejo desde el caché
            // del Service Worker incluso después de un reload completo —
            // esto es lo que hacía que recargar la página, ante un chunk
            // roto por un deploy nuevo, no solucionara nada: seguía
            // trayendo referencias viejas a archivos que ya no existen.
            // Con 3 segundos de timeout cae a la versión cacheada si la
            // red tarda demasiado (ej. sin conexión), para no dejar al
            // usuario sin nada.
            urlPattern: ({ request }: { request: Request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "navigations",
              networkTimeoutSeconds: 3,
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Separa vendors pesados en sus propios chunks: cachean aparte del
        // código de la app (que cambia mucho más seguido) y no todos se
        // descargan en rutas que no los necesitan, sumado al
        // code-splitting por ruta ya aplicado en App.tsx.
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-supabase": ["@supabase/supabase-js", "@supabase/ssr"],
          "vendor-mapbox": ["mapbox-gl"],
          "vendor-radix": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-aspect-ratio",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-context-menu",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-hover-card",
            "@radix-ui/react-label",
            "@radix-ui/react-menubar",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-progress",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slider",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-toggle",
            "@radix-ui/react-toggle-group",
            "@radix-ui/react-tooltip",
          ],
        },
      },
    },
  },
});