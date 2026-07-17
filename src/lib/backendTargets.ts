import { API_BASE_URL } from "@/lib/api";

export function getScanApiBaseUrl(): string {
  if (API_BASE_URL) {
    return API_BASE_URL;
  }
  if (import.meta.env.DEV) {
    return "";
  }
  const configured = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (!configured) {
    throw new Error("VITE_API_URL is not set for production builds.");
  }
  return configured.replace(/\/+$/, "");
}

/** True when OCR runs on this PC (works without internet). */
export function isLocalScanBackend(): boolean {
  try {
    const base = getScanApiBaseUrl();
    if (!base) return true;
    const { hostname } = new URL(base);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

/**
 * OCR runs in the browser (PaddleOCR). Backend receives extracted fields on save/sync.
 */
export function canRunScanOcr(): boolean {
  return typeof window !== "undefined";
}

export function getScanBackendLabel(): string {
  return `CardSync API — ${API_BASE_URL || "Vite proxy / VITE_API_URL"}`;
}

export function getLocalContactsUrl(): string {
  return `${API_BASE_URL}/api/contacts`;
}

export function getContactsListUrl(): string {
  return `${API_BASE_URL}/api/contacts`;
}

export function getBackendLabel(): string {
  return "PostgreSQL";
}

export function getDeleteContactUrl(contactId: string): string {
  return `${API_BASE_URL}/api/contacts/${contactId}`;
}
