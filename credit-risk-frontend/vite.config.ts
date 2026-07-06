import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Batch Scoring API (separate service — score-report persistence,
      // CSV export). Assumed to run on :8001; change the target below if
      // yours runs elsewhere. Declared before "/api" so it's matched first.
      "/api/batch": {
        target: "http://localhost:8001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/batch/, ""),
      },
      // Individual-scoring API (POST /score, GET /psi, GET /health).
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
