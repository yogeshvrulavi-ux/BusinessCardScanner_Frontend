import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

const apiTarget = process.env.VITE_API_URL;
if (!apiTarget) {
  throw new Error(
    "VITE_API_URL is required for the Vite proxy. Set it in BusinessCardScanner_Frontend/.env",
  );
}

export default defineConfig({
  server: {
    proxy: {
      "/admin": { target: apiTarget, changeOrigin: true },
      // Proxy API paths only — do not steal SPA route GET /contacts (Contacts page)
      "/contacts": {
        target: apiTarget,
        changeOrigin: true,
        bypass(req) {
          const path = (req.url ?? "").split("?")[0];
          if (path !== "/contacts" && path !== "/contacts/") return;
          const accept = req.headers.accept ?? "";
          if (accept.includes("text/html")) return req.url;
          if (req.headers["sec-fetch-mode"] === "navigate") return req.url;
        },
      },
      "/health": { target: apiTarget, changeOrigin: true },
      "/integrations": { target: apiTarget, changeOrigin: true },
      "/api": { target: apiTarget, changeOrigin: true },
    },
  },
  optimizeDeps: {
    include: ["framer-motion", "motion-dom", "motion-utils"],
  },
  ssr: {
    // victory-vendor (recharts → d3-shape) is CJS; must bundle for SSR ESM loader
    noExternal: [
      "echarts",
      "recharts",
      "victory-vendor",
      "@reduxjs/toolkit",
      "react-redux",
      "framer-motion",
      "motion-dom",
      "motion-utils",
    ],
  },
  plugins: [tsConfigPaths(), tailwindcss(), tanstackStart(), react()],
});
