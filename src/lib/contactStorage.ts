import type { LeadPayload } from "@/lib/cardImage";
import { pickPrimaryEmail } from "@/lib/contactEmail";
import {
  setResolvedStorageMode,
  storageLabel,
  type ContactStorageMode,
} from "@/lib/storageConfig";
import {
  addToQueue,
  deleteStoredContact,
  getQueueItems,
  getStoredContactById,
  listStoredContacts,
  patchStoredContactSyncStatus,
  removeQueueItem,
  saveStoredContact,
  updateQueueItem,
  updateStoredContact,
  type QueueItem,
} from "@/lib/indexeddb";
import {
  localContactToPayload,
  queueContactToPayload,
  updateContactInLocalDb,
  type LocalContact,
} from "@/lib/localContactApi";
import { recordContactEventLink } from "@/lib/eventStorage";
import { getConnectionMode } from "@/lib/connectionMode";
import { saveContactToBackend, seedOfflineSampleContact } from "@/lib/contactApi";
import {
  getCurrentAppUser,
  stampCapturedByFields,
  type AppUserIdentity,
} from "@/lib/currentAppUser";
import { recordOutreachFromSyncResult } from "@/lib/outreachStatusStorage";

export type StoredContact = Awaited<ReturnType<typeof listStoredContacts>>[number];

export {
  isIndexedDbStorage,
  storageLabel,
  type ContactStorageMode,
} from "@/lib/storageConfig";

export { queueContactToPayload, localContactToPayload, seedOfflineSampleContact };

export async function resolveStorageMode(): Promise<ContactStorageMode> {
  setResolvedStorageMode("indexeddb");
  return "indexeddb";
}

export async function checkStorageHealth(): Promise<boolean> {
  await resolveStorageMode();
  return true;
}

export async function listContacts(): Promise<StoredContact[]> {
  await resolveStorageMode();
  return listStoredContacts() as Promise<StoredContact[]>;
}

export async function getContactById(contactId: string): Promise<StoredContact | null> {
  const contact = await getStoredContactById(contactId);
  return contact as StoredContact | null;
}

/** Offline = no internet (or explicit offline). Online = PostgreSQL backend. */
function isOfflineSave(options?: { connectionMode?: "online" | "offline" }): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  if (options?.connectionMode === "offline") return true;
  if (options?.connectionMode === "online") return false;
  return false;
}

function saveConnectionMode(): "online" | "offline" {
  return getConnectionMode();
}

function notifyContactsListChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cs-contacts-updated"));
    void import("@/lib/contactsDirectory").then((m) => m.invalidateContactsDirectory());
  }
}

async function persistOutreachStatus(
  payload: LeadPayload,
  result: {
    id?: string;
    emailSent?: boolean;
    emailAttempted?: boolean;
    emailError?: string | null;
    emailSkipped?: boolean;
    whatsappSent?: boolean;
    whatsappAttempted?: boolean;
    whatsappError?: string | null;
  },
): Promise<void> {
  await recordOutreachFromSyncResult(
    {
      email: pickPrimaryEmail(payload),
      phone: payload.phone,
      name: payload.fullName,
    },
    result,
  );
}

async function saveOfflineToIndexedDbQueue(
  payload: LeadPayload,
  cardImageBase64?: string,
  errorMessage = "Saved offline — will sync when online",
): Promise<{ id: string; queued: true }> {
  const email = pickPrimaryEmail(payload);
  const appUser = await getCurrentAppUser();
  const item = buildQueueItemFromPayload(
    { ...payload, email },
    cardImageBase64,
    errorMessage,
    appUser,
  );
  await addToQueue(item);
  const { recordOfflineQueueCapture } = await import("@/lib/captureSourceAnalytics");
  recordOfflineQueueCapture();
  notifyContactsListChanged();
  return { id: item.id, queued: true };
}

async function saveOnlineToPostgres(
  payload: LeadPayload,
  cardImageBase64?: string,
  options?: {
    skipWhatsApp?: boolean;
    skipEmail?: boolean;
  },
): Promise<{ id: string; queued?: boolean; error?: string }> {
  const email = pickPrimaryEmail(payload);
  const body = { ...payload, email };
  const skipEmail = Boolean(options?.skipEmail) || !email;

  try {
    const result = await saveContactToBackend(body, {
      connectionMode: "online",
      skipWhatsApp: options?.skipWhatsApp,
      skipEmail,
      cardImageBase64,
    });
    if (body.eventName?.trim()) {
      recordContactEventLink({
        eventName: body.eventName.trim(),
        email,
        phone: body.phone,
      });
    }
    const { recordDirectDatabaseCapture } = await import("@/lib/captureSourceAnalytics");
    recordDirectDatabaseCapture();
    await persistOutreachStatus(body, result);
    notifyContactsListChanged();
    return {
      id: result.id || crypto.randomUUID(),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed";
    const fallback = await saveOfflineToIndexedDbQueue(body, cardImageBase64, message);
    return { ...fallback, error: message };
  }
}

/** Sync a single queued contact to the backend. */
export async function syncQueueItem(
  item: QueueItem,
  options?: { skipWhatsApp?: boolean; skipEmail?: boolean },
): Promise<{
  id?: string;
  emailSent?: boolean;
  emailError?: string | null;
}> {
  if (!navigator.onLine) {
    throw new Error("No internet connection.");
  }
  const payload = queueContactToPayload(item.contact_data);
  const result = await saveContactToBackend(payload, {
    connectionMode: "online",
    skipWhatsApp: options?.skipWhatsApp,
    skipEmail: options?.skipEmail,
    cardImageBase64: item.image_base64 || undefined,
  });
  if (payload.eventName?.trim()) {
    recordContactEventLink({
      eventName: payload.eventName.trim(),
      email: pickPrimaryEmail(payload),
      phone: payload.phone,
    });
  }
  await removeQueueItem(item.id);
  await persistOutreachStatus(payload, result);
  const { recordQueueSyncedToDatabase } = await import("@/lib/captureSourceAnalytics");
  recordQueueSyncedToDatabase();
  notifyContactsListChanged();
  return {
    id: result.id,
    emailSent: result.emailSent,
    emailError: result.emailError,
  };
}

/** Sync all pending queue items to the backend. */
export async function syncAllQueueItems(options?: {
  skipWhatsApp?: boolean;
  skipEmail?: boolean;
}): Promise<{ synced: number; total: number }> {
  const items = await getQueueItems();
  const pending = items.filter((i) => i.status === "pending" || i.status === "retrying");
  let synced = 0;
  for (const item of pending) {
    try {
      await updateQueueItem({
        ...item,
        status: "retrying",
        last_attempt: new Date().toISOString(),
      });
      await syncQueueItem(item, options);
      synced += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      const nextRetry = item.retry_count + 1;
      await updateQueueItem({
        ...item,
        status: nextRetry >= 5 ? "failed" : "pending",
        retry_count: nextRetry,
        last_attempt: new Date().toISOString(),
        error_message: message,
      });
    }
  }
  return { synced, total: pending.length };
}

export async function saveContact(
  payload: LeadPayload,
  cardImageBase64?: string,
  options?: {
    connectionMode?: "online" | "offline";
    skipWhatsApp?: boolean;
    skipEmail?: boolean;
  },
): Promise<{
  id: string;
  queued?: boolean;
  error?: string;
}> {
  await resolveStorageMode();
  const mode = options?.connectionMode ?? saveConnectionMode();

  if (isOfflineSave({ ...options, connectionMode: mode })) {
    return saveOfflineToIndexedDbQueue(payload, cardImageBase64);
  }

  return saveOnlineToPostgres(payload, cardImageBase64, options);
}

export async function updateContact(contactId: string, payload: LeadPayload): Promise<void> {
  const email = pickPrimaryEmail(payload);
  const nextPayload = { ...payload, email };
  const online = typeof navigator === "undefined" || navigator.onLine;

  if (online) {
    await updateContactInLocalDb(contactId, nextPayload);
    const existing = await getStoredContactById(contactId);
    if (existing) {
      await updateStoredContact(contactId, {
        ...(nextPayload as Record<string, unknown>),
        emailAddress: email,
      });
    }
    notifyContactsListChanged();
    return;
  }

  const existing = await getStoredContactById(contactId);
  if (!existing) {
    throw new Error("Cannot update contact while offline — contact is not available locally.");
  }
  await updateStoredContact(contactId, {
    ...(nextPayload as Record<string, unknown>),
    emailAddress: email,
  });
  notifyContactsListChanged();
}

export async function deleteContact(contactId: string): Promise<void> {
  await deleteStoredContact(contactId);
}

export async function markContactSynced(
  contactId: string,
): Promise<void> {
  await patchStoredContactSyncStatus(contactId, "synced");
}

export type AutoSyncResult = {
  queueSynced: number;
  queueTotal: number;
};

let autoSyncInFlight: Promise<AutoSyncResult> | null = null;

export async function runAutoSyncWhenOnline(options?: {
  skipWhatsApp?: boolean;
  skipEmail?: boolean;
}): Promise<AutoSyncResult> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { queueSynced: 0, queueTotal: 0 };
  }

  if (autoSyncInFlight) {
    return autoSyncInFlight;
  }

  autoSyncInFlight = (async () => {
    const queue = await syncAllQueueItems(options);
    return {
      queueSynced: queue.synced,
      queueTotal: queue.total,
    };
  })().finally(() => {
    autoSyncInFlight = null;
  });

  return autoSyncInFlight;
}

export function shouldUseIndexedDbQueueSync(): boolean {
  return true;
}

export function buildQueueItemFromPayload(
  payload: LeadPayload,
  imageBase64?: string,
  errorMessage?: string,
  appUser?: AppUserIdentity | null,
): QueueItem {
  const email = pickPrimaryEmail(payload);
  const stamped = stampCapturedByFields(
    { ...(payload as Record<string, unknown>), email, emailAddress: email },
    appUser ?? null,
  );
  const queueId = crypto.randomUUID();
  return {
    id: queueId,
    contact_data: {
      ...stamped,
      // Keep the original scan source (Camera/Upload) when known.
      captureSource: String(stamped.captureSource || "") || "offline_queue",
    },
    image_base64: imageBase64,
    status: "pending",
    retry_count: 0,
    created_at: new Date().toISOString(),
    last_attempt: new Date().toISOString(),
    error_message: errorMessage,
    capturedByEmail: String(stamped.capturedByEmail || ""),
    capturedByUserId: String(stamped.capturedByUserId || ""),
    capturedByPhone: String(stamped.capturedByPhone || ""),
  };
}
