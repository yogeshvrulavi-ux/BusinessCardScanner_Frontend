import type { LeadPayload } from "@/lib/cardImage";
import { listStoredContacts } from "@/lib/indexeddb";

export type StoredContact = {
  id: string;
  name?: string;
  fullName?: string;
  company?: string;
  phone?: string;
  email?: string;
  designation?: string;
  website?: string;
  address?: string;
  [key: string]: unknown;
};

export type DuplicateMatch = {
  contact: StoredContact;
  matchedBy: ("email" | "phone" | "name_company")[];
};

export type DuplicateCheckResult = {
  duplicates: DuplicateMatch[];
};

function normalizePhone(phone: string): string {
  return String(phone || "").replace(/\D/g, "");
}

function findDuplicatesLocally(
  contacts: StoredContact[],
  payload: LeadPayload,
): DuplicateMatch[] {
  const email = String(payload.email || "").trim().toLowerCase();
  const phone = normalizePhone(payload.phone || "");
  const name = String(payload.fullName || "").trim().toLowerCase();
  const company = String(payload.company || "").trim().toLowerCase();

  const duplicates: DuplicateMatch[] = [];
  const seen = new Set<string>();

  for (const contact of contacts) {
    const id = String(contact.id || "");
    if (!id || seen.has(id)) continue;

    const matchedBy: DuplicateMatch["matchedBy"] = [];
    const cEmail = String(contact.email || "").trim().toLowerCase();
    const cPhone = normalizePhone(String(contact.phone || ""));
    const cName = String(contact.fullName || contact.name || "").trim().toLowerCase();
    const cCompany = String(contact.company || "").trim().toLowerCase();

    if (email && cEmail && email === cEmail) matchedBy.push("email");
    if (phone && cPhone && phone === cPhone) matchedBy.push("phone");
    if (name && company && cName === name && cCompany === company) matchedBy.push("name_company");

    if (matchedBy.length > 0) {
      seen.add(id);
      duplicates.push({ contact, matchedBy });
    }
  }

  return duplicates;
}

export async function checkForDuplicates(payload: LeadPayload): Promise<DuplicateCheckResult> {
  // Prefer RBAC-scoped PostgreSQL duplicates when online.
  if (typeof navigator === "undefined" || navigator.onLine) {
    try {
      const { API_BASE_URL } = await import("@/lib/api");
      const { apiFetch } = await import("@/lib/apiFetch");
      const response = await apiFetch(`${API_BASE_URL}/contacts/check-duplicates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: payload.fullName || "",
          company: payload.company || "",
          phone: payload.phone || "",
          email: payload.email || "",
        }),
      });
      if (response.ok) {
        const data = (await response.json()) as DuplicateCheckResult;
        return { duplicates: Array.isArray(data.duplicates) ? data.duplicates : [] };
      }
    } catch {
      // Fall through to IndexedDB when the API is unreachable.
    }
  }

  const contacts = await listStoredContacts();
  const localMatches = findDuplicatesLocally(contacts as StoredContact[], payload);

  // Also treat pending offline queue items as existing contacts.
  try {
    const { getQueueItems } = await import("@/lib/indexeddb");
    const queueItems = await getQueueItems();
    const queueAsContacts: StoredContact[] = queueItems.map((item) => ({
      id: item.id,
      ...(item.contact_data as Record<string, unknown>),
      fullName: String(item.contact_data.fullName || item.contact_data.name || ""),
      email: String(item.contact_data.email || ""),
      phone: String(item.contact_data.phone || ""),
      company: String(item.contact_data.company || ""),
    }));
    const queueMatches = findDuplicatesLocally(queueAsContacts, payload);
    const seen = new Set(localMatches.map((m) => m.contact.id));
    for (const match of queueMatches) {
      if (!seen.has(match.contact.id)) {
        localMatches.push(match);
        seen.add(match.contact.id);
      }
    }
  } catch {
    /* queue optional */
  }

  return { duplicates: localMatches };
}

export function diffContacts(
  existing: StoredContact,
  incoming: LeadPayload,
): { field: string; existing: string; incoming: string }[] {
  const fields: { key: keyof LeadPayload; label: string; existingKey?: keyof StoredContact }[] = [
    { key: "fullName", label: "Name", existingKey: "fullName" },
    { key: "designation", label: "Designation" },
    { key: "company", label: "Company" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "website", label: "Website" },
    { key: "address", label: "Address" },
  ];

  return fields
    .map(({ key, label, existingKey }) => {
      const ex = String(existing[existingKey || key] || existing.name || "").trim();
      const inc = String(incoming[key] || "").trim();
      if (!ex && !inc) return null;
      if (ex === inc) return null;
      return { field: label, existing: ex || "—", incoming: inc || "—" };
    })
    .filter(Boolean) as { field: string; existing: string; incoming: string }[];
}
