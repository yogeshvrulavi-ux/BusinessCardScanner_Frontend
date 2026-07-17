import type { DirectoryContact } from "@/lib/contactsDirectory";
import { loadEvents, type StoredEvent } from "@/lib/eventStorage";

export type EventFolderStats = {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
  totalLeads: number;
  synced: number;
  pending: number;
  failed: number;
};

function normalizeEventName(name: string): string {
  return name.trim().toLowerCase();
}

function countContactsForEvent(contacts: DirectoryContact[], eventName: string) {
  const key = normalizeEventName(eventName);
  const matched = contacts.filter((c) => normalizeEventName(c.eventName || "") === key);
  return {
    totalLeads: matched.length,
    synced: matched.filter((c) => c.status === "synced").length,
    pending: matched.filter((c) => c.status === "pending").length,
    failed: matched.filter((c) => c.status === "failed").length,
  };
}

/** Build event folders from contacts (database + queue + local). Stored names merge metadata only. */
export function buildEventFolderStats(
  contacts: DirectoryContact[],
  events?: StoredEvent[],
): EventFolderStats[] {
  const stored = events ?? loadEvents();
  const byName = new Map<string, EventFolderStats>();

  for (const contact of contacts) {
    const name = (contact.eventName || "").trim();
    if (!name) continue;
    const key = normalizeEventName(name);
    const storedMeta = stored.find((event) => normalizeEventName(event.name) === key);
    const counts = countContactsForEvent(contacts, name);
    byName.set(key, {
      id: storedMeta?.id ?? key,
      name: storedMeta?.name ?? name,
      createdAt: storedMeta?.createdAt ?? "",
      lastUsedAt: storedMeta?.lastUsedAt,
      ...counts,
    });
  }

  for (const event of stored) {
    const key = normalizeEventName(event.name);
    if (byName.has(key)) {
      const existing = byName.get(key)!;
      byName.set(key, {
        ...existing,
        id: event.id,
        name: event.name,
        createdAt: event.createdAt,
        lastUsedAt: event.lastUsedAt ?? existing.lastUsedAt,
      });
    }
  }

  return Array.from(byName.values()).sort((a, b) => {
    const aTime = a.lastUsedAt || a.createdAt || "";
    const bTime = b.lastUsedAt || b.createdAt || "";
    return bTime.localeCompare(aTime);
  });
}

export function filterContactsByEventName(
  contacts: DirectoryContact[],
  eventName: string,
): DirectoryContact[] {
  const key = normalizeEventName(eventName);
  return contacts.filter((c) => normalizeEventName(c.eventName || "") === key);
}

export function summarizeEventFolders(folders: EventFolderStats[]) {
  return {
    totalEvents: folders.length,
    totalLeads: folders.reduce((sum, folder) => sum + folder.totalLeads, 0),
    synced: folders.reduce((sum, folder) => sum + folder.synced, 0),
    pending: folders.reduce((sum, folder) => sum + folder.pending, 0),
    failed: folders.reduce((sum, folder) => sum + folder.failed, 0),
  };
}
