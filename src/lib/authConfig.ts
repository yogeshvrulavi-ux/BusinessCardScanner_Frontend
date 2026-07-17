/**
 * Auth configuration — backend JWT RBAC system.
 * Auth is always enabled; the backend URL is resolved from VITE_API_URL.
 */

import { normalizeApiUrl } from "@/lib/productionApi";

/** True when backend JWT auth is active (always true for RBAC). */
export const isAuthEnabled = true;

/** Resolve backend API base URL for auth endpoints. */
export function getAuthApiBase(): string {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) return normalizeApiUrl(configured);
  if (import.meta.env.DEV) {
    // Same-origin Vite proxy in local development
    return "";
  }
  throw new Error(
    "VITE_API_URL is not set. Configure it in BusinessCardScanner_Frontend/.env.",
  );
}
