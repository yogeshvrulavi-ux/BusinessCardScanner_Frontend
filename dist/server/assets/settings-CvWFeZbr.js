import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { Building2, Clock, User, Mail, Phone, Loader2, Bell, Inbox, ScanLine, MessageCircle, Wifi, Shield, Cookie, Scale, ExternalLink, FileText, Trash2 } from "lucide-react";
import { a as getCurrentAppUser, b as apiFetch, A as API_BASE_URL, c as clearUserBrowserData, d as clearOutreachStatusForUser, i as invalidateContactsDirectory, e as cn, I as Input, T as TIMEZONE_OPTIONS, B as Button, u as useConfirmModal, f as authClient, D as DEFAULT_USER_SETTINGS, h as getUserInitials, s as syncProfileFromAuthUser, j as loadUserSettings, k as hasCookieConsent, P as PAGE, m as applyWorkModePreference, n as saveUserSettings, o as saveCookieConsent } from "./router-CgoztCPx.js";
import { C as Card, P as PageShell } from "./PageShell-Blc1kFAi.js";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { L as Label, D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, e as DialogFooter } from "./dialog-DDn7LjBa.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-D2ml3Cfa.js";
import { C as COOKIE_POLICY_SECTIONS, L as LEGAL_PAGE_URLS } from "./legalContent-W3nnvv-x.js";
import { toast } from "sonner";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "@neondatabase/auth-ui";
import "@neondatabase/neon-js/auth";
import "@neondatabase/neon-js/auth/react";
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
async function wipeAllAppData(options) {
  const includeZoho = options?.includeZoho !== false;
  const appUser = await getCurrentAppUser();
  const result = { scopedToUser: Boolean(appUser) };
  const backendRes = await apiFetch(`${API_BASE_URL}/admin/wipe-all-data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirm: true, include_zoho: includeZoho })
  });
  if (!backendRes.ok) {
    let detail = `Wipe failed (${backendRes.status})`;
    try {
      const err = await backendRes.json();
      if (typeof err.detail === "string") detail = err.detail;
    } catch {
    }
    throw new Error(detail);
  }
  const backendJson = await backendRes.json();
  result.zoho = backendJson.zoho;
  result.contacts = backendJson.contacts;
  result.scopedToUser = Boolean(backendJson.scoped_to_user ?? appUser);
  const browser = await clearUserBrowserData(appUser);
  clearOutreachStatusForUser(appUser);
  result.browser = browser;
  invalidateContactsDirectory();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cs-contacts-updated"));
    window.dispatchEvent(new CustomEvent("cs-queue-updated"));
  }
  return result;
}
async function clearLocalQueueOnly() {
  const appUser = await getCurrentAppUser();
  const { clearUserSyncQueue } = await import("./router-CgoztCPx.js").then((n) => n.ac);
  const removed = await clearUserSyncQueue(appUser);
  invalidateContactsDirectory();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cs-queue-updated"));
  }
  return removed;
}
const Switch = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SwitchPrimitives.Root,
  {
    className: cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    ),
    ...props,
    ref,
    children: /* @__PURE__ */ jsx(
      SwitchPrimitives.Thumb,
      {
        className: cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
        )
      }
    )
  }
));
Switch.displayName = SwitchPrimitives.Root.displayName;
function Field({
  id,
  label,
  icon,
  children,
  className
}) {
  return /* @__PURE__ */ jsxs("div", { className, children: [
    /* @__PURE__ */ jsxs(Label, { htmlFor: id, className: "flex items-center gap-1.5 text-xs font-medium text-muted-foreground", children: [
      /* @__PURE__ */ jsx("span", { className: "text-primary/80", children: icon }),
      label
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-1.5", children })
  ] });
}
function ProfileSettingsCard({
  profile,
  initials,
  isSaving,
  onChange,
  onSave
}) {
  const displayName = profile.fullName.trim() || "Your name";
  const subtitle = [profile.role, profile.company].filter(Boolean).join(" · ");
  return /* @__PURE__ */ jsxs(Card, { className: "overflow-hidden rounded-2xl border-border/60 shadow-soft lg:col-span-2", children: [
    /* @__PURE__ */ jsx("div", { className: "relative border-b border-border/60 bg-gradient-to-br from-primary/8 via-card to-violet-500/5 px-5 py-6 sm:px-8 sm:py-8", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative mx-auto shrink-0 sm:mx-0", children: [
        /* @__PURE__ */ jsx("div", { className: "flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-primary text-2xl font-semibold text-primary-foreground shadow-glow sm:h-24 sm:w-24", children: initials }),
        /* @__PURE__ */ jsx("span", { className: "absolute -bottom-1 -right-1 rounded-full border-2 border-background bg-green-500 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white", children: "Local" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 text-center sm:text-left", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[11px] font-medium uppercase tracking-wider text-muted-foreground", children: "Your profile" }),
        /* @__PURE__ */ jsx("h2", { className: "mt-1 font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl", children: displayName }),
        profile.email ? /* @__PURE__ */ jsx("p", { className: "mt-1 truncate text-sm text-muted-foreground", children: profile.email }) : null,
        subtitle ? /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: subtitle }) : null,
        /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap justify-center gap-2 sm:justify-start", children: [
          profile.company ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] font-medium text-foreground/90", children: [
            /* @__PURE__ */ jsx(Building2, { className: "h-3 w-3 text-primary" }),
            profile.company
          ] }) : null,
          /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground", children: [
            /* @__PURE__ */ jsx(Clock, { className: "h-3 w-3" }),
            profile.timezone
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6 p-5 sm:p-8", children: [
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-foreground", children: "Personal" }),
        /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: "Shown in the header and on your Capture greeting." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-4 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsx(Field, { id: "profile-fullName", label: "Full name", icon: /* @__PURE__ */ jsx(User, { className: "h-3.5 w-3.5" }), children: /* @__PURE__ */ jsx(
            Input,
            {
              id: "profile-fullName",
              value: profile.fullName,
              onChange: (e) => onChange("fullName", e.target.value),
              className: "h-10 rounded-md border-border/60 bg-background",
              placeholder: "Your name"
            }
          ) }),
          /* @__PURE__ */ jsx(Field, { id: "profile-email", label: "Email", icon: /* @__PURE__ */ jsx(Mail, { className: "h-3.5 w-3.5" }), children: /* @__PURE__ */ jsx(
            Input,
            {
              id: "profile-email",
              type: "email",
              value: profile.email,
              onChange: (e) => onChange("email", e.target.value),
              className: "h-10 rounded-md border-border/60 bg-background",
              placeholder: "you@company.com"
            }
          ) }),
          /* @__PURE__ */ jsx(
            Field,
            {
              id: "profile-phone",
              label: "Phone",
              icon: /* @__PURE__ */ jsx(Phone, { className: "h-3.5 w-3.5" }),
              className: "sm:col-span-2",
              children: /* @__PURE__ */ jsx(
                Input,
                {
                  id: "profile-phone",
                  type: "tel",
                  value: profile.phone,
                  onChange: (e) => onChange("phone", e.target.value),
                  className: "h-10 rounded-md border-border/60 bg-background",
                  placeholder: "+91 XXXXX XXXXX"
                }
              )
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "h-px bg-border/60" }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-foreground", children: "Work" }),
        /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: "Optional details for cards and contact context." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-4 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsx(Field, { id: "profile-company", label: "Company", icon: /* @__PURE__ */ jsx(Building2, { className: "h-3.5 w-3.5" }), children: /* @__PURE__ */ jsx(
            Input,
            {
              id: "profile-company",
              value: profile.company,
              onChange: (e) => onChange("company", e.target.value),
              className: "h-10 rounded-md border-border/60 bg-background",
              placeholder: "Your organisation"
            }
          ) }),
          /* @__PURE__ */ jsx(Field, { id: "profile-role", label: "Role", icon: /* @__PURE__ */ jsx(User, { className: "h-3.5 w-3.5" }), children: /* @__PURE__ */ jsx(
            Input,
            {
              id: "profile-role",
              value: profile.role,
              onChange: (e) => onChange("role", e.target.value),
              className: "h-10 rounded-md border-border/60 bg-background",
              placeholder: "Workspace owner"
            }
          ) }),
          /* @__PURE__ */ jsx(
            Field,
            {
              id: "profile-timezone",
              label: "Timezone",
              icon: /* @__PURE__ */ jsx(Clock, { className: "h-3.5 w-3.5" }),
              className: "sm:col-span-2",
              children: /* @__PURE__ */ jsxs(
                Select,
                {
                  value: profile.timezone,
                  onValueChange: (value) => onChange("timezone", value),
                  children: [
                    /* @__PURE__ */ jsx(
                      SelectTrigger,
                      {
                        id: "profile-timezone",
                        className: "h-10 w-full rounded-md border-border/60 bg-background",
                        children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select timezone" })
                      }
                    ),
                    /* @__PURE__ */ jsx(SelectContent, { children: TIMEZONE_OPTIONS.map((tz) => /* @__PURE__ */ jsx(SelectItem, { value: tz, children: tz }, tz)) })
                  ]
                }
              )
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col-reverse gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between", children: [
        /* @__PURE__ */ jsx("p", { className: "text-center text-[11px] text-muted-foreground sm:text-left", children: "Profile data is stored only in this browser." }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            onClick: onSave,
            disabled: isSaving,
            className: "w-full rounded-xl bg-gradient-primary shadow-glow sm:w-auto sm:min-w-[140px]",
            children: [
              isSaving ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : null,
              isSaving ? "Saving…" : "Save profile"
            ]
          }
        )
      ] })
    ] })
  ] });
}
function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  showClose = true
}) {
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(
    DialogContent,
    {
      className: cn(
        "max-w-lg rounded-2xl border-border/60 shadow-soft",
        !showClose && "[&>button]:hidden",
        className
      ),
      children: [
        (title || description) && /* @__PURE__ */ jsxs(DialogHeader, { children: [
          title ? /* @__PURE__ */ jsx(DialogTitle, { className: "font-display text-lg", children: title }) : null,
          description ? /* @__PURE__ */ jsx(DialogDescription, { className: "text-sm text-muted-foreground", children: description }) : null
        ] }),
        children,
        footer ? /* @__PURE__ */ jsx(DialogFooter, { className: "gap-2 sm:gap-2", children: footer }) : null
      ]
    }
  ) });
}
function LegalDocumentModal({
  open,
  onOpenChange,
  title,
  sections
}) {
  return /* @__PURE__ */ jsx(
    Modal,
    {
      open,
      onOpenChange,
      title,
      className: "max-h-[85vh] max-w-2xl",
      children: /* @__PURE__ */ jsx("div", { className: "max-h-[60vh] space-y-5 overflow-y-auto pr-1 text-sm text-muted-foreground", children: sections.map((section) => /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h3", { className: "mb-1.5 font-medium text-foreground", children: section.heading }),
        /* @__PURE__ */ jsx("p", { className: "leading-relaxed", children: section.body })
      ] }, section.heading)) })
    }
  );
}
function SettingRow({
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
  icon
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/30 p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 items-start gap-3", children: [
      icon ? /* @__PURE__ */ jsx("div", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary", children: icon }) : null,
      /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: title }),
        /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground", children: description })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      Switch,
      {
        checked,
        disabled,
        onCheckedChange
      }
    )
  ] });
}
function SettingsPage() {
  const { confirm } = useConfirmModal();
  const { data: authSession } = authClient.useSession();
  const [profile, setProfile] = useState(DEFAULT_USER_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [isClearingQueue, setIsClearingQueue] = useState(false);
  const [cookiesOpen, setCookiesOpen] = useState(false);
  const initials = useMemo(() => getUserInitials(profile.fullName), [profile.fullName]);
  useEffect(() => {
    if (authSession?.user) {
      syncProfileFromAuthUser(authSession.user);
    }
    const loaded = loadUserSettings();
    const authEmail = authSession?.user?.email?.trim();
    const authName = authSession?.user?.name?.trim();
    const mergedProfile = {
      ...loaded,
      ...authEmail ? { email: authEmail } : {},
      ...authName ? { fullName: authName } : {}
    };
    const consent = hasCookieConsent();
    setProfile(
      consent ? { ...mergedProfile, cookiesAccepted: true } : mergedProfile
    );
    document.documentElement.classList.remove("dark");
    localStorage.removeItem("cs-dark");
  }, [authSession?.user?.email, authSession?.user?.name]);
  const updateProfileField = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };
  const persistToggle = (key, value, message) => {
    updateProfileField(key, value);
    saveUserSettings({ [key]: value });
    toast.success(message);
  };
  const persistCookieChoice = (analytics) => {
    saveCookieConsent({ essential: true, analytics });
    persistToggle("cookiesAccepted", true, "Cookie preferences saved.");
    persistToggle("analyticsCookiesEnabled", analytics, analytics ? "Analytics enabled." : "Analytics disabled.");
  };
  const handleSaveProfile = () => {
    setIsSaving(true);
    try {
      saveUserSettings(profile);
      applyWorkModePreference(profile.preferOfflineCapture);
      toast.success("Profile saved to this device.");
    } catch {
      toast.error("Failed to save preferences.");
    } finally {
      setIsSaving(false);
    }
  };
  const handleClearQueue = async () => {
    const ok = await confirm({
      title: "Clear offline queue?",
      description: "Remove only your offline sync queue on this device. Other users' queued contacts are not affected.",
      confirmLabel: "Clear queue",
      destructive: true
    });
    if (!ok) return;
    setIsClearingQueue(true);
    try {
      const removed = await clearLocalQueueOnly();
      toast.success(
        removed > 0 ? `Cleared ${removed} queued contact${removed === 1 ? "" : "s"} from your queue.` : "Your offline queue is already empty."
      );
    } catch {
      toast.error("Failed to clear queue.");
    } finally {
      setIsClearingQueue(false);
    }
  };
  const handleWipeAll = async () => {
    const ok = await confirm({
      title: "Delete your data?",
      description: "Remove your contacts, queue, and outreach status on this device. Zoho records are marked deleted (not permanently removed) and only for your account.",
      confirmLabel: "Delete my data",
      destructive: true
    });
    if (!ok) return;
    setIsWiping(true);
    try {
      const result = await wipeAllAppData();
      const browser = result.browser;
      toast.success(
        browser ? `Your data cleared (${browser.contactsRemoved} device contact${browser.contactsRemoved === 1 ? "" : "s"}, ${browser.queueRemoved} queue item${browser.queueRemoved === 1 ? "" : "s"}).` : "Your data cleared on this device."
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Wipe failed.");
    } finally {
      setIsWiping(false);
    }
  };
  return /* @__PURE__ */ jsxs(PageShell, { title: PAGE.preferences.title, description: PAGE.preferences.description, children: [
    /* @__PURE__ */ jsx(
      LegalDocumentModal,
      {
        open: cookiesOpen,
        onOpenChange: setCookiesOpen,
        title: "Cookie Policy",
        sections: COOKIE_POLICY_SECTIONS
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-5 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsx(
        ProfileSettingsCard,
        {
          profile,
          initials,
          isSaving,
          onChange: updateProfileField,
          onSave: handleSaveProfile
        }
      ),
      /* @__PURE__ */ jsxs(Card, { className: "flex h-full flex-col rounded-2xl border-border/60 p-6 shadow-soft lg:col-span-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-medium", children: [
          /* @__PURE__ */ jsx(Bell, { className: "h-4 w-4 text-primary" }),
          " Notifications"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: "Control in-app alerts and follow-up reminders. Changes apply on this device immediately." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-3 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsx(
            SettingRow,
            {
              icon: /* @__PURE__ */ jsx(Bell, { className: "h-4 w-4" }),
              title: "Sync alerts",
              description: "Toast when contacts save or fail to sync",
              checked: profile.notificationsEnabled,
              onCheckedChange: (v) => persistToggle(
                "notificationsEnabled",
                v,
                v ? "Sync alerts on." : "Sync alerts off."
              )
            }
          ),
          /* @__PURE__ */ jsx(
            SettingRow,
            {
              icon: /* @__PURE__ */ jsx(Inbox, { className: "h-4 w-4" }),
              title: "Queue updates",
              description: "Notify when items are added or cleared from the sync queue",
              checked: profile.queueNotificationsEnabled,
              onCheckedChange: (v) => persistToggle(
                "queueNotificationsEnabled",
                v,
                v ? "Queue notifications on." : "Queue notifications off."
              )
            }
          ),
          /* @__PURE__ */ jsx(
            SettingRow,
            {
              icon: /* @__PURE__ */ jsx(ScanLine, { className: "h-4 w-4" }),
              title: "Capture complete",
              description: "Alert when OCR finishes on the Capture page",
              checked: profile.captureNotificationsEnabled,
              onCheckedChange: (v) => persistToggle(
                "captureNotificationsEnabled",
                v,
                v ? "Capture notifications on." : "Capture notifications off."
              )
            }
          ),
          /* @__PURE__ */ jsx(
            SettingRow,
            {
              icon: /* @__PURE__ */ jsx(Mail, { className: "h-4 w-4" }),
              title: "Email follow-ups",
              description: "Remind you to send email after saving a contact (when available)",
              checked: profile.emailNotificationsEnabled,
              onCheckedChange: (v) => persistToggle(
                "emailNotificationsEnabled",
                v,
                v ? "Email reminders on." : "Email reminders off."
              )
            }
          ),
          /* @__PURE__ */ jsx(
            SettingRow,
            {
              icon: /* @__PURE__ */ jsx(MessageCircle, { className: "h-4 w-4" }),
              title: "Auto thank-you on WhatsApp",
              description: "Send an approved template to the contact's phone when you save or sync (requires a phone on the card)",
              checked: profile.whatsappNotificationsEnabled,
              onCheckedChange: (v) => persistToggle(
                "whatsappNotificationsEnabled",
                v,
                v ? "WhatsApp auto-send on." : "WhatsApp auto-send off."
              )
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "flex h-full flex-col rounded-2xl border-border/60 p-6 shadow-soft", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-medium", children: [
          /* @__PURE__ */ jsx(ScanLine, { className: "h-4 w-4 text-primary" }),
          " Capture & workflow"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-5 space-y-3", children: [
          /* @__PURE__ */ jsx(
            SettingRow,
            {
              title: "Capture tips",
              description: "Show rotating guidance on the Capture page",
              checked: profile.showCaptureTips,
              onCheckedChange: (v) => persistToggle("showCaptureTips", v, v ? "Capture tips enabled." : "Capture tips hidden.")
            }
          ),
          /* @__PURE__ */ jsx(
            SettingRow,
            {
              title: "Prefer offline capture",
              description: "Queue new cards locally until you choose to save them (when online)",
              checked: profile.preferOfflineCapture,
              onCheckedChange: (v) => {
                persistToggle(
                  "preferOfflineCapture",
                  v,
                  v ? "Offline capture preferred." : "Online capture preferred."
                );
                applyWorkModePreference(v);
              }
            }
          ),
          /* @__PURE__ */ jsx(
            SettingRow,
            {
              icon: /* @__PURE__ */ jsx(Wifi, { className: "h-4 w-4" }),
              title: "Auto-sync to Zoho CRM when online",
              description: "When back online, sync the offline queue to Zoho CRM and send email follow-ups",
              checked: profile.autoSyncToZohoWhenOnline,
              onCheckedChange: (v) => {
                persistToggle(
                  "autoSyncToZohoWhenOnline",
                  v,
                  v ? "Auto-sync to Zoho enabled." : "Auto-sync to Zoho disabled."
                );
                if (v && typeof navigator !== "undefined" && navigator.onLine) {
                  void import("./router-CgoztCPx.js").then((n) => n.ad).then(
                    ({ maybeAutoSyncToZohoWhenOnline }) => maybeAutoSyncToZohoWhenOnline().then((summary) => {
                      if (summary.ran && summary.queueSynced + summary.contactsSynced > 0) {
                        toast.success("Pending contacts synced to Zoho CRM.");
                        window.dispatchEvent(new CustomEvent("cs-contacts-updated"));
                        window.dispatchEvent(new CustomEvent("cs-queue-updated"));
                      }
                    })
                  );
                }
              }
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "flex h-full flex-col rounded-2xl border-border/60 p-6 shadow-soft", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-medium", children: [
          /* @__PURE__ */ jsx(Shield, { className: "h-4 w-4 text-primary" }),
          " Legal & cookies"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: "Terms and privacy open as public pages on this site (suitable for Meta and business verification). Cookie preferences are managed below." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-5 space-y-3", children: [
          /* @__PURE__ */ jsx(
            SettingRow,
            {
              icon: /* @__PURE__ */ jsx(Cookie, { className: "h-4 w-4" }),
              title: "Essential cookies",
              description: "Required for navigation and sidebar state — always active",
              checked: true,
              disabled: true
            }
          ),
          /* @__PURE__ */ jsx(
            SettingRow,
            {
              icon: /* @__PURE__ */ jsx(Cookie, { className: "h-4 w-4" }),
              title: "Analytics cookies",
              description: "Optional local usage insights to improve the product",
              checked: profile.analyticsCookiesEnabled,
              onCheckedChange: (v) => persistCookieChoice(v)
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-5 flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", className: "rounded-xl", asChild: true, children: /* @__PURE__ */ jsxs(
            "a",
            {
              href: LEGAL_PAGE_URLS.terms,
              target: "_blank",
              rel: "noopener noreferrer",
              children: [
                /* @__PURE__ */ jsx(Scale, { className: "mr-2 h-4 w-4" }),
                "Terms",
                /* @__PURE__ */ jsx(ExternalLink, { className: "ml-1 h-3.5 w-3.5 opacity-60" })
              ]
            }
          ) }),
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", className: "rounded-xl", asChild: true, children: /* @__PURE__ */ jsxs(
            "a",
            {
              href: LEGAL_PAGE_URLS.privacy,
              target: "_blank",
              rel: "noopener noreferrer",
              children: [
                /* @__PURE__ */ jsx(FileText, { className: "mr-2 h-4 w-4" }),
                "Privacy",
                /* @__PURE__ */ jsx(ExternalLink, { className: "ml-1 h-3.5 w-3.5 opacity-60" })
              ]
            }
          ) }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              className: "rounded-xl",
              onClick: () => setCookiesOpen(true),
              children: [
                /* @__PURE__ */ jsx(Cookie, { className: "mr-2 h-4 w-4" }),
                "Cookies"
              ]
            }
          )
        ] }),
        !profile.cookiesAccepted ? /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs text-amber-600 dark:text-amber-400", children: "Cookie consent pending — use the cookie icon at the bottom-right or enable analytics above." }) : null
      ] }),
      /* @__PURE__ */ jsx(Card, { className: "rounded-2xl border-destructive/20 bg-destructive/5 p-6 shadow-soft lg:col-span-2", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-medium text-destructive", children: [
            /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }),
            "Danger zone"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: "Irreversible actions affecting data on this device." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex w-full flex-col gap-2 sm:mt-0 sm:w-auto sm:flex-row", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              className: "w-full rounded-xl sm:w-auto",
              onClick: handleClearQueue,
              disabled: isClearingQueue || isWiping,
              children: [
                isClearingQueue ? /* @__PURE__ */ jsx(Loader2, { className: "mr-1.5 h-3 w-3 animate-spin" }) : null,
                "Clear local queue"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "destructive",
              className: "w-full rounded-xl sm:w-auto",
              onClick: handleWipeAll,
              disabled: isWiping || isClearingQueue,
              children: [
                isWiping ? /* @__PURE__ */ jsx(Loader2, { className: "mr-1.5 h-3 w-3 animate-spin" }) : /* @__PURE__ */ jsx(Trash2, { className: "mr-1.5 h-3 w-3" }),
                "Delete all data"
              ]
            }
          )
        ] })
      ] }) })
    ] })
  ] });
}
const SplitComponent = SettingsPage;
export {
  SplitComponent as component
};
