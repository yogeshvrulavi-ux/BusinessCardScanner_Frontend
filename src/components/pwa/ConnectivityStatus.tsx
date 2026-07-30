import { useCallback, useEffect, useState } from "react";
import { CloudOff, RefreshCw, Wifi } from "lucide-react";
import {
  CONNECTION_MODE_CHANGED,
  getConnectionMode,
  type ConnectionMode,
} from "@/lib/connectionMode";
import { getQueueItems } from "@/lib/indexeddb";
import { formatLastSyncTime, readLastSyncTime } from "@/lib/syncStatus";
import { cn } from "@/lib/utils";

type ConnectivityStatusProps = {
  className?: string;
  /** Compact chip for the top bar; expanded shows last sync. */
  compact?: boolean;
  syncing?: boolean;
};

/**
 * Online / Offline Mode / Syncing… indicator with pending count + last sync.
 */
export function ConnectivityStatus({
  className,
  compact = true,
  syncing = false,
}: ConnectivityStatusProps) {
  const [mode, setMode] = useState<ConnectionMode>("online");
  const [pending, setPending] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [networkOnline, setNetworkOnline] = useState(true);

  const refresh = useCallback(async () => {
    setMode(getConnectionMode());
    setNetworkOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    setLastSync(readLastSyncTime());
    try {
      const items = await getQueueItems();
      setPending(items.filter((item) => item.status !== "synced").length);
    } catch {
      setPending(0);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onMode = () => void refresh();
    window.addEventListener("online", onMode);
    window.addEventListener("offline", onMode);
    window.addEventListener(CONNECTION_MODE_CHANGED, onMode);
    window.addEventListener("cs-queue-updated", onMode);
    window.addEventListener("cs-last-sync-updated", onMode);
    return () => {
      window.removeEventListener("online", onMode);
      window.removeEventListener("offline", onMode);
      window.removeEventListener(CONNECTION_MODE_CHANGED, onMode);
      window.removeEventListener("cs-queue-updated", onMode);
      window.removeEventListener("cs-last-sync-updated", onMode);
    };
  }, [refresh]);

  const offline = !networkOnline || mode === "offline";
  const label = syncing
    ? "Syncing…"
    : offline
      ? "Offline Mode"
      : "Online";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium shadow-soft",
        offline
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : syncing
            ? "border-sky-300/50 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200"
            : "border-emerald-300/50 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
        className,
      )}
      title={`Last sync: ${formatLastSyncTime(lastSync)}${pending ? ` · ${pending} pending` : ""}`}
    >
      {syncing ? (
        <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden />
      ) : offline ? (
        <CloudOff className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <Wifi className="h-3.5 w-3.5" aria-hidden />
      )}
      <span className="hidden min-[420px]:inline">{label}</span>
      {pending > 0 ? (
        <span className="tabular-nums opacity-90">{pending}</span>
      ) : null}
      {!compact && lastSync ? (
        <span className="hidden text-[10px] font-normal opacity-80 sm:inline">
          · {formatLastSyncTime(lastSync)}
        </span>
      ) : null}
    </div>
  );
}
