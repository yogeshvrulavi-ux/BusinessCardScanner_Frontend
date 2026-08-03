import { openDB, IDBPDatabase } from "idb";
import type { AppUserIdentity } from "@/lib/currentAppUser";
import { contactBelongsToAppUser } from "@/lib/currentAppUser";

export interface QueueItem {
  id: string;
  contact_data: any;
  status: "pending" | "retrying" | "synced" | "failed";
  retry_count: number;
  created_at: string;
  last_attempt: string;
  error_message?: string;
  /** Base64 data URL of the business card image for local DB sync */
  image_base64?: string;
  capturedByEmail?: string;
  capturedByUserId?: string;
  capturedByPhone?: string;
}

const DB_NAME = "cardsync-db";
const STORE_NAME = "sync_queue";
const CONTACTS_CACHE_STORE = "contacts_cache";
const DB_VERSION = 3;

export const OFFLINE_STORAGE_FULL_MESSAGE =
  "Offline storage is full. Please sync pending data or free up device storage.";

export class OfflineStorageFullError extends Error {
  constructor(message = OFFLINE_STORAGE_FULL_MESSAGE) {
    super(message);
    this.name = "OfflineStorageFullError";
  }
}

export function isQuotaExceededError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const anyErr = err as { name?: string; code?: number; message?: string };
  if (anyErr.name === "QuotaExceededError" || anyErr.name === "NS_ERROR_DOM_QUOTA_REACHED") {
    return true;
  }
  if (anyErr.code === 22 || anyErr.code === 1014) return true;
  const message = String(anyErr.message || "").toLowerCase();
  return message.includes("quota") || message.includes("storage full");
}

function dispatchQueueUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cs-queue-updated"));
  }
}

function rethrowStorageWriteError(err: unknown, operation: string): never {
  if (isQuotaExceededError(err)) {
    console.error(`[offline-storage] Quota exceeded during ${operation}`, err);
    throw new OfflineStorageFullError();
  }
  console.error(`[offline-storage] Failed during ${operation}`, err);
  throw err instanceof Error ? err : new Error(String(err));
}

/** Best-effort check before large writes. Returns false when clearly full. */
export async function ensureOfflineStorageAvailable(estimatedBytes = 0): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return;
  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage ?? 0;
    const quota = estimate.quota ?? 0;
    if (!quota) return;
    const remaining = quota - usage;
    // Leave a small safety buffer; block when remaining room is tiny.
    const needed = Math.max(estimatedBytes, 64 * 1024);
    if (remaining < needed) {
      console.error("[offline-storage] Insufficient browser storage", {
        usage,
        quota,
        remaining,
        needed,
      });
      throw new OfflineStorageFullError();
    }
  } catch (err) {
    if (err instanceof OfflineStorageFullError) throw err;
    // estimate() failures should not block saves
  }
}

export async function initDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(CONTACTS_CACHE_STORE)) {
        db.createObjectStore(CONTACTS_CACHE_STORE, { keyPath: "id" });
      }
    },
  });
}

export async function addToQueue(item: QueueItem): Promise<void> {
  const estimated =
    (item.image_base64?.length || 0) + JSON.stringify(item.contact_data || {}).length;
  await ensureOfflineStorageAvailable(estimated);
  try {
    const db = await initDB();
    await db.put(STORE_NAME, item);
    dispatchQueueUpdate();
  } catch (err) {
    rethrowStorageWriteError(err, "addToQueue");
  }
}

export async function getQueueItems(): Promise<QueueItem[]> {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}

export async function updateQueueItem(item: QueueItem): Promise<void> {
  try {
    const db = await initDB();
    await db.put(STORE_NAME, item);
    dispatchQueueUpdate();
  } catch (err) {
    rethrowStorageWriteError(err, "updateQueueItem");
  }
}

export async function removeQueueItem(id: string): Promise<void> {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
  dispatchQueueUpdate();
}

export async function cacheContacts(contacts: any[]): Promise<void> {
  try {
    const db = await initDB();
    const tx = db.transaction(CONTACTS_CACHE_STORE, "readwrite");
    const store = tx.objectStore(CONTACTS_CACHE_STORE);
    await store.clear();
    for (const contact of contacts) {
      await store.put(contact);
    }
    await tx.done;
  } catch (err) {
    if (isQuotaExceededError(err)) {
      console.error("[offline-storage] Quota exceeded during cacheContacts", err);
      return;
    }
    /* cache is best-effort */
  }
}

export async function getCachedContacts(): Promise<any[]> {
  try {
    const db = await initDB();
    return db.getAll(CONTACTS_CACHE_STORE);
  } catch {
    return [];
  }
}

export async function clearSyncQueue(): Promise<void> {
  const db = await initDB();
  await db.clear(STORE_NAME);
  dispatchQueueUpdate();
}

export async function clearContactsCache(): Promise<void> {
  const db = await initDB();
  await db.clear(CONTACTS_CACHE_STORE);
}

export async function clearUserSyncQueue(appUser: AppUserIdentity | null): Promise<number> {
  const items = await getQueueItems();
  let removed = 0;
  for (const item of items) {
    if (!contactBelongsToAppUser(item, appUser)) continue;
    await removeQueueItem(item.id);
    removed += 1;
  }
  return removed;
}

export async function clearUserContactsCache(appUser: AppUserIdentity | null): Promise<number> {
  const contacts = await getCachedContacts();
  let removed = 0;
  for (const contact of contacts) {
    if (!contactBelongsToAppUser(contact, appUser)) continue;
    await removeCachedContact(String(contact.id || ""));
    removed += 1;
  }
  return removed;
}

export async function clearUserBrowserData(appUser: AppUserIdentity | null): Promise<{
  queueRemoved: number;
  contactsRemoved: number;
}> {
  const queueRemoved = await clearUserSyncQueue(appUser);
  const contactsRemoved = await clearUserContactsCache(appUser);
  return { queueRemoved, contactsRemoved };
}

export async function clearAllBrowserData(): Promise<void> {
  await clearSyncQueue();
  await clearContactsCache();
}

export async function removeCachedContact(id: string): Promise<void> {
  try {
    const db = await initDB();
    await db.delete(CONTACTS_CACHE_STORE, id);
    window.dispatchEvent(new CustomEvent("cs-contacts-updated"));
  } catch {
    /* ignore */
  }
}

function contactRecordFromPayload(
  payload: Record<string, unknown>,
  existingId?: string,
  cardImageBase64?: string,
): Record<string, unknown> {
  const id = existingId || crypto.randomUUID();
  const now = new Date().toISOString();
  const fullName = String(payload.fullName || payload.name || "").trim();
  const syncStatus = String(payload.syncStatus || "local_only");
  const status =
    syncStatus === "synced"
      ? "synced"
      : syncStatus === "failed"
        ? "failed"
        : "pending";

  return {
    id,
    name: fullName,
    fullName,
    firstName: String(payload.firstName || ""),
    lastName: String(payload.lastName || ""),
    designation: String(payload.designation || payload.title || ""),
    company: String(payload.company || ""),
    countryCode: String(payload.countryCode || ""),
    countryName: String(payload.countryName || ""),
    phone: String(payload.phone || ""),
    secondaryPhone: String(payload.secondaryPhone || ""),
    email: String(payload.email || ""),
    secondaryEmail: String(payload.secondaryEmail || ""),
    website: String(payload.website || ""),
    secondaryWebsite: String(payload.secondaryWebsite || ""),
    address: String(payload.address || ""),
    secondaryAddress: String(payload.secondaryAddress || ""),
    socialLinks: String(payload.socialLinks || ""),
    gstNumber: String(payload.gstNumber || ""),
    notes: String(payload.notes || ""),
    eventName: String(payload.eventName || ""),
    eventDay: String(payload.eventDay || ""),
    eventId: String(payload.eventId || ""),
    cardImageBase64: cardImageBase64 ?? payload.cardImageBase64,
    syncStatus,
    source: "indexeddb",
    status,
    created_at: String(payload.created_at || now),
    lastSync: status === "synced" ? "Saved on device" : "Pending",
    channels: {
      whatsapp: Boolean(payload.phone),
      email: Boolean(payload.email),
    },
    capturedByEmail: String(payload.capturedByEmail || ""),
    capturedByUserId: String(payload.capturedByUserId || ""),
    capturedByPhone: String(payload.capturedByPhone || ""),
    capturedByName: String(payload.capturedByName || ""),
  };
}

/** Primary contact storage when CONTACT_STORAGE=indexeddb */
export async function saveStoredContact(
  payload: Record<string, unknown>,
  cardImageBase64?: string,
): Promise<{ id: string }> {
  const record = contactRecordFromPayload(payload, undefined, cardImageBase64);
  const estimated =
    JSON.stringify(record).length + (typeof cardImageBase64 === "string" ? cardImageBase64.length : 0);
  await ensureOfflineStorageAvailable(estimated);
  try {
    const db = await initDB();
    await db.put(CONTACTS_CACHE_STORE, record);
    window.dispatchEvent(new CustomEvent("cs-contacts-updated"));
    return { id: String(record.id) };
  } catch (err) {
    rethrowStorageWriteError(err, "saveStoredContact");
  }
}

export async function updateStoredContact(
  contactId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const db = await initDB();
    const existing = (await db.get(CONTACTS_CACHE_STORE, contactId)) as
      | Record<string, unknown>
      | undefined;
    const record = contactRecordFromPayload(
      { ...(existing || {}), ...payload },
      contactId,
      payload.cardImageBase64 as string | undefined,
    );
    if (existing?.created_at) {
      record.created_at = existing.created_at;
    }
    await ensureOfflineStorageAvailable(JSON.stringify(record).length);
    await db.put(CONTACTS_CACHE_STORE, record);
    window.dispatchEvent(new CustomEvent("cs-contacts-updated"));
  } catch (err) {
    rethrowStorageWriteError(err, "updateStoredContact");
  }
}

export async function listStoredContacts(): Promise<Record<string, unknown>[]> {
  const contacts = await getCachedContacts();
  return contacts.sort((a, b) =>
    String(b.created_at || "").localeCompare(String(a.created_at || "")),
  );
}

export async function getStoredContactById(contactId: string): Promise<Record<string, unknown> | null> {
  const db = await initDB();
  const contact = await db.get(CONTACTS_CACHE_STORE, contactId);
  return contact ?? null;
}

export async function deleteStoredContact(contactId: string): Promise<void> {
  await removeCachedContact(contactId);
}

export async function patchStoredContactSyncStatus(
  contactId: string,
  syncStatus: string,
): Promise<void> {
  const existing = await getStoredContactById(contactId);
  if (!existing) {
    throw new Error("Contact not found");
  }
  await updateStoredContact(contactId, {
    ...existing,
    syncStatus,
  });
}
