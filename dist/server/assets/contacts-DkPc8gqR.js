import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ImageOff, RotateCw, UserRound, Search, RefreshCw, Loader2, Send, Trash2, Filter, Plus } from "lucide-react";
import { P as PageShell, C as Card } from "./PageShell-BozHmfmh.js";
import { b as getCurrentAppUser, M as removeQueueItem, V as removeOutreachStatusForContact, W as deleteContactFromBackend, g as getQueueItems, X as contactBelongsToAppUser, Y as getStoredContactById, Z as optimisticallyRemoveDirectoryContact, i as invalidateContactsDirectory, _ as getContactsListUrl, c as apiFetch, $ as getOutreachStatusForContactSync, a0 as getCurrentAppUserSync, a1 as resolveEventNameForContact, a2 as resolveChannelIconStatus, h as cn, B as Button, a as useConfirmModal, a3 as Route, u as useAuth, q as useUserSettings, y as loadEvents, U as contactRowKey, P as PAGE, I as Input, O as syncQueueItem, L as syncAllQueueItems } from "./router-CKY3IDgE.js";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, S as Select, e as SelectTrigger, f as SelectValue, g as SelectContent, h as SelectItem } from "./select-C2z8FtOj.js";
import { S as StatusPill } from "./StatusPill-DyKwaYdT.js";
import { T as Tabs, a as TabsList, b as TabsTrigger } from "./tabs-ChIvIqsS.js";
import { toast } from "sonner";
import { T as TABLE_PAGE_SIZE, c as clampPageAfterDelete, a as TablePagination } from "./table-pagination-B0_uHbmo.js";
import { u as useCardImage } from "./CardThumbnail-_gVAPqtU.js";
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
  if (contact.source === "localdb") {
    return;
  }
  const appUser = await getCurrentAppUser();
  if (contact.source === "queue") {
    const items = await getQueueItems();
    const item = items.find((entry) => entry.id === contact.id);
    if (item && !contactBelongsToAppUser(item, appUser)) {
      throw new Error("You do not have permission to delete this contact.");
    }
    return;
  }
  if (contact.source === "indexeddb") {
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
const ACCENTS = [
  "from-cyan-500 to-teal-500",
  "from-sky-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-fuchsia-500 to-pink-500",
  "from-cyan-500 to-blue-500"
];
function mapRawContact(c, index) {
  const name = String(c.name || c.fullName || "");
  const initials = name ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "";
  const status = c.status === "failed" || c.syncStatus === "failed" ? "failed" : "synced";
  const rawImage = String(c.cardImageBase64 || "");
  const hasCardImage = Boolean(c.hasCardImage) || rawImage.startsWith("data:image/") && rawImage.length > 32;
  const outreach = getOutreachStatusForContactSync(
    {
      email: String(c.email || ""),
      phone: String(c.phone || ""),
      name
    },
    getCurrentAppUserSync()
  );
  return {
    id: String(c.id || `db-${index}`),
    name,
    company: String(c.company || ""),
    title: String(c.title || c.designation || ""),
    email: String(c.email || ""),
    phone: String(c.phone || ""),
    eventName: resolveEventNameForContact({
      eventName: String(c.eventName || ""),
      email: String(c.email || ""),
      phone: String(c.phone || "")
    }),
    notes: String(c.notes || ""),
    source: "localdb",
    initials,
    accent: ACCENTS[index % ACCENTS.length],
    status,
    channels: c.channels || {
      whatsapp: !!c.phone,
      email: !!c.email
    },
    lastSync: status === "synced" ? String(c.lastSync || c.created_at || "Synced") : String(c.lastSync || ""),
    admin_name: String(c.admin_name || ""),
    user_name: String(c.user_name || ""),
    user_username: String(c.user_username || ""),
    createdAt: String(c.created_at || c.createdAt || ""),
    hasCardImage,
    emailDelivery: outreach.emailDelivery,
    whatsappDelivery: outreach.whatsappDelivery
  };
}
async function fetchContactsPage(page = 1, limit = TABLE_PAGE_SIZE, options) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  const q = options?.q?.trim();
  const event = options?.event?.trim();
  if (q) params.set("q", q);
  if (event) params.set("event", event);
  const url = `${getContactsListUrl()}?${params.toString()}`;
  const response = await apiFetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load contacts (${response.status})`);
  }
  const json = await response.json();
  const rawItems = Array.isArray(json) ? json : Array.isArray(json?.items) ? json.items : [];
  const total = typeof json?.total === "number" ? json.total : rawItems.length;
  return {
    items: rawItems.map((c, i) => mapRawContact(c, i)),
    total,
    page: typeof json?.page === "number" ? json.page : page,
    limit: typeof json?.limit === "number" ? json.limit : limit
  };
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
  if (status === "not_sent") {
    return error ? `${label} not sent: ${error}` : `${label}: not sent`;
  }
  return `${label}: no send result yet`;
}
function statusLabel(status) {
  if (status === "success") return "Sent";
  if (status === "failure") return "Failed";
  if (status === "not_sent") return "Not sent";
  return "Pending";
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
        status === "success" ? "bg-success/10 text-success" : status === "failure" ? "bg-destructive/10 text-destructive" : status === "not_sent" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : "bg-muted text-muted-foreground/60",
        className
      ),
      children: [
        status === "success" ? /* @__PURE__ */ jsx(CheckIcon, { className: "h-3.5 w-3.5" }) : status === "failure" || status === "not_sent" ? /* @__PURE__ */ jsx(CrossIcon, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(PendingIcon, { className: "h-3.5 w-3.5" }),
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
  const whatsappStatus = phone ? resolveChannelIconStatus(whatsappDelivery) : "not_sent";
  const emailStatus = email ? resolveChannelIconStatus(emailDelivery) : "not_sent";
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
        /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
          "WhatsApp: ",
          statusLabel(whatsappStatus)
        ] })
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
        /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
          "Email: ",
          statusLabel(emailStatus)
        ] })
      ] }) : null
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: cn("flex items-center gap-1.5", className), children: [
    showWhatsApp ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-[11px] text-muted-foreground", children: [
      /* @__PURE__ */ jsx(
        ChannelBadge,
        {
          status: whatsappStatus,
          type: "whatsapp",
          error: whatsappDelivery?.error
        }
      ),
      "WhatsApp: ",
      statusLabel(whatsappStatus)
    ] }) : null,
    showEmail ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-[11px] text-muted-foreground", children: [
      /* @__PURE__ */ jsx(
        ChannelBadge,
        {
          status: emailStatus,
          type: "email",
          error: emailDelivery?.error
        }
      ),
      "Email: ",
      statusLabel(emailStatus)
    ] }) : null
  ] });
}
function rotateImage(img, degrees) {
  const canvas = document.createElement("canvas");
  const swapSides = degrees % 180 !== 0;
  canvas.width = swapSides ? img.naturalHeight : img.naturalWidth;
  canvas.height = swapSides ? img.naturalWidth : img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(degrees * Math.PI / 180);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  return canvas.toDataURL("image/jpeg", 0.92);
}
function CardImageCell({
  contactId,
  hasCardImage,
  queueImageDataUrl,
  contactName,
  capturedBy,
  className
}) {
  const { src, markFailed } = useCardImage({ contactId, hasCardImage, queueImageDataUrl });
  const [open, setOpen] = useState(false);
  const [rotation, setRotation] = useState(null);
  const [displaySrc, setDisplaySrc] = useState(null);
  useEffect(() => {
    if (!src) {
      setDisplaySrc(null);
      setRotation(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const angle = rotation ?? (img.naturalHeight > img.naturalWidth ? 270 : 0);
      if (rotation === null) {
        setRotation(angle);
        return;
      }
      if (angle === 0) {
        setDisplaySrc(src);
        return;
      }
      setDisplaySrc(rotateImage(img, angle) ?? src);
    };
    img.onerror = () => {
      if (!cancelled) setDisplaySrc(src);
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src, rotation]);
  const shownSrc = displaySrc ?? src;
  if (!src) {
    return /* @__PURE__ */ jsx(
      "span",
      {
        className: cn("inline-flex w-14 items-center justify-center rounded-md border border-dashed border-border/60 text-muted-foreground/50", className),
        title: "No card image",
        children: /* @__PURE__ */ jsx(ImageOff, { className: "h-3.5 w-3.5" })
      }
    );
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: cn("inline-flex w-14 flex-col items-stretch gap-0.5", className), children: [
      contactName && /* @__PURE__ */ jsx(
        "span",
        {
          className: "truncate text-center text-[10px] font-medium leading-tight text-muted-foreground",
          title: contactName,
          children: contactName
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => setOpen(true),
          title: "View card image",
          className: "group relative block shrink-0 cursor-zoom-in overflow-hidden rounded-md ring-1 ring-border/60 transition hover:ring-2 hover:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          children: /* @__PURE__ */ jsx(
            "img",
            {
              src: shownSrc ?? void 0,
              alt: contactName ? `${contactName} business card` : "Business card",
              className: "h-9 w-14 object-cover transition group-hover:scale-105",
              onError: markFailed
            }
          )
        }
      )
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-3xl", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 pr-6", children: [
          /* @__PURE__ */ jsx(DialogTitle, { children: contactName || "Business card" }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              onClick: () => setRotation((r) => ((r ?? 0) + 90) % 360),
              className: "h-7 rounded-md px-2.5 text-xs",
              children: [
                /* @__PURE__ */ jsx(RotateCw, { className: "mr-1.5 h-3.5 w-3.5" }),
                " Rotate"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "Scanned business card image" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-lg bg-muted/40", children: [
        (contactName || capturedBy) && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-3 border-b border-border/60 bg-muted/80 px-3 py-1.5 text-xs text-muted-foreground", children: [
          contactName && /* @__PURE__ */ jsx("span", { className: "truncate font-semibold text-foreground", children: contactName }),
          contactName && capturedBy && /* @__PURE__ */ jsx("span", { className: "text-border", children: "|" }),
          capturedBy && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 font-medium", children: [
            /* @__PURE__ */ jsx(UserRound, { className: "h-3.5 w-3.5" }),
            "Captured by ",
            /* @__PURE__ */ jsx("span", { className: "text-foreground", children: capturedBy })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex max-h-[70vh] items-center justify-center overflow-auto p-2", children: /* @__PURE__ */ jsx(
          "img",
          {
            src: shownSrc ?? void 0,
            alt: contactName ? `${contactName} business card` : "Business card",
            className: "max-h-[62vh] w-auto max-w-full rounded-md object-contain"
          }
        ) })
      ] })
    ] }) })
  ] });
}
async function loadQueueAsDirectoryContacts() {
  const appUser = await getCurrentAppUser();
  const queueItems = await getQueueItems();
  return queueItems.filter((item) => contactBelongsToAppUser(item, appUser)).map((item) => {
    const c = item.contact_data;
    const name = String(c.fullName || c.name || "Unnamed Contact");
    const initials = name ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "?";
    const outreach = getOutreachStatusForContactSync(
      {
        email: String(c.email || ""),
        phone: String(c.phone || ""),
        name
      },
      getCurrentAppUserSync()
    );
    return {
      id: item.id,
      source: "queue",
      name,
      initials,
      company: c.company || "No Company",
      title: c.title || c.designation || "No Title",
      email: c.email || "",
      phone: c.phone || "",
      eventName: resolveEventNameForContact({
        eventName: String(c.eventName || ""),
        email: String(c.email || ""),
        phone: String(c.phone || "")
      }),
      notes: String(c.notes || ""),
      status: item.status === "retrying" ? "pending" : item.status,
      channels: c.channels || {
        whatsapp: !!c.phone,
        email: !!c.email
      },
      lastSync: item.status === "failed" ? "Sync failed" : "Queued · pending sync",
      accent: "from-amber-500 to-orange-500",
      createdAt: item.created_at || "",
      hasCardImage: Boolean(
        item.image_base64 && String(item.image_base64).startsWith("data:image/")
      ),
      queueImageDataUrl: item.image_base64 && String(item.image_base64).startsWith("data:image/") ? String(item.image_base64) : void 0,
      emailDelivery: outreach.emailDelivery,
      whatsappDelivery: outreach.whatsappDelivery
    };
  });
}
const InitialsAvatar = ({
  initials,
  accent = "from-cyan-500 to-teal-500",
  className
}) => /* @__PURE__ */ jsx(
  "div",
  {
    className: cn(
      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-[11px] font-semibold text-white",
      accent,
      className
    ),
    children: initials || "?"
  }
);
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
  const isAdmin = authUser?.role === "ADMIN";
  const canDelete = authUser?.role === "SUPER_ADMIN" || authUser?.role === "ADMIN";
  const [page, setPage] = useState(1);
  const [dbContacts, setDbContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [queueContacts, setQueueContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("all");
  const [syncingId, setSyncingId] = useState(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedQ, setDebouncedQ] = useState(q);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(q), 300);
    return () => window.clearTimeout(timer);
  }, [q]);
  const setQ = (next) => {
    setPage(1);
    void navigate({ search: (prev) => ({ ...prev, q: next.trim() || void 0 }), replace: true });
  };
  const setEventFilter = (next) => {
    setPage(1);
    void navigate({
      search: (prev) => ({ ...prev, event: next === "all" ? void 0 : next }),
      replace: true
    });
  };
  const clearFilters = () => {
    setTab("all");
    setPage(1);
    void navigate({
      search: (prev) => ({ ...prev, q: void 0, event: void 0 }),
      replace: true
    });
  };
  const { settings: userSettings } = useUserSettings();
  const showWhatsAppTemplateStatus = userSettings.whatsappNotificationsEnabled;
  const showEmailTemplateStatus = userSettings.emailNotificationsEnabled;
  const showTemplateStatusColumn = showWhatsAppTemplateStatus || showEmailTemplateStatus;
  const templateColumnLabel = [
    showWhatsAppTemplateStatus ? "WhatsApp" : null,
    showEmailTemplateStatus ? "Email" : null
  ].filter(Boolean).join(" / ");
  const contactsList = useMemo(() => {
    if (page === 1) return [...queueContacts, ...dbContacts];
    return dbContacts;
  }, [page, queueContacts, dbContacts]);
  const showInitialLoading = isLoading && contactsList.length === 0 && total === 0;
  const activeFilterCount = (q ? 1 : 0) + (eventFilter ? 1 : 0) + (tab !== "all" ? 1 : 0);
  const loadPage = useCallback(
    async ({ silent = false, pageOverride } = {}) => {
      const targetPage = pageOverride ?? page;
      if (silent) setIsRefreshing(true);
      else setIsLoading(true);
      try {
        setError(null);
        const filters = { q: debouncedQ, event: eventFilter || void 0 };
        const [pageRes, queue] = await Promise.all([
          fetchContactsPage(targetPage, TABLE_PAGE_SIZE, filters),
          loadQueueAsDirectoryContacts()
        ]);
        const nextPage = clampPageAfterDelete(targetPage, pageRes.total, TABLE_PAGE_SIZE);
        if (nextPage !== targetPage) {
          setPage(nextPage);
          const again = await fetchContactsPage(nextPage, TABLE_PAGE_SIZE, filters);
          setDbContacts(again.items);
          setTotal(again.total);
        } else {
          setDbContacts(pageRes.items);
          setTotal(pageRes.total);
        }
        setQueueContacts(queue);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load contacts.");
        if (!silent) toast.error("Failed to load contacts.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, debouncedQ, eventFilter]
  );
  useEffect(() => {
    void loadPage();
    const onDataChanged = () => {
      void loadPage({ silent: true });
    };
    window.addEventListener("cs-contacts-updated", onDataChanged);
    window.addEventListener("cs-queue-updated", onDataChanged);
    return () => {
      window.removeEventListener("cs-contacts-updated", onDataChanged);
      window.removeEventListener("cs-queue-updated", onDataChanged);
    };
  }, [loadPage]);
  const reloadContacts = async ({
    silent = false,
    force: _force = true
  } = {}) => {
    await loadPage({ silent });
  };
  const removeContact = (contact) => {
    if (contact.source === "queue") {
      setQueueContacts((prev) => prev.filter((c) => contactRowKey(c) !== contactRowKey(contact)));
    } else {
      setDbContacts((prev) => prev.filter((c) => contactRowKey(c) !== contactRowKey(contact)));
      setTotal((t) => Math.max(0, t - 1));
    }
    invalidateContactsDirectory();
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
      await syncQueueItem(item, {
        skipWhatsApp: !userSettings.whatsappNotificationsEnabled,
        skipEmail: !userSettings.emailNotificationsEnabled
      });
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
    if (queueContacts.length === 0) {
      toast.info("No queued contacts waiting to sync.");
      return;
    }
    setIsSyncingAll(true);
    try {
      const result = await syncAllQueueItems({
        skipWhatsApp: !userSettings.whatsappNotificationsEnabled,
        skipEmail: !userSettings.emailNotificationsEnabled
      });
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
      if (c.source === "queue") {
        if (eventFilter && (c.eventName || "").trim().toLowerCase() !== eventFilter.trim().toLowerCase()) {
          return false;
        }
        if (q) {
          const searchStr = `${c.name || ""} ${c.company || ""} ${c.email || ""} ${c.eventName || ""}`.toLowerCase();
          if (!searchStr.includes(q.toLowerCase())) return false;
        }
      }
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
  const pendingQueueCount = queueContacts.length;
  const counts = useMemo(() => ({
    all: total + queueContacts.length,
    synced: total,
    pending: queueContacts.length,
    failed: dbContacts.filter((c) => c.status === "failed").length
  }), [total, queueContacts.length, dbContacts]);
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
      description: total > 0 || queueContacts.length > 0 ? `${PAGE.contacts.description} · ${total + queueContacts.length} record${total + queueContacts.length === 1 ? "" : "s"}` : PAGE.contacts.description,
      actions: /* @__PURE__ */ jsxs("div", { className: "grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            onClick: () => void reloadContacts({ force: true }),
            disabled: isRefreshing,
            className: "w-full sm:w-auto",
            children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: `mr-2 h-4 w-4 shrink-0 ${isRefreshing ? "animate-spin" : ""}` }),
              "Refresh"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            onClick: () => setShowFilters((prev) => !prev),
            "aria-expanded": showFilters,
            className: cn(
              "w-full sm:w-auto",
              showFilters && "border-primary/50 bg-primary/5 text-primary"
            ),
            children: [
              /* @__PURE__ */ jsx(Filter, { className: "mr-2 h-4 w-4 shrink-0" }),
              "Filters",
              activeFilterCount > 0 ? /* @__PURE__ */ jsx("span", { className: "ml-1.5 rounded-md bg-primary/15 px-1.5 text-[10px] font-semibold text-primary", children: activeFilterCount }) : null
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            onClick: () => void navigate({ to: "/scan" }),
            className: "w-full sm:w-auto",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "mr-2 h-4 w-4 shrink-0" }),
              "New contact"
            ]
          }
        )
      ] }),
      children: [
        /* @__PURE__ */ jsxs(Card, { className: "rounded-2xl border-border/60 p-3 shadow-soft sm:p-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-center", children: [
              /* @__PURE__ */ jsxs("div", { className: "relative min-w-0 flex-1", children: [
                /* @__PURE__ */ jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
                /* @__PURE__ */ jsx(Input, { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search name, company, email, or event", className: "h-10 w-full rounded-md border-border/60 bg-background pl-9" })
              ] }),
              showFilters && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs(Select, { value: eventFilter || "all", onValueChange: setEventFilter, children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "h-10 w-full shrink-0 rounded-md border-border/60 bg-background sm:w-[240px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Filter by event" }) }),
                  /* @__PURE__ */ jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All events" }),
                    eventFilterOptions.map((name) => /* @__PURE__ */ jsx(SelectItem, { value: name, children: name }, name))
                  ] })
                ] }),
                activeFilterCount > 0 && /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "ghost",
                    size: "sm",
                    onClick: clearFilters,
                    className: "h-10 shrink-0 rounded-md text-xs text-muted-foreground hover:text-foreground",
                    children: "Clear filters"
                  }
                )
              ] })
            ] }),
            showFilters && /* @__PURE__ */ jsx(Tabs, { value: tab, onValueChange: (v) => setTab(v), className: "w-full", children: /* @__PURE__ */ jsx(TabsList, { className: "grid h-auto w-full grid-cols-4 gap-1 rounded-xl bg-muted/60 p-1", children: statusTabs.map((t) => /* @__PURE__ */ jsxs(TabsTrigger, { value: t.key, className: "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-[10px] leading-tight data-[state=active]:bg-card data-[state=active]:shadow-soft sm:flex-row sm:gap-1.5 sm:text-xs", children: [
              /* @__PURE__ */ jsx("span", { children: t.label }),
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-semibold text-muted-foreground", children: counts[t.key] })
            ] }, t.key)) }) })
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
              /* @__PURE__ */ jsx("thead", { className: "bg-gradient-primary text-left text-[11px] font-bold uppercase tracking-wider text-white", children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-bold text-white", children: "Contact Name" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-bold text-white", children: "Card" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-bold text-white", children: "Company" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-bold text-white", children: "Designation" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-bold text-white", children: "Email" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-bold text-white", children: "Phone" }),
                isSuperAdmin && /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-bold text-white", children: "Admin Name" }),
                  /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-bold text-white", children: "Captured By" })
                ] }),
                isAdmin && /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-bold text-white", children: "Captured By" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-bold text-white", children: "Event" }),
                showTemplateStatusColumn && /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-bold text-white", children: templateColumnLabel }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-bold text-white", children: "Status" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-bold text-white", children: "Created" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-bold text-white text-right", children: "Actions" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border/60", children: filtered.map((c) => {
                const rowKey = contactRowKey(c);
                const isHighlighted = highlight === rowKey;
                return /* @__PURE__ */ jsxs("tr", { id: `contact-row-${rowKey}`, className: cn("transition", isHighlighted ? "bg-primary/10 ring-2 ring-inset ring-primary/35" : "hover:bg-muted/30"), children: [
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsx(InitialsAvatar, { initials: c.initials, accent: c.accent }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("div", { className: "font-medium", children: c.name || "—" }),
                      c.notes && /* @__PURE__ */ jsx("div", { className: "max-w-[200px] truncate text-[11px] text-muted-foreground", children: c.notes })
                    ] })
                  ] }) }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(
                    CardImageCell,
                    {
                      contactId: c.id,
                      hasCardImage: c.hasCardImage,
                      queueImageDataUrl: c.queueImageDataUrl,
                      contactName: c.name,
                      capturedBy: c.user_name
                    }
                  ) }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground", children: c.company || "—" }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground", children: c.title || "—" }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground", children: c.email || "—" }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground", children: c.phone || "—" }),
                  isSuperAdmin && /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground", children: c.admin_name || "—" }),
                    /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground", children: c.user_name || "—" })
                  ] }),
                  isAdmin && /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground", children: c.user_name || "—" }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground", children: c.eventName || "—" }),
                  showTemplateStatusColumn && /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(ContactChannelIcons, { phone: c.phone, email: c.email, whatsappDelivery: c.whatsappDelivery, emailDelivery: c.emailDelivery, showWhatsApp: showWhatsAppTemplateStatus, showEmail: showEmailTemplateStatus }) }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(StatusPill, { status: c.status }) }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground", children: formatDate(c.createdAt) }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1", children: [
                    c.source === "queue" && /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => handleSyncQueueItem(c.id), disabled: syncingId === c.id || isSyncingAll, className: "h-8 rounded-md text-xs", children: syncingId === c.id ? /* @__PURE__ */ jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                      /* @__PURE__ */ jsx(Send, { className: "mr-1.5 h-3 w-3" }),
                      "Sync"
                    ] }) }),
                    canDelete && /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: () => handleDelete(c), className: "h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md cursor-pointer", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
                  ] }) })
                ] }, rowKey);
              }) })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "mt-5 space-y-3 lg:hidden", children: filtered.map((c) => {
              const rowKey = contactRowKey(c);
              const isHighlighted = highlight === rowKey;
              return /* @__PURE__ */ jsxs("div", { id: `contact-row-${rowKey}`, className: cn("rounded-xl border p-3 sm:p-4 transition", isHighlighted ? "border-primary/50 bg-primary/10 ring-2 ring-primary/30" : "border-border/60 bg-card/40"), children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                  /* @__PURE__ */ jsx(
                    InitialsAvatar,
                    {
                      initials: c.initials,
                      accent: c.accent,
                      className: "h-12 w-12 rounded-xl text-xs"
                    }
                  ),
                  /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                    /* @__PURE__ */ jsx("div", { className: "truncate font-medium", children: c.name || "—" }),
                    /* @__PURE__ */ jsxs("div", { className: "truncate text-xs text-muted-foreground", children: [
                      c.title || "—",
                      " / ",
                      c.company || "No company"
                    ] }),
                    c.email && /* @__PURE__ */ jsx("div", { className: "truncate text-[11px] text-muted-foreground", children: c.email }),
                    c.phone && /* @__PURE__ */ jsx("div", { className: "truncate text-[11px] text-muted-foreground", children: c.phone }),
                    (isSuperAdmin || isAdmin) && c.user_name && /* @__PURE__ */ jsxs("div", { className: "mt-0.5 text-[11px] text-primary/80", children: [
                      isSuperAdmin && c.admin_name && `Admin: ${c.admin_name} | `,
                      "Captured by: ",
                      c.user_name
                    ] }),
                    c.eventName && /* @__PURE__ */ jsxs("div", { className: "mt-0.5 truncate text-[11px] text-primary/90", children: [
                      "Event: ",
                      c.eventName
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "mt-0.5 text-[11px] text-muted-foreground", children: formatDate(c.createdAt) })
                  ] }),
                  /* @__PURE__ */ jsx(
                    CardImageCell,
                    {
                      contactId: c.id,
                      hasCardImage: c.hasCardImage,
                      queueImageDataUrl: c.queueImageDataUrl,
                      contactName: c.name,
                      capturedBy: c.user_name,
                      className: "self-start"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-2 border-t border-border/40 pt-3", children: [
                  /* @__PURE__ */ jsx(StatusPill, { status: c.status }),
                  showTemplateStatusColumn && /* @__PURE__ */ jsx(ContactChannelIcons, { phone: c.phone, email: c.email, whatsappDelivery: c.whatsappDelivery, emailDelivery: c.emailDelivery, compact: true, showWhatsApp: showWhatsAppTemplateStatus, showEmail: showEmailTemplateStatus })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
                  c.source === "queue" && /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => handleSyncQueueItem(c.id), disabled: syncingId === c.id || isSyncingAll, className: "flex-1 min-w-[120px] rounded-md text-xs sm:flex-none", children: syncingId === c.id ? /* @__PURE__ */ jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin" }) : "Sync to database" }),
                  canDelete && /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: () => handleDelete(c), className: "rounded-md text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive", children: [
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
            /* @__PURE__ */ jsx(
              TablePagination,
              {
                page,
                total,
                limit: TABLE_PAGE_SIZE,
                disabled: isLoading || isRefreshing,
                onPageChange: setPage
              }
            )
          ] })
        ] }),
        pendingQueueCount > 0 && /* @__PURE__ */ jsx("div", { className: "fab-bottom fab-above-cookie fixed z-40 flex flex-col items-end gap-2", children: /* @__PURE__ */ jsxs(
          Button,
          {
            onClick: () => void handleSyncAllQueue(),
            disabled: isSyncingAll || isRefreshing,
            title: "Sync queued contacts to database",
            className: "shrink-0 rounded-md bg-gradient-primary px-3 shadow-glow",
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
