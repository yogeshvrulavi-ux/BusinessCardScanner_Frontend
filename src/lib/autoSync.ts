import { getQueueItems } from "@/lib/indexeddb";
import { syncAllQueueItems } from "@/lib/contactStorage";
import { loadUserSettings } from "@/lib/settingsStorage";

export type AutoSyncSummary = {
  ran: boolean;
  queueSynced: number;
  queueTotal: number;
  queueRemaining: number;
};

export async function countPendingSync(): Promise<{ queue: number }> {
  const queue = await getQueueItems();
  // Include failed items so reconnect drains the whole IndexedDB queue.
  const queuePending = queue.filter(
    (item) =>
      item.status === "pending" ||
      item.status === "retrying" ||
      item.status === "failed",
  ).length;
  return { queue: queuePending };
}

/** Run automatic sync to PostgreSQL when online if the user enabled it in Settings. */
export async function maybeAutoSyncWhenOnline(): Promise<AutoSyncSummary> {
  const empty: AutoSyncSummary = {
    ran: false,
    queueSynced: 0,
    queueTotal: 0,
    queueRemaining: 0,
  };

  if (typeof navigator === "undefined" || !navigator.onLine) {
    return empty;
  }

  const prefs = loadUserSettings();
  if (!prefs.autoSyncQueueWhenOnline) {
    return empty;
  }

  const queue = await getQueueItems();
  const queuePending = queue.filter(
    (item) =>
      item.status === "pending" ||
      item.status === "retrying" ||
      item.status === "failed",
  );

  if (queuePending.length === 0) {
    return { ...empty, queueRemaining: 0 };
  }

  const result = await syncAllQueueItems({
    skipWhatsApp: !prefs.whatsappNotificationsEnabled,
    skipEmail: !prefs.emailNotificationsEnabled,
    includeFailed: true,
  });

  return {
    ran: true,
    queueSynced: result.synced,
    queueTotal: result.total,
    queueRemaining: result.remaining,
  };
}
