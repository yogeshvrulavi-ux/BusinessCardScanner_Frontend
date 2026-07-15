import { getQueueItems } from "@/lib/indexeddb";
import { syncAllQueueItems, type AutoSyncResult } from "@/lib/contactStorage";
import { loadUserSettings } from "@/lib/settingsStorage";

export type AutoSyncSummary = {
  ran: boolean;
  queueSynced: number;
  queueTotal: number;
};

export async function countPendingSync(): Promise<{ queue: number }> {
  const queue = await getQueueItems();
  const queuePending = queue.filter(
    (item) => item.status === "pending" || item.status === "retrying",
  ).length;
  return { queue: queuePending };
}

/** Run automatic sync to PostgreSQL when online if the user enabled it in Settings. */
export async function maybeAutoSyncWhenOnline(): Promise<AutoSyncSummary> {
  const empty: AutoSyncSummary = {
    ran: false,
    queueSynced: 0,
    queueTotal: 0,
  };

  if (typeof navigator === "undefined" || !navigator.onLine) {
    return empty;
  }

  const prefs = loadUserSettings();
  if (!prefs.autoSyncToZohoWhenOnline) {
    return empty;
  }

  const queue = await getQueueItems();
  const queuePending = queue.filter(
    (item) => item.status === "pending" || item.status === "retrying",
  );

  if (queuePending.length === 0) {
    return empty;
  }

  const result = await syncAllQueueItems({
    skipWhatsApp: !prefs.whatsappNotificationsEnabled,
    skipEmail: !prefs.emailNotificationsEnabled,
  });

  return { ran: true, ...result };
}

// Legacy aliases for backward compatibility
export const countPendingZohoSync = countPendingSync;
export const maybeAutoSyncToZohoWhenOnline = maybeAutoSyncWhenOnline;
export type AutoZohoSyncSummary = AutoSyncSummary;
