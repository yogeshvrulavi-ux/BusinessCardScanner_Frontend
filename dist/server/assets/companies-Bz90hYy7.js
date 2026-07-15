import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import { Loader2, Plus, Building2, Trash2, RefreshCw } from "lucide-react";
import { P as PageShell, C as Card } from "./PageShell-D0cqsQM3.js";
import { I as Input, B as Button, A as AuthGate, a as useConfirmModal } from "./router-ZM5rT6gC.js";
import { B as Badge } from "./badge-6gQAlWpx.js";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, L as Label, e as DialogFooter } from "./label-DfA3np1i.js";
import { toast } from "sonner";
import { g as createCompany, f as fetchCompanies, h as deleteCompany } from "./adminApi-4v_rjpNP.js";
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
const EMPTY = {
  company_name: "",
  company_code: "",
  admin_first_name: "",
  admin_last_name: "",
  admin_email: "",
  admin_username: "",
  admin_password: "",
  address: "",
  phone: "",
  email: "",
  website: ""
};
function CreateCompanyModal({ open, onOpenChange, onSuccess }) {
  const [form, setForm] = useState({ ...EMPTY });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company_name.trim() || !form.company_code.trim()) {
      toast.error("Company name and code are required.");
      return;
    }
    if (!form.admin_email.trim() || !form.admin_username.trim() || !form.admin_password) {
      toast.error("Admin email, username, and password are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createCompany(form);
      toast.success(`Company "${form.company_name}" and admin user created.`);
      setForm({ ...EMPTY });
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create company.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: (v) => {
    if (!v) setForm({ ...EMPTY });
    onOpenChange(v);
  }, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: "Create Company" }),
      /* @__PURE__ */ jsx(DialogDescription, { children: "Create a new company and its admin user in a single step." })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "Company" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "company_name", children: "Company Name *" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "company_name",
                value: form.company_name,
                onChange: (e) => set("company_name", e.target.value),
                placeholder: "Acme Corp",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "company_code", children: "Company Code *" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "company_code",
                value: form.company_code,
                onChange: (e) => set("company_code", e.target.value.toUpperCase()),
                placeholder: "ACME",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "phone", children: "Phone" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "phone",
                value: form.phone ?? "",
                onChange: (e) => set("phone", e.target.value),
                placeholder: "+1 555-0100"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "Email" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "email",
                type: "email",
                value: form.email ?? "",
                onChange: (e) => set("email", e.target.value),
                placeholder: "info@acme.com"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "website", children: "Website" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "website",
                value: form.website ?? "",
                onChange: (e) => set("website", e.target.value),
                placeholder: "https://acme.com"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "address", children: "Address" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "address",
                value: form.address ?? "",
                onChange: (e) => set("address", e.target.value),
                placeholder: "123 Main St, City"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "Admin User" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "admin_first_name", children: "First Name" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "admin_first_name",
                value: form.admin_first_name ?? "",
                onChange: (e) => set("admin_first_name", e.target.value),
                placeholder: "John"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "admin_last_name", children: "Last Name" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "admin_last_name",
                value: form.admin_last_name ?? "",
                onChange: (e) => set("admin_last_name", e.target.value),
                placeholder: "Doe"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "admin_email", children: "Admin Email *" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "admin_email",
                type: "email",
                value: form.admin_email,
                onChange: (e) => set("admin_email", e.target.value),
                placeholder: "admin@acme.com",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "admin_username", children: "Username *" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "admin_username",
                value: form.admin_username,
                onChange: (e) => set("admin_username", e.target.value),
                placeholder: "admin_acme",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "admin_password", children: "Password *" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "admin_password",
                type: "password",
                value: form.admin_password,
                onChange: (e) => set("admin_password", e.target.value),
                placeholder: "Min 8 characters",
                required: true,
                minLength: 8
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2 pt-2", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            onClick: () => {
              setForm({ ...EMPTY });
              onOpenChange(false);
            },
            disabled: isSubmitting,
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsxs(Button, { type: "submit", disabled: isSubmitting, className: "bg-gradient-primary", children: [
          isSubmitting ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Plus, { className: "mr-2 h-4 w-4" }),
          "Create Company"
        ] })
      ] })
    ] })
  ] }) });
}
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
      CreateCompanyModal,
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
              className: "h-10 rounded-xl",
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
              className: "h-10 rounded-xl bg-gradient-primary",
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "mr-2 h-4 w-4" }),
                "Create Company"
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
          /* @__PURE__ */ jsx("p", { className: "mt-1 max-w-xs text-sm text-muted-foreground", children: "Create your first company to get started. Each company comes with its own admin user." }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              className: "mt-5 rounded-xl bg-gradient-primary",
              onClick: () => setCreateOpen(true),
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "mr-2 h-4 w-4" }),
                "Create Company"
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
