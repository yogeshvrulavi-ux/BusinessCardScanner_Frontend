import { apiFetch } from "@/lib/apiFetch";
import { getContactsListUrl } from "@/lib/backendTargets";
import { listContacts, storageLabel } from "@/lib/contactStorage";
import { resolveEventNameForContact } from "@/lib/eventStorage";
import { getQueueItems } from "@/lib/indexeddb";
import type { ContactStatus } from "@/lib/contactStatus";
import { contactBelongsToAppUser, getCurrentAppUser } from "@/lib/currentAppUser";
import {
  getOutreachStatusForContactSync,
  type OutreachDeliveryRecord,
} from "@/lib/outreachStatusStorage";
import { getCurrentAppUserSync } from "@/lib/currentAppUser";

export type DirectoryContact = {
  id: string;
  name: string;
  initials: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  eventName?: string;
  notes?: string;
  status: ContactStatus;
  source: "localdb" | "indexeddb" | "queue";
  channels: { whatsapp: boolean; email: boolean };
  emailDelivery?: OutreachDeliveryRecord;
  whatsappDelivery?: OutreachDeliveryRecord;
  lastSync: string;
  accent: string;
  /** Admin (company owner) name — populated for SuperAdmin view */
  admin_name?: string;
  /** User who created/owns the contact */
  user_name?: string;
  createdAt?: string;
};

const ACCENTS = [
  "from-indigo-500 to-violet-500",
  "from-sky-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-fuchsia-500 to-pink-500",
  "from-cyan-500 to-blue-500",
];

function attachOutreachStatus<T extends Pick<DirectoryContact, "email" | "phone" | "name">>(
  contact: T,
): T & Pick<DirectoryContact, "emailDelivery" | "whatsappDelivery"> {
  const outreach = getOutreachStatusForContactSync(
    {
      email: contact.email,
      phone: contact.phone,
      name: contact.name,
    },
    getCurrentAppUserSync(),
  );
  return {
    ...contact,
    emailDelivery: outreach.emailDelivery,
    whatsappDelivery: outreach.whatsappDelivery,
  };
}

export function contactRowKey(contact: Pick<DirectoryContact, "source" | "id">): string {
  return `${contact.source}-${contact.id}`;
}

export function contactSearchText(contact: DirectoryContact): string {
  return `${contact.name} ${contact.company} ${contact.email} ${contact.phone} ${contact.title} ${contact.eventName || ""} ${contact.notes || ""}`
    .toLowerCase()
    .trim();
}

export function filterContactsByQuery(
  contacts: DirectoryContact[],
  query: string,
): DirectoryContact[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return contacts.filter((c) => contactSearchText(c).includes(q));
}

export type ContactsDirectorySnapshot = {
  contacts: DirectoryContact[];
  fetchFailed: boolean;
  fetchedAt: number;
};

/** Reuse cached directory data; only refetched after TTL or invalidation. */
const CACHE_TTL_MS = 60_000;

let cache: ContactsDirectorySnapshot | null = null;
let inFlight: Promise<ContactsDirectorySnapshot> | null = null;
const listeners = new Set<() => void>();

export function getContactsDirectorySnapshot(): ContactsDirectorySnapshot | null {
  return cache;
}

export function subscribeContactsDirectory(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function invalidateContactsDirectory(): void {
  cache = null;
  inFlight = null;
}

/** Remove one row from cache immediately (e.g. after delete) without waiting for refetch. */
export function optimisticallyRemoveDirectoryContact(
  contact: Pick<DirectoryContact, "id" | "source">,
): void {
  const key = contactRowKey(contact);
  if (!cache) return;
  const nextContacts = cache.contacts.filter((c) => contactRowKey(c) !== key);
  if (nextContacts.length === cache.contacts.length) return;
  cache = { ...cache, contacts: nextContacts };
  notifyContactsDirectorySubscribers();
}

function notifyContactsDirectorySubscribers(): void {
  listeners.forEach((listener) => listener());
}

async function fetchContactsFromPostgres(): Promise<ContactsDirectorySnapshot> {
  let fetchFailed = false;
  const appUser = await getCurrentAppUser();

  // Fetch from PostgreSQL backend API
  let pgData: Record<string, unknown>[] = [];
  try {
    const response = await apiFetch(getContactsListUrl());
    if (response.ok) {
      const json = await response.json();
      pgData = Array.isArray(json) ? json : [];
    } else {
      console.error("PostgreSQL contacts fetch failed:", response.statusText);
      fetchFailed = true;
    }
  } catch (err) {
    console.error("PostgreSQL contacts fetch error:", err);
    // Fallback: try local IndexedDB contacts
    try {
      pgData = (await listContacts()) as Record<string, unknown>[];
    } catch {
      /* empty */
    }
    fetchFailed = true;
  }

  // Format PostgreSQL contacts
  const formattedDb: DirectoryContact[] = pgData
    .filter((c) => contactBelongsToAppUser(c, appUser))
    .map((c, i) => {
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
        c.syncStatus === "synced_zoho" || c.syncStatus === "synced"
          ? ("synced" as ContactStatus)
          : c.syncStatus === "failed"
            ? ("failed" as ContactStatus)
            : ("pending" as ContactStatus);
      return attachOutreachStatus({
        id: String(c.id || `db-${i}`),
        name,
        company: String(c.company || ""),
        title: String(c.title || c.designation || ""),
        email: String(c.email || ""),
        phone: String(c.phone || ""),
        eventName: resolveEventNameForContact({
          eventName: String(c.eventName || ""),
          email: String(c.email || ""),
          phone: String(c.phone || ""),
        }),
        notes: String(c.notes || ""),
        source: "localdb" as const,
        initials,
        accent: ACCENTS[i % ACCENTS.length],
        status,
        channels: (c.channels as DirectoryContact["channels"]) || {
          whatsapp: !!c.phone,
          email: !!c.email,
        },
        lastSync: String(c.lastSync || c.created_at || ""),
        admin_name: String(c.admin_name || ""),
        user_name: String(c.user_name || ""),
        createdAt: String(c.created_at || c.createdAt || ""),
      });
    });

  // Also load IndexedDB queue for offline/pending contacts
  let formattedQueue: DirectoryContact[] = [];
  try {
    const queueItems = await getQueueItems();
    formattedQueue = queueItems
      .filter((item) => contactBelongsToAppUser(item, appUser))
      .map((item) => {
        const c = item.contact_data;
        const name = c.name || "Unnamed Contact";
        const initials = name
          ? name
              .split(" ")
              .map((n: string) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()
          : "?";

        return attachOutreachStatus({
          id: item.id,
          source: "queue" as const,
          name,
          initials,
          company: c.company || "No Company",
          title: c.title || c.designation || "No Title",
          email: c.email || "",
          phone: c.phone || "",
          eventName: resolveEventNameForContact({
            eventName: String(c.eventName || ""),
            email: String(c.email || ""),
            phone: String(c.phone || ""),
          }),
          notes: String(c.notes || ""),
          status: (item.status === "retrying" ? "pending" : item.status) as ContactStatus,
          channels: c.channels || {
            whatsapp: !!c.phone,
            email: !!c.email,
          },
          lastSync:
            item.status === "failed" ? "Sync failed" : "Queued · pending sync",
          accent: "from-amber-500 to-orange-500",
          createdAt: item.created_at || "",
        });
      });
  } catch (dbErr) {
    console.error("Failed to read IndexedDB queue:", dbErr);
  }

  return {
    contacts: [...formattedQueue, ...formattedDb],
    fetchFailed,
    fetchedAt: Date.now(),
  };
}

export async function loadContactsDirectory(options?: {
  force?: boolean;
}): Promise<ContactsDirectorySnapshot> {
  const force = options?.force ?? false;
  const now = Date.now();

  if (force) {
    inFlight = null;
  }

  if (!force && cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache;
  }

  if (inFlight) {
    return inFlight;
  }

  inFlight = (async () => {
    try {
      const snapshot = await fetchContactsFromPostgres();
      cache = snapshot;
      notifyContactsDirectorySubscribers();
      return snapshot;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
