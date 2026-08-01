import { useCallback, useEffect, useState } from "react";
import { ExternalLink, HardDrive, Loader2, Unplug } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";
import { apiFetch } from "@/lib/apiFetch";
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
  const sheetUrl = status?.sheet_url;
  const lastDriveSync = status?.connected_at
    ? new Date(status.connected_at).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const connectionLabel =
    status?.oauth_configured === false
      ? "Not configured"
      : connected
        ? "Connected"
        : "Not Connected";

  return (
    <Card className="flex h-full flex-col rounded-2xl border-border/60 p-6 shadow-soft">
      <div className="flex items-center gap-2 text-sm font-medium">
        <HardDrive className="h-4 w-4 text-primary" /> Google Drive
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Connect your Google account once. Your company contacts sheet is created in{" "}
        <strong>your</strong> Drive (free), then Users can view it and the app can sync rows.
      </p>

      {loading ? (
        <div className="mt-5 flex flex-1 items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking connection…
        </div>
      ) : (
        <div className="mt-4 flex flex-1 flex-col">
          <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-1">
            <div className="flex items-center justify-between gap-3 border-b border-border/40 py-2.5">
              <span className="text-xs text-muted-foreground">Connection Status</span>
              <span className="text-sm font-medium text-foreground">{connectionLabel}</span>
            </div>
            {connected ? (
              <div className="flex items-center justify-between gap-3 border-b border-border/40 py-2.5">
                <span className="text-xs text-muted-foreground">Connected As</span>
                <span className="max-w-[55%] truncate text-right text-sm font-medium text-foreground">
                  {status?.google_email || "Google account"}
                </span>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3 border-b border-border/40 py-2.5">
              <span className="text-xs text-muted-foreground">Last Drive Sync</span>
              <span className="text-sm font-medium tabular-nums text-foreground">{lastDriveSync}</span>
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-xs text-muted-foreground">Drive Folder</span>
              {sheetUrl ? (
                <a
                  href={sheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex max-w-[55%] items-center gap-1 truncate text-sm font-medium text-primary hover:underline"
                >
                  Open sheet <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ) : (
                <span className="text-sm font-medium text-foreground">—</span>
              )}
            </div>
          </div>

          {status?.oauth_configured === false ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Place <code className="text-[11px]">secrets/client_secret_*.json</code> or set{" "}
              <code className="text-[11px]">GOOGLE_OAUTH_CLIENT_ID</code> / SECRET / REDIRECT_URI,
              then restart the backend.
            </p>
          ) : null}

          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            {!connected ? (
              <Button type="button" disabled={busy || status?.oauth_configured === false} onClick={handleConnect}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Connect Google Drive
              </Button>
            ) : (
              <>
                <Button type="button" disabled={busy} onClick={handleEnsureSheet}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create / refresh sheet
                </Button>
                <Button type="button" variant="outline" disabled={busy} onClick={handleDisconnect}>
                  <Unplug className="mr-2 h-4 w-4" />
                  Disconnect
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
