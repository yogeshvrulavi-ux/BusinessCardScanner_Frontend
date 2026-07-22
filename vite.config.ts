import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig(({ mode, command }) => {
  // vite.config runs before import.meta.env; load .env explicitly
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = (env.VITE_API_URL || process.env.VITE_API_URL || "").trim();
  // Amplify static hosting has no Node SSR runtime — build a prerendered SPA shell.
  const isAmplifyBuild = !!process.env.AMPLIFY;

  // Dev server proxy needs a backend target. Production build does not use the proxy,
  // but the client still needs VITE_API_URL baked in via loadEnv / Amplify env.
  if (command === "serve" && !apiTarget) {
    throw new Error(
      "VITE_API_URL is required for the Vite dev proxy. Set it in BusinessCardScanner_Frontend/.env",
    );
  }

  if (command === "build" && !apiTarget) {
    throw new Error(
      "VITE_API_URL is required for production builds. Set it in .env or CI (e.g. Amplify).",
    );
  }

  return {
    server: apiTarget
      ? {
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
        }
      : undefined,
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
    plugins: [
      tsConfigPaths(),
      tailwindcss(),
      tanstackStart(isAmplifyBuild ? { spa: { enabled: true } } : undefined),
      react(),
    ],
  };
});
