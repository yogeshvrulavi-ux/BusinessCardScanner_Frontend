/** Normalize API base URLs (trim trailing slashes). */
export function normalizeApiUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/**
 * Resolve API base URL from VITE_API_URL only.
 * In local Vite DEV with an empty/local VITE_API_URL, the Vite proxy is used ("").
 */
export function resolveApiBaseUrl(options?: { isDev?: boolean }): string {
  const isDev = options?.isDev ?? Boolean(import.meta.env.DEV);
  const configured = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || "";

  if (!configured) {
    if (isDev) return "";
    throw new Error(
      "VITE_API_URL is not set. Configure it in BusinessCardScanner_Frontend/.env for this environment.",
    );
  }

  const normalized = normalizeApiUrl(configured);
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(normalized);
  // Local Python: prefer same-origin Vite proxy in DEV
  if (isDev && isLocal) return "";
  return normalized;
}
