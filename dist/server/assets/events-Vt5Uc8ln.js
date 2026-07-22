import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Folder, Users, CheckCircle2, Clock, AlertCircle, Plus, ArrowLeft, RefreshCw, FolderOpen, CalendarDays } from "lucide-react";
import { P as PageShell, C as Card } from "./PageShell-DmFkjHU4.js";
import { y as loadEvents, R as Route, p as useContactsDirectory, Q as purgeOrphanExampleEvent, P as PAGE, I as Input, t as getExampleEventName, B as Button, h as cn, S as rememberEvent, U as contactRowKey, i as invalidateContactsDirectory, A as AuthGate } from "./router-VRE0sT79.js";
import { S as StatusPill } from "./StatusPill-fefU9l8m.js";
import { C as CardThumbnail } from "./CardThumbnail-D3bZa1cH.js";
import "@tanstack/react-query";
import "sonner";
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
function normalizeEventName(name) {
  return name.trim().toLowerCase();
}
function countContactsForEvent(contacts, eventName) {
  const key = normalizeEventName(eventName);
  const matched = contacts.filter((c) => normalizeEventName(c.eventName || "") === key);
  return {
    totalLeads: matched.length,
    synced: matched.filter((c) => c.status === "synced").length,
    pending: matched.filter((c) => c.status === "pending").length,
    failed: matched.filter((c) => c.status === "failed").length
  };
}
function buildEventFolderStats(contacts, events) {
  const stored = events ?? loadEvents();
  const byName = /* @__PURE__ */ new Map();
  for (const contact of contacts) {
    const name = (contact.eventName || "").trim();
    if (!name) continue;
    const key = normalizeEventName(name);
    const storedMeta = stored.find((event) => normalizeEventName(event.name) === key);
    const counts = countContactsForEvent(contacts, name);
    byName.set(key, {
      id: storedMeta?.id ?? key,
      name: storedMeta?.name ?? name,
      createdAt: storedMeta?.createdAt ?? "",
      lastUsedAt: storedMeta?.lastUsedAt,
      ...counts
    });
  }
  for (const event of stored) {
    const key = normalizeEventName(event.name);
    if (byName.has(key)) {
      const existing = byName.get(key);
      byName.set(key, {
        ...existing,
        id: event.id,
        name: event.name,
        createdAt: event.createdAt,
        lastUsedAt: event.lastUsedAt ?? existing.lastUsedAt
      });
    }
  }
  return Array.from(byName.values()).sort((a, b) => {
    const aTime = a.lastUsedAt || a.createdAt || "";
    const bTime = b.lastUsedAt || b.createdAt || "";
    return bTime.localeCompare(aTime);
  });
}
function filterContactsByEventName(contacts, eventName) {
  const key = normalizeEventName(eventName);
  return contacts.filter((c) => normalizeEventName(c.eventName || "") === key);
}
function summarizeEventFolders(folders) {
  return {
    totalEvents: folders.length,
    totalLeads: folders.reduce((sum, folder) => sum + folder.totalLeads, 0),
    synced: folders.reduce((sum, folder) => sum + folder.synced, 0),
    pending: folders.reduce((sum, folder) => sum + folder.pending, 0),
    failed: folders.reduce((sum, folder) => sum + folder.failed, 0)
  };
}
function formatEventDate(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" });
}
function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default"
}) {
  const toneClass = tone === "success" ? "text-emerald-600 dark:text-emerald-400" : tone === "warning" ? "text-amber-600 dark:text-amber-400" : tone === "danger" ? "text-destructive" : "text-primary";
  return /* @__PURE__ */ jsx(Card, { className: "rounded-2xl border-border/60 p-4 shadow-soft", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-[11px] font-medium uppercase tracking-wider text-muted-foreground", children: label }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-2xl font-semibold tabular-nums", children: value })
    ] }),
    /* @__PURE__ */ jsx("div", { className: cn("rounded-xl bg-muted/50 p-2.5", toneClass), children: /* @__PURE__ */ jsx(Icon, { className: "h-5 w-5" }) })
  ] }) });
}
function EventContactsTable({ contacts }) {
  if (contacts.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-dashed border-border/60 px-6 py-12 text-center text-sm text-muted-foreground", children: "No leads tagged with this event yet. Scan a card and enter this event name on Review." });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: "hidden overflow-x-auto rounded-xl border border-border/60 lg:block", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Contact" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Company" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Email" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Phone" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Notes" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-medium", children: "Status" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border/60", children: contacts.map((contact) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30", children: [
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(
            CardThumbnail,
            {
              contactId: contact.id,
              hasCardImage: contact.hasCardImage,
              queueImageDataUrl: contact.queueImageDataUrl,
              initials: contact.initials,
              accent: contact.accent
            }
          ),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: contact.name }),
            /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground", children: contact.title || "—" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground", children: contact.company || "—" }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground", children: contact.email || "—" }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground", children: contact.phone || "—" }),
        /* @__PURE__ */ jsx("td", { className: "max-w-xs px-4 py-3 text-muted-foreground", children: /* @__PURE__ */ jsx("span", { className: "line-clamp-2", title: contact.notes || void 0, children: contact.notes || "—" }) }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(StatusPill, { status: contact.status }) })
      ] }, contactRowKey(contact))) })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "space-y-3 lg:hidden", children: contacts.map((contact) => /* @__PURE__ */ jsx(Card, { className: "rounded-xl border-border/60 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsx(
        CardThumbnail,
        {
          contactId: contact.id,
          hasCardImage: contact.hasCardImage,
          queueImageDataUrl: contact.queueImageDataUrl,
          initials: contact.initials,
          accent: contact.accent,
          size: "md",
          className: "rounded-xl"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium", children: contact.name }),
        /* @__PURE__ */ jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [
          contact.company || "No company",
          " · ",
          contact.email || "No email"
        ] }),
        contact.notes ? /* @__PURE__ */ jsx("p", { className: "mt-2 line-clamp-3 text-xs text-muted-foreground", children: contact.notes }) : null,
        /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsx(StatusPill, { status: contact.status }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: contact.phone || "—" })
        ] })
      ] })
    ] }) }, contactRowKey(contact))) })
  ] });
}
function EventsPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { event: selectedEventName = "" } = Route.useSearch();
  const { contacts, isLoading, isRefreshing, fetchFailed, refresh } = useContactsDirectory();
  const [eventsVersion, setEventsVersion] = useState(0);
  const [newEventName, setNewEventName] = useState("");
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  useEffect(() => {
    invalidateContactsDirectory();
    void refresh({ force: true, silent: false });
  }, [refresh]);
  useEffect(() => {
    purgeOrphanExampleEvent(contacts);
  }, [contacts]);
  useEffect(() => {
    const bump = () => setEventsVersion((n) => n + 1);
    window.addEventListener("cs-events-updated", bump);
    return () => window.removeEventListener("cs-events-updated", bump);
  }, []);
  const folders = useMemo(() => {
    return buildEventFolderStats(contacts, loadEvents());
  }, [contacts, eventsVersion]);
  const summary = useMemo(() => summarizeEventFolders(folders), [folders]);
  const selectedFolder = useMemo(() => {
    if (!selectedEventName) return null;
    const key = selectedEventName.trim().toLowerCase();
    return folders.find((f) => f.name.trim().toLowerCase() === key) ?? null;
  }, [folders, selectedEventName]);
  const filteredContacts = useMemo(() => {
    if (!selectedEventName) return [];
    return filterContactsByEventName(contacts, selectedEventName);
  }, [contacts, selectedEventName]);
  const handleCreateEvent = () => {
    const trimmed = newEventName.trim();
    if (!trimmed) {
      setCreateError("Enter an event name.");
      setCreateSuccess("");
      return;
    }
    setCreateError("");
    rememberEvent(trimmed);
    setNewEventName("");
    setEventsVersion((n) => n + 1);
    setCreateSuccess(
      `${trimmed} saved for Review. After you save a card, refresh Events to see the folder from the database.`
    );
  };
  const selectFolder = (folder) => {
    void navigate({ search: { event: folder.name }, replace: true });
  };
  const clearSelection = () => {
    void navigate({ search: { event: void 0 }, replace: true });
  };
  const showInitialLoading = isLoading && contacts.length === 0 && folders.length === 0;
  return /* @__PURE__ */ jsxs(
    PageShell,
    {
      title: PAGE.events.title,
      description: PAGE.events.description,
      actions: /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "outline",
          onClick: () => {
            invalidateContactsDirectory();
            void refresh({ force: true });
          },
          disabled: isRefreshing,
          className: "h-10 rounded-xl",
          children: [
            /* @__PURE__ */ jsx(RefreshCw, { className: cn("mr-2 h-4 w-4", isRefreshing && "animate-spin") }),
            "Refresh"
          ]
        }
      ),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4", children: [
          /* @__PURE__ */ jsx(StatCard, { label: "Events", value: summary.totalEvents, icon: Folder }),
          /* @__PURE__ */ jsx(StatCard, { label: "Total leads", value: summary.totalLeads, icon: Users }),
          /* @__PURE__ */ jsx(StatCard, { label: "Synced", value: summary.synced, icon: CheckCircle2, tone: "success" }),
          /* @__PURE__ */ jsx(StatCard, { label: "Pending", value: summary.pending, icon: Clock, tone: "warning" })
        ] }),
        fetchFailed ? /* @__PURE__ */ jsxs(Card, { className: "flex items-center gap-3 rounded-2xl border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4 shrink-0 text-amber-600" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "Could not load leads from the database. Wait a minute, then click ",
            /* @__PURE__ */ jsx("strong", { children: "Refresh" }),
            "."
          ] })
        ] }) : null,
        summary.failed > 0 ? /* @__PURE__ */ jsxs(Card, { className: "flex items-center gap-3 rounded-2xl border-destructive/30 bg-destructive/5 px-4 py-3 text-sm", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4 shrink-0 text-destructive" }),
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("strong", { children: summary.failed }),
            " lead",
            summary.failed === 1 ? "" : "s",
            " failed to sync across all events."
          ] })
        ] }) : null,
        /* @__PURE__ */ jsxs(Card, { className: "rounded-2xl border-border/60 p-4 shadow-soft sm:p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Event folders" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Folders come from event tags and pending saves. Refresh to pull latest contacts." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    value: newEventName,
                    onChange: (e) => {
                      setNewEventName(e.target.value);
                      if (createError) setCreateError("");
                      if (createSuccess) setCreateSuccess("");
                    },
                    onKeyDown: (e) => {
                      if (e.key === "Enter") handleCreateEvent();
                    },
                    placeholder: `New event (e.g. ${getExampleEventName()})`,
                    className: "h-9 rounded-lg sm:w-56"
                  }
                ),
                /* @__PURE__ */ jsxs(Button, { type: "button", size: "sm", onClick: handleCreateEvent, className: "h-9 shrink-0 rounded-lg", children: [
                  /* @__PURE__ */ jsx(Plus, { className: "mr-1.5 h-4 w-4" }),
                  "Create"
                ] })
              ] }),
              selectedEventName ? /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: clearSelection, className: "h-9 rounded-lg", children: [
                /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
                "All folders"
              ] }) : null
            ] })
          ] }),
          createError ? /* @__PURE__ */ jsx("p", { className: "mb-3 text-xs text-destructive", children: createError }) : null,
          createSuccess ? /* @__PURE__ */ jsx("p", { className: "mb-3 text-xs text-emerald-600 dark:text-emerald-400", children: createSuccess }) : null,
          showInitialLoading ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center py-16 text-center text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsx(RefreshCw, { className: "mb-3 h-6 w-6 animate-spin text-primary" }),
            "Loading events…"
          ] }) : folders.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-dashed border-border/60 px-6 py-14 text-center", children: [
            /* @__PURE__ */ jsx(Folder, { className: "mx-auto mb-3 h-10 w-10 text-muted-foreground/60" }),
            /* @__PURE__ */ jsx("p", { className: "font-medium", children: "No event folders yet" }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: fetchFailed ? "The database could not be reached. Click Refresh after a minute." : contacts.length > 0 ? "Leads loaded but no event name found. The contact's event field should show Event: YourEventName (e.g. Event: Mall Opening)." : "Save a card with an event name on Review, then click Refresh." })
          ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", children: folders.map((folder) => {
            const isSelected = selectedEventName.trim().toLowerCase() === folder.name.trim().toLowerCase();
            return /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => selectFolder(folder),
                className: cn(
                  "group flex flex-col rounded-2xl border p-4 text-left transition-all",
                  "hover:-translate-y-0.5 hover:shadow-md",
                  isSelected ? "border-primary/50 bg-primary/5 shadow-soft ring-2 ring-primary/20" : "border-border/60 bg-card/40 hover:border-primary/30"
                ),
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
                    isSelected ? /* @__PURE__ */ jsx(FolderOpen, { className: "h-9 w-9 text-primary" }) : /* @__PURE__ */ jsx(Folder, { className: "h-9 w-9 text-amber-500 group-hover:text-primary" }),
                    /* @__PURE__ */ jsxs("span", { className: "rounded-lg bg-muted/60 px-2 py-0.5 text-[10px] font-semibold tabular-nums", children: [
                      folder.totalLeads,
                      " lead",
                      folder.totalLeads === 1 ? "" : "s"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "mt-3 line-clamp-2 font-semibold leading-snug", children: folder.name }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground", children: [
                    /* @__PURE__ */ jsxs("span", { className: "text-emerald-600 dark:text-emerald-400", children: [
                      folder.synced,
                      " synced"
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "text-amber-600 dark:text-amber-400", children: [
                      folder.pending,
                      " pending"
                    ] }),
                    folder.failed > 0 ? /* @__PURE__ */ jsxs("span", { className: "text-destructive", children: [
                      folder.failed,
                      " failed"
                    ] }) : null
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground", children: [
                    /* @__PURE__ */ jsx(CalendarDays, { className: "h-3 w-3" }),
                    "Last used ",
                    formatEventDate(folder.lastUsedAt || folder.createdAt)
                  ] })
                ]
              },
              folder.id
            );
          }) })
        ] }),
        selectedEventName && selectedFolder ? /* @__PURE__ */ jsxs(Card, { className: "rounded-2xl border-border/60 p-4 shadow-soft sm:p-6", children: [
          /* @__PURE__ */ jsx("div", { className: "mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h2", { className: "flex items-center gap-2 text-lg font-semibold", children: [
              /* @__PURE__ */ jsx(FolderOpen, { className: "h-5 w-5 text-primary" }),
              selectedFolder.name
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
              filteredContacts.length,
              " lead",
              filteredContacts.length === 1 ? "" : "s",
              " ·",
              " ",
              selectedFolder.synced,
              " synced · ",
              selectedFolder.pending,
              " pending"
            ] })
          ] }) }),
          /* @__PURE__ */ jsx(EventContactsTable, { contacts: filteredContacts })
        ] }) : null
      ]
    }
  );
}
function EventsRoutePage() {
  return /* @__PURE__ */ jsx(AuthGate, { allowedRoles: ["ADMIN", "USER"], children: /* @__PURE__ */ jsx(EventsPage, {}) });
}
export {
  EventsRoutePage as component
};
