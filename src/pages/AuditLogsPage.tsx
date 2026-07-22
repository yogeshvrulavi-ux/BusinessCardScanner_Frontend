import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, ScrollText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/PageShell";
import { AuthGate } from "@/components/auth/AuthGate";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";
import { apiFetch } from "@/lib/apiFetch";

type AuditLog = {
  id: string;
  user_id: string | null;
  action: string;
  created_at: string;
  new_value?: unknown;
  actor_name?: string;
  actor_username?: string;
  actor_email?: string;
  actor_role?: string;
};

/** Username of the acting user; failed logins have no linked user, so fall
 * back to the identifier the person typed (stored in new_value). */
function usernameOf(log: AuditLog): string {
  if (log.actor_username) return log.actor_username;
  if (log.new_value && typeof log.new_value === "object") {
    const identifier = (log.new_value as { identifier?: unknown }).identifier;
    if (typeof identifier === "string" && identifier.trim()) return identifier;
  }
  return "";
}

export function AuditLogsPage() {
  return (
    <AuthGate allowedRoles={["SUPER_ADMIN"]}>
      <AuditLogsPageInner />
    </AuthGate>
  );
}

function AuditLogsPageInner() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/audit-logs?page=1&limit=100`);
      if (!res.ok) throw new Error("Failed to load audit logs.");
      const data = await res.json();
      setItems(data.items ?? data.logs ?? []);
      setTotal(data.total ?? (data.items?.length ?? 0));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load audit logs.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PageShell
      title="Audit Logs"
      description={total ? `${total} events` : "System-wide invitation and account events"}
      actions={
        <Button variant="outline" onClick={() => void load(true)} disabled={isRefreshing} className="rounded-md">
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      <Card className="rounded-2xl border-border/60 p-4 shadow-soft sm:p-6">
        {isLoading ? (
          <div className="flex flex-col items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <ScrollText className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No audit events yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Performed By</th>
                  <th className="px-4 py-3 font-medium">Username</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 font-medium">{log.action}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{log.actor_name?.trim() || log.actor_username || "System"}</div>
                      <div className="text-xs text-muted-foreground">
                        {log.actor_email || (log.user_id ? `User ${log.user_id}` : "Automated event")}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {usernameOf(log) || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {log.actor_role?.replaceAll("_", " ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageShell>
  );
}
