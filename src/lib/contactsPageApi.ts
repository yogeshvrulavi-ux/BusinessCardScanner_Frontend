import { apiFetch } from "@/lib/apiFetch";
import { getContactsListUrl, getDeleteContactUrl } from "@/lib/backendTargets";
import { resolveEventNameForContact } from "@/lib/eventStorage";
import type { ContactStatus } from "@/lib/contactStatus";
import {
  attachOutreachStatus,
  type DirectoryContact,
} from "@/lib/contactsDirectory";
import { TABLE_PAGE_SIZE } from "@/components/ui/table-pagination";

const ACCENTS = [
  "from-cyan-500 to-teal-500",
  "from-sky-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-fuchsia-500 to-pink-500",
  "from-cyan-500 to-blue-500",
];

export type ContactsPageResponse = {
  items: DirectoryContact[];
  total: number;
  page: number;
  limit: number;
};

/** Map a raw API/DB contact into the Contacts table row shape (DB delivery is source of truth). */
export function mapRawContact(c: Record<string, unknown>, index = 0): DirectoryContact {
  const name = String(c.name || c.fullName || "");
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";
  const status =
    c.status === "failed" || c.syncStatus === "failed"
      ? ("failed" as ContactStatus)
      : ("synced" as ContactStatus);
  const rawImage = String(c.cardImageBase64 || "");
  const hasCardImage =
    Boolean(c.hasCardImage) ||
    (rawImage.startsWith("data:image/") && rawImage.length > 32);

  // Prefer camelCase API fields; also accept snake_case if present.
  const emailStatus = String(
    c.emailDeliveryStatus || c.email_delivery_status || c.email_status || "",
  );
  const whatsappStatus = String(
    c.whatsappDeliveryStatus || c.whatsapp_delivery_status || c.whatsapp_status || "",
  );

  return attachOutreachStatus(
    {
      id: String(c.id || `db-${index}`),
      name,
      company: String(c.company || ""),
      title: String(c.title || c.designation || ""),
      email: String(c.email || ""),
      phone: String(c.phone || ""),
      countryCode: String(c.countryCode || ""),
      countryName: String(c.countryName || ""),
      eventName: resolveEventNameForContact({
        eventName: String(c.eventName || ""),
        email: String(c.email || ""),
        phone: String(c.phone || ""),
      }),
      notes: String(c.notes || ""),
      source: "localdb" as const,
      initials,
      accent: ACCENTS[index % ACCENTS.length],
      status,
      channels: (c.channels as DirectoryContact["channels"]) || {
        whatsapp: !!c.phone,
        email: !!c.email,
      },
      lastSync:
        status === "synced"
          ? String(c.lastSync || c.created_at || "Synced")
          : String(c.lastSync || ""),
      admin_name: String(c.admin_name || ""),
      user_name: String(c.user_name || ""),
      user_username: String(c.user_username || ""),
      createdAt: String(c.created_at || c.createdAt || ""),
      hasCardImage,
    },
    {
      emailSent: c.emailSent === true,
      whatsappSent: c.whatsappSent === true,
      emailStatus,
      whatsappStatus,
      emailError: String(c.emailDeliveryError || c.email_delivery_error || ""),
      whatsappError: String(c.whatsappDeliveryError || c.whatsapp_delivery_error || ""),
      updatedAt: String(c.updatedAt || c.created_at || c.createdAt || ""),
    },
  );
}

/** Fetch one contact by id and map delivery status from the database. */
export async function fetchContactById(contactId: string): Promise<DirectoryContact | null> {
  const id = contactId.trim();
  if (!id) return null;
  const response = await apiFetch(getDeleteContactUrl(id), {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to load contact (${response.status})`);
  }
  const json = (await response.json()) as Record<string, unknown>;
  const raw =
    json && typeof json === "object" && json.contact && typeof json.contact === "object"
      ? (json.contact as Record<string, unknown>)
      : json;
  return mapRawContact(raw, 0);
}

/** Paged contacts for the Contacts table only (Scan/Events still use full directory). */
export async function fetchContactsPage(
  page = 1,
  limit = TABLE_PAGE_SIZE,
  options?: { q?: string; event?: string },
): Promise<ContactsPageResponse> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  const q = options?.q?.trim();
  const event = options?.event?.trim();
  if (q) params.set("q", q);
  if (event) params.set("event", event);

  const url = `${getContactsListUrl()}?${params.toString()}`;
  // Always read latest delivery statuses from PostgreSQL (no browser HTTP cache).
  const response = await apiFetch(url, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  if (!response.ok) {
    throw new Error(`Failed to load contacts (${response.status})`);
  }
  const json = await response.json();
  const rawItems: Record<string, unknown>[] = Array.isArray(json)
    ? json
    : Array.isArray(json?.items)
      ? json.items
      : [];
  const total = typeof json?.total === "number" ? json.total : rawItems.length;
  return {
    items: rawItems.map((c, i) => mapRawContact(c, i)),
    total,
    page: typeof json?.page === "number" ? json.page : page,
    limit: typeof json?.limit === "number" ? json.limit : limit,
  };
}
