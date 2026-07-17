import { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  User as UserIcon,
  UserCheck,
  UserX,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/layout/PageShell";
import { AuthGate } from "@/components/auth/AuthGate";
import { InviteUserModal } from "@/components/admin/InviteUserModal";
import { EditUserModal } from "@/components/admin/EditUserModal";
import { ResetPasswordModal } from "@/components/admin/ResetPasswordModal";
import { useConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import {
  fetchUsers,
  deleteUser,
  updateUserStatus,
  type User,
} from "@/lib/adminApi";

export function UsersPage() {
  return (
    <AuthGate allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
      <UsersPageInner />
    </AuthGate>
  );
}

function UsersPageInner() {
  const { confirm } = useConfirmModal();
  const { user: authUser } = useAuth();
  const isSuperAdmin = authUser?.role === "SUPER_ADMIN";

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  // Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resetUser, setResetUser] = useState<User | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const res = await fetchUsers(1, 200);
      setUsers(res.items);
      setTotal(res.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q),
    );
  }, [users, search]);

  const handleDelete = async (user: User) => {
    const ok = await confirm({
      title: "Delete user?",
      description: `Are you sure you want to delete "${user.first_name} ${user.last_name}"? This will soft-delete the user.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;

    try {
      await deleteUser(user.id);
      toast.success(`User "${user.first_name} ${user.last_name}" deleted.`);
      void load(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user.");
    }
  };

  const handleToggleActive = async (user: User) => {
    const next = !user.is_active;
    const ok = await confirm({
      title: next ? "Activate user?" : "Deactivate user?",
      description: next
        ? `"${user.first_name} ${user.last_name}" will be able to log in again.`
        : `"${user.first_name} ${user.last_name}" will be signed out and cannot log in.`,
      confirmLabel: next ? "Activate" : "Deactivate",
      destructive: !next,
    });
    if (!ok) return;

    try {
      await updateUserStatus(user.id, next);
      toast.success(`User ${next ? "activated" : "deactivated"}.`);
      void load(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status.");
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "Never";
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const roleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-violet-100 text-violet-700 border-violet-200";
      case "ADMIN":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const roleLabel = (role: string) =>
    role.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <>
      <InviteUserModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => void load(true)}
      />
      <EditUserModal
        open={!!editUser}
        onOpenChange={(v) => { if (!v) setEditUser(null); }}
        user={editUser}
        onSuccess={() => { setEditUser(null); void load(true); }}
      />
      <ResetPasswordModal
        open={!!resetUser}
        onOpenChange={(v) => { if (!v) setResetUser(null); }}
        user={resetUser}
        onSuccess={() => setResetUser(null)}
      />

      <PageShell
        title="Users"
        description={total > 0 ? `${total} user${total === 1 ? "" : "s"} total` : "Manage users and permissions"}
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
              Invite {isSuperAdmin ? "Admin" : "User"}
            </Button>
          </div>
        }
      >
        <Card className="rounded-2xl border-border/60 p-4 shadow-soft sm:p-6">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, username, or role"
              className="h-10 rounded-md border-border/60 bg-background pl-9"
            />
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">Loading users…</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
                <UserIcon className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">No users yet</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Invite someone by email. They create their own password.
              </p>
              <Button
                className="mt-5 rounded-xl bg-gradient-primary"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Invite {isSuperAdmin ? "Admin" : "User"}
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto rounded-xl border border-border/60 lg:block">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">User</th>
                      <th className="px-4 py-3 font-medium">Username</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Last Login</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filtered.map((u) => (
                      <tr key={u.id} className="transition hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold text-primary">
                              {(u.first_name?.[0] ?? "").toUpperCase()}{(u.last_name?.[0] ?? "").toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium">{u.first_name} {u.last_name}</div>
                              <div className="text-[11px] text-muted-foreground">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{u.username}</code>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`rounded-full border text-[10px] font-medium ${roleBadgeColor(u.role)}`}>
                            {roleLabel(u.role)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {u.is_active ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                              <UserCheck className="h-3.5 w-3.5" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <UserX className="h-3.5 w-3.5" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {formatDate(u.last_login)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditUser(u)}
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg cursor-pointer"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setResetUser(u)}
                              className="h-8 w-8 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"
                              title="Reset password"
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => void handleToggleActive(u)}
                              className={`h-8 w-8 rounded-lg cursor-pointer ${
                                u.is_active
                                  ? "text-muted-foreground hover:text-amber-600 hover:bg-amber-50"
                                  : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
                              }`}
                              title={u.is_active ? "Deactivate" : "Activate"}
                            >
                              {u.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => void handleDelete(u)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 lg:hidden">
                {filtered.map((u) => (
                  <div
                    key={u.id}
                    className="rounded-xl border border-border/60 bg-card/40 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                        {(u.first_name?.[0] ?? "").toUpperCase()}{(u.last_name?.[0] ?? "").toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-medium">{u.first_name} {u.last_name}</span>
                          <Badge className={`shrink-0 rounded-full border text-[10px] font-medium ${roleBadgeColor(u.role)}`}>
                            {roleLabel(u.role)}
                          </Badge>
                        </div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">{u.email}</div>
                        <div className="mt-1 flex items-center gap-2">
                          {u.is_active ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                              <UserCheck className="h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <UserX className="h-3 w-3" /> Inactive
                            </span>
                          )}
                          <span className="text-[11px] text-muted-foreground">
                            · Last login {formatDate(u.last_login)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 border-t border-border/40 pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditUser(u)}
                        className="h-8 rounded-lg text-xs"
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setResetUser(u)}
                        className="h-8 rounded-lg text-xs"
                      >
                        <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                        Password
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleToggleActive(u)}
                        className="h-8 rounded-lg text-xs"
                      >
                        {u.is_active ? <UserX className="mr-1.5 h-3.5 w-3.5" /> : <UserCheck className="mr-1.5 h-3.5 w-3.5" />}
                        {u.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDelete(u)}
                        className="h-8 rounded-lg text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {filtered.length === 0 && search && (
                <div className="mt-8 flex flex-col items-center justify-center py-8 text-center">
                  <Search className="h-6 w-6 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No users match "{search}"</p>
                </div>
              )}

              <div className="mt-4 text-xs text-muted-foreground">
                Showing {filtered.length} of {total}
              </div>
            </>
          )}
        </Card>
      </PageShell>
    </>
  );
}
