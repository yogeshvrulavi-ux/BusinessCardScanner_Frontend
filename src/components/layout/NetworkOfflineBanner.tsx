import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { ConnectivityStatus } from "@/components/pwa/ConnectivityStatus";

export function NetworkOfflineBanner() {
  // SSR and first client paint must match — sync navigator.onLine after mount only.
  const [networkOnline, setNetworkOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const sync = () => setNetworkOnline(navigator.onLine);
    const onSyncStart = () => setIsSyncing(true);
    const onSyncEnd = () => setIsSyncing(false);

    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    window.addEventListener("cs-sync-start", onSyncStart);
    window.addEventListener("cs-sync-end", onSyncEnd);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
      window.removeEventListener("cs-sync-start", onSyncStart);
      window.removeEventListener("cs-sync-end", onSyncEnd);
    };
  }, []);

  if (networkOnline && !isSyncing) return null;

  if (isSyncing && networkOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-between gap-2 border-t border-sky-300/40 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100 sm:px-4 md:px-6"
      >
        <p className="min-w-0 leading-snug">Syncing queued contacts…</p>
        <ConnectivityStatus compact={false} syncing />
      </div>
    );
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-center justify-between gap-2 border-t border-destructive/25 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive sm:px-4 md:px-6"
    >
      <div className="flex min-w-0 items-center gap-2">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
        <p className="min-w-0 leading-snug">
          Offline Mode — captures stay on this device until you&apos;re back online.
        </p>
      </div>
      <ConnectivityStatus compact={false} />
    </div>
  );
}
