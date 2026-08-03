import { API_BASE_URL } from "@/lib/api";
import { apiFetch } from "@/lib/apiFetch";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { clearUserBrowserData } from "@/lib/indexeddb";
import { clearOutreachStatusForUser } from "@/lib/outreachStatusStorage";
import { invalidateContactsDirectory } from "@/lib/contactsDirectory";

export type WipeResult = {
  contacts?: { deleted?: number; error?: string; note?: string };
  browser?: { queueRemoved: number; contactsRemoved: number };
  scopedToUser?: boolean;
};

async function parseDetail(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") return body.detail;
    if (body?.detail?.message) return String(body.detail.message);
  } catch {
    /* ignore */
  }
  return `Request failed (${response.status})`;
}

/** Email confirmation after Delete My Data / Delete Organisation Data. */
export async function notifyDataDeletion(kind: "local_queue" | "organisation"): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/api/profile/data-deletion-notice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind }),
  });
  if (!response.ok) {
    console.warn("Deletion confirmation email failed:", await parseDetail(response));
  }
}

export async function sendMobileVerificationOtp(phone: string): Promise<{ message: string }> {
  const response = await apiFetch(`${API_BASE_URL}/api/profile/mobile-verify/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: phone.trim() }),
  });
  if (!response.ok) throw new Error(await parseDetail(response));
  return response.json();
}

export async function confirmMobileVerificationOtp(input: {
  phone: string;
  otp: string;
}): Promise<{ message: string; phone?: string }> {
  const response = await apiFetch(`${API_BASE_URL}/api/profile/mobile-verify/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: input.phone.trim(), otp: input.otp.trim() }),
  });
  if (!response.ok) throw new Error(await parseDetail(response));
  return response.json();
}

const MOBILE_VERIFIED_PREFIX = "cs-mobile-verified:";

export function isMobileNumberVerified(userId: string | null | undefined, phone: string): boolean {
  if (typeof window === "undefined" || !userId || !phone.trim()) return false;
  const digits = phone.replace(/\D/g, "");
  return localStorage.getItem(`${MOBILE_VERIFIED_PREFIX}${userId}:${digits}`) === "1";
}

export function markMobileNumberVerified(userId: string, phone: string): void {
  if (typeof window === "undefined" || !userId) return;
  const digits = phone.replace(/\D/g, "");
  localStorage.setItem(`${MOBILE_VERIFIED_PREFIX}${userId}:${digits}`, "1");
}

export async function wipeAllAppData(): Promise<WipeResult> {
  const appUser = await getCurrentAppUser();
  const result: WipeResult = { scopedToUser: Boolean(appUser) };

  const backendRes = await apiFetch(`${API_BASE_URL}/admin/wipe-all-data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirm: true }),
  });
  if (!backendRes.ok) {
    let detail = `Wipe failed (${backendRes.status})`;
    try {
      const err = await backendRes.json();
      if (typeof err.detail === "string") detail = err.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  const backendJson = await backendRes.json();
  result.contacts = backendJson.contacts;
  result.scopedToUser = Boolean(backendJson.scoped_to_user ?? appUser);

  const browser = await clearUserBrowserData(appUser);
  clearOutreachStatusForUser(appUser);
  result.browser = browser;

  invalidateContactsDirectory();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cs-contacts-updated"));
    window.dispatchEvent(new CustomEvent("cs-queue-updated"));
  }

  return result;
}

export async function clearLocalQueueOnly(): Promise<number> {
  const appUser = await getCurrentAppUser();
  const { clearUserSyncQueue } = await import("@/lib/indexeddb");
  const removed = await clearUserSyncQueue(appUser);
  invalidateContactsDirectory();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cs-queue-updated"));
  }
  return removed;
}
