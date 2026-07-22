import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import { Loader2, Building2, Plus, Trash2, RefreshCw } from "lucide-react";
import { P as PageShell, C as Card } from "./PageShell-DmFkjHU4.js";
import { A as AuthGate, a as useConfirmModal, B as Button } from "./router-VRE0sT79.js";
import { B as Badge } from "./badge-CZj7XPhQ.js";
import { I as InviteUserModal } from "./InviteUserModal-Ckk2rydu.js";
import { toast } from "sonner";
import { h as fetchCompanies, i as deleteCompany } from "./adminApi-tL7U-5o6.js";
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
import "./dialog-CnKEsUqY.js";
import "./label-B1IaclL9.js";
import "@radix-ui/react-label";
function CompaniesPage() {
  return /* @__PURE__ */ jsx(AuthGate, { allowedRoles: ["SUPER_ADMIN"], children: /* @__PURE__ */ jsx(CompaniesPageInner, {}) });
}
function CompaniesPageInner() {
  const { confirm } = useConfirmModal();
  const [companies, setCompanies] = useState([]);
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
  const handleDelete = async (company) => {
    const ok = await confirm({
      title: "Delete company?",
      description: `Are you sure you want to delete "${company.company_name}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      destructive: true
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
  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch {
      return iso;
    }
  };
  const statusColor = (status) => {
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
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      InviteUserModal,
      {
        open: createOpen,
        onOpenChange: setCreateOpen,
        onSuccess: () => void load(true)
      }
    ),
    /* @__PURE__ */ jsx(
      PageShell,
      {
        title: "Companies",
        description: total > 0 ? `${total} compan${total === 1 ? "y" : "ies"} registered` : "Manage companies and admin accounts",
        actions: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              onClick: () => void load(true),
              disabled: isRefreshing,
              className: "h-9 rounded-md",
              children: [
                /* @__PURE__ */ jsx(RefreshCw, { className: `mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}` }),
                "Refresh"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              onClick: () => setCreateOpen(true),
              className: "h-9 rounded-md bg-gradient-primary",
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "mr-2 h-4 w-4" }),
                "Invite Admin"
              ]
            }
          )
        ] }),
        children: /* @__PURE__ */ jsx(Card, { className: "rounded-2xl border-border/60 p-4 shadow-soft sm:p-6", children: isLoading ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-16", children: [
          /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "Loading companies…" })
        ] }) : companies.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-16 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-2xl bg-accent", children: /* @__PURE__ */ jsx(Building2, { className: "h-7 w-7 text-muted-foreground" }) }),
          /* @__PURE__ */ jsx("h3", { className: "mt-4 font-display text-lg font-semibold", children: "No companies yet" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 max-w-xs text-sm text-muted-foreground", children: "Invite a company Admin by email. They set their own password when they register." }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              className: "mt-5 h-9 rounded-md bg-gradient-primary",
              onClick: () => setCreateOpen(true),
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "mr-2 h-4 w-4" }),
                "Invite Admin"
              ]
            }
          )
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { className: "hidden overflow-x-auto rounded-xl border border-border/60 lg:block", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Company" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Code" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Contact" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Status" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Created" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium text-right", children: "Actions" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border/60", children: companies.map((c) => /* @__PURE__ */ jsxs("tr", { className: "transition hover:bg-muted/30", children: [
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold text-primary", children: c.company_name.slice(0, 2).toUpperCase() }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { className: "font-medium", children: c.company_name }),
                  c.address ? /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground", children: c.address }) : null
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx("code", { className: "rounded bg-muted px-1.5 py-0.5 text-xs font-mono", children: c.company_code }) }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground", children: c.email || c.phone ? /* @__PURE__ */ jsxs("div", { className: "space-y-0.5 text-[11px]", children: [
                c.email && /* @__PURE__ */ jsx("div", { children: c.email }),
                c.phone && /* @__PURE__ */ jsx("div", { children: c.phone })
              ] }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/60", children: "—" }) }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(Badge, { className: `rounded-full border text-[10px] font-medium ${statusColor(c.status)}`, children: c.status ?? "active" }) }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground", children: formatDate(c.created_at) }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right", children: /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "icon",
                  onClick: () => void handleDelete(c),
                  className: "h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer",
                  children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
                }
              ) })
            ] }, c.id)) })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "space-y-3 lg:hidden", children: companies.map((c) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "rounded-xl border border-border/60 bg-card/40 p-4",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary", children: c.company_name.slice(0, 2).toUpperCase() }),
                  /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                      /* @__PURE__ */ jsx("span", { className: "truncate font-medium", children: c.company_name }),
                      /* @__PURE__ */ jsx(Badge, { className: `shrink-0 rounded-full border text-[10px] font-medium ${statusColor(c.status)}`, children: c.status ?? "active" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "mt-0.5 text-xs text-muted-foreground", children: [
                      /* @__PURE__ */ jsx("code", { className: "rounded bg-muted px-1 py-0.5 text-[10px] font-mono", children: c.company_code }),
                      c.email ? ` · ${c.email}` : ""
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "mt-1 text-[11px] text-muted-foreground", children: [
                      "Created ",
                      formatDate(c.created_at)
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "mt-3 flex gap-2 border-t border-border/40 pt-3", children: /* @__PURE__ */ jsxs(
                  Button,
                  {
                    variant: "ghost",
                    size: "sm",
                    onClick: () => void handleDelete(c),
                    className: "h-8 rounded-lg text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
                    children: [
                      /* @__PURE__ */ jsx(Trash2, { className: "mr-1.5 h-3.5 w-3.5" }),
                      "Delete"
                    ]
                  }
                ) })
              ]
            },
            c.id
          )) }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 text-xs text-muted-foreground", children: [
            "Showing ",
            companies.length,
            " of ",
            total
          ] })
        ] }) })
      }
    )
  ] });
}
const SplitComponent = CompaniesPage;
export {
  SplitComponent as component
};
