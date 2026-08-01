import { useCallback, useEffect, useState } from "react";
import { Database, HardDrive, Loader2, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";
import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/lib/AuthContext";
import { formatLastSyncTime, readLastSyncTime } from "@/lib/syncStatus";

type StorageUsagePayload = {
  cards_scanned?: number;
  contacts?: number;
  images_stored?: number;
  image_bytes?: number;
  database_bytes?: number | null;
};

type StorageConfigResponse = {
  storage?: string;
  database?: { ok?: boolean; storage?: string };
  usage?: StorageUsagePayload;
};

type GoogleDriveStatus = {
  oauth_configured?: boolean;
  connected?: boolean;
  google_email?: string | null;
};

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes === 0) return "0 MB";
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / (1024 * 1024);
  if (mb >= 0.01) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
}

function formatCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "0";
  return Math.max(0, Math.floor(value)).toLocaleString();
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await apiFetch(`${API_BASE_URL}${url}`, {
    headers: { "Content-Type": "application/json" },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = body?.detail?.message ?? body?.detail ?? `Request failed (${res.status})`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return body as T;
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/40 py-2.5 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums text-foreground">{value}</span>
    </div>
  );
}

export function StorageUsageCard() {
  const { hasRole } = useAuth();
  const canSeeDrive = hasRole("ADMIN", "SUPER_ADMIN");
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<StorageUsagePayload | null>(null);
  const [drive, setDrive] = useState<GoogleDriveStatus | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const configPromise = fetchJson<StorageConfigResponse>("/api/storage/config");
      const drivePromise = canSeeDrive
        ? fetchJson<GoogleDriveStatus>("/api/google/oauth/status").catch(() => ({
            connected: false,
          }))
        : Promise.resolve(null);

      const [config, driveStatus] = await Promise.all([configPromise, drivePromise]);
      setUsage(config.usage || null);
      setDrive(driveStatus);
      setLastSync(readLastSyncTime());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load storage usage.");
    } finally {
      setLoading(false);
    }
  }, [canSeeDrive]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onData = () => {
      void refresh();
    };
    const onSync = () => setLastSync(readLastSyncTime());
    window.addEventListener("cs-contacts-updated", onData);
    window.addEventListener("cs-queue-updated", onData);
    window.addEventListener("cs-last-sync-updated", onSync);
    return () => {
      window.removeEventListener("cs-contacts-updated", onData);
      window.removeEventListener("cs-queue-updated", onData);
      window.removeEventListener("cs-last-sync-updated", onSync);
    };
  }, [refresh]);

  const driveConnected = Boolean(drive?.connected);
  const imageBytes = usage?.image_bytes ?? 0;

  return (
    <Card className="flex h-full flex-col rounded-2xl border-border/60 p-6 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <HardDrive className="h-4 w-4 text-primary" /> Storage Usage
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => void refresh()}
          disabled={loading}
          aria-label="Refresh storage usage"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Live counts from your database and card images for the contacts you can access.
      </p>

      {loading && !usage ? (
        <div className="mt-5 flex flex-1 items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading storage…
        </div>
      ) : error && !usage ? (
        <p className="mt-5 text-sm text-destructive">{error}</p>
      ) : (
        <div className="mt-4 flex flex-1 flex-col">
          <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-1">
            <StatRow label="Cards Scanned" value={formatCount(usage?.cards_scanned)} />
            <StatRow label="Contacts" value={formatCount(usage?.contacts)} />
            <StatRow label="Images Stored" value={formatCount(usage?.images_stored)} />
            <StatRow label="Image Storage" value={formatBytes(imageBytes)} />
            <StatRow
              label="Database Storage"
              value={
                usage?.database_bytes != null ? formatBytes(usage.database_bytes) : "—"
              }
            />
            {canSeeDrive ? (
              <>
                <StatRow
                  label="Google Drive"
                  value={driveConnected ? "Connected" : "Not Connected"}
                />
                <StatRow
                  label="Drive Storage Used"
                  value={driveConnected ? formatBytes(imageBytes) : "—"}
                />
              </>
            ) : null}
            <StatRow label="Last Sync" value={formatLastSyncTime(lastSync)} />
          </div>
          <div className="mt-auto flex items-center gap-1.5 pt-3 text-[11px] text-muted-foreground">
            <Database className="h-3 w-3" />
            Scoped to your role · refreshes after scan/sync
          </div>
        </div>
      )}
    </Card>
  );
}
