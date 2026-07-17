import { API_BASE_URL } from "@/lib/api";
import { apiFetch } from "@/lib/apiFetch";
import { parseApiErrorDetail } from "@/lib/apiErrors";
import { getDeleteContactUrl } from "@/lib/backendTargets";
import type { LeadPayload } from "@/lib/cardImage";
import { pickPrimaryEmail, pickSecondaryEmail } from "@/lib/contactEmail";

export type SyncResult = {
  id?: string;
  success?: boolean;
  emailSent?: boolean;
  emailAttempted?: boolean;
  emailError?: string | null;
  emailTo?: string | null;
  emailExtracted?: string | null;
  emailSkipped?: boolean;
  emailCc?: string[];
  emailCcInvalid?: Array<{ address: string; reason: string }>;
  whatsappSent?: boolean;
  whatsappAttempted?: boolean;
  whatsappError?: string | null;
  whatsappTo?: string | null;
  whatsappMessageId?: string | null;
  whatsappDeliveryStatus?: string | null;
  whatsappSendMode?: string | null;
};

function normalizeSyncResult(data: Record<string, unknown>): SyncResult {
  const emailError = (data.email_error as string | null | undefined) ?? null;
  const emailSent = data.email_sent === true || data.emailSent === true;
  const emailAttempted =
    data.email_attempted === true ||
    data.emailAttempted === true ||
    emailSent;
  const emailExtracted =
    (data.email_extracted as string | null | undefined) ??
    (data.email_to as string | null | undefined) ??
    null;
  const whatsappSent = data.whatsapp_sent === true || data.whatsappSent === true;
  const whatsappAttempted =
    data.whatsapp_attempted === true ||
    data.whatsappAttempted === true ||
    whatsappSent;

  return {
    success: data.success === true,
    id: (data.id as string | undefined) || undefined,
    emailSent,
    emailAttempted,
    emailError,
    emailTo: (data.email_to as string | null | undefined) ?? null,
    emailExtracted,
    emailSkipped: Boolean(data.email_skipped ?? data.emailSkipped),
    emailCc: Array.isArray(data.email_cc) ? (data.email_cc as string[]) : [],
    emailCcInvalid: Array.isArray(data.email_cc_invalid)
      ? (data.email_cc_invalid as Array<{ address: string; reason: string }>)
      : [],
    whatsappSent,
    whatsappAttempted,
    whatsappError: (data.whatsapp_error as string | null | undefined) ?? null,
    whatsappTo: (data.whatsapp_to as string | null | undefined) ?? null,
    whatsappMessageId:
      (data.whatsapp_message_id as string | null | undefined) ?? null,
    whatsappDeliveryStatus:
      (data.whatsapp_delivery_status as string | null | undefined) ?? null,
    whatsappSendMode:
      (data.whatsapp_send_mode as string | null | undefined) ?? null,
  };
}

export async function seedOfflineSampleContact(): Promise<{
  seeded?: boolean;
  id?: string;
}> {
  try {
    const response = await apiFetch(`${API_BASE_URL}/contacts/seed-sample`, {
      method: "POST",
    });
    if (!response.ok) {
      return { seeded: false };
    }
    return response.json();
  } catch {
    return { seeded: false };
  }
}

/**
 * Save a contact to PostgreSQL via the backend API.
 * The backend transparently handles any CRM sync if configured.
 */
export async function saveContactToBackend(
  payload: LeadPayload,
  options?: {
    connectionMode?: "online" | "offline";
    skipWhatsApp?: boolean;
    skipEmail?: boolean;
  },
): Promise<SyncResult> {
  let response: Response;
  try {
    response = await apiFetch(`${API_BASE_URL}/api/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: payload.fullName,
        firstName: payload.firstName,
        lastName: payload.lastName,
        company: payload.company,
        designation: payload.designation,
        phone: payload.phone,
        secondaryPhone: payload.secondaryPhone,
        email: pickPrimaryEmail(payload),
        emailAddress: pickPrimaryEmail(payload),
        secondaryEmail: pickSecondaryEmail(payload),
        secondaryEmailAddress: pickSecondaryEmail(payload),
        website: payload.website,
        secondaryWebsite: payload.secondaryWebsite,
        address: payload.address,
        secondaryAddress: payload.secondaryAddress,
        eventName: payload.eventName,
        eventId: payload.eventId,
        notes: payload.notes || "",
        connectionMode: options?.connectionMode ?? "online",
        skipWhatsApp: Boolean(options?.skipWhatsApp),
        skipEmail: Boolean(options?.skipEmail),
      }),
    });
  } catch {
    throw new Error(
      "Backend not reachable. Ensure the API server is running.",
    );
  }

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(
      parseApiErrorDetail(data, "Failed to save contact."),
    );
  }

  return normalizeSyncResult(data);
}

/**
 * Delete a contact from PostgreSQL via the backend API (soft-delete).
 */
export async function deleteContactFromBackend(contactId: string): Promise<void> {
  const id = contactId.trim();
  if (!id) {
    throw new Error("Invalid contact id.");
  }

  let response: Response;
  try {
    response = await apiFetch(getDeleteContactUrl(id), {
      method: "DELETE",
    });
  } catch {
    throw new Error(
      "Backend not reachable. Ensure the API server is running.",
    );
  }

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(parseApiErrorDetail(data, "Failed to delete contact."));
  }
}
