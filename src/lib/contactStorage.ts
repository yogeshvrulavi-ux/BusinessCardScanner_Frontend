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

function notifyContactsListChanged(contactId?: string): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("cs-contacts-updated", {
        detail: contactId ? { contactId } : undefined,
      }),
    );
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
  const image =
    cardImageBase64 && cardImageBase64.startsWith("data:image/")
      ? cardImageBase64
      : undefined;
  const item = buildQueueItemFromPayload(
    { ...payload, email },
    image,
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
    notifyContactsListChanged(result.id);
    return {
      id: result.id || crypto.randomUUID(),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed";
    const fallback = await saveOfflineToIndexedDbQueue(body, cardImageBase64, message);
    return { ...fallback, error: message };
  }
}

/** Prevents overlapping sync runners (auto-sync + manual Sync All) from double-posting. */
let syncAllInFlight: Promise<{ synced: number; total: number; remaining: number }> | null = null;
/** Per-queue-id lock so the same contact is never processed twice concurrently. */
const syncingItemIds = new Set<string>();

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
  if (syncingItemIds.has(item.id)) {
    // Another runner is already syncing this queue id — skip to avoid duplicates.
    return {};
  }

  // Re-read IndexedDB: item may have been removed by a concurrent successful sync.
  const latest = (await getQueueItems()).find((entry) => entry.id === item.id);
  if (!latest || latest.status === "synced") {
    return {};
  }

  syncingItemIds.add(item.id);
  try {
    const payload = queueContactToPayload(latest.contact_data);
    const image =
      latest.image_base64 && String(latest.image_base64).startsWith("data:image/")
        ? latest.image_base64
        : undefined;

    // Idempotency: if this contact already exists (e.g. prior sync succeeded but queue
    // removal failed), update instead of inserting a duplicate row.
    try {
      const { checkForDuplicates } = await import("@/lib/duplicateDetection");
      const dup = await checkForDuplicates(payload);
      const existingId = dup.duplicates[0]?.contact?.id;
      if (existingId) {
        await updateContact(String(existingId), payload, image);
        await removeQueueItem(latest.id);
        const { recordQueueSyncedToDatabase } = await import("@/lib/captureSourceAnalytics");
        recordQueueSyncedToDatabase();
        notifyContactsListChanged(String(existingId));
        return { id: String(existingId) };
      }
    } catch {
      /* fall through to create */
    }

    const result = await saveContactToBackend(payload, {
      connectionMode: "online",
      skipWhatsApp: options?.skipWhatsApp,
      skipEmail: options?.skipEmail,
      cardImageBase64: image,
    });
    if (payload.eventName?.trim()) {
      recordContactEventLink({
        eventName: payload.eventName.trim(),
        email: pickPrimaryEmail(payload),
        phone: payload.phone,
      });
    }
    // Remove from IndexedDB only after a successful backend response.
    await removeQueueItem(latest.id);
    await persistOutreachStatus(payload, result);
    const { recordQueueSyncedToDatabase } = await import("@/lib/captureSourceAnalytics");
    recordQueueSyncedToDatabase();
    notifyContactsListChanged(result.id);
    return {
      id: result.id,
      emailSent: result.emailSent,
      emailError: result.emailError,
    };
  } finally {
    syncingItemIds.delete(item.id);
  }
}

/** Sync all pending/failed queue items to the backend (failed items are retried). */
export async function syncAllQueueItems(options?: {
  skipWhatsApp?: boolean;
  skipEmail?: boolean;
  includeFailed?: boolean;
}): Promise<{ synced: number; total: number; remaining: number }> {
  // Coalesce concurrent Sync All / auto-sync callers onto one run.
  if (syncAllInFlight) {
    return syncAllInFlight;
  }

  syncAllInFlight = (async () => {
    const items = await getQueueItems();
    const includeFailed = options?.includeFailed !== false;
    const pending = items.filter(
      (i) =>
        !syncingItemIds.has(i.id) &&
        (i.status === "pending" ||
          i.status === "retrying" ||
          (includeFailed && i.status === "failed")),
    );
    let synced = 0;
    for (const item of pending) {
      // Skip if another path already claimed / removed this id mid-loop.
      if (syncingItemIds.has(item.id)) continue;
      const stillQueued = (await getQueueItems()).find((entry) => entry.id === item.id);
      if (!stillQueued || stillQueued.status === "synced") continue;

      // Simple backoff: wait longer after repeated failures (max ~8s).
      if (stillQueued.retry_count > 0) {
        const delayMs = Math.min(8000, 250 * 2 ** Math.min(stillQueued.retry_count, 5));
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      try {
        await updateQueueItem({
          ...stillQueued,
          status: "retrying",
          last_attempt: new Date().toISOString(),
        });
        const result = await syncQueueItem(stillQueued, options);
        if (result.id) {
          synced += 1;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Sync failed";
        const nextRetry = stillQueued.retry_count + 1;
        // Keep retrying on reconnect — mark failed for UI, but still include in future auto-sync.
        const exists = (await getQueueItems()).some((entry) => entry.id === stillQueued.id);
        if (!exists) continue;
        await updateQueueItem({
          ...stillQueued,
          status: nextRetry >= 5 ? "failed" : "pending",
          retry_count: nextRetry,
          last_attempt: new Date().toISOString(),
          error_message: message,
        });
      }
    }
    const remaining = (await getQueueItems()).filter((i) => i.status !== "synced").length;
    return { synced, total: pending.length, remaining };
  })().finally(() => {
    syncAllInFlight = null;
  });

  return syncAllInFlight;
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

export async function updateContact(
  contactId: string,
  payload: LeadPayload,
  cardImageBase64?: string,
): Promise<void> {
  const email = pickPrimaryEmail(payload);
  const nextPayload = { ...payload, email };
  const online = typeof navigator === "undefined" || navigator.onLine;
  const image =
    cardImageBase64 && cardImageBase64.startsWith("data:image/")
      ? cardImageBase64
      : undefined;

  if (online) {
    await updateContactInLocalDb(contactId, nextPayload, image);
    const existing = await getStoredContactById(contactId);
    if (existing) {
      await updateStoredContact(contactId, {
        ...(nextPayload as Record<string, unknown>),
        emailAddress: email,
        ...(image ? { cardImageBase64: image } : {}),
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
    ...(image ? { cardImageBase64: image } : {}),
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
