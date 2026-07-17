import type { LeadPayload } from "@/lib/cardImage";

/** Primary email for contact sync / thank-you outreach (form + queue field names). */
export function pickPrimaryEmail(
  payload: LeadPayload | Record<string, unknown>,
): string {
  const p = payload as Record<string, unknown>;
  return String(
    p.email ||
      p.emailAddress ||
      p.secondaryEmail ||
      p.secondaryEmailAddress ||
      "",
  ).trim();
}

export function pickSecondaryEmail(
  payload: LeadPayload | Record<string, unknown>,
): string {
  const p = payload as Record<string, unknown>;
  const primary = pickPrimaryEmail(payload);
  const secondary = String(
    p.secondaryEmail || p.secondaryEmailAddress || "",
  ).trim();
  if (!secondary || secondary.toLowerCase() === primary.toLowerCase()) {
    return "";
  }
  return secondary;
}
