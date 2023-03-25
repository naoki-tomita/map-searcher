// vite.config.js
import { defineConfig } from "vite"

export default defineConfig({
  server: {
    proxy: {
      "/es": {
        target: "http://localhost:9200",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/es/, ""),
      },
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      }
    }
  }
});
