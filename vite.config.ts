import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:8083', // URL de votre backend
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, ''),
    //   },
    // },
    // Écoutez sur toutes les interfaces réseau dans Docker
    port: 5173,
    // allowedHosts: ["vps-72f35cc3.vps.ovh.ca", "ced-depannage.fr"],
    proxy: {
      "/api": {
        target: "http://rds_database:8083",
        changeOrigin: true,
        secure: false,
        headers: {
          "ngrok-skip-browser-warning": "69420",
        },
      },
    },
  },
});
