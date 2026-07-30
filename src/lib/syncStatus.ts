/** Last successful offline-queue sync timestamp (localStorage). */

const LAST_SYNC_KEY = "cs-last-sync-at";

export function recordLastSyncTime(iso = new Date().toISOString()): void {
  try {
    localStorage.setItem(LAST_SYNC_KEY, iso);
    window.dispatchEvent(new CustomEvent("cs-last-sync-updated"));
  } catch {
    /* ignore */
  }
}

export function readLastSyncTime(): string | null {
  try {
    return localStorage.getItem(LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

export function formatLastSyncTime(iso: string | null): string {
  if (!iso) return "Never";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
