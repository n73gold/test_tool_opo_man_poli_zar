import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
  registerType: "autoUpdate",
  includeAssets: ["favicon.svg", "apple-touch-icon.png"],
  manifest: {
    name: "Test Oposiciones",
    short_name: "Oposiciones",
    description: "App de test de oposiciones",
    theme_color: "#ffffff",
    background_color: "#ffffff",
    display: "standalone",
    start_url: "/",
    icons: [
      {
        src: "/pwa-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/pwa-512x512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  },

  // 👇 ESTO ES CLAVE
  workbox: {
    globPatterns: [
      "**/*.{js,css,html,png,svg,ico,json}"
    ]
  }
})

  ]
});