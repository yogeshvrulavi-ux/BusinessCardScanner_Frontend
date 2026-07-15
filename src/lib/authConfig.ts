/**
 * Auth configuration — backend JWT RBAC system.
 * Auth is always enabled; the backend URL is resolved from VITE_API_URL or defaults.
 */

/** True when backend JWT auth is active (always true for RBAC). */
export const isAuthEnabled = true;

/** Resolve backend API base URL for auth endpoints. */
export function getAuthApiBase(): string {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (import.meta.env.DEV) return "http://127.0.0.1:5000";
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("onrender.com")) return window.location.origin;
  }
  return "https://businessscannercardbackend.onrender.com";
}
