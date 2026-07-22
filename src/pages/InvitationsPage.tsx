import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Mail,
  MailX,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/layout/PageShell";
import { AuthGate } from "@/components/auth/AuthGate";
import { InviteUserModal } from "@/components/admin/InviteUserModal";
import { useConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import {
  fetchInvitations,
  resendInvitation,
  revokeInvitation,
  type Invitation,
} from "@/lib/adminApi";
import {
  TABLE_PAGE_SIZE,
  TablePagination,
  clampPageAfterDelete,
} from "@/components/ui/table-pagination";

export function InvitationsPage() {
  return (
    <AuthGate allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
      <InvitationsPageInner />
    </AuthGate>
  );
}

function InvitationsPageInner() {
  const { confirm } = useConfirmModal();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [items, setItems] = useState<Invitation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  const load = useCallback(async (silent = false, pageOverride?: number) => {
    const targetPage = pageOverride ?? page;
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const res = await fetchInvitations(undefined, targetPage, TABLE_PAGE_SIZE);
      const nextPage = clampPageAfterDelete(targetPage, res.total, TABLE_PAGE_SIZE);
      if (nextPage !== targetPage) {
        setPage(nextPage);
        const again = await fetchInvitations(undefined, nextPage, TABLE_PAGE_SIZE);
        setItems(again.items);
        setTotal(again.total);
      } else {
        setItems(res.items);
        setTotal(res.total);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load invitations.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.email.toLowerCase().includes(q) ||
        i.role.toLowerCase().includes(q) ||
        i.status.toLowerCase().includes(q) ||
        (i.company_name || "").toLowerCase().includes(q),
    );
  }, [items, search]);

  const handleResend = async (inv: Invitation) => {
    try {
      await resendInvitation(inv.id);
      toast.success(`Invitation resent to ${inv.email}.`);
      void load(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend.");
    }
  };

  const handleRevoke = async (inv: Invitation) => {
    const ok = await confirm({
      title: "Revoke invitation?",
      description: `The pending invite for ${inv.email} will no longer work.`,
      confirmLabel: "Revoke",
      destructive: true,
    });
    if (!ok) return;
    try {
      await revokeInvitation(inv.id);
      toast.success("Invitation revoked.");
      void load(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke.");
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "used":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "expired":
        return "bg-gray-100 text-gray-600 border-gray-200";
      case "revoked":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <>
      <InviteUserModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSuccess={() => void load(true)}
      />

      <PageShell
        title="Invitations"
        description={
          isSuperAdmin
            ? "Invite Admins and track invitation status"
            : "Invite Users and track invitation status"
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => void load(true)}
              disabled={isRefreshing}
              className="rounded-md"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={() => setInviteOpen(true)} className="rounded-md bg-gradient-primary">
              <Plus className="mr-2 h-4 w-4" />
              Invite {isSuperAdmin ? "Admin" : "User"}
            </Button>
          </div>
        }
      >
        <Card className="rounded-2xl border-border/60 p-4 shadow-soft sm:p-6">
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email, role, status, or company"
              className="h-10 rounded-md border-border/60 bg-background pl-9"
            />
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">Loading invitations…</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Mail className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 font-display text-lg font-semibold">No invitations yet</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Send an invitation by email. The recipient creates their own password.
              </p>
              <Button className="mt-5 rounded-md bg-gradient-primary" onClick={() => setInviteOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Send invitation
              </Button>
            </div>
          ) : (
            <>
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-sm">
                <thead className="bg-gradient-primary text-left text-[11px] font-bold uppercase tracking-wider text-white">
                  <tr>
                    <th className="px-4 py-3 font-bold text-white">Email</th>
                    <th className="px-4 py-3 font-bold text-white">Role</th>
                    <th className="px-4 py-3 font-bold text-white">Company</th>
                    <th className="px-4 py-3 font-bold text-white">Status</th>
                    <th className="px-4 py-3 font-bold text-white">Expires</th>
                    <th className="px-4 py-3 font-bold text-white text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-bold text-white">{inv.email}</td>
                      <td className="px-4 py-3">{inv.role}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {inv.company_name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`rounded-full border text-[10px] font-medium ${statusBadge(inv.status)}`}>
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(inv.expires_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {inv.status === "pending" && (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Resend"
                              onClick={() => void handleResend(inv)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              title="Revoke"
                              onClick={() => void handleRevoke(inv)}
                            >
                              <MailX className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={page}
              total={total}
              limit={TABLE_PAGE_SIZE}
              disabled={isLoading || isRefreshing}
              onPageChange={(next) => {
                setSearch("");
                setPage(next);
              }}
            />
            </>
          )}
        </Card>
      </PageShell>
    </>
  );
}
