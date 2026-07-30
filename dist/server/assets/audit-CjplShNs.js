import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import { Loader2, ScrollText, RefreshCw } from "lucide-react";
import { P as PageShell, C as Card } from "./PageShell-CAiM-dst.js";
import { A as AuthGate, c as apiFetch, d as API_BASE_URL, B as Button } from "./router-DJrz5rEK.js";
import { toast } from "sonner";
import { f as formatPersonDisplay } from "./personDisplay-Cb1M3koG.js";
import { T as TABLE_PAGE_SIZE, a as TablePagination } from "./table-pagination-R8ymbfwN.js";
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
function usernameOf(log) {
  if (log.actor_username) return log.actor_username;
  if (log.new_value && typeof log.new_value === "object") {
    const identifier = log.new_value.identifier;
    if (typeof identifier === "string" && identifier.trim()) return identifier;
  }
  return "";
}
function actorDisplayName(log) {
  return formatPersonDisplay({
    fullName: log.actor_name,
    email: log.actor_email
  }) || log.actor_username || "System";
}
function AuditLogsPage() {
  return /* @__PURE__ */ jsx(AuthGate, { allowedRoles: ["SUPER_ADMIN"], children: /* @__PURE__ */ jsx(AuditLogsPageInner, {}) });
}
function AuditLogsPageInner() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const load = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const res = await apiFetch(
        `${API_BASE_URL}/api/audit-logs?page=${page}&limit=${TABLE_PAGE_SIZE}`
      );
      if (!res.ok) throw new Error("Failed to load audit logs.");
      const data = await res.json();
      setItems(data.items ?? data.logs ?? []);
      setTotal(data.total ?? (data.items?.length ?? 0));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load audit logs.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page]);
  useEffect(() => {
    void load();
  }, [load]);
  return /* @__PURE__ */ jsx(
    PageShell,
    {
      title: "Audit Logs",
      description: total ? `${total} events` : "System-wide invitation and account events",
      actions: /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => void load(true), disabled: isRefreshing, className: "rounded-md", children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: `mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}` }),
        "Refresh"
      ] }),
      children: /* @__PURE__ */ jsxs(Card, { className: "rounded-2xl border-border/60 p-4 shadow-soft sm:p-6", children: [
        isLoading ? /* @__PURE__ */ jsx("div", { className: "flex flex-col items-center py-16", children: /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) }) : items.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center py-16 text-center", children: [
          /* @__PURE__ */ jsx(ScrollText, { className: "h-10 w-10 text-muted-foreground" }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "No audit events yet." })
        ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-xl border border-border/60", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-gradient-primary text-left text-[11px] font-bold uppercase tracking-wider text-white", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-bold text-white", children: "When" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-bold text-white", children: "Action" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-bold text-white", children: "Performed By" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-bold text-white", children: "Username" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-bold text-white", children: "Role" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border/60", children: items.map((log) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30", children: [
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground", children: log.created_at ? new Date(log.created_at).toLocaleString() : "—" }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-bold text-white", children: log.action }),
            /* @__PURE__ */ jsxs("td", { className: "px-4 py-3", children: [
              /* @__PURE__ */ jsx("div", { className: "font-medium", children: actorDisplayName(log) }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: log.actor_email || (log.user_id ? `User ${log.user_id}` : "Automated event") })
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground", children: usernameOf(log) || "—" }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground", children: log.actor_role?.replaceAll("_", " ") || "—" })
          ] }, log.id)) })
        ] }) }),
        !isLoading && total > 0 ? /* @__PURE__ */ jsx(
          TablePagination,
          {
            page,
            total,
            limit: TABLE_PAGE_SIZE,
            disabled: isLoading || isRefreshing,
            onPageChange: setPage
          }
        ) : null
      ] })
    }
  );
}
const SplitComponent = AuditLogsPage;
export {
  SplitComponent as component
};
