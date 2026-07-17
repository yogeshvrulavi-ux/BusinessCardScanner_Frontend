import { resolveApiBaseUrl } from "@/lib/productionApi";

if (!import.meta.env.VITE_API_URL?.trim() && import.meta.env.DEV) {
  console.warn(
    "VITE_API_URL is not set. Local dev uses the Vite proxy (see vite.config.ts).",
  );
}

export const API_BASE_URL = resolveApiBaseUrl();
