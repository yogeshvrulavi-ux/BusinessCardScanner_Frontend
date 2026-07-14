const STORAGE_KEY = "cs-capture-source-stats";
const EMPTY = {
  queuedOffline: 0,
  syncedFromQueue: 0,
  directToZoho: 0
};
function loadCaptureSourceStats() {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    return {
      queuedOffline: Math.max(0, Number(parsed.queuedOffline) || 0),
      syncedFromQueue: Math.max(0, Number(parsed.syncedFromQueue) || 0),
      directToZoho: Math.max(0, Number(parsed.directToZoho) || 0)
    };
  } catch {
    return { ...EMPTY };
  }
}
function persist(next) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("cs-capture-stats-updated"));
}
function bump(field) {
  const stats = loadCaptureSourceStats();
  stats[field] += 1;
  persist(stats);
}
function recordOfflineQueueCapture() {
  bump("queuedOffline");
}
function recordDirectZohoCapture() {
  bump("directToZoho");
}
function recordQueueSyncedToZoho() {
  bump("syncedFromQueue");
}
export {
  loadCaptureSourceStats,
  recordDirectZohoCapture,
  recordOfflineQueueCapture,
  recordQueueSyncedToZoho
};
