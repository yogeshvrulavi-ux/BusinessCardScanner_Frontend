const CONSENT_KEY = "cs-cookie-consent";

export type CookieConsent = {
  essential: boolean;
  analytics: boolean;
  acceptedAt: string;
};

export function loadCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookieConsent;
  } catch {
    return null;
  }
}

export function hasCookieConsent(): boolean {
  return loadCookieConsent() !== null;
}

export function saveCookieConsent(consent: Omit<CookieConsent, "acceptedAt">): CookieConsent {
  const record: CookieConsent = {
    essential: consent.essential,
    analytics: consent.analytics,
    acceptedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
    window.dispatchEvent(new CustomEvent("cs-cookie-consent-updated", { detail: record }));
  }
  return record;
}
