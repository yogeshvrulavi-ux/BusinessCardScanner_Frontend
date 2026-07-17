/** Local counters: offline IndexedDB queue vs online direct database saves (this device). */
export type CaptureSourceStats = {
  queuedOffline: number;
  syncedFromQueue: number;
  directToDatabase: number;
};

const STORAGE_KEY = "cs-capture-source-stats";

const EMPTY: CaptureSourceStats = {
  queuedOffline: 0,
  syncedFromQueue: 0,
  directToDatabase: 0,
};

export function loadCaptureSourceStats(): CaptureSourceStats {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<CaptureSourceStats>;
    return {
      queuedOffline: Math.max(0, Number(parsed.queuedOffline) || 0),
      syncedFromQueue: Math.max(0, Number(parsed.syncedFromQueue) || 0),
      directToDatabase: Math.max(0, Number(parsed.directToDatabase) || 0),
    };
  } catch {
    return { ...EMPTY };
  }
}

function persist(next: CaptureSourceStats): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("cs-capture-stats-updated"));
}

function bump(field: keyof CaptureSourceStats): void {
  const stats = loadCaptureSourceStats();
  stats[field] += 1;
  persist(stats);
}

export function recordOfflineQueueCapture(): void {
  bump("queuedOffline");
}

export function recordDirectDatabaseCapture(): void {
  bump("directToDatabase");
}

export function recordQueueSyncedToDatabase(): void {
  bump("syncedFromQueue");
}
