import { useCallback, useEffect, useState } from "react";
import { ExternalLink, HardDrive, Loader2, RefreshCw, Unplug } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";
import { apiFetch } from "@/lib/apiFetch";
import { formatLastSyncTime, readLastSyncTime } from "@/lib/syncStatus";
import { toast } from "sonner";

type GoogleDriveStatus = {
  oauth_configured?: boolean;
  connected?: boolean;
  google_email?: string | null;
  connected_at?: string | null;
  company_sheet_id?: string | null;
  user_sheet_id?: string | null;
  sheet_url?: string | null;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(`${API_BASE_URL}${url}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = body?.detail?.message ?? body?.detail ?? `Request failed (${res.status})`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return body as T;
}

function relativeConnectedAt(iso?: string | null): string {
  if (!iso) return formatLastSyncTime(readLastSyncTime()) || "—";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "—";
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Compact Google Drive status card for Settings. */
export function GoogleDriveConnectCard() {
  const [status, setStatus] = useState<GoogleDriveStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJson<GoogleDriveStatus>("/api/google/oauth/status");
      setStatus(data);
    } catch (err) {
      setStatus({ oauth_configured: false, connected: false });
      toast.error(err instanceof Error ? err.message : "Could not load Google Drive status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const google = params.get("google");
    if (!google) return;
    if (google === "connected") {
      toast.success("Google Drive connected.");
      void refresh();
    } else if (google === "error") {
      toast.error(`Google connect failed: ${params.get("message") || "unknown error"}`);
    }
    params.delete("google");
    params.delete("message");
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
    window.history.replaceState({}, "", next);
  }, [refresh]);

  const handleConnect = async () => {
    setBusy(true);
    try {
      const data = await fetchJson<{
        authorize_url?: string | null;
        oauth_configured?: boolean;
        message?: string;
      }>("/api/google/oauth/start");
      if (data.oauth_configured === false || !data.authorize_url) {
        setStatus((prev) => ({ ...(prev || {}), oauth_configured: false, connected: false }));
        toast.message(
          data.message ||
            "Google OAuth is not configured on the server. Google Drive connect is disabled.",
        );
        setBusy(false);
        return;
      }
      window.location.href = data.authorize_url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start Google connect.");
      setBusy(false);
    }
  };

  const handleEnsureSheet = async () => {
    setBusy(true);
    try {
      const data = await fetchJson<{ sheet_url?: string; spreadsheet_id?: string }>(
        "/api/google/sheets/ensure",
        { method: "POST" },
      );
      toast.success("Google Sheet ready.");
      if (data.sheet_url) {
        window.open(data.sheet_url, "_blank", "noopener,noreferrer");
      }
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create sheet.");
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setBusy(true);
    try {
      await fetchJson("/api/google/oauth/disconnect", { method: "POST" });
      toast.success("Google Drive disconnected.");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Disconnect failed.");
    } finally {
      setBusy(false);
    }
  };

  const connected = Boolean(status?.connected);

  return (
    <Card className="rounded-2xl border-border/60 p-4 shadow-soft sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HardDrive className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">Google Drive</h3>
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              ) : (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    connected
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : status?.oauth_configured === false
                        ? "bg-muted text-muted-foreground"
                        : "bg-amber-500/15 text-amber-800 dark:text-amber-200"
                  }`}
                >
                  {status?.oauth_configured === false
                    ? "Not configured"
                    : connected
                      ? "Connected"
                      : "Not connected"}
                </span>
              )}
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {connected
                ? status?.google_email || "Google account"
                : "Connect once to sync your company contacts sheet."}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Last sync · {relativeConnectedAt(status?.connected_at)}
              {status?.sheet_url ? (
                <>
                  {" · "}
                  <a
                    href={status.sheet_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
                  >
                    Open sheet <ExternalLink className="h-3 w-3" />
                  </a>
                </>
              ) : null}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!connected ? (
            <Button
              type="button"
              size="sm"
              className="rounded-lg"
              disabled={busy || status?.oauth_configured === false}
              onClick={handleConnect}
            >
              {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Connect
            </Button>
          ) : (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-lg"
                disabled={busy}
                onClick={handleConnect}
              >
                Reconnect
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-lg"
                disabled={busy}
                onClick={handleEnsureSheet}
              >
                {busy ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                )}
                Sync now
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="rounded-lg text-muted-foreground"
                disabled={busy}
                onClick={handleDisconnect}
              >
                <Unplug className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
