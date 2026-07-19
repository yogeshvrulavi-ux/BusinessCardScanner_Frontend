import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, Save, KeyRound, Search, User, UserCheck, UserX, Pencil, Trash2, RefreshCw } from "lucide-react";
import { P as PageShell, C as Card } from "./PageShell-DPWj-4WK.js";
import { u as useAuth, I as Input, B as Button, A as AuthGate, a as useConfirmModal } from "./router-CTqOT-Nn.js";
import { B as Badge } from "./badge-CV6iWjqx.js";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, L as Label, e as DialogFooter } from "./label-Dkk4Xk9E.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CtnA8dyC.js";
import { S as Switch } from "./switch-CVGGiDMm.js";
import { toast } from "sonner";
import { u as updateUser, a as adminResetPassword, f as fetchUsers, b as updateUserStatus, d as deleteUser } from "./adminApi-BVIkgpxY.js";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-separator";
import "@radix-ui/react-dialog";
import "@radix-ui/react-tooltip";
import "idb";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-alert-dialog";
import "zod";
import "@radix-ui/react-label";
import "@radix-ui/react-select";
import "@radix-ui/react-switch";
const ROLES = [
  { value: "USER", label: "User" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPER_ADMIN", label: "Super Admin" }
];
function EditUserModal({ open, onOpenChange, user, onSuccess }) {
  const { user: authUser } = useAuth();
  const isSuperAdmin = authUser?.role === "SUPER_ADMIN";
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    role: "USER",
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name ?? "",
        last_name: user.last_name ?? "",
        phone: user.phone ?? "",
        role: user.role,
        is_active: user.is_active
      });
    }
  }, [user]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      await updateUser(user.id, form);
      toast.success(`User "${form.first_name} ${form.last_name}" updated.`);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-h-[90vh] max-w-md overflow-y-auto rounded-2xl", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: "Edit User" }),
      /* @__PURE__ */ jsx(DialogDescription, { children: user ? `${user.email}` : "Update user details" })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "edit_first_name", children: "First Name" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "edit_first_name",
              value: form.first_name ?? "",
              onChange: (e) => set("first_name", e.target.value),
              placeholder: "Jane"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "edit_last_name", children: "Last Name" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "edit_last_name",
              value: form.last_name ?? "",
              onChange: (e) => set("last_name", e.target.value),
              placeholder: "Smith"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "edit_phone", children: "Phone" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "edit_phone",
              value: form.phone ?? "",
              onChange: (e) => set("phone", e.target.value),
              placeholder: "+1 555-0123"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Role" }),
          isSuperAdmin ? /* @__PURE__ */ jsxs(Select, { value: form.role ?? "USER", onValueChange: (v) => set("role", v), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select role" }) }),
            /* @__PURE__ */ jsx(SelectContent, { children: ROLES.map((r) => /* @__PURE__ */ jsx(SelectItem, { value: r.value, children: r.label }, r.value)) })
          ] }) : /* @__PURE__ */ jsx("div", { className: "flex h-9 items-center rounded-md border border-input bg-muted/30 px-3 text-sm capitalize text-muted-foreground", children: user?.role?.toLowerCase().replace("_", " ") ?? "user" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-2 flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Active" }),
            /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground", children: "Deactivated users cannot log in" })
          ] }),
          /* @__PURE__ */ jsx(
            Switch,
            {
              checked: form.is_active ?? true,
              onCheckedChange: (v) => set("is_active", v)
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2 pt-2", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            onClick: () => onOpenChange(false),
            disabled: isSubmitting,
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsxs(Button, { type: "submit", disabled: isSubmitting, className: "bg-gradient-primary", children: [
          isSubmitting ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "mr-2 h-4 w-4" }),
          "Save Changes"
        ] })
      ] })
    ] })
  ] }) });
}
function ResetPasswordModal({ open, onOpenChange, user, onSuccess }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      await adminResetPassword(user.id, newPassword);
      toast.success(`Password reset for "${user.first_name} ${user.last_name}".`);
      setNewPassword("");
      setConfirmPassword("");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleClose = (v) => {
    if (!v) {
      setNewPassword("");
      setConfirmPassword("");
    }
    onOpenChange(v);
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: handleClose, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-md rounded-2xl", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(KeyRound, { className: "h-5 w-5 text-primary" }),
        "Reset Password"
      ] }),
      /* @__PURE__ */ jsxs(DialogDescription, { children: [
        "Set a new password for ",
        user ? `${user.first_name} ${user.last_name}` : "this user",
        ". They will use this password on their next login."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "new_password", children: "New Password *" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "new_password",
            type: "password",
            value: newPassword,
            onChange: (e) => setNewPassword(e.target.value),
            placeholder: "Min 8 characters",
            required: true,
            minLength: 8,
            autoFocus: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "confirm_password", children: "Confirm Password *" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "confirm_password",
            type: "password",
            value: confirmPassword,
            onChange: (e) => setConfirmPassword(e.target.value),
            placeholder: "Repeat password",
            required: true,
            minLength: 8
          }
        ),
        confirmPassword && newPassword !== confirmPassword ? /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-destructive", children: "Passwords do not match." }) : null
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2 pt-2", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            onClick: () => handleClose(false),
            disabled: isSubmitting,
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            type: "submit",
            disabled: isSubmitting || newPassword !== confirmPassword,
            className: "bg-gradient-primary",
            children: [
              isSubmitting ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(KeyRound, { className: "mr-2 h-4 w-4" }),
              "Reset Password"
            ]
          }
        )
      ] })
    ] })
  ] }) });
}
function UsersPage() {
  return /* @__PURE__ */ jsx(AuthGate, { allowedRoles: ["SUPER_ADMIN", "ADMIN"], children: /* @__PURE__ */ jsx(UsersPageInner, {}) });
}
function UsersPageInner() {
  const { confirm } = useConfirmModal();
  const { user: authUser } = useAuth();
  authUser?.role === "SUPER_ADMIN";
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
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
      (u) => `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
    );
  }, [users, search]);
  const handleDelete = async (user) => {
    const ok = await confirm({
      title: "Delete user?",
      description: `Are you sure you want to delete "${user.first_name} ${user.last_name}"? This will soft-delete the user.`,
      confirmLabel: "Delete",
      destructive: true
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
  const handleToggleActive = async (user) => {
    const next = !user.is_active;
    const ok = await confirm({
      title: next ? "Activate user?" : "Deactivate user?",
      description: next ? `"${user.first_name} ${user.last_name}" will be able to log in again.` : `"${user.first_name} ${user.last_name}" will be signed out and cannot log in.`,
      confirmLabel: next ? "Activate" : "Deactivate",
      destructive: !next
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
  const formatDate = (iso) => {
    if (!iso) return "Never";
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return iso;
    }
  };
  const roleBadgeColor = (role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-violet-100 text-violet-700 border-violet-200";
      case "ADMIN":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };
  const roleLabel = (role) => role.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      EditUserModal,
      {
        open: !!editUser,
        onOpenChange: (v) => {
          if (!v) setEditUser(null);
        },
        user: editUser,
        onSuccess: () => {
          setEditUser(null);
          void load(true);
        }
      }
    ),
    /* @__PURE__ */ jsx(
      ResetPasswordModal,
      {
        open: !!resetUser,
        onOpenChange: (v) => {
          if (!v) setResetUser(null);
        },
        user: resetUser,
        onSuccess: () => setResetUser(null)
      }
    ),
    /* @__PURE__ */ jsx(
      PageShell,
      {
        title: "Users",
        description: total > 0 ? `${total} user${total === 1 ? "" : "s"} total` : "Manage users and permissions",
        actions: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            onClick: () => void load(true),
            disabled: isRefreshing,
            className: "h-10 rounded-xl",
            children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: `mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}` }),
              "Refresh"
            ]
          }
        ) }),
        children: /* @__PURE__ */ jsxs(Card, { className: "rounded-2xl border-border/60 p-4 shadow-soft sm:p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative mb-4", children: [
            /* @__PURE__ */ jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: search,
                onChange: (e) => setSearch(e.target.value),
                placeholder: "Search by name, email, username, or role",
                className: "h-10 rounded-md border-border/60 bg-background pl-9"
              }
            )
          ] }),
          isLoading ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-16", children: [
            /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }),
            /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "Loading users…" })
          ] }) : users.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-16 text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-2xl bg-accent", children: /* @__PURE__ */ jsx(User, { className: "h-7 w-7 text-muted-foreground" }) }),
            /* @__PURE__ */ jsx("h3", { className: "mt-4 font-display text-lg font-semibold", children: "No users yet" }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 max-w-xs text-sm text-muted-foreground", children: "Users appear here after they accept an invitation and register." })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: "hidden overflow-x-auto rounded-xl border border-border/60 lg:block", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
              /* @__PURE__ */ jsx("thead", { className: "bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "User" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Username" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Role" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Status" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Last Login" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium text-right", children: "Actions" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border/60", children: filtered.map((u) => /* @__PURE__ */ jsxs("tr", { className: "transition hover:bg-muted/30", children: [
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold text-primary", children: [
                    (u.first_name?.[0] ?? "").toUpperCase(),
                    (u.last_name?.[0] ?? "").toUpperCase()
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
                      u.first_name,
                      " ",
                      u.last_name
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground", children: u.email })
                  ] })
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx("code", { className: "rounded bg-muted px-1.5 py-0.5 text-xs font-mono", children: u.username }) }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(Badge, { className: `rounded-full border text-[10px] font-medium ${roleBadgeColor(u.role)}`, children: roleLabel(u.role) }) }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: u.is_active ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-xs text-emerald-600", children: [
                  /* @__PURE__ */ jsx(UserCheck, { className: "h-3.5 w-3.5" }),
                  " Active"
                ] }) : /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-xs text-muted-foreground", children: [
                  /* @__PURE__ */ jsx(UserX, { className: "h-3.5 w-3.5" }),
                  " Inactive"
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground", children: formatDate(u.last_login) }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1", children: [
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "icon",
                      onClick: () => setEditUser(u),
                      className: "h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg cursor-pointer",
                      title: "Edit",
                      children: /* @__PURE__ */ jsx(Pencil, { className: "h-4 w-4" })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "icon",
                      onClick: () => setResetUser(u),
                      className: "h-8 w-8 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer",
                      title: "Reset password",
                      children: /* @__PURE__ */ jsx(KeyRound, { className: "h-4 w-4" })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "icon",
                      onClick: () => void handleToggleActive(u),
                      className: `h-8 w-8 rounded-lg cursor-pointer ${u.is_active ? "text-muted-foreground hover:text-amber-600 hover:bg-amber-50" : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"}`,
                      title: u.is_active ? "Deactivate" : "Activate",
                      children: u.is_active ? /* @__PURE__ */ jsx(UserX, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(UserCheck, { className: "h-4 w-4" })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "icon",
                      onClick: () => void handleDelete(u),
                      className: "h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer",
                      title: "Delete",
                      children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
                    }
                  )
                ] }) })
              ] }, u.id)) })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "space-y-3 lg:hidden", children: filtered.map((u) => /* @__PURE__ */ jsxs(
              "div",
              {
                className: "rounded-xl border border-border/60 bg-card/40 p-4",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary", children: [
                      (u.first_name?.[0] ?? "").toUpperCase(),
                      (u.last_name?.[0] ?? "").toUpperCase()
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                        /* @__PURE__ */ jsxs("span", { className: "truncate font-medium", children: [
                          u.first_name,
                          " ",
                          u.last_name
                        ] }),
                        /* @__PURE__ */ jsx(Badge, { className: `shrink-0 rounded-full border text-[10px] font-medium ${roleBadgeColor(u.role)}`, children: roleLabel(u.role) })
                      ] }),
                      /* @__PURE__ */ jsx("div", { className: "mt-0.5 truncate text-xs text-muted-foreground", children: u.email }),
                      /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center gap-2", children: [
                        u.is_active ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-[11px] text-emerald-600", children: [
                          /* @__PURE__ */ jsx(UserCheck, { className: "h-3 w-3" }),
                          " Active"
                        ] }) : /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-[11px] text-muted-foreground", children: [
                          /* @__PURE__ */ jsx(UserX, { className: "h-3 w-3" }),
                          " Inactive"
                        ] }),
                        /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-muted-foreground", children: [
                          "· Last login ",
                          formatDate(u.last_login)
                        ] })
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap gap-2 border-t border-border/40 pt-3", children: [
                    /* @__PURE__ */ jsxs(
                      Button,
                      {
                        variant: "outline",
                        size: "sm",
                        onClick: () => setEditUser(u),
                        className: "h-8 rounded-lg text-xs",
                        children: [
                          /* @__PURE__ */ jsx(Pencil, { className: "mr-1.5 h-3.5 w-3.5" }),
                          "Edit"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      Button,
                      {
                        variant: "outline",
                        size: "sm",
                        onClick: () => setResetUser(u),
                        className: "h-8 rounded-lg text-xs",
                        children: [
                          /* @__PURE__ */ jsx(KeyRound, { className: "mr-1.5 h-3.5 w-3.5" }),
                          "Password"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      Button,
                      {
                        variant: "outline",
                        size: "sm",
                        onClick: () => void handleToggleActive(u),
                        className: "h-8 rounded-lg text-xs",
                        children: [
                          u.is_active ? /* @__PURE__ */ jsx(UserX, { className: "mr-1.5 h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(UserCheck, { className: "mr-1.5 h-3.5 w-3.5" }),
                          u.is_active ? "Deactivate" : "Activate"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      Button,
                      {
                        variant: "ghost",
                        size: "sm",
                        onClick: () => void handleDelete(u),
                        className: "h-8 rounded-lg text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
                        children: [
                          /* @__PURE__ */ jsx(Trash2, { className: "mr-1.5 h-3.5 w-3.5" }),
                          "Delete"
                        ]
                      }
                    )
                  ] })
                ]
              },
              u.id
            )) }),
            filtered.length === 0 && search && /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-col items-center justify-center py-8 text-center", children: [
              /* @__PURE__ */ jsx(Search, { className: "h-6 w-6 text-muted-foreground" }),
              /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm text-muted-foreground", children: [
                'No users match "',
                search,
                '"'
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 text-xs text-muted-foreground", children: [
              "Showing ",
              filtered.length,
              " of ",
              total
            ] })
          ] })
        ] })
      }
    )
  ] });
}
const SplitComponent = UsersPage;
export {
  SplitComponent as component
};
