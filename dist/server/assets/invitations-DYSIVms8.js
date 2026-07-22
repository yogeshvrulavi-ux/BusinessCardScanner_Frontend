import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useCallback, useEffect, useMemo } from "react";
import { Search, Loader2, Mail, Plus, RotateCcw, MailX, RefreshCw } from "lucide-react";
import { P as PageShell, C as Card } from "./PageShell-NqYVBqI-.js";
import { A as AuthGate, a as useConfirmModal, u as useAuth, I as Input, B as Button } from "./router-Dkk-a0yt.js";
import { B as Badge } from "./badge-CPV5HTrS.js";
import { I as InviteUserModal } from "./InviteUserModal-ZCFCYGcQ.js";
import { toast } from "sonner";
import { e as fetchInvitations, r as resendInvitation, g as revokeInvitation } from "./adminApi-BUY9nMV3.js";
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
import "./dialog-Bw9GmcQt.js";
import "./label-CL7WfdZU.js";
import "@radix-ui/react-label";
function InvitationsPage() {
  return /* @__PURE__ */ jsx(AuthGate, { allowedRoles: ["SUPER_ADMIN", "ADMIN"], children: /* @__PURE__ */ jsx(InvitationsPageInner, {}) });
}
function InvitationsPageInner() {
  const { confirm } = useConfirmModal();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const load = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const res = await fetchInvitations();
      setItems(res.items);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load invitations.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) => i.email.toLowerCase().includes(q) || i.role.toLowerCase().includes(q) || i.status.toLowerCase().includes(q) || (i.company_name || "").toLowerCase().includes(q)
    );
  }, [items, search]);
  const handleResend = async (inv) => {
    try {
      await resendInvitation(inv.id);
      toast.success(`Invitation resent to ${inv.email}.`);
      void load(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend.");
    }
  };
  const handleRevoke = async (inv) => {
    const ok = await confirm({
      title: "Revoke invitation?",
      description: `The pending invite for ${inv.email} will no longer work.`,
      confirmLabel: "Revoke",
      destructive: true
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
  const statusBadge = (status) => {
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
  const formatDate = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      InviteUserModal,
      {
        open: inviteOpen,
        onOpenChange: setInviteOpen,
        onSuccess: () => void load(true)
      }
    ),
    /* @__PURE__ */ jsx(
      PageShell,
      {
        title: "Invitations",
        description: isSuperAdmin ? "Invite Admins and track invitation status" : "Invite Users and track invitation status",
        actions: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxs(
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
          ),
          /* @__PURE__ */ jsxs(Button, { onClick: () => setInviteOpen(true), className: "h-10 rounded-xl bg-gradient-primary", children: [
            /* @__PURE__ */ jsx(Plus, { className: "mr-2 h-4 w-4" }),
            "Invite ",
            isSuperAdmin ? "Admin" : "User"
          ] })
        ] }),
        children: /* @__PURE__ */ jsxs(Card, { className: "rounded-2xl border-border/60 p-4 shadow-soft sm:p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative mb-4", children: [
            /* @__PURE__ */ jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: search,
                onChange: (e) => setSearch(e.target.value),
                placeholder: "Search by email, role, status, or company",
                className: "h-10 rounded-md border-border/60 bg-background pl-9"
              }
            )
          ] }),
          isLoading ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-16", children: [
            /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }),
            /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "Loading invitations…" })
          ] }) : items.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-16 text-center", children: [
            /* @__PURE__ */ jsx(Mail, { className: "h-10 w-10 text-muted-foreground" }),
            /* @__PURE__ */ jsx("h3", { className: "mt-4 font-display text-lg font-semibold", children: "No invitations yet" }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 max-w-sm text-sm text-muted-foreground", children: "Send an invitation by email. The recipient creates their own password." }),
            /* @__PURE__ */ jsxs(Button, { className: "mt-5 rounded-xl bg-gradient-primary", onClick: () => setInviteOpen(true), children: [
              /* @__PURE__ */ jsx(Plus, { className: "mr-2 h-4 w-4" }),
              "Send invitation"
            ] })
          ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-xl border border-border/60", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Email" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Role" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Company" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Status" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Expires" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium text-right", children: "Actions" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border/60", children: filtered.map((inv) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30", children: [
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium", children: inv.email }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: inv.role }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground", children: inv.company_name || "—" }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(Badge, { className: `rounded-full border text-[10px] font-medium ${statusBadge(inv.status)}`, children: inv.status }) }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground", children: formatDate(inv.expires_at) }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right", children: inv.status === "pending" && /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-1", children: [
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "ghost",
                    size: "icon",
                    className: "h-8 w-8",
                    title: "Resend",
                    onClick: () => void handleResend(inv),
                    children: /* @__PURE__ */ jsx(RotateCcw, { className: "h-4 w-4" })
                  }
                ),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "ghost",
                    size: "icon",
                    className: "h-8 w-8 text-destructive",
                    title: "Revoke",
                    onClick: () => void handleRevoke(inv),
                    children: /* @__PURE__ */ jsx(MailX, { className: "h-4 w-4" })
                  }
                )
              ] }) })
            ] }, inv.id)) })
          ] }) })
        ] })
      }
    )
  ] });
}
const SplitComponent = InvitationsPage;
export {
  SplitComponent as component
};
