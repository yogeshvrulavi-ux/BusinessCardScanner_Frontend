import { normalizeApiUrl, PRODUCTION_API_URL } from "@/lib/productionApi";

const configuredApiUrl = import.meta.env.VITE_API_URL
  ? normalizeApiUrl(import.meta.env.VITE_API_URL)
  : "";

function resolveDefaultApiUrl(): string {
  if (configuredApiUrl) {
    return configuredApiUrl;
  }
  if (!import.meta.env.DEV) {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host.includes("onrender.com")) {
        return normalizeApiUrl(window.location.origin);
      }
    }
    return PRODUCTION_API_URL;
  }
  return "http://127.0.0.1:5000";
}

function isLocalApiUrl(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(url.trim());
}

function resolveDevApiBaseUrl(): string {
  // Remote API (e.g. Render): call directly so verify + webhook use the same server.
  if (configuredApiUrl && !isLocalApiUrl(configuredApiUrl)) {
    return configuredApiUrl;
  }
  // Local Python: same-origin proxy via vite.config.ts
  return "";
}

if (!configuredApiUrl && import.meta.env.DEV) {
  console.warn("VITE_API_URL is not set. Local dev uses Vite proxy to Python on port 5000.");
}

export const API_BASE_URL =
  import.meta.env.DEV && typeof window !== "undefined"
    ? resolveDevApiBaseUrl()
    : resolveDefaultApiUrl();
