import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  User as UserIcon,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/layout/PageShell";
import { AuthGate } from "@/components/auth/AuthGate";
import { InviteUserModal } from "@/components/admin/InviteUserModal";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "sonner";
import {
  fetchCompanies,
  fetchUsers,
  deleteCompany,
  type Company,
  type User,
} from "@/lib/adminApi";
import { formatPersonDisplay, personInitials } from "@/lib/personDisplay";
import { cn } from "@/lib/utils";
import {
  TABLE_PAGE_SIZE,
  TablePagination,
  clampPageAfterDelete,
} from "@/components/ui/table-pagination";

export function CompaniesPage() {
  return (
    <AuthGate allowedRoles={["SUPER_ADMIN"]}>
      <CompaniesPageInner />
    </AuthGate>
  );
}

function adminLabel(company: Company): string {
  return (
    formatPersonDisplay({
      fullName: company.admin_name,
      email: company.admin_email,
    }) || "No admin yet"
  );
}

function userDisplayName(user: User): string {
  return (
    formatPersonDisplay({
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
    }) || user.email
  );
}

/** Users belonging to this Admin/company only — never cross-assign. */
function usersForCompany(company: Company, users: User[]): User[] {
  return users.filter((u) => {
    if (String(u.role || "").toUpperCase() !== "USER") return false;
    if (company.admin_id) {
      if (u.admin_id) return u.admin_id === company.admin_id;
      return u.company_id === company.id;
    }
    return u.company_id === company.id;
  });
}

function CompaniesPageInner() {
  const { confirm } = useConfirmModal();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async (silent = false, pageOverride?: number) => {
    const targetPage = pageOverride ?? page;
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const [companiesRes, usersRes] = await Promise.all([
        fetchCompanies(targetPage, TABLE_PAGE_SIZE),
        fetchUsers(1, 200),
      ]);
      const nextPage = clampPageAfterDelete(targetPage, companiesRes.total, TABLE_PAGE_SIZE);
      if (nextPage !== targetPage) {
        setPage(nextPage);
        const again = await fetchCompanies(nextPage, TABLE_PAGE_SIZE);
        setCompanies(again.items);
        setTotal(again.total);
      } else {
        setCompanies(companiesRes.items);
        setTotal(companiesRes.total);
      }
      setAllUsers(usersRes.items.filter((u) => String(u.role || "").toUpperCase() === "USER"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load employees.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const hierarchy = useMemo(
    () =>
      companies.map((company) => ({
        company,
        users: usersForCompany(company, allUsers),
      })),
    [companies, allUsers],
  );

  const toggleExpanded = (companyId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(companyId)) next.delete(companyId);
      else next.add(companyId);
      return next;
    });
  };

  const handleDelete = async (company: Company) => {
    const label = adminLabel(company);
    const ok = await confirm({
      title: "Delete company?",
      description: `Are you sure you want to delete the company for "${label}"${
        company.company_name ? ` (${company.company_name})` : ""
      }? This action cannot be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;

    try {
      await deleteCompany(company.id);
      toast.success(`Company for "${label}" deleted.`);
      void load(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete company.");
    }
  };

  const statusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
      case "inactive":
        return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
      case "suspended":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200 dark:bg-muted dark:text-muted-foreground dark:border-border";
    }
  };

  return (
    <>
      <InviteUserModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => void load(true)}
        role="ADMIN"
      />

      <PageShell
        title="Employee Management"
        description={
          total > 0
            ? `${total} employee${total === 1 ? "" : "s"}`
            : "Invite and manage company Admins"
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
            <Button
              onClick={() => setCreateOpen(true)}
              className="rounded-md bg-gradient-primary"
            >
              <Plus className="mr-2 h-4 w-4" />
              Invite Admin
            </Button>
          </div>
        }
      >
        <Card className="rounded-2xl border-border/60 p-4 shadow-soft sm:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">Loading employees…</p>
            </div>
          ) : hierarchy.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
                <UserIcon className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">No employees yet</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Invite a company Admin by email. They set their own password when they register.
              </p>
              <Button
                className="mt-5 rounded-md bg-gradient-primary"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Invite Admin
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {hierarchy.map(({ company: c, users }) => {
                  const label = adminLabel(c);
                  const hasAdmin = Boolean(c.admin_name || c.admin_email);
                  const designation = c.admin_designation?.trim() || "Admin";
                  const department = c.admin_department?.trim() || "";
                  const open = expandedIds.has(c.id);
                  const userTotal = c.user_count ?? users.length;

                  return (
                    <Collapsible
                      key={c.id}
                      open={open}
                      onOpenChange={() => toggleExpanded(c.id)}
                    >
                      <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40">
                        <div className="flex items-start gap-2 p-3 sm:p-4">
                          <CollapsibleTrigger asChild>
                            <button
                              type="button"
                              className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground hover:bg-muted/50"
                              aria-label={open ? "Collapse users" : "Expand users"}
                            >
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 transition-transform",
                                  open && "rotate-180",
                                )}
                              />
                            </button>
                          </CollapsibleTrigger>

                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold text-primary">
                              {personInitials({
                                fullName: c.admin_name,
                                email: c.admin_email,
                              })}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="truncate font-medium">
                                  {hasAdmin ? label : "No admin yet"}
                                </span>
                                <Badge className="rounded-full border border-blue-200 bg-blue-100 text-[10px] font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                                  Admin
                                </Badge>
                                <Badge
                                  className={`rounded-full border text-[10px] font-medium ${statusColor(c.status)}`}
                                >
                                  {c.status ?? "active"}
                                </Badge>
                              </div>
                              <div className="mt-0.5 truncate text-xs text-muted-foreground">
                                {c.admin_email?.trim() || "—"}
                              </div>
                              <div className="mt-0.5 text-xs text-muted-foreground">
                                {designation}
                                {department ? ` · ${department}` : ""}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {userTotal} user{userTotal === 1 ? "" : "s"}
                                </span>
                                <span>·</span>
                                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
                                  {c.company_code}
                                </code>
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => void handleDelete(c)}
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <CollapsibleContent>
                          <div className="border-t border-border/50 bg-muted/20 px-3 py-3 sm:px-4">
                            {users.length === 0 ? (
                              <p className="py-2 pl-10 text-xs text-muted-foreground sm:pl-12">
                                No users under this Admin yet.
                              </p>
                            ) : (
                              <ul className="space-y-2">
                                {users.map((u) => (
                                  <li
                                    key={u.id}
                                    className="flex items-start gap-3 rounded-lg border border-border/40 bg-background/80 px-3 py-2.5"
                                  >
                                    <span
                                      className="mt-2 w-3 shrink-0 text-muted-foreground/70"
                                      aria-hidden
                                    >
                                      ├──
                                    </span>
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] font-semibold text-muted-foreground">
                                      {personInitials({
                                        firstName: u.first_name,
                                        lastName: u.last_name,
                                        email: u.email,
                                      })}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="truncate text-sm font-medium">
                                          {userDisplayName(u)}
                                        </span>
                                        <Badge className="rounded-full border border-border/60 bg-muted text-[10px] font-medium text-muted-foreground">
                                          User
                                        </Badge>
                                        <Badge
                                          className={`rounded-full border text-[10px] font-medium ${
                                            u.is_active
                                              ? statusColor("active")
                                              : statusColor("inactive")
                                          }`}
                                        >
                                          {u.is_active ? "active" : "inactive"}
                                        </Badge>
                                      </div>
                                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                                        {u.email}
                                      </div>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>

              <TablePagination
                page={page}
                total={total}
                limit={TABLE_PAGE_SIZE}
                disabled={isLoading || isRefreshing}
                onPageChange={(next) => setPage(next)}
              />
            </>
          )}
        </Card>
      </PageShell>
    </>
  );
}
