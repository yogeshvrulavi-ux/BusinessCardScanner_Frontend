export type ContactStatus = "synced" | "pending" | "failed";

export function resolveStoredContactStatus(
  contact: Record<string, unknown>,
): ContactStatus {
  const syncStatus = String(contact.syncStatus || "");
  if (syncStatus === "failed" || contact.status === "failed") return "failed";
  // PostgreSQL rows (and legacy local_only / synced_zoho) are already in the DB.
  if (
    syncStatus === "synced" ||
    syncStatus === "synced_zoho" ||
    syncStatus === "local_only" ||
    contact.status === "synced" ||
    contact.source === "localdb"
  ) {
    return "synced";
  }
  return "pending";
}

export function resolveStoredContactLastSync(
  contact: Record<string, unknown>,
  status: ContactStatus,
): string {
  if (status === "synced") {
    return String(contact.lastSync || contact.synced_at || "Synced to database");
  }
  if (status === "failed") {
    return String(contact.sync_error || contact.lastSync || "Sync failed");
  }
  return "Pending sync";
}

/** @deprecated Use resolveStoredContactStatus */
export const resolveFirebaseContactStatus = resolveStoredContactStatus;

/** @deprecated Use resolveStoredContactLastSync */
export const resolveFirebaseLastSync = resolveStoredContactLastSync;
