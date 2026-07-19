import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Loader2, BarChart3, Users, TrendingUp, RefreshCw, Building2, CalendarDays } from "lucide-react";
import { P as PageShell, C as Card } from "./PageShell-DdPA0nbc.js";
import { A as AuthGate, B as Button, c as apiFetch, d as API_BASE_URL } from "./router-B3QH6PKy.js";
import { toast } from "sonner";
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
function InsightsPage() {
  return /* @__PURE__ */ jsx(AuthGate, { allowedRoles: ["SUPER_ADMIN"], children: /* @__PURE__ */ jsx(InsightsPageInner, {}) });
}
function InsightsPageInner() {
  const [data, setData] = useState(null);
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
      const json = await res.json();
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
  useEffect(() => {
    void load();
  }, []);
  const maxActivity = data?.recent_activity?.length ? Math.max(...data.recent_activity.map((d) => d.count), 1) : 1;
  return /* @__PURE__ */ jsx(
    PageShell,
    {
      title: "Insights",
      description: "Contact capture analytics and team performance overview",
      actions: /* @__PURE__ */ jsxs(
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
      children: isLoading ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-20", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "Loading insights..." })
      ] }) : !data ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-20 text-center", children: [
        /* @__PURE__ */ jsx(BarChart3, { className: "h-12 w-12 text-muted-foreground" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 font-display text-lg font-semibold", children: "No data available" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Unable to load analytics data." })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 sm:grid-cols-4", children: [
          /* @__PURE__ */ jsx(StatCard, { icon: /* @__PURE__ */ jsx(Users, { className: "h-5 w-5" }), label: "Total Contacts", value: data.total, accent: "bg-primary/10 text-primary" }),
          /* @__PURE__ */ jsx(StatCard, { icon: /* @__PURE__ */ jsx(TrendingUp, { className: "h-5 w-5" }), label: "Synced", value: data.synced, accent: "bg-emerald-500/10 text-emerald-600" }),
          /* @__PURE__ */ jsx(StatCard, { icon: /* @__PURE__ */ jsx(RefreshCw, { className: "h-5 w-5" }), label: "Pending", value: data.pending, accent: "bg-amber-500/10 text-amber-600" }),
          /* @__PURE__ */ jsx(StatCard, { icon: /* @__PURE__ */ jsx(BarChart3, { className: "h-5 w-5" }), label: "Failed", value: data.failed, accent: "bg-destructive/10 text-destructive" })
        ] }),
        data.recent_activity.length > 0 && /* @__PURE__ */ jsxs(Card, { className: "rounded-2xl border-border/60 p-5 shadow-soft", children: [
          /* @__PURE__ */ jsx("h3", { className: "mb-4 font-display text-base font-semibold", children: "Recent Activity (7 days)" }),
          /* @__PURE__ */ jsx("div", { className: "flex items-end gap-2 h-32", children: data.recent_activity.map((day) => /* @__PURE__ */ jsxs("div", { className: "flex flex-1 flex-col items-center gap-1", children: [
            /* @__PURE__ */ jsx("div", { className: "text-[10px] font-medium text-muted-foreground", children: day.count }),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "w-full rounded-t-md bg-primary/70 transition-all",
                style: { height: `${Math.max(day.count / maxActivity * 100, 4)}%` }
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "text-[9px] text-muted-foreground", children: new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }) })
          ] }, day.date)) })
        ] }),
        data.by_company.length > 0 && /* @__PURE__ */ jsxs(Card, { className: "rounded-2xl border-border/60 p-5 shadow-soft", children: [
          /* @__PURE__ */ jsxs("h3", { className: "mb-4 flex items-center gap-2 font-display text-base font-semibold", children: [
            /* @__PURE__ */ jsx(Building2, { className: "h-4 w-4 text-muted-foreground" }),
            " Contacts by Company"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-2", children: data.by_company.map((row) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-lg border border-border/40 px-4 py-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: row.company_name }),
            /* @__PURE__ */ jsx("span", { className: "rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold", children: row.count })
          ] }, row.company_name)) })
        ] }),
        data.by_event.length > 0 && /* @__PURE__ */ jsxs(Card, { className: "rounded-2xl border-border/60 p-5 shadow-soft", children: [
          /* @__PURE__ */ jsxs("h3", { className: "mb-1 flex items-center gap-2 font-display text-base font-semibold", children: [
            /* @__PURE__ */ jsx(CalendarDays, { className: "h-4 w-4 text-muted-foreground" }),
            " Event Analytics"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mb-4 text-xs text-muted-foreground", children: "Events, team participation, and captured contacts in your accessible companies." }),
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full min-w-[960px] text-sm", children: [
            /* @__PURE__ */ jsx("thead", { className: "text-left text-[11px] uppercase tracking-wider text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "pb-2 font-medium", children: "Event" }),
              /* @__PURE__ */ jsx("th", { className: "pb-2 font-medium", children: "Company / Admin" }),
              /* @__PURE__ */ jsx("th", { className: "pb-2 font-medium", children: "Contributors" }),
              /* @__PURE__ */ jsx("th", { className: "pb-2 font-medium text-right", children: "Users" }),
              /* @__PURE__ */ jsx("th", { className: "pb-2 font-medium text-right", children: "Contacts" }),
              /* @__PURE__ */ jsx("th", { className: "pb-2 font-medium text-right", children: "Synced" }),
              /* @__PURE__ */ jsx("th", { className: "pb-2 font-medium text-right", children: "Pending" }),
              /* @__PURE__ */ jsx("th", { className: "pb-2 font-medium", children: "Last Activity" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border/40", children: data.by_event.map((row, i) => /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { className: "py-3 font-medium", children: row.event_name }),
              /* @__PURE__ */ jsxs("td", { className: "py-3", children: [
                /* @__PURE__ */ jsx("div", { children: row.company_name }),
                row.admin_name && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
                  "Admin: ",
                  row.admin_name
                ] })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "max-w-72 py-3 text-muted-foreground", children: row.contributors || "Unknown" }),
              /* @__PURE__ */ jsx("td", { className: "py-3 text-right", children: row.user_count }),
              /* @__PURE__ */ jsx("td", { className: "py-3 text-right font-semibold", children: row.contact_count }),
              /* @__PURE__ */ jsx("td", { className: "py-3 text-right text-emerald-600", children: row.synced }),
              /* @__PURE__ */ jsx("td", { className: "py-3 text-right text-amber-600", children: row.pending }),
              /* @__PURE__ */ jsx("td", { className: "py-3 text-muted-foreground", children: new Date(row.last_capture).toLocaleDateString() })
            ] }, `${row.company_name}-${row.event_name}-${row.event_id ?? i}`)) })
          ] }) })
        ] }),
        data.by_user.length > 0 && /* @__PURE__ */ jsxs(Card, { className: "rounded-2xl border-border/60 p-5 shadow-soft", children: [
          /* @__PURE__ */ jsxs("h3", { className: "mb-4 flex items-center gap-2 font-display text-base font-semibold", children: [
            /* @__PURE__ */ jsx(Users, { className: "h-4 w-4 text-muted-foreground" }),
            " User Analytics"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full min-w-[820px] text-sm", children: [
            /* @__PURE__ */ jsx("thead", { className: "text-left text-[11px] uppercase tracking-wider text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "pb-2 font-medium", children: "User" }),
              /* @__PURE__ */ jsx("th", { className: "pb-2 font-medium", children: "Role" }),
              /* @__PURE__ */ jsx("th", { className: "pb-2 font-medium", children: "Company" }),
              /* @__PURE__ */ jsx("th", { className: "pb-2 font-medium", children: "Admin" }),
              /* @__PURE__ */ jsx("th", { className: "pb-2 font-medium text-right", children: "Events" }),
              /* @__PURE__ */ jsx("th", { className: "pb-2 font-medium text-right", children: "Contacts" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border/40", children: data.by_user.map((row, i) => /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsxs("td", { className: "py-3", children: [
                /* @__PURE__ */ jsx("div", { className: "font-medium", children: row.user_name }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: row.email || row.username })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "py-3 text-muted-foreground", children: row.role }),
              /* @__PURE__ */ jsx("td", { className: "py-3 text-muted-foreground", children: row.company_name }),
              /* @__PURE__ */ jsx("td", { className: "py-3 text-muted-foreground", children: row.admin_name || "—" }),
              /* @__PURE__ */ jsx("td", { className: "py-3 text-right", children: row.event_count }),
              /* @__PURE__ */ jsx("td", { className: "py-3 text-right", children: /* @__PURE__ */ jsx("span", { className: "rounded-full bg-muted px-2 py-0.5 text-xs font-semibold", children: row.count }) })
            ] }, row.user_id ?? `${row.user_name}-${i}`)) })
          ] }) })
        ] })
      ] })
    }
  );
}
function StatCard({ icon, label, value, accent }) {
  return /* @__PURE__ */ jsxs(Card, { className: "rounded-2xl border-border/60 p-4 shadow-soft", children: [
    /* @__PURE__ */ jsx("div", { className: `mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${accent}`, children: icon }),
    /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: value.toLocaleString() }),
    /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: label })
  ] });
}
const SplitComponent = InsightsPage;
export {
  SplitComponent as component
};
