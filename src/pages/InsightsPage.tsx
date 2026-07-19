import { useEffect, useState } from "react";
import { BarChart3, CalendarDays, Loader2, RefreshCw, Users, Building2, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/PageShell";
import { AuthGate } from "@/components/auth/AuthGate";
import { apiFetch } from "@/lib/apiFetch";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";

type AnalyticsSummary = {
  total: number;
  synced: number;
  pending: number;
  failed: number;
  by_company: Array<{ company_name: string; count: number }>;
  by_user: Array<{
    user_id: string | null;
    user_name: string;
    username: string;
    email: string;
    role: string;
    company_name: string;
    admin_name: string;
    count: number;
    event_count: number;
  }>;
  by_event: Array<{
    event_id: string | null;
    event_name: string;
    company_name: string;
    admin_name: string;
    contact_count: number;
    user_count: number;
    synced: number;
    pending: number;
    failed: number;
    contributors: string;
    first_capture: string;
    last_capture: string;
  }>;
  recent_activity: Array<{ date: string; count: number }>;
  error?: string;
};

export function InsightsPage() {
  return (
    <AuthGate allowedRoles={["SUPER_ADMIN"]}>
      <InsightsPageInner />
    </AuthGate>
  );
}

function InsightsPageInner() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/analytics/summary`);
      if (!res.ok) {
        throw new Error(`Failed to load analytics (${res.status})`);
      }
      const json: AnalyticsSummary = await res.json();
      setData(json);
      if (json.error) {
        toast.error("Some analytics data could not be loaded.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load insights.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const maxActivity = data?.recent_activity?.length
    ? Math.max(...data.recent_activity.map((d) => d.count), 1)
    : 1;

  return (
    <PageShell
      title="Insights"
      description="Contact capture analytics and team performance overview"
      actions={
        <Button
          variant="outline"
          onClick={() => void load(true)}
          disabled={isRefreshing}
          className="h-10 rounded-xl"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Loading insights...</p>
        </div>
      ) : !data ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-display text-lg font-semibold">No data available</h3>
          <p className="mt-1 text-sm text-muted-foreground">Unable to load analytics data.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon={<Users className="h-5 w-5" />} label="Total Contacts" value={data.total} accent="bg-primary/10 text-primary" />
            <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Synced" value={data.synced} accent="bg-emerald-500/10 text-emerald-600" />
            <StatCard icon={<RefreshCw className="h-5 w-5" />} label="Pending" value={data.pending} accent="bg-amber-500/10 text-amber-600" />
            <StatCard icon={<BarChart3 className="h-5 w-5" />} label="Failed" value={data.failed} accent="bg-destructive/10 text-destructive" />
          </div>

          {/* Recent activity chart */}
          {data.recent_activity.length > 0 && (
            <Card className="rounded-2xl border-border/60 p-5 shadow-soft">
              <h3 className="mb-4 font-display text-base font-semibold">Recent Activity (7 days)</h3>
              <div className="flex items-end gap-2 h-32">
                {data.recent_activity.map((day) => (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                    <div className="text-[10px] font-medium text-muted-foreground">{day.count}</div>
                    <div
                      className="w-full rounded-t-md bg-primary/70 transition-all"
                      style={{ height: `${Math.max((day.count / maxActivity) * 100, 4)}%` }}
                    />
                    <div className="text-[9px] text-muted-foreground">
                      {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* By company */}
          {data.by_company.length > 0 && (
            <Card className="rounded-2xl border-border/60 p-5 shadow-soft">
              <h3 className="mb-4 flex items-center gap-2 font-display text-base font-semibold">
                <Building2 className="h-4 w-4 text-muted-foreground" /> Contacts by Company
              </h3>
              <div className="space-y-2">
                {data.by_company.map((row) => (
                  <div key={row.company_name} className="flex items-center justify-between rounded-lg border border-border/40 px-4 py-2">
                    <span className="text-sm font-medium">{row.company_name}</span>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">{row.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Event activity */}
          {data.by_event.length > 0 && (
            <Card className="rounded-2xl border-border/60 p-5 shadow-soft">
              <h3 className="mb-1 flex items-center gap-2 font-display text-base font-semibold">
                <CalendarDays className="h-4 w-4 text-muted-foreground" /> Event Analytics
              </h3>
              <p className="mb-4 text-xs text-muted-foreground">
                Events, team participation, and captured contacts in your accessible companies.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-sm">
                  <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="pb-2 font-medium">Event</th>
                      <th className="pb-2 font-medium">Company / Admin</th>
                      <th className="pb-2 font-medium">Contributors</th>
                      <th className="pb-2 font-medium text-right">Users</th>
                      <th className="pb-2 font-medium text-right">Contacts</th>
                      <th className="pb-2 font-medium text-right">Synced</th>
                      <th className="pb-2 font-medium text-right">Pending</th>
                      <th className="pb-2 font-medium">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {data.by_event.map((row, i) => (
                      <tr key={`${row.company_name}-${row.event_name}-${row.event_id ?? i}`}>
                        <td className="py-3 font-medium">{row.event_name}</td>
                        <td className="py-3">
                          <div>{row.company_name}</div>
                          {row.admin_name && (
                            <div className="text-xs text-muted-foreground">Admin: {row.admin_name}</div>
                          )}
                        </td>
                        <td className="max-w-72 py-3 text-muted-foreground">{row.contributors || "Unknown"}</td>
                        <td className="py-3 text-right">{row.user_count}</td>
                        <td className="py-3 text-right font-semibold">{row.contact_count}</td>
                        <td className="py-3 text-right text-emerald-600">{row.synced}</td>
                        <td className="py-3 text-right text-amber-600">{row.pending}</td>
                        <td className="py-3 text-muted-foreground">
                          {new Date(row.last_capture).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* By user */}
          {data.by_user.length > 0 && (
            <Card className="rounded-2xl border-border/60 p-5 shadow-soft">
              <h3 className="mb-4 flex items-center gap-2 font-display text-base font-semibold">
                <Users className="h-4 w-4 text-muted-foreground" /> User Analytics
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="pb-2 font-medium">User</th>
                      <th className="pb-2 font-medium">Role</th>
                      <th className="pb-2 font-medium">Company</th>
                      <th className="pb-2 font-medium">Admin</th>
                      <th className="pb-2 font-medium text-right">Events</th>
                      <th className="pb-2 font-medium text-right">Contacts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {data.by_user.map((row, i) => (
                      <tr key={row.user_id ?? `${row.user_name}-${i}`}>
                        <td className="py-3">
                          <div className="font-medium">{row.user_name}</div>
                          <div className="text-xs text-muted-foreground">{row.email || row.username}</div>
                        </td>
                        <td className="py-3 text-muted-foreground">{row.role}</td>
                        <td className="py-3 text-muted-foreground">{row.company_name}</td>
                        <td className="py-3 text-muted-foreground">{row.admin_name || "—"}</td>
                        <td className="py-3 text-right">{row.event_count}</td>
                        <td className="py-3 text-right">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{row.count}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </PageShell>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <Card className="rounded-2xl border-border/60 p-4 shadow-soft">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}
