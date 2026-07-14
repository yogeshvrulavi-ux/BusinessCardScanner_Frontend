import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import netlify from "@netlify/vite-plugin-tanstack-start";

const apiTarget = process.env.VITE_API_URL || "http://127.0.0.1:5000";

/** Netlify functions-serve breaks SSR deps (e.g. recharts → @reduxjs/toolkit) during `vite dev`. */
const isViteDev = process.argv.includes("dev");
const isLocalProdBuild = process.argv.some((arg) => arg.includes("development"));
/** Disable the Netlify adapter when building for AWS Amplify (static SPA deploy). */
const isAmplifyBuild = !!process.env.AMPLIFY;
const enableNetlifyPlugin = !isViteDev && !isLocalProdBuild && !isAmplifyBuild;

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
    // victory-vendor (recharts → d3-shape) is CJS; must bundle for Netlify SSR ESM loader
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
    // Amplify has no SSR runtime here — build a prerendered SPA shell (dist/client/index.html)
    // so the static deploy can boot. Netlify keeps full SSR via its adapter below.
    tanstackStart(isAmplifyBuild ? { spa: { enabled: true } } : undefined),
    ...(enableNetlifyPlugin ? [netlify()] : []),
    react(),
  ],
});
