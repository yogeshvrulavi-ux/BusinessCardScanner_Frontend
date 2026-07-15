import { useCallback, useEffect, useState } from "react";
import { Building2, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/layout/PageShell";
import { AuthGate } from "@/components/auth/AuthGate";
import { CreateCompanyModal } from "@/components/admin/CreateCompanyModal";
import { useConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "sonner";
import {
  fetchCompanies,
  deleteCompany,
  type Company,
} from "@/lib/adminApi";

export function CompaniesPage() {
  return (
    <AuthGate allowedRoles={["SUPER_ADMIN"]}>
      <CompaniesPageInner />
    </AuthGate>
  );
}

function CompaniesPageInner() {
  const { confirm } = useConfirmModal();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const res = await fetchCompanies(1, 100);
      setCompanies(res.items);
      setTotal(res.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load companies.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (company: Company) => {
    const ok = await confirm({
      title: "Delete company?",
      description: `Are you sure you want to delete "${company.company_name}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;

    try {
      await deleteCompany(company.id);
      toast.success(`Company "${company.company_name}" deleted.`);
      void load(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete company.");
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const statusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "inactive":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "suspended":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  return (
    <>
      <CreateCompanyModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => void load(true)}
      />

      <PageShell
        title="Companies"
        description={total > 0 ? `${total} compan${total === 1 ? "y" : "ies"} registered` : "Manage companies and admin accounts"}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => void load(true)}
              disabled={isRefreshing}
              className="h-10 rounded-xl"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setCreateOpen(true)}
              className="h-10 rounded-xl bg-gradient-primary"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Company
            </Button>
          </div>
        }
      >
        <Card className="rounded-2xl border-border/60 p-4 shadow-soft sm:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">Loading companies…</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
                <Building2 className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">No companies yet</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Create your first company to get started. Each company comes with its own admin user.
              </p>
              <Button
                className="mt-5 rounded-xl bg-gradient-primary"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Company
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto rounded-xl border border-border/60 lg:block">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Company</th>
                      <th className="px-4 py-3 font-medium">Code</th>
                      <th className="px-4 py-3 font-medium">Contact</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Created</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {companies.map((c) => (
                      <tr key={c.id} className="transition hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold text-primary">
                              {c.company_name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium">{c.company_name}</div>
                              {c.address ? (
                                <div className="text-[11px] text-muted-foreground">{c.address}</div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{c.company_code}</code>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {c.email || c.phone ? (
                            <div className="space-y-0.5 text-[11px]">
                              {c.email && <div>{c.email}</div>}
                              {c.phone && <div>{c.phone}</div>}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`rounded-full border text-[10px] font-medium ${statusColor(c.status)}`}>
                            {c.status ?? "active"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {formatDate(c.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => void handleDelete(c)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 lg:hidden">
                {companies.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-border/60 bg-card/40 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                        {c.company_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-medium">{c.company_name}</span>
                          <Badge className={`shrink-0 rounded-full border text-[10px] font-medium ${statusColor(c.status)}`}>
                            {c.status ?? "active"}
                          </Badge>
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          <code className="rounded bg-muted px-1 py-0.5 text-[10px] font-mono">{c.company_code}</code>
                          {c.email ? ` · ${c.email}` : ""}
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          Created {formatDate(c.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2 border-t border-border/40 pt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDelete(c)}
                        className="h-8 rounded-lg text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-xs text-muted-foreground">
                Showing {companies.length} of {total}
              </div>
            </>
          )}
        </Card>
      </PageShell>
    </>
  );
}
