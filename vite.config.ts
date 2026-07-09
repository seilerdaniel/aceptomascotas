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
        // Don't cache Supabase API calls — always fetch fresh data for
        // listings, messages, etc. Only static assets get cached offline.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkOnly",
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
});