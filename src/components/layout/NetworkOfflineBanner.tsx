import { useEffect, useState } from "react";
import { Check, WifiOff } from "lucide-react";
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
      className="border-t border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive sm:px-4 md:px-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 font-semibold">
            <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
            <span>You are Offline</span>
          </div>
          <ul className="space-y-0.5 pl-0.5 text-xs font-medium leading-relaxed text-destructive/90 sm:text-[13px]">
            <li className="flex items-start gap-1.5">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>Card scanning is available.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>Contacts are being stored locally.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>They will automatically sync when internet is restored.</span>
            </li>
          </ul>
        </div>
        <ConnectivityStatus compact={false} className="shrink-0 self-start" />
      </div>
    </div>
  );
}
