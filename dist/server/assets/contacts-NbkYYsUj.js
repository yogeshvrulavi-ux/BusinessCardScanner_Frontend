import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, RefreshCw, Loader2, Send, Trash2, Filter, Plus } from "lucide-react";
import { P as PageShell, C as Card } from "./PageShell-CBDc5a2k.js";
import { b as getCurrentAppUser, M as removeQueueItem, W as removeOutreachStatusForContact, X as deleteContactFromBackend, g as getQueueItems, Y as contactBelongsToAppUser, Z as getStoredContactById, _ as optimisticallyRemoveDirectoryContact, i as invalidateContactsDirectory, $ as resolveChannelIconStatus, h as cn, a as useConfirmModal, a0 as Route, u as useAuth, Q as useContactsDirectory, q as useUserSettings, F as loadEvents, V as contactRowKey, P as PAGE, I as Input, B as Button, O as syncQueueItem, L as syncAllQueueItems } from "./router-BZi1TmQF.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CO4DQJuM.js";
import { S as StatusPill } from "./StatusPill-CpbaPKXq.js";
import { T as Tabs, a as TabsList, b as TabsTrigger } from "./tabs-nMo77AuU.js";
import { toast } from "sonner";
import "@tanstack/react-query";
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
import "@radix-ui/react-select";
import "@radix-ui/react-tabs";
function notifyContactsListChanged(removed) {
  if (removed) {
    optimisticallyRemoveDirectoryContact(removed);
  } else {
    invalidateContactsDirectory();
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cs-contacts-updated"));
    window.dispatchEvent(new CustomEvent("cs-queue-updated"));
  }
}
async function assertContactOwnedByCurrentUser(contact) {
  const appUser = await getCurrentAppUser();
  if (contact.source === "queue") {
    const items = await getQueueItems();
    const item = items.find((entry) => entry.id === contact.id);
    if (item && !contactBelongsToAppUser(item, appUser)) {
      throw new Error("You do not have permission to delete this contact.");
    }
    return;
  }
  if (contact.source === "indexeddb" || contact.source === "localdb") {
    const stored = await getStoredContactById(contact.id);
    if (stored && !contactBelongsToAppUser(stored, appUser)) {
      throw new Error("You do not have permission to delete this contact.");
    }
  }
}
async function deleteDirectoryContact(contact) {
  await assertContactOwnedByCurrentUser(contact);
  const appUser = await getCurrentAppUser();
  if (contact.source === "queue") {
    await removeQueueItem(contact.id);
    removeOutreachStatusForContact(contact, appUser);
    notifyContactsListChanged(contact);
    return;
  }
  if (contact.source === "localdb" || contact.source === "indexeddb") {
    await deleteContactFromBackend(contact.id);
    removeOutreachStatusForContact(contact, appUser);
    notifyContactsListChanged(contact);
    return;
  }
  throw new Error("Unknown contact source — cannot delete.");
}
function CheckIcon({ className }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      viewBox: "0 0 16 16",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      className,
      "aria-hidden": true,
      children: /* @__PURE__ */ jsx(
        "path",
        {
          d: "M3.5 8.5L6.5 11.5L12.5 4.5",
          stroke: "currentColor",
          strokeWidth: "1.75",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        }
      )
    }
  );
}
function CrossIcon({ className }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      viewBox: "0 0 16 16",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      className,
      "aria-hidden": true,
      children: /* @__PURE__ */ jsx(
        "path",
        {
          d: "M4.5 4.5L11.5 11.5M11.5 4.5L4.5 11.5",
          stroke: "currentColor",
          strokeWidth: "1.75",
          strokeLinecap: "round"
        }
      )
    }
  );
}
function PendingIcon({ className }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      viewBox: "0 0 16 16",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      className,
      "aria-hidden": true,
      children: /* @__PURE__ */ jsx("circle", { cx: "8", cy: "8", r: "5.5", stroke: "currentColor", strokeWidth: "1.5" })
    }
  );
}
function channelTitle(type, status, error) {
  const label = type === "whatsapp" ? "WhatsApp" : "Email";
  if (status === "success") return `${label}: sent successfully`;
  if (status === "failure") {
    return error ? `${label} failed: ${error}` : `${label}: send failed`;
  }
  return `${label}: no send result yet`;
}
function ChannelBadge({ status, type, error, className }) {
  const title = channelTitle(type, status, error);
  return /* @__PURE__ */ jsxs(
    "span",
    {
      title,
      "aria-label": title,
      className: cn(
        "inline-flex h-6 w-6 items-center justify-center rounded-md",
        status === "success" ? "bg-success/10 text-success" : status === "failure" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground/60",
        className
      ),
      children: [
        status === "success" ? /* @__PURE__ */ jsx(CheckIcon, { className: "h-3.5 w-3.5" }) : status === "failure" ? /* @__PURE__ */ jsx(CrossIcon, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(PendingIcon, { className: "h-3.5 w-3.5" }),
        /* @__PURE__ */ jsx("span", { className: "sr-only", children: title })
      ]
    }
  );
}
function ContactChannelIcons({
  phone,
  email,
  emailDelivery,
  whatsappDelivery,
  className,
  compact = false,
  showWhatsApp = true,
  showEmail = true
}) {
  if (!showWhatsApp && !showEmail) return null;
  const whatsappStatus = resolveChannelIconStatus(whatsappDelivery);
  const emailStatus = resolveChannelIconStatus(emailDelivery);
  if (compact) {
    return /* @__PURE__ */ jsxs("div", { className: cn("flex flex-wrap items-center gap-1.5", className), children: [
      showWhatsApp ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-md bg-muted/40 px-1.5 py-0.5 text-[10px]", children: [
        /* @__PURE__ */ jsx(
          ChannelBadge,
          {
            status: whatsappStatus,
            type: "whatsapp",
            error: whatsappDelivery?.error,
            className: "h-4 w-4"
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "WhatsApp" })
      ] }) : null,
      showEmail ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-md bg-muted/40 px-1.5 py-0.5 text-[10px]", children: [
        /* @__PURE__ */ jsx(
          ChannelBadge,
          {
            status: emailStatus,
            type: "email",
            error: emailDelivery?.error,
            className: "h-4 w-4"
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Email" })
      ] }) : null
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: cn("flex items-center gap-1.5", className), children: [
    showWhatsApp ? /* @__PURE__ */ jsx(
      ChannelBadge,
      {
        status: whatsappStatus,
        type: "whatsapp",
        error: whatsappDelivery?.error
      }
    ) : null,
    showEmail ? /* @__PURE__ */ jsx(
      ChannelBadge,
      {
        status: emailStatus,
        type: "email",
        error: emailDelivery?.error
      }
    ) : null
  ] });
}
const statusTabs = [
  { key: "all", label: "All" },
  { key: "synced", label: "Synced" },
  { key: "pending", label: "Pending" },
  { key: "failed", label: "Failed" }
];
function ContactsPage() {
  const { confirm } = useConfirmModal();
  const navigate = useNavigate({ from: Route.fullPath });
  const { q = "", highlight, event: eventFilter = "" } = Route.useSearch();
  const { user: authUser } = useAuth();
  const isSuperAdmin = authUser?.role === "SUPER_ADMIN";
  const canDelete = authUser?.role === "SUPER_ADMIN" || authUser?.role === "ADMIN";
  const setQ = (next) => {
    void navigate({ search: (prev) => ({ ...prev, q: next.trim() || void 0 }), replace: true });
  };
  const setEventFilter = (next) => {
    void navigate({
      search: (prev) => ({ ...prev, event: next === "all" ? void 0 : next }),
      replace: true
    });
  };
  const { contacts: contactsList, isLoading, isRefreshing, refresh, removeContact } = useContactsDirectory();
  const { settings: userSettings } = useUserSettings();
  const showWhatsAppTemplateStatus = userSettings.whatsappNotificationsEnabled;
  const showEmailTemplateStatus = userSettings.emailNotificationsEnabled;
  const showTemplateStatusColumn = showWhatsAppTemplateStatus || showEmailTemplateStatus;
  const templateColumnLabel = [
    showWhatsAppTemplateStatus ? "WhatsApp" : null,
    showEmailTemplateStatus ? "Email" : null
  ].filter(Boolean).join(" / ");
  const showInitialLoading = isLoading && contactsList.length === 0;
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("all");
  const [syncingId, setSyncingId] = useState(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const reloadContacts = async ({
    silent = false,
    force = true
  } = {}) => {
    try {
      setError(null);
      const result = await refresh({ silent, force });
      if (result?.fetchFailed && !silent) {
        toast.info("Some contacts could not be loaded. Showing available data.");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load contacts.");
    }
  };
  const handleSyncQueueItem = async (queueId) => {
    setSyncingId(queueId);
    try {
      const items = await getQueueItems();
      const item = items.find((qi) => qi.id === queueId);
      if (!item) {
        toast.error("Queued contact not found.");
        return;
      }
      await syncQueueItem(item);
      toast.success(`Synced: ${item.contact_data.name || "contact"}`);
      window.dispatchEvent(new CustomEvent("cs-contacts-updated"));
      window.dispatchEvent(new CustomEvent("cs-queue-updated"));
    } catch (err) {
      toast.error(err.message || "Failed to sync contact.");
    } finally {
      setSyncingId(null);
    }
  };
  const handleSyncAllQueue = async () => {
    const queuePending = contactsList.filter((c) => c.source === "queue");
    if (queuePending.length === 0) {
      toast.info("No queued contacts waiting to sync.");
      return;
    }
    setIsSyncingAll(true);
    try {
      const result = await syncAllQueueItems();
      if (result.synced > 0) {
        toast.success(`Synced ${result.synced} of ${result.total} contact(s).`);
      } else {
        toast.error("Could not sync any queued contacts.");
      }
      window.dispatchEvent(new CustomEvent("cs-contacts-updated"));
      window.dispatchEvent(new CustomEvent("cs-queue-updated"));
    } catch (err) {
      toast.error(err.message || "Failed to sync queue.");
    } finally {
      setIsSyncingAll(false);
    }
  };
  const handleDelete = async (contact) => {
    const ok = await confirm({
      title: "Delete contact?",
      description: "This contact will be soft-deleted for audit and recovery.",
      confirmLabel: "Delete",
      destructive: true
    });
    if (!ok) return;
    try {
      await deleteDirectoryContact(contact);
      removeContact(contact);
      toast.success(contact.source === "queue" ? "Queued contact removed." : "Contact deleted.");
      void reloadContacts({ force: true, silent: true });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to delete contact.");
    }
  };
  const filtered = useMemo(() => {
    return contactsList.filter((c) => {
      if (tab !== "all" && c.status !== tab) return false;
      if (eventFilter && (c.eventName || "").trim().toLowerCase() !== eventFilter.trim().toLowerCase()) return false;
      const searchStr = `${c.name || ""} ${c.company || ""} ${c.email || ""} ${c.eventName || ""}`.toLowerCase();
      if (q && !searchStr.includes(q.toLowerCase())) return false;
      return true;
    });
  }, [contactsList, tab, q, eventFilter]);
  const eventFilterOptions = useMemo(() => {
    const names = /* @__PURE__ */ new Set();
    for (const contact of contactsList) {
      const name = (contact.eventName || "").trim();
      if (name) names.add(name);
    }
    for (const event of loadEvents()) {
      names.add(event.name);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [contactsList]);
  const highlightInView = useMemo(() => {
    if (!highlight) return false;
    return filtered.some((c) => contactRowKey(c) === highlight);
  }, [highlight, filtered]);
  useEffect(() => {
    if (!highlight || showInitialLoading) return;
    if (tab !== "all") {
      setTab("all");
      return;
    }
    if (!highlightInView) return;
    const scrollToRow = () => {
      document.getElementById(`contact-row-${highlight}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    scrollToRow();
    const retry = window.setTimeout(scrollToRow, 200);
    return () => window.clearTimeout(retry);
  }, [highlight, showInitialLoading, q, tab, highlightInView, contactsList.length]);
  const pendingQueueCount = useMemo(() => contactsList.filter((c) => c.source === "queue").length, [contactsList]);
  const counts = useMemo(() => ({
    all: contactsList.length,
    synced: contactsList.filter((c) => c.status === "synced").length,
    pending: contactsList.filter((c) => c.status === "pending").length,
    failed: contactsList.filter((c) => c.status === "failed").length
  }), [contactsList]);
  const formatDate = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return iso;
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "page-bottom-safe lg:pb-0", children: /* @__PURE__ */ jsxs(
    PageShell,
    {
      title: PAGE.contacts.title,
      description: contactsList.length > 0 ? `${PAGE.contacts.description} · ${contactsList.length} record${contactsList.length === 1 ? "" : "s"}` : PAGE.contacts.description,
      actions: /* @__PURE__ */ jsxs("div", { className: "grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end", children: [
        /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => void reloadContacts({ force: true }), disabled: isRefreshing, className: "h-10 w-full rounded-xl sm:w-auto", children: [
          /* @__PURE__ */ jsx(RefreshCw, { className: `mr-2 h-4 w-4 shrink-0 ${isRefreshing ? "animate-spin" : ""}` }),
          "Refresh"
        ] }),
        /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "h-10 w-full rounded-xl sm:w-auto", children: [
          /* @__PURE__ */ jsx(Filter, { className: "mr-2 h-4 w-4 shrink-0" }),
          " Filters"
        ] }),
        /* @__PURE__ */ jsxs(Button, { className: "h-10 w-full rounded-xl bg-gradient-primary shadow-glow sm:w-auto", children: [
          /* @__PURE__ */ jsx(Plus, { className: "mr-2 h-4 w-4 shrink-0" }),
          " New contact"
        ] })
      ] }),
      children: [
        /* @__PURE__ */ jsxs(Card, { className: "rounded-2xl border-border/60 p-3 shadow-soft sm:p-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative hidden w-full md:block", children: [
              /* @__PURE__ */ jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
              /* @__PURE__ */ jsx(Input, { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search name, company, email, or event", className: "h-10 w-full rounded-md border-border/60 bg-background pl-9" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-center", children: /* @__PURE__ */ jsxs(Select, { value: eventFilter || "all", onValueChange: setEventFilter, children: [
              /* @__PURE__ */ jsx(SelectTrigger, { className: "h-10 w-full rounded-md border-border/60 bg-background sm:w-[240px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Filter by event" }) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All events" }),
                eventFilterOptions.map((name) => /* @__PURE__ */ jsx(SelectItem, { value: name, children: name }, name))
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "w-full lg:hidden", children: /* @__PURE__ */ jsx(Tabs, { value: tab, onValueChange: (v) => setTab(v), className: "w-full", children: /* @__PURE__ */ jsx(TabsList, { className: "grid h-auto w-full grid-cols-4 gap-1 rounded-xl bg-muted/60 p-1", children: statusTabs.map((t) => /* @__PURE__ */ jsxs(TabsTrigger, { value: t.key, className: "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-[10px] leading-tight data-[state=active]:bg-card data-[state=active]:shadow-soft sm:flex-row sm:text-xs", children: [
              /* @__PURE__ */ jsx("span", { children: t.label }),
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-semibold text-muted-foreground", children: counts[t.key] })
            ] }, t.key)) }) }) }),
            /* @__PURE__ */ jsx("div", { className: "hidden w-full overflow-x-auto hide-scrollbar pb-1 lg:block", children: /* @__PURE__ */ jsx(Tabs, { value: tab, onValueChange: (v) => setTab(v), className: "w-full min-w-max", children: /* @__PURE__ */ jsx(TabsList, { className: "rounded-xl bg-muted/60", children: statusTabs.map((t) => /* @__PURE__ */ jsxs(TabsTrigger, { value: t.key, className: "rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:shadow-soft", children: [
              t.label,
              " ",
              /* @__PURE__ */ jsx("span", { className: "ml-1.5 text-[10px] text-muted-foreground", children: counts[t.key] })
            ] }, t.key)) }) }) })
          ] }),
          showInitialLoading ? /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-col items-center justify-center py-12 text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-2xl bg-accent", children: /* @__PURE__ */ jsx(RefreshCw, { className: "h-6 w-6 text-primary animate-spin" }) }),
            /* @__PURE__ */ jsx("h3", { className: "mt-4 font-display text-lg font-semibold", children: "Loading contacts" }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 max-w-xs text-sm text-muted-foreground", children: "Connecting to database..." })
          ] }) : error ? /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-col items-center justify-center py-12 text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10", children: /* @__PURE__ */ jsx("span", { className: "text-xl text-destructive", children: "!" }) }),
            /* @__PURE__ */ jsx("h3", { className: "mt-4 font-display text-lg font-semibold text-destructive", children: "Failed to load contacts" }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 max-w-xs text-sm text-muted-foreground", children: error })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            isRefreshing && contactsList.length > 0 ? /* @__PURE__ */ jsxs("p", { className: "mt-3 flex items-center gap-2 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: "h-3.5 w-3.5 animate-spin" }),
              " Updating list..."
            ] }) : null,
            /* @__PURE__ */ jsx("div", { className: "mt-5 hidden overflow-x-auto rounded-xl border border-border/60 lg:block", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
              /* @__PURE__ */ jsx("thead", { className: "bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Contact Name" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Company" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Designation" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Email" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Phone" }),
                isSuperAdmin && /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Admin Name" }),
                  /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "User Name" })
                ] }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Event" }),
                showTemplateStatusColumn && /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: templateColumnLabel }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Status" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Created" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium text-right", children: "Actions" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border/60", children: filtered.map((c) => {
                const rowKey = contactRowKey(c);
                const isHighlighted = highlight === rowKey;
                return /* @__PURE__ */ jsxs("tr", { id: `contact-row-${rowKey}`, className: cn("transition", isHighlighted ? "bg-primary/10 ring-2 ring-inset ring-primary/35" : "hover:bg-muted/30"), children: [
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsx("div", { className: `flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${c.accent} text-xs font-semibold text-white`, children: c.initials }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("div", { className: "font-medium", children: c.name || "—" }),
                      c.notes && /* @__PURE__ */ jsx("div", { className: "max-w-[200px] truncate text-[11px] text-muted-foreground", children: c.notes })
                    ] })
                  ] }) }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground", children: c.company || "—" }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground", children: c.title || "—" }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground", children: c.email || "—" }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground", children: c.phone || "—" }),
                  isSuperAdmin && /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground", children: c.admin_name || "—" }),
                    /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground", children: c.user_name || "—" })
                  ] }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground", children: c.eventName || "—" }),
                  showTemplateStatusColumn && /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(ContactChannelIcons, { phone: c.phone, email: c.email, whatsappDelivery: c.whatsappDelivery, emailDelivery: c.emailDelivery, showWhatsApp: showWhatsAppTemplateStatus, showEmail: showEmailTemplateStatus }) }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(StatusPill, { status: c.status }) }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground", children: formatDate(c.createdAt) }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1", children: [
                    c.source === "queue" && /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => handleSyncQueueItem(c.id), disabled: syncingId === c.id || isSyncingAll, className: "h-8 rounded-lg text-xs", children: syncingId === c.id ? /* @__PURE__ */ jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                      /* @__PURE__ */ jsx(Send, { className: "mr-1.5 h-3 w-3" }),
                      "Sync"
                    ] }) }),
                    canDelete && /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: () => handleDelete(c), className: "h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
                  ] }) })
                ] }, rowKey);
              }) })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "mt-5 space-y-3 lg:hidden", children: filtered.map((c) => {
              const rowKey = contactRowKey(c);
              const isHighlighted = highlight === rowKey;
              return /* @__PURE__ */ jsxs("div", { id: `contact-row-${rowKey}`, className: cn("rounded-xl border p-3 sm:p-4 transition", isHighlighted ? "border-primary/50 bg-primary/10 ring-2 ring-primary/30" : "border-border/60 bg-card/40"), children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: `flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${c.accent} text-sm font-semibold text-white`, children: c.initials }),
                  /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                    /* @__PURE__ */ jsx("div", { className: "truncate font-medium", children: c.name || "—" }),
                    /* @__PURE__ */ jsxs("div", { className: "truncate text-xs text-muted-foreground", children: [
                      c.title || "—",
                      " / ",
                      c.company || "No company"
                    ] }),
                    c.email && /* @__PURE__ */ jsx("div", { className: "truncate text-[11px] text-muted-foreground", children: c.email }),
                    c.phone && /* @__PURE__ */ jsx("div", { className: "truncate text-[11px] text-muted-foreground", children: c.phone }),
                    isSuperAdmin && (c.admin_name || c.user_name) && /* @__PURE__ */ jsxs("div", { className: "mt-0.5 text-[11px] text-primary/80", children: [
                      c.admin_name && `Admin: ${c.admin_name}`,
                      c.admin_name && c.user_name && " | ",
                      c.user_name && `User: ${c.user_name}`
                    ] }),
                    c.eventName && /* @__PURE__ */ jsxs("div", { className: "mt-0.5 truncate text-[11px] text-primary/90", children: [
                      "Event: ",
                      c.eventName
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "mt-0.5 text-[11px] text-muted-foreground", children: formatDate(c.createdAt) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-2 border-t border-border/40 pt-3", children: [
                  /* @__PURE__ */ jsx(StatusPill, { status: c.status }),
                  showTemplateStatusColumn && /* @__PURE__ */ jsx(ContactChannelIcons, { phone: c.phone, email: c.email, whatsappDelivery: c.whatsappDelivery, emailDelivery: c.emailDelivery, compact: true, showWhatsApp: showWhatsAppTemplateStatus, showEmail: showEmailTemplateStatus })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
                  c.source === "queue" && /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => handleSyncQueueItem(c.id), disabled: syncingId === c.id || isSyncingAll, className: "h-9 flex-1 min-w-[120px] rounded-lg text-xs sm:flex-none", children: syncingId === c.id ? /* @__PURE__ */ jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin" }) : "Sync to database" }),
                  canDelete && /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: () => handleDelete(c), className: "h-9 rounded-lg text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive", children: [
                    /* @__PURE__ */ jsx(Trash2, { className: "mr-1.5 h-3.5 w-3.5" }),
                    " Delete"
                  ] })
                ] })
              ] }, rowKey);
            }) }),
            filtered.length === 0 && /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-col items-center justify-center py-12 text-center", children: [
              /* @__PURE__ */ jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-2xl bg-accent", children: /* @__PURE__ */ jsx(Search, { className: "h-6 w-6 text-accent-foreground" }) }),
              /* @__PURE__ */ jsx("h3", { className: "mt-4 font-display text-lg font-semibold", children: "No contacts match" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 max-w-xs text-sm text-muted-foreground", children: "Try a different search or change the active filter." })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-5 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
              "Showing ",
              filtered.length,
              " of ",
              contactsList.length
            ] }) })
          ] })
        ] }),
        pendingQueueCount > 0 && /* @__PURE__ */ jsx("div", { className: "fab-bottom fab-above-cookie fixed z-40 flex flex-col items-end gap-2", children: /* @__PURE__ */ jsxs(
          Button,
          {
            onClick: () => void handleSyncAllQueue(),
            disabled: isSyncingAll || isRefreshing,
            title: "Sync queued contacts to database",
            className: "h-11 shrink-0 rounded-2xl bg-gradient-primary px-3 shadow-glow sm:h-12",
            children: [
              isSyncingAll ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Send, { className: "mr-2 h-4 w-4" }),
              /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium", children: [
                "Sync queue (",
                pendingQueueCount,
                ")"
              ] })
            ]
          }
        ) })
      ]
    }
  ) });
}
const SplitComponent = ContactsPage;
export {
  SplitComponent as component
};
