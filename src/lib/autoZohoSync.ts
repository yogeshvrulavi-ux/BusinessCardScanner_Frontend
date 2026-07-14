import { getQueueItems, listStoredContacts } from "@/lib/indexeddb";
import { isContactPendingZoho, runAutoZohoSyncWhenOnline, type StoredContact } from "@/lib/contactStorage";
import { loadUserSettings } from "@/lib/settingsStorage";

export type AutoZohoSyncSummary = {
  ran: boolean;
  queueSynced: number;
  queueTotal: number;
  contactsSynced: number;
  contactsTotal: number;
};

export async function countPendingZohoSync(): Promise<{ queue: number; contacts: number }> {
  const queue = await getQueueItems();
  const queuePending = queue.filter(
    (item) => item.status === "pending" || item.status === "retrying",
  ).length;
  const contacts = await listStoredContacts();
  const contactsPending = contacts.filter((c) =>
    isContactPendingZoho(c as StoredContact),
  ).length;
  return { queue: queuePending, contacts: contactsPending };
}

/** Run automatic Zoho sync when online if the user enabled it in Settings. */
export async function maybeAutoSyncToZohoWhenOnline(): Promise<AutoZohoSyncSummary> {
  const empty: AutoZohoSyncSummary = {
    ran: false,
    queueSynced: 0,
    queueTotal: 0,
    contactsSynced: 0,
    contactsTotal: 0,
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
  const contacts = await listStoredContacts();
  const contactsPending = contacts.filter((c) =>
    isContactPendingZoho(c as StoredContact),
  );

  if (queuePending.length === 0 && contactsPending.length === 0) {
    return empty;
  }

  const result = await runAutoZohoSyncWhenOnline({
    skipWhatsApp: !prefs.whatsappNotificationsEnabled,
    skipEmail: !prefs.emailNotificationsEnabled,
  });

  return { ran: true, ...result };
}
