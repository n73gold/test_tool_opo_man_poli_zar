import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/test_tool_opo_man_poli_zar/", // 👈 MUY IMPORTANTE
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
        start_url: "/test_tool_opo_man_poli_zar/", // 👈 MUY IMPORTANTE
        icons: [
          {
            src: "pwa-192x192.png", // 👈 SIN /
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "pwa-512x512.png", // 👈 SIN /
            sizes: "512x512",
            type: "image/png"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,json}"]
      }
    })
  ]
});