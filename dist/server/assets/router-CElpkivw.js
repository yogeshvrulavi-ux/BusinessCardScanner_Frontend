import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { HeadContent, Scripts, useNavigate, useRouterState, Link, useRouteContext, useRouter, Outlet, createRootRouteWithContext, createFileRoute, lazyRouteComponent, redirect, createRouter } from "@tanstack/react-router";
import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import { createAuthClient } from "@neondatabase/neon-js/auth";
import { BetterAuthReactAdapter } from "@neondatabase/neon-js/auth/react";
import { Toaster as Toaster$1, toast } from "sonner";
import * as React from "react";
import { useEffect, useState, useRef, useCallback, useId, useMemo, useContext, createContext } from "react";
import { Loader2, X, PanelLeft, Menu, LayoutDashboard, ScanLine, Users, FolderKanban, Inbox, BarChart3, Settings, Search, ChevronRight, Check, Circle, UserCircle2, LogOut, WifiOff, Cookie, ArrowLeft } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { openDB } from "idb";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { z } from "zod";
const appCss = "/assets/global-BmCchgrn.css";
function RootDocument({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
const isAuthEnabled = Boolean("https://ep-dry-dew-atry9zbz.neonauth.c-9.us-east-1.aws.neon.tech/neondb/auth"?.trim());
const neonAuthUrl = "https://ep-dry-dew-atry9zbz.neonauth.c-9.us-east-1.aws.neon.tech/neondb/auth"?.trim() ?? "";
function getNeonAuthUrlIssue(url) {
  const trimmed = url.trim();
  if (!trimmed) return "VITE_NEON_AUTH_URL is not set.";
  if (!trimmed.includes("neonauth") && trimmed.includes(".neon.tech")) {
    return "VITE_NEON_AUTH_URL looks like a database host. Use the Auth URL from Neon Console → Auth (hostname contains neonauth, ends with /neondb/auth).";
  }
  if (!trimmed.endsWith("/auth")) {
    return "VITE_NEON_AUTH_URL should end with /auth (e.g. …/neondb/auth).";
  }
  return null;
}
const neonAuthConfigIssue = getNeonAuthUrlIssue("https://ep-dry-dew-atry9zbz.neonauth.c-9.us-east-1.aws.neon.tech/neondb/auth");
const authClient = createAuthClient(
  neonAuthUrl || "http://localhost:0/auth-disabled",
  { adapter: BetterAuthReactAdapter() }
);
const Toaster = ({ ...props }) => {
  return /* @__PURE__ */ jsx(
    Toaster$1,
    {
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
const CONNECTION_MODE_CHANGED = "cs-connection-mode-changed";
const STORAGE_KEY$2 = "cs-connection-mode";
function getConnectionMode() {
  if (typeof window === "undefined") return "online";
  if (!navigator.onLine) return "offline";
  return localStorage.getItem(STORAGE_KEY$2) === "offline" ? "offline" : "online";
}
function isOfflineMode() {
  return getConnectionMode() === "offline";
}
function setConnectionMode(mode) {
  if (typeof window === "undefined") return "online";
  const effective = !navigator.onLine ? "offline" : mode;
  localStorage.setItem(STORAGE_KEY$2, effective);
  window.dispatchEvent(new CustomEvent(CONNECTION_MODE_CHANGED, { detail: effective }));
  return effective;
}
function syncConnectionModeWithNetwork() {
  if (typeof window === "undefined") return "online";
  const mode = navigator.onLine ? "online" : "offline";
  localStorage.setItem(STORAGE_KEY$2, mode);
  window.dispatchEvent(new CustomEvent(CONNECTION_MODE_CHANGED, { detail: mode }));
  return mode;
}
const STORAGE_KEY$1 = "cs-user-settings";
const WHATSAPP_ENABLE_MIGRATION_KEY = "cs-whatsapp-enabled-v3";
const TIMEZONE_OPTIONS = [
  "Pacific Time (US)",
  "Mountain Time (US)",
  "Central Time (US)",
  "Eastern Time (US)",
  "GMT / UTC",
  "Central European Time",
  "India Standard Time",
  "Singapore Time",
  "Japan Standard Time"
];
const DEFAULT_USER_SETTINGS = {
  fullName: "",
  email: "",
  phone: "",
  company: "CardSync AI",
  role: "Workspace owner",
  timezone: "India Standard Time",
  notificationsEnabled: true,
  queueNotificationsEnabled: true,
  captureNotificationsEnabled: true,
  emailNotificationsEnabled: true,
  whatsappNotificationsEnabled: true,
  cookiesAccepted: false,
  analyticsCookiesEnabled: false,
  autoSyncQueueWhenOnline: true,
  autoSyncToZohoWhenOnline: true,
  showCaptureTips: true,
  confirmBeforeDelete: true,
  preferOfflineCapture: false
};
function loadUserSettings() {
  if (typeof window === "undefined") {
    return { ...DEFAULT_USER_SETTINGS };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY$1);
    if (!raw) return { ...DEFAULT_USER_SETTINGS };
    const parsed = JSON.parse(raw);
    const autoSyncToZohoWhenOnline = parsed.autoSyncToZohoWhenOnline ?? parsed.autoSyncQueueWhenOnline ?? DEFAULT_USER_SETTINGS.autoSyncToZohoWhenOnline;
    const needsWhatsappMigration = !localStorage.getItem(WHATSAPP_ENABLE_MIGRATION_KEY);
    const whatsappNotificationsEnabled = needsWhatsappMigration ? true : parsed.whatsappNotificationsEnabled !== false;
    if (needsWhatsappMigration) {
      localStorage.setItem(WHATSAPP_ENABLE_MIGRATION_KEY, "1");
    }
    const merged = {
      ...DEFAULT_USER_SETTINGS,
      ...parsed,
      autoSyncToZohoWhenOnline,
      autoSyncQueueWhenOnline: autoSyncToZohoWhenOnline,
      whatsappNotificationsEnabled
    };
    if (needsWhatsappMigration) {
      localStorage.setItem(STORAGE_KEY$1, JSON.stringify(merged));
    }
    return merged;
  } catch {
    return { ...DEFAULT_USER_SETTINGS };
  }
}
function saveUserSettings(settings) {
  const next = { ...loadUserSettings(), ...settings };
  if (settings.autoSyncToZohoWhenOnline !== void 0) {
    next.autoSyncQueueWhenOnline = settings.autoSyncToZohoWhenOnline;
  }
  if (settings.autoSyncQueueWhenOnline !== void 0 && settings.autoSyncToZohoWhenOnline === void 0) {
    next.autoSyncToZohoWhenOnline = settings.autoSyncQueueWhenOnline;
  }
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY$1, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("cs-settings-updated", { detail: next }));
  }
  return next;
}
function applyWorkModePreference(preferOffline) {
  if (typeof window === "undefined" || !navigator.onLine) return;
  setConnectionMode(preferOffline ? "offline" : "online");
}
function getUserInitials(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("");
}
function getUserFirstName(fullName) {
  const first = fullName.trim().split(/\s+/).filter(Boolean)[0];
  return first || "User";
}
const LEGACY_PLACEHOLDER_EMAILS = /* @__PURE__ */ new Set([
  "yogeshvanaparthi@gmail.com",
  "alex@cardsync.ai",
  "yogi2324@gmail.com"
]);
const LEGACY_PLACEHOLDER_NAMES = /* @__PURE__ */ new Set(["Yogesh VR", "Yogesh Vanaparti", "Alex Kim"]);
function syncProfileFromAuthUser(user) {
  const email = user.email?.trim();
  const name = user.name?.trim();
  const phone = user.phone?.trim();
  if (!email && !name && !phone) return;
  const current = loadUserSettings();
  const updates = {};
  const storedEmail = current.email?.trim().toLowerCase() || "";
  const defaultEmail = DEFAULT_USER_SETTINGS.email.trim().toLowerCase();
  if (email && (!storedEmail || storedEmail === defaultEmail || LEGACY_PLACEHOLDER_EMAILS.has(storedEmail))) {
    updates.email = email;
  }
  const storedName = current.fullName?.trim() || "";
  if (name && (!storedName || storedName === DEFAULT_USER_SETTINGS.fullName.trim() || LEGACY_PLACEHOLDER_NAMES.has(storedName))) {
    updates.fullName = name;
  }
  const storedPhone = current.phone?.trim() || "";
  if (phone && !storedPhone) {
    updates.phone = phone;
  }
  if (Object.keys(updates).length > 0) {
    saveUserSettings(updates);
  }
}
function resolvePostAuthPath() {
  if (typeof window === "undefined") return "/scan";
  const redirectTo = new URLSearchParams(window.location.search).get("redirectTo");
  if (redirectTo?.startsWith("/") && !redirectTo.startsWith("/auth")) {
    return redirectTo;
  }
  return "/scan";
}
function AuthGate({ children }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const searchStr = useRouterState({ select: (state) => state.location.searchStr });
  const { data: session, isPending } = authClient.useSession();
  useEffect(() => {
    if (session?.user) {
      syncProfileFromAuthUser(session.user);
    }
  }, [session?.user?.email, session?.user?.name]);
  useEffect(() => {
    if (isPending || session?.user) return;
    const redirectTo = `${pathname}${searchStr}`;
    navigate({
      to: "/auth/$pathname",
      params: { pathname: "sign-in" },
      search: { redirectTo },
      replace: true
    });
  }, [isPending, session?.user, pathname, searchStr, navigate]);
  if (isPending) {
    return /* @__PURE__ */ jsx("div", { className: "flex min-h-svh items-center justify-center bg-background", children: /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary", "aria-label": "Loading session" }) });
  }
  if (!session?.user) {
    return null;
  }
  return /* @__PURE__ */ jsx(Fragment, { children });
}
const MOBILE_BREAKPOINT = 768;
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(void 0);
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return !!isMobile;
}
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsx(Comp, { className: cn(buttonVariants({ variant, size, className })), ref, ...props });
  }
);
Button.displayName = "Button";
const Input = React.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "input",
      {
        type,
        className: cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";
const Separator = React.forwardRef(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ jsx(
  SeparatorPrimitive.Root,
  {
    ref,
    decorative,
    orientation,
    className: cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      className
    ),
    ...props
  }
));
Separator.displayName = SeparatorPrimitive.Root.displayName;
const Sheet = SheetPrimitive.Root;
const SheetPortal = SheetPrimitive.Portal;
const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Overlay,
  {
    className: cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props,
    ref
  }
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;
const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
      }
    },
    defaultVariants: {
      side: "right"
    }
  }
);
const SheetContent = React.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ jsxs(SheetPortal, { children: [
  /* @__PURE__ */ jsx(SheetOverlay, {}),
  /* @__PURE__ */ jsxs(SheetPrimitive.Content, { ref, className: cn(sheetVariants({ side }), className), ...props, children: [
    /* @__PURE__ */ jsxs(SheetPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary", children: [
      /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
    ] }),
    children
  ] })
] }));
SheetContent.displayName = SheetPrimitive.Content.displayName;
const SheetHeader = ({ className, ...props }) => /* @__PURE__ */ jsx("div", { className: cn("flex flex-col space-y-2 text-center sm:text-left", className), ...props });
SheetHeader.displayName = "SheetHeader";
const SheetTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold text-foreground", className),
    ...props
  }
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;
const SheetDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;
function Skeleton({ className, ...props }) {
  return /* @__PURE__ */ jsx("div", { className: cn("animate-pulse rounded-md bg-primary/10", className), ...props });
}
const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(TooltipPrimitive.Portal, { children: /* @__PURE__ */ jsx(
  TooltipPrimitive.Content,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-tooltip-content-transform-origin)",
      className
    ),
    ...props
  }
) }));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;
const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";
const SidebarContext = React.createContext(null);
function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}
const SidebarProvider = React.forwardRef(
  ({
    defaultOpen = true,
    open: openProp,
    onOpenChange: setOpenProp,
    className,
    style,
    children,
    ...props
  }, ref) => {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;
    const setOpen = React.useCallback(
      (value) => {
        const openState = typeof value === "function" ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(openState);
        } else {
          _setOpen(openState);
        }
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      },
      [setOpenProp, open]
    );
    const toggleSidebar = React.useCallback(() => {
      return isMobile ? setOpenMobile((open2) => !open2) : setOpen((open2) => !open2);
    }, [isMobile, setOpen, setOpenMobile]);
    React.useEffect(() => {
      const handleKeyDown = (event) => {
        if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          toggleSidebar();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleSidebar]);
    const state = open ? "expanded" : "collapsed";
    const contextValue = React.useMemo(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    );
    return /* @__PURE__ */ jsx(SidebarContext.Provider, { value: contextValue, children: /* @__PURE__ */ jsx(TooltipProvider, { delayDuration: 0, children: /* @__PURE__ */ jsx(
      "div",
      {
        style: {
          "--sidebar-width": SIDEBAR_WIDTH,
          "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
          ...style
        },
        className: cn(
          "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
          className
        ),
        ref,
        ...props,
        children
      }
    ) }) });
  }
);
SidebarProvider.displayName = "SidebarProvider";
const Sidebar = React.forwardRef(
  ({
    side = "left",
    variant = "sidebar",
    collapsible = "offcanvas",
    className,
    children,
    ...props
  }, ref) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
    if (collapsible === "none") {
      return /* @__PURE__ */ jsx(
        "div",
        {
          className: cn(
            "flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground",
            className
          ),
          ref,
          ...props,
          children
        }
      );
    }
    if (isMobile) {
      return /* @__PURE__ */ jsx(Sheet, { open: openMobile, onOpenChange: setOpenMobile, ...props, children: /* @__PURE__ */ jsxs(
        SheetContent,
        {
          "data-sidebar": "sidebar",
          "data-mobile": "true",
          className: "w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden",
          style: {
            "--sidebar-width": SIDEBAR_WIDTH_MOBILE
          },
          side,
          children: [
            /* @__PURE__ */ jsxs(SheetHeader, { className: "sr-only", children: [
              /* @__PURE__ */ jsx(SheetTitle, { children: "Sidebar" }),
              /* @__PURE__ */ jsx(SheetDescription, { children: "Displays the mobile sidebar." })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex h-full w-full flex-col", children })
          ]
        }
      ) });
    }
    return /* @__PURE__ */ jsxs(
      "div",
      {
        ref,
        className: "group peer hidden text-sidebar-foreground md:block",
        "data-state": state,
        "data-collapsible": state === "collapsed" ? collapsible : "",
        "data-variant": variant,
        "data-side": side,
        children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: cn(
                "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
                "group-data-[collapsible=offcanvas]:w-0",
                "group-data-[side=right]:rotate-180",
                variant === "floating" || variant === "inset" ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]" : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)"
              )
            }
          ),
          /* @__PURE__ */ jsx(
            "div",
            {
              className: cn(
                "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
                side === "left" ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]" : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
                // Adjust the padding for floating and inset variants.
                variant === "floating" || variant === "inset" ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]" : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
                className
              ),
              ...props,
              children: /* @__PURE__ */ jsx(
                "div",
                {
                  "data-sidebar": "sidebar",
                  className: "flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow",
                  children
                }
              )
            }
          )
        ]
      }
    );
  }
);
Sidebar.displayName = "Sidebar";
const SidebarTrigger = React.forwardRef(({ className, onClick, icon = "menu", ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  const Icon = icon === "panel" ? PanelLeft : Menu;
  return /* @__PURE__ */ jsxs(
    Button,
    {
      ref,
      "data-sidebar": "trigger",
      variant: "ghost",
      size: "icon",
      className: cn("h-7 w-7", className),
      onClick: (event) => {
        onClick?.(event);
        toggleSidebar();
      },
      ...props,
      children: [
        /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Toggle Sidebar" })
      ]
    }
  );
});
SidebarTrigger.displayName = "SidebarTrigger";
const SidebarRail = React.forwardRef(
  ({ className, ...props }, ref) => {
    const { toggleSidebar } = useSidebar();
    return /* @__PURE__ */ jsx(
      "button",
      {
        ref,
        "data-sidebar": "rail",
        "aria-label": "Toggle Sidebar",
        tabIndex: -1,
        onClick: toggleSidebar,
        title: "Toggle Sidebar",
        className: cn(
          "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
          "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
          "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
          "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar",
          "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
          "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
          className
        ),
        ...props
      }
    );
  }
);
SidebarRail.displayName = "SidebarRail";
const SidebarInset = React.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "main",
      {
        ref,
        className: cn(
          "relative flex w-full flex-1 flex-col bg-background",
          "md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
          className
        ),
        ...props
      }
    );
  }
);
SidebarInset.displayName = "SidebarInset";
const SidebarInput = React.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx(
    Input,
    {
      ref,
      "data-sidebar": "input",
      className: cn(
        "h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        className
      ),
      ...props
    }
  );
});
SidebarInput.displayName = "SidebarInput";
const SidebarHeader = React.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "div",
      {
        ref,
        "data-sidebar": "header",
        className: cn("flex flex-col gap-2 p-2", className),
        ...props
      }
    );
  }
);
SidebarHeader.displayName = "SidebarHeader";
const SidebarFooter = React.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "div",
      {
        ref,
        "data-sidebar": "footer",
        className: cn("flex flex-col gap-2 p-2", className),
        ...props
      }
    );
  }
);
SidebarFooter.displayName = "SidebarFooter";
const SidebarSeparator = React.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx(
    Separator,
    {
      ref,
      "data-sidebar": "separator",
      className: cn("mx-2 w-auto bg-sidebar-border", className),
      ...props
    }
  );
});
SidebarSeparator.displayName = "SidebarSeparator";
const SidebarContent = React.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "div",
      {
        ref,
        "data-sidebar": "content",
        className: cn(
          "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
          className
        ),
        ...props
      }
    );
  }
);
SidebarContent.displayName = "SidebarContent";
const SidebarGroup = React.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "div",
      {
        ref,
        "data-sidebar": "group",
        className: cn("relative flex w-full min-w-0 flex-col p-2", className),
        ...props
      }
    );
  }
);
SidebarGroup.displayName = "SidebarGroup";
const SidebarGroupLabel = React.forwardRef(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";
  return /* @__PURE__ */ jsx(
    Comp,
    {
      ref,
      "data-sidebar": "group-label",
      className: cn(
        "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      ),
      ...props
    }
  );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";
const SidebarGroupAction = React.forwardRef(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return /* @__PURE__ */ jsx(
    Comp,
    {
      ref,
      "data-sidebar": "group-action",
      className: cn(
        "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring cursor-pointer transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "group-data-[collapsible=icon]:hidden",
        className
      ),
      ...props
    }
  );
});
SidebarGroupAction.displayName = "SidebarGroupAction";
const SidebarGroupContent = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      "data-sidebar": "group-content",
      className: cn("w-full text-sm", className),
      ...props
    }
  )
);
SidebarGroupContent.displayName = "SidebarGroupContent";
const SidebarMenu = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "ul",
    {
      ref,
      "data-sidebar": "menu",
      className: cn("flex w-full min-w-0 flex-col gap-1", className),
      ...props
    }
  )
);
SidebarMenu.displayName = "SidebarMenu";
const SidebarMenuItem = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "li",
    {
      ref,
      "data-sidebar": "menu-item",
      className: cn("group/menu-item relative", className),
      ...props
    }
  )
);
SidebarMenuItem.displayName = "SidebarMenuItem";
const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-[0.5rem] p-2 text-left text-sm outline-none ring-sidebar-ring cursor-pointer transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:rounded-[0.5rem] data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline: "bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)]"
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const SidebarMenuButton = React.forwardRef(
  ({
    asChild = false,
    isActive = false,
    variant = "default",
    size = "default",
    tooltip,
    className,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    const { isMobile, state } = useSidebar();
    const button = /* @__PURE__ */ jsx(
      Comp,
      {
        ref,
        "data-sidebar": "menu-button",
        "data-size": size,
        "data-active": isActive,
        className: cn(sidebarMenuButtonVariants({ variant, size }), className),
        ...props
      }
    );
    if (!tooltip) {
      return button;
    }
    if (typeof tooltip === "string") {
      tooltip = {
        children: tooltip
      };
    }
    return /* @__PURE__ */ jsxs(Tooltip, { children: [
      /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: button }),
      /* @__PURE__ */ jsx(
        TooltipContent,
        {
          side: "right",
          align: "center",
          hidden: state !== "collapsed" || isMobile,
          ...tooltip
        }
      )
    ] });
  }
);
SidebarMenuButton.displayName = "SidebarMenuButton";
const SidebarMenuAction = React.forwardRef(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return /* @__PURE__ */ jsx(
    Comp,
    {
      ref,
      "data-sidebar": "menu-action",
      className: cn(
        "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring cursor-pointer transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover && "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        className
      ),
      ...props
    }
  );
});
SidebarMenuAction.displayName = "SidebarMenuAction";
const SidebarMenuBadge = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      "data-sidebar": "menu-badge",
      className: cn(
        "pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground",
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        className
      ),
      ...props
    }
  )
);
SidebarMenuBadge.displayName = "SidebarMenuBadge";
const SidebarMenuSkeleton = React.forwardRef(({ className, showIcon = false, ...props }, ref) => {
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref,
      "data-sidebar": "menu-skeleton",
      className: cn("flex h-8 items-center gap-2 rounded-md px-2", className),
      ...props,
      children: [
        showIcon && /* @__PURE__ */ jsx(Skeleton, { className: "size-4 rounded-md", "data-sidebar": "menu-skeleton-icon" }),
        /* @__PURE__ */ jsx(
          Skeleton,
          {
            className: "h-4 max-w-(--skeleton-width) flex-1",
            "data-sidebar": "menu-skeleton-text",
            style: {
              "--skeleton-width": width
            }
          }
        )
      ]
    }
  );
});
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";
const SidebarMenuSub = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "ul",
    {
      ref,
      "data-sidebar": "menu-sub",
      className: cn(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
        "group-data-[collapsible=icon]:hidden",
        className
      ),
      ...props
    }
  )
);
SidebarMenuSub.displayName = "SidebarMenuSub";
const SidebarMenuSubItem = React.forwardRef(
  ({ ...props }, ref) => /* @__PURE__ */ jsx("li", { ref, ...props })
);
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";
const SidebarMenuSubButton = React.forwardRef(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";
  return /* @__PURE__ */ jsx(
    Comp,
    {
      ref,
      "data-sidebar": "menu-sub-button",
      "data-size": size,
      "data-active": isActive,
      className: cn(
        "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-[0.5rem] px-2 text-sidebar-foreground outline-none ring-sidebar-ring cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
        "data-[active=true]:rounded-[0.5rem] data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
      ),
      ...props
    }
  );
});
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";
const LOGO_SRC = "/logo.png";
const sizeClasses = {
  xs: "h-8 w-8",
  sm: "h-9 w-9",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16"
};
function AppLogo({
  size = "sm",
  className,
  imageClassName,
  alt = "CardScan"
}) {
  return /* @__PURE__ */ jsx("div", { className: cn("shrink-0", className), children: /* @__PURE__ */ jsx(
    "img",
    {
      src: LOGO_SRC,
      alt,
      className: cn("object-contain", sizeClasses[size], imageClassName)
    }
  ) });
}
const NAV_SECTION_LABEL = "Menu";
const NAV = {
  capture: { label: "Capture a card", path: "/scan" },
  contacts: { label: "Contacts List", path: "/contacts" },
  events: { label: "Events", path: "/events" },
  syncQueue: { label: "Offline Queue System", path: "/queue" },
  preferences: { label: "Settings & Preferences", path: "/settings" }
};
const PAGE = {
  capture: {
    title: "Capture a card",
    description: "Upload or photograph a business card. On-device OCR extracts contact details in seconds."
  },
  contacts: {
    title: "Contact Lists",
    description: "Search, filter, and manage every lead saved on this device."
  },
  events: {
    title: "Events",
    description: "Open an event folder to see leads and sync stats for that event."
  },
  syncQueue: {
    title: "Sync queue",
    description: "Review cards awaiting save. Offline captures are held here until you are back online."
  },
  preferences: {
    title: "Preferences",
    description: "Profile, notifications, legal policies, cookies, and device data."
  }
};
const sidebarItems = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: NAV.capture.label, url: NAV.capture.path, icon: ScanLine },
  { title: NAV.contacts.label, url: NAV.contacts.path, icon: Users },
  { title: NAV.events.label, url: NAV.events.path, icon: FolderKanban },
  { title: NAV.syncQueue.label, url: NAV.syncQueue.path, icon: Inbox },
  { title: "Insights", url: "/analytics", icon: BarChart3 },
  { title: NAV.preferences.label, url: NAV.preferences.path, icon: Settings }
];
const items = sidebarItems.filter(
  (item) => ["/scan", "/contacts", "/events", "/queue", "/settings"].includes(item.url)
);
function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url) => {
    if (url === "/scan") {
      return path === "/scan" || path === "/" || path.startsWith("/review");
    }
    return path.startsWith(url);
  };
  return /* @__PURE__ */ jsxs(Sidebar, { collapsible: "icon", className: "border-r border-border/60", children: [
    /* @__PURE__ */ jsx(SidebarHeader, { className: "px-3 pt-4", children: /* @__PURE__ */ jsxs(Link, { to: "/scan", className: "flex items-center gap-2.5 px-2 py-1.5", children: [
      /* @__PURE__ */ jsx(AppLogo, { size: collapsed ? "sm" : "md" }),
      !collapsed && /* @__PURE__ */ jsxs("div", { className: "leading-tight", children: [
        /* @__PURE__ */ jsx("div", { className: "font-display text-[15px] font-semibold tracking-tight", children: "CardScan" }),
        /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground", children: "Scan · Detect · Extract" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(SidebarContent, { className: "px-2", children: /* @__PURE__ */ jsxs(SidebarGroup, { children: [
      /* @__PURE__ */ jsx(SidebarGroupLabel, { className: "text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80", children: NAV_SECTION_LABEL }),
      /* @__PURE__ */ jsx(SidebarGroupContent, { children: /* @__PURE__ */ jsx(SidebarMenu, { children: items.map((item) => {
        const active = isActive(item.url);
        return /* @__PURE__ */ jsx(SidebarMenuItem, { children: /* @__PURE__ */ jsx(
          SidebarMenuButton,
          {
            asChild: true,
            isActive: active,
            className: "h-10 rounded-[0.5rem] data-[active=true]:rounded-[0.5rem] data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[active=true]:font-medium",
            children: /* @__PURE__ */ jsxs(Link, { to: item.url, className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(item.icon, { className: "h-4 w-4" }),
              !collapsed && /* @__PURE__ */ jsx("span", { className: "text-sm font-medium tracking-tight", children: item.title })
            ] })
          }
        ) }, item.title);
      }) }) })
    ] }) })
  ] });
}
let cachedToken = null;
let cachedExpiresAt = 0;
async function getAuthBearerToken(forceRefresh = false) {
  if (!isAuthEnabled) return null;
  const now = Date.now();
  if (!forceRefresh && cachedToken && cachedExpiresAt > now + 6e4) {
    return cachedToken;
  }
  try {
    const tokenResult = await authClient.token(
      forceRefresh ? { fetchOptions: { headers: { "X-Force-Fetch": "true" } } } : void 0
    );
    const jwt = tokenResult.data?.token;
    if (jwt) {
      cachedToken = jwt;
      cachedExpiresAt = now + 14 * 6e4;
      return jwt;
    }
    const sessionResult = await authClient.getSession({
      query: { disableRefresh: false }
    });
    const sessionToken = sessionResult.data?.session?.token;
    const expiresAt = sessionResult.data?.session?.expiresAt;
    if (sessionToken) {
      cachedToken = sessionToken;
      cachedExpiresAt = expiresAt ? new Date(expiresAt).getTime() : now + 36e5;
      return sessionToken;
    }
  } catch {
  }
  cachedToken = null;
  cachedExpiresAt = 0;
  return null;
}
function clearAuthTokenCache() {
  cachedToken = null;
  cachedExpiresAt = 0;
}
async function apiFetch(input, init) {
  const headers = new Headers(init?.headers);
  const token = await getAuthBearerToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  let response = await fetch(input, { ...init, headers });
  if (response.status === 401 && token) {
    const refreshed = await getAuthBearerToken(true);
    if (refreshed && refreshed !== token) {
      headers.set("Authorization", `Bearer ${refreshed}`);
      response = await fetch(input, { ...init, headers });
    }
  }
  return response;
}
function contactMatchKey(email, phone) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (normalizedEmail) {
    return `e:${normalizedEmail}`;
  }
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length >= 7) {
    return `p:${digits}`;
  }
  return "";
}
function buildZohoLeadLookup(leads) {
  const leadIds = /* @__PURE__ */ new Set();
  const contactKeys = /* @__PURE__ */ new Set();
  for (const lead of leads) {
    const id = String(lead.id || "").trim();
    if (id) {
      leadIds.add(id);
    }
    const key = contactMatchKey(lead.email, lead.phone);
    if (key) {
      contactKeys.add(key);
    }
  }
  return { leadIds, contactKeys };
}
function isDuplicateOfZohoLead(contact, lookup, options) {
  const zohoId = String(contact.zohoLeadId || "").trim();
  if (zohoId && lookup.leadIds.has(zohoId)) {
    return true;
  }
  const key = contactMatchKey(contact.email, contact.phone);
  if (key && lookup.contactKeys.has(key)) {
    return true;
  }
  if (options?.hideSyncedWhenOnline) {
    if (contact.syncStatus === "synced_zoho" || contact.status === "synced") {
      return true;
    }
  }
  return false;
}
const PRODUCTION_API_URL = "https://businessscannercardbackend.onrender.com";
function normalizeApiUrl(url) {
  return url.trim().replace(/\/+$/, "");
}
const configuredApiUrl = normalizeApiUrl("http://localhost:5000");
function resolveDefaultApiUrl() {
  if (configuredApiUrl) {
    return configuredApiUrl;
  }
  {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host.includes("onrender.com")) {
        return normalizeApiUrl(window.location.origin);
      }
    }
    return PRODUCTION_API_URL;
  }
}
const API_BASE_URL = resolveDefaultApiUrl();
function storageLabel(options) {
  const online = options?.online ?? false;
  return online ? "Zoho CRM" : "Offline queue (device)";
}
function getZohoLeadsUrl() {
  return `${API_BASE_URL}/api/leads`;
}
function getDeleteContactUrl(contactId, source) {
  return `${API_BASE_URL}/api/leads/${contactId}`;
}
function pickPrimaryEmail(payload) {
  const p = payload;
  return String(
    p.email || p.emailAddress || p.secondaryEmail || p.secondaryEmailAddress || ""
  ).trim();
}
function pickSecondaryEmail(payload) {
  const p = payload;
  const primary = pickPrimaryEmail(payload);
  const secondary = String(
    p.secondaryEmail || p.secondaryEmailAddress || ""
  ).trim();
  if (!secondary || secondary.toLowerCase() === primary.toLowerCase()) {
    return "";
  }
  return secondary;
}
function getCurrentAppUserSync() {
  const settings = loadUserSettings();
  const email = settings.email?.trim().toLowerCase() || "";
  const phone = settings.phone?.trim() || "";
  const fullName = settings.fullName?.trim() || "";
  if (!email && !phone && !fullName) return null;
  return { id: "", email, phone, fullName };
}
async function getCurrentAppUser() {
  const settings = loadUserSettings();
  let id = "";
  let email = settings.email?.trim().toLowerCase() || "";
  let phone = settings.phone?.trim() || "";
  let fullName = settings.fullName?.trim() || "";
  if (isAuthEnabled) {
    try {
      const session = await authClient.getSession();
      const user = session.data?.user;
      if (user) {
        id = String(user.id || "").trim();
        email = user.email?.trim().toLowerCase() || email;
        fullName = user.name?.trim() || fullName;
      }
    } catch {
    }
  }
  if (!id && !email && !phone) return null;
  return { id, email, phone, fullName };
}
function getUserScopeKeys(user) {
  if (!user) return ["anonymous"];
  const keys = [];
  if (user.email.trim()) keys.push(`email:${user.email.trim().toLowerCase()}`);
  if (user.id.trim()) keys.push(`id:${user.id.trim()}`);
  if (user.phone.trim()) keys.push(`phone:${user.phone.replace(/\D/g, "")}`);
  return keys.length ? keys : ["anonymous"];
}
function stampCapturedByFields(payload, user) {
  if (!user || !user.email && !user.id) return payload;
  return {
    ...payload,
    capturedByEmail: user.email || payload.capturedByEmail,
    capturedByUserId: user.id || payload.capturedByUserId,
    capturedByPhone: user.phone || payload.capturedByPhone,
    capturedByName: user.fullName || payload.capturedByName
  };
}
function contactBelongsToAppUser(record, user) {
  if (!isAuthEnabled || !user) return true;
  const data = record.contact_data ?? record;
  const capturedEmail = String(data.capturedByEmail || "").trim().toLowerCase();
  const capturedId = String(data.capturedByUserId || "").trim();
  const capturedPhone = String(data.capturedByPhone || "").replace(/\D/g, "");
  const userEmail = user.email.trim().toLowerCase();
  const userId = user.id.trim();
  const userPhone = user.phone.replace(/\D/g, "");
  if (!capturedEmail && !capturedId && !capturedPhone) return false;
  if (capturedEmail && userEmail && capturedEmail === userEmail) return true;
  if (capturedId && userId && capturedId === userId) return true;
  if (capturedPhone && userPhone && (capturedPhone === userPhone || capturedPhone.endsWith(userPhone) || userPhone.endsWith(capturedPhone))) {
    return true;
  }
  return false;
}
const DB_NAME = "cardsync-db";
const STORE_NAME = "sync_queue";
const CONTACTS_CACHE_STORE = "contacts_cache";
const DB_VERSION = 3;
function dispatchQueueUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cs-queue-updated"));
  }
}
async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(CONTACTS_CACHE_STORE)) {
        db.createObjectStore(CONTACTS_CACHE_STORE, { keyPath: "id" });
      }
    }
  });
}
async function addToQueue(item) {
  const db = await initDB();
  await db.put(STORE_NAME, item);
  dispatchQueueUpdate();
}
async function getQueueItems() {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}
async function updateQueueItem(item) {
  const db = await initDB();
  await db.put(STORE_NAME, item);
  dispatchQueueUpdate();
}
async function removeQueueItem(id) {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
  dispatchQueueUpdate();
}
async function cacheContacts(contacts) {
  try {
    const db = await initDB();
    const tx = db.transaction(CONTACTS_CACHE_STORE, "readwrite");
    const store = tx.objectStore(CONTACTS_CACHE_STORE);
    await store.clear();
    for (const contact of contacts) {
      await store.put(contact);
    }
    await tx.done;
  } catch {
  }
}
async function getCachedContacts() {
  try {
    const db = await initDB();
    return db.getAll(CONTACTS_CACHE_STORE);
  } catch {
    return [];
  }
}
async function clearUserSyncQueue(appUser) {
  const items2 = await getQueueItems();
  let removed = 0;
  for (const item of items2) {
    if (!contactBelongsToAppUser(item, appUser)) continue;
    await removeQueueItem(item.id);
    removed += 1;
  }
  return removed;
}
async function clearUserContactsCache(appUser) {
  const contacts = await getCachedContacts();
  let removed = 0;
  for (const contact of contacts) {
    if (!contactBelongsToAppUser(contact, appUser)) continue;
    await removeCachedContact(String(contact.id || ""));
    removed += 1;
  }
  return removed;
}
async function clearUserBrowserData(appUser) {
  const queueRemoved = await clearUserSyncQueue(appUser);
  const contactsRemoved = await clearUserContactsCache(appUser);
  return { queueRemoved, contactsRemoved };
}
async function removeCachedContact(id) {
  try {
    const db = await initDB();
    await db.delete(CONTACTS_CACHE_STORE, id);
    window.dispatchEvent(new CustomEvent("cs-contacts-updated"));
  } catch {
  }
}
function contactRecordFromPayload(payload, existingId, cardImageBase64) {
  const id = existingId || crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const fullName = String(payload.fullName || payload.name || "").trim();
  const syncStatus = String(payload.syncStatus || "local_only");
  const zohoLeadId = payload.zohoLeadId;
  const status = syncStatus === "synced_zoho" || syncStatus === "synced" || zohoLeadId ? "synced" : syncStatus === "failed" ? "failed" : "pending";
  return {
    id,
    name: fullName,
    fullName,
    firstName: String(payload.firstName || ""),
    lastName: String(payload.lastName || ""),
    designation: String(payload.designation || payload.title || ""),
    company: String(payload.company || ""),
    phone: String(payload.phone || ""),
    secondaryPhone: String(payload.secondaryPhone || ""),
    email: String(payload.email || ""),
    secondaryEmail: String(payload.secondaryEmail || ""),
    website: String(payload.website || ""),
    secondaryWebsite: String(payload.secondaryWebsite || ""),
    address: String(payload.address || ""),
    secondaryAddress: String(payload.secondaryAddress || ""),
    socialLinks: String(payload.socialLinks || ""),
    gstNumber: String(payload.gstNumber || ""),
    notes: String(payload.notes || ""),
    eventName: String(payload.eventName || ""),
    eventId: String(payload.eventId || ""),
    cardImageBase64: cardImageBase64 ?? payload.cardImageBase64,
    syncStatus,
    zohoLeadId: zohoLeadId ?? null,
    source: "indexeddb",
    status,
    created_at: String(payload.created_at || now),
    lastSync: status === "synced" ? "Saved on device" : "Pending",
    channels: {
      whatsapp: Boolean(payload.phone),
      email: Boolean(payload.email)
    },
    capturedByEmail: String(payload.capturedByEmail || ""),
    capturedByUserId: String(payload.capturedByUserId || ""),
    capturedByPhone: String(payload.capturedByPhone || ""),
    capturedByName: String(payload.capturedByName || "")
  };
}
async function updateStoredContact(contactId, payload) {
  const db = await initDB();
  const existing = await db.get(CONTACTS_CACHE_STORE, contactId);
  const record = contactRecordFromPayload(
    { ...existing || {}, ...payload },
    contactId,
    payload.cardImageBase64
  );
  if (existing?.created_at) {
    record.created_at = existing.created_at;
  }
  await db.put(CONTACTS_CACHE_STORE, record);
  window.dispatchEvent(new CustomEvent("cs-contacts-updated"));
}
async function listStoredContacts() {
  const contacts = await getCachedContacts();
  return contacts.sort(
    (a, b) => String(b.created_at || "").localeCompare(String(a.created_at || ""))
  );
}
async function getStoredContactById(contactId) {
  const db = await initDB();
  const contact = await db.get(CONTACTS_CACHE_STORE, contactId);
  return contact ?? null;
}
async function deleteStoredContact(contactId) {
  await removeCachedContact(contactId);
}
async function patchStoredContactSyncStatus(contactId, syncStatus, zohoLeadId) {
  const existing = await getStoredContactById(contactId);
  if (!existing) {
    throw new Error("Contact not found");
  }
  await updateStoredContact(contactId, {
    ...existing,
    syncStatus,
    zohoLeadId: zohoLeadId ?? existing.zohoLeadId
  });
}
const indexeddb = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addToQueue,
  cacheContacts,
  clearUserBrowserData,
  clearUserContactsCache,
  clearUserSyncQueue,
  deleteStoredContact,
  getCachedContacts,
  getQueueItems,
  getStoredContactById,
  initDB,
  listStoredContacts,
  patchStoredContactSyncStatus,
  removeCachedContact,
  removeQueueItem,
  updateQueueItem,
  updateStoredContact
}, Symbol.toStringTag, { value: "Module" }));
function parseApiErrorDetail(body, fallback) {
  if (!body || typeof body !== "object") {
    return fallback;
  }
  const detail = body.detail;
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }
  if (Array.isArray(detail)) {
    const parts = detail.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "msg" in item) {
        return String(item.msg);
      }
      return "";
    }).filter(Boolean);
    if (parts.length) return parts.join("; ");
  }
  const error = body.error;
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  return fallback;
}
function normalizeZohoSyncResult(data) {
  const emailError = data.email_error ?? null;
  const emailSent = data.email_sent === true || data.emailSent === true;
  const emailAttempted = data.email_attempted === true || data.emailAttempted === true || emailSent;
  const emailExtracted = data.email_extracted ?? data.email_to ?? null;
  const whatsappSent = data.whatsapp_sent === true || data.whatsappSent === true;
  const whatsappAttempted = data.whatsapp_attempted === true || data.whatsappAttempted === true || whatsappSent;
  return {
    success: data.success === true,
    zohoLeadId: data.zohoLeadId || data.zoho_lead_id,
    alreadySynced: Boolean(data.alreadySynced ?? data.already_synced),
    emailSent,
    emailAttempted,
    emailError,
    emailTo: data.email_to ?? null,
    emailExtracted,
    emailSkipped: Boolean(data.email_skipped ?? data.emailSkipped),
    emailCc: Array.isArray(data.email_cc) ? data.email_cc : [],
    emailCcInvalid: Array.isArray(data.email_cc_invalid) ? data.email_cc_invalid : [],
    whatsappSent,
    whatsappAttempted,
    whatsappError: data.whatsapp_error ?? null,
    whatsappTo: data.whatsapp_to ?? null,
    whatsappMessageId: data.whatsapp_message_id ?? null,
    whatsappDeliveryStatus: data.whatsapp_delivery_status ?? null,
    whatsappSendMode: data.whatsapp_send_mode ?? null
  };
}
async function syncPayloadToZoho(payload, options) {
  let response;
  try {
    response = await apiFetch(`${API_BASE_URL}/api/leads/sync-from-local`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: payload.fullName,
        firstName: payload.firstName,
        lastName: payload.lastName,
        company: payload.company,
        designation: payload.designation,
        phone: payload.phone,
        secondaryPhone: payload.secondaryPhone,
        email: pickPrimaryEmail(payload),
        emailAddress: pickPrimaryEmail(payload),
        secondaryEmail: pickSecondaryEmail(payload),
        secondaryEmailAddress: pickSecondaryEmail(payload),
        website: payload.website,
        secondaryWebsite: payload.secondaryWebsite,
        address: payload.address,
        secondaryAddress: payload.secondaryAddress,
        eventName: payload.eventName,
        eventId: payload.eventId,
        notes: payload.notes || "",
        zohoLeadId: payload.zohoLeadId,
        connectionMode: options?.connectionMode ?? "online",
        skipWhatsApp: Boolean(options?.skipWhatsApp),
        skipEmail: Boolean(options?.skipEmail)
      })
    });
  } catch {
    throw new Error(
      "Python backend not reachable. Run npm run dev:all (API on port 5000)."
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      parseApiErrorDetail(data, "Failed to sync contact to Zoho CRM.")
    );
  }
  return normalizeZohoSyncResult(data);
}
async function deleteZohoLead(leadId) {
  const id = leadId.trim();
  if (!id || id.startsWith("zoho-")) {
    throw new Error("Invalid Zoho lead id.");
  }
  let response;
  try {
    response = await apiFetch(getDeleteContactUrl(id, "zoho"), {
      method: "DELETE"
    });
  } catch {
    throw new Error(
      "Python backend not reachable. Run npm run dev:all (API on port 5000)."
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseApiErrorDetail(data, "Failed to delete contact from Zoho CRM."));
  }
}
function queueContactToPayload(contactData) {
  const fullName = String(
    contactData.fullName || contactData.name || ""
  ).trim();
  return {
    fullName,
    firstName: String(contactData.firstName || ""),
    lastName: String(contactData.lastName || ""),
    designation: String(contactData.designation || contactData.title || ""),
    company: String(contactData.company || ""),
    phone: String(contactData.phone || ""),
    secondaryPhone: String(contactData.secondaryPhone || ""),
    email: String(
      contactData.email || contactData.emailAddress || contactData.secondaryEmail || contactData.secondaryEmailAddress || ""
    ),
    secondaryEmail: String(contactData.secondaryEmail || contactData.secondaryEmailAddress || ""),
    website: String(contactData.website || ""),
    secondaryWebsite: String(contactData.secondaryWebsite || ""),
    address: String(contactData.address || ""),
    secondaryAddress: String(contactData.secondaryAddress || ""),
    socialLinks: String(contactData.socialLinks || ""),
    gstNumber: String(contactData.gstNumber || ""),
    notes: String(contactData.notes || ""),
    eventName: String(contactData.eventName || ""),
    eventId: String(contactData.eventId || "")
  };
}
function localContactToPayload(contact) {
  return {
    fullName: contact.fullName || contact.name || "",
    firstName: contact.firstName || "",
    lastName: contact.lastName || "",
    designation: contact.designation || "",
    company: contact.company || "",
    phone: contact.phone || "",
    email: contact.email || String(contact.emailAddress || ""),
    website: contact.website || "",
    address: contact.address || "",
    notes: String(contact.notes || ""),
    eventName: String(contact.eventName || ""),
    eventId: String(contact.eventId || "")
  };
}
const EVENTS_STORAGE_KEY = "cs-events";
const LAST_EVENT_NAME_KEY = "cs-last-event-name";
function readEventsRaw() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item;
      const name = String(record.name || "").trim();
      if (!name) return null;
      return {
        id: String(record.id || crypto.randomUUID()),
        name,
        createdAt: String(record.createdAt || (/* @__PURE__ */ new Date()).toISOString()),
        lastUsedAt: record.lastUsedAt ? String(record.lastUsedAt) : void 0
      };
    }).filter((item) => item !== null);
  } catch {
    return [];
  }
}
function writeEvents(events) {
  if (typeof window === "undefined") return;
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  window.dispatchEvent(new CustomEvent("cs-events-updated"));
}
function loadEvents() {
  return readEventsRaw().sort((a, b) => {
    const aTime = a.lastUsedAt || a.createdAt;
    const bTime = b.lastUsedAt || b.createdAt;
    return bTime.localeCompare(aTime);
  });
}
function getLastUsedEventName() {
  if (typeof window === "undefined") return "";
  return (localStorage.getItem(LAST_EVENT_NAME_KEY) || "").trim();
}
function setLastUsedEventName(name) {
  if (typeof window === "undefined") return;
  const trimmed = name.trim();
  if (!trimmed) {
    localStorage.removeItem(LAST_EVENT_NAME_KEY);
    return;
  }
  localStorage.setItem(LAST_EVENT_NAME_KEY, trimmed);
}
function rememberEvent(eventName) {
  const name = eventName.trim();
  if (!name) {
    throw new Error("Event name is required.");
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const events = readEventsRaw();
  const existing = events.find((event) => event.name.toLowerCase() === name.toLowerCase());
  let saved;
  if (existing) {
    saved = { ...existing, name, lastUsedAt: now };
    const next = events.map(
      (event) => event.id === existing.id ? saved : event
    );
    writeEvents(next);
  } else {
    saved = { id: crypto.randomUUID(), name, createdAt: now, lastUsedAt: now };
    writeEvents([saved, ...events]);
  }
  setLastUsedEventName(name);
  return saved;
}
function resolveEventForSave(eventName) {
  const trimmed = eventName.trim();
  if (!trimmed) {
    return { eventName: "" };
  }
  const saved = rememberEvent(trimmed);
  return { eventName: saved.name, eventId: saved.id };
}
function listEventNames() {
  return loadEvents().map((event) => event.name);
}
const EXAMPLE_EVENT_NAME = "Mall Opening";
function getExampleEventName() {
  return EXAMPLE_EVENT_NAME;
}
function purgeOrphanExampleEvent(contacts) {
  const key = EXAMPLE_EVENT_NAME.toLowerCase();
  const hasLead = contacts.some(
    (c) => (c.eventName || "").trim().toLowerCase() === key
  );
  if (hasLead) return;
  const events = readEventsRaw();
  const next = events.filter((e) => e.name.trim().toLowerCase() !== key);
  if (next.length === events.length) return;
  writeEvents(next);
  if (getLastUsedEventName().trim().toLowerCase() === key) {
    setLastUsedEventName("");
  }
}
const EVENT_LEAD_MAP_KEY = "cs-event-lead-map";
function eventContactKey(email, phone) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (normalizedEmail) return `e:${normalizedEmail}`;
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length >= 7) return `p:${digits}`;
  return "";
}
function readEventLeadMap() {
  if (typeof window === "undefined") {
    return { byZohoId: {}, byContactKey: {} };
  }
  try {
    const raw = localStorage.getItem(EVENT_LEAD_MAP_KEY);
    if (!raw) return { byZohoId: {}, byContactKey: {} };
    const parsed = JSON.parse(raw);
    return {
      byZohoId: parsed.byZohoId && typeof parsed.byZohoId === "object" ? parsed.byZohoId : {},
      byContactKey: parsed.byContactKey && typeof parsed.byContactKey === "object" ? parsed.byContactKey : {}
    };
  } catch {
    return { byZohoId: {}, byContactKey: {} };
  }
}
function writeEventLeadMap(map) {
  if (typeof window === "undefined") return;
  localStorage.setItem(EVENT_LEAD_MAP_KEY, JSON.stringify(map));
}
function recordContactEventLink(meta) {
  const eventName = meta.eventName.trim();
  if (!eventName) return;
  const link = { eventName, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  const map = readEventLeadMap();
  const zohoId = String(meta.zohoLeadId || "").trim();
  if (zohoId) {
    map.byZohoId[zohoId] = link;
  }
  const key = eventContactKey(meta.email, meta.phone);
  if (key) {
    map.byContactKey[key] = link;
  }
  writeEventLeadMap(map);
}
function resolveEventNameForContact(contact) {
  const direct = String(contact.eventName || "").trim();
  if (direct) return direct;
  const map = readEventLeadMap();
  const zohoId = String(contact.zohoLeadId || "").trim();
  if (zohoId && map.byZohoId[zohoId]?.eventName) {
    return map.byZohoId[zohoId].eventName;
  }
  const key = eventContactKey(contact.email, contact.phone);
  if (key && map.byContactKey[key]?.eventName) {
    return map.byContactKey[key].eventName;
  }
  return "";
}
const STORAGE_KEY = "cs-outreach-status-v2";
function normalizePart(value) {
  return String(value || "").trim().toLowerCase();
}
function outreachContactKey(input) {
  const zohoId = String(input.zohoLeadId || "").trim();
  if (zohoId && !zohoId.startsWith("zoho-")) {
    return `zoho:${zohoId}`;
  }
  const email = normalizePart(input.email);
  const phone = normalizePart(input.phone);
  const name = normalizePart(input.name);
  return `contact:${email}|${phone}|${name}`;
}
function migrateLegacyStore() {
  if (typeof window === "undefined") return {};
  try {
    const legacyRaw = window.localStorage.getItem("cs-outreach-status-v1");
    if (!legacyRaw) return {};
    const legacy = JSON.parse(legacyRaw);
    const scoped = { anonymous: legacy };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scoped));
    window.localStorage.removeItem("cs-outreach-status-v1");
    return scoped;
  } catch {
    return {};
  }
}
function readAllScopedStores() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return migrateLegacyStore();
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
function writeAllScopedStores(stores) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stores));
  } catch (err) {
    console.warn("Failed to persist outreach status:", err);
  }
}
function readStore(scope) {
  const all = readAllScopedStores();
  return all[scope] || {};
}
function writeStore(scope, store) {
  const all = readAllScopedStores();
  all[scope] = store;
  writeAllScopedStores(all);
}
function lookupEntry(store, contact) {
  const key = outreachContactKey(contact);
  if (store[key]) return store[key];
  const zohoId = String(contact.zohoLeadId || "").trim();
  if (zohoId) {
    const byZoho = store[`zoho:${zohoId}`];
    if (byZoho) return byZoho;
  }
  return void 0;
}
function findEntryForUser(contact, appUser) {
  for (const scope of getUserScopeKeys(appUser)) {
    const entry = lookupEntry(readStore(scope), contact);
    if (entry) return entry;
  }
  return void 0;
}
function clearOutreachStatusForUser(appUser) {
  const all = readAllScopedStores();
  for (const scope of getUserScopeKeys(appUser)) {
    delete all[scope];
  }
  writeAllScopedStores(all);
}
function resolveChannelState(input) {
  if (!input.hasChannel) return "unavailable";
  if (input.sent === true) return "success";
  if (input.skipped) return "skipped";
  if (input.attempted === true && input.sent === false) return "failure";
  if (input.error) {
    const message = String(input.error).toLowerCase();
    if (message.includes("skipped") || message.includes("disabled") || message.includes("offline mode") || message.includes("will send when")) {
      return "skipped";
    }
    if (input.attempted === true) return "failure";
  }
  return "unknown";
}
function buildDeliveryRecord(input) {
  const state = resolveChannelState(input);
  if (state === "unknown" && !input.attempted && !input.error && input.sent !== true) {
    return void 0;
  }
  return {
    state,
    error: input.error ?? null,
    attempted: input.attempted,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function recordOutreachFromSyncResult(contact, result) {
  const appUser = await getCurrentAppUser();
  const emailAttempted = result.emailAttempted === true || result.emailSent === true;
  const whatsappAttempted = result.whatsappAttempted === true || result.whatsappSent === true;
  const hasEmail = Boolean(normalizePart(contact.email));
  const hasPhone = Boolean(normalizePart(contact.phone));
  const emailDelivery = buildDeliveryRecord({
    hasChannel: hasEmail,
    attempted: emailAttempted,
    sent: result.emailSent === true,
    skipped: result.emailSkipped,
    error: result.emailError
  });
  const whatsappDelivery = buildDeliveryRecord({
    hasChannel: hasPhone,
    attempted: whatsappAttempted,
    sent: result.whatsappSent === true,
    error: result.whatsappError
  });
  const entry = {
    zohoLeadId: contact.zohoLeadId,
    email: contact.email || void 0,
    phone: contact.phone || void 0,
    name: contact.name || void 0,
    ...emailDelivery ? { emailDelivery } : {},
    ...whatsappDelivery ? { whatsappDelivery } : {}
  };
  const contactKey = outreachContactKey(contact);
  const zohoId = String(contact.zohoLeadId || "").trim();
  const zohoKey = zohoId ? `zoho:${zohoId}` : null;
  for (const scope of getUserScopeKeys(appUser)) {
    const store = readStore(scope);
    store[contactKey] = { ...store[contactKey] || {}, ...entry };
    if (zohoKey) {
      store[zohoKey] = { ...store[zohoKey] || {}, ...entry };
    }
    writeStore(scope, store);
  }
}
function getOutreachStatusForContactSync(contact, appUser) {
  const entry = findEntryForUser(contact, appUser);
  if (!entry) return {};
  return {
    emailDelivery: entry.emailDelivery,
    whatsappDelivery: entry.whatsappDelivery
  };
}
function removeOutreachStatusForContact(contact, appUser) {
  const key = outreachContactKey(contact);
  const zohoKey = contact.zohoLeadId ? `zoho:${String(contact.zohoLeadId).trim()}` : null;
  for (const scope of getUserScopeKeys(appUser)) {
    const store = readStore(scope);
    let changed = false;
    if (store[key]) {
      delete store[key];
      changed = true;
    }
    if (zohoKey && store[zohoKey]) {
      delete store[zohoKey];
      changed = true;
    }
    if (changed) writeStore(scope, store);
  }
}
function resolveChannelIconStatus(record) {
  if (!record) return "pending";
  if (record.state === "success") return "success";
  if (record.state === "failure") return "failure";
  return "pending";
}
async function resolveStorageMode() {
  return "indexeddb";
}
async function checkStorageHealth() {
  await resolveStorageMode();
  return true;
}
async function listContacts() {
  await resolveStorageMode();
  return listStoredContacts();
}
function isOfflineSave(options) {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  if (options?.connectionMode === "offline") return true;
  if (options?.connectionMode === "online") return false;
  return false;
}
function saveConnectionMode() {
  return getConnectionMode();
}
function notifyContactsListChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cs-contacts-updated"));
    void Promise.resolve().then(() => contactsDirectory).then((m) => m.invalidateContactsDirectory());
  }
}
async function persistOutreachStatus(payload, zoho) {
  await recordOutreachFromSyncResult(
    {
      zohoLeadId: zoho.zohoLeadId,
      email: pickPrimaryEmail(payload),
      phone: payload.phone,
      name: payload.fullName
    },
    zoho
  );
}
async function saveOfflineToIndexedDbQueue(payload, cardImageBase64, errorMessage = "Saved offline — will sync to Zoho when online") {
  const email = pickPrimaryEmail(payload);
  const appUser = await getCurrentAppUser();
  const item = buildQueueItemFromPayload(
    { ...payload, email },
    cardImageBase64,
    errorMessage,
    appUser
  );
  await addToQueue(item);
  const { recordOfflineQueueCapture } = await import("./captureSourceAnalytics-C5QY0HWn.js");
  recordOfflineQueueCapture();
  notifyContactsListChanged();
  return { id: item.id, queued: true };
}
async function saveOnlineDirectToZoho(payload, cardImageBase64, options) {
  const email = pickPrimaryEmail(payload);
  const body = { ...payload, email };
  const skipEmail = Boolean(options?.skipEmail) || !email;
  try {
    const zoho = await syncPayloadToZoho(body, {
      connectionMode: "online",
      skipWhatsApp: options?.skipWhatsApp,
      skipEmail
    });
    if (body.eventName?.trim()) {
      recordContactEventLink({
        eventName: body.eventName.trim(),
        zohoLeadId: zoho.zohoLeadId,
        email,
        phone: body.phone
      });
    }
    const { recordDirectZohoCapture } = await import("./captureSourceAnalytics-C5QY0HWn.js");
    recordDirectZohoCapture();
    await persistOutreachStatus(body, zoho);
    notifyContactsListChanged();
    return {
      id: zoho.zohoLeadId || crypto.randomUUID(),
      zohoLeadId: zoho.zohoLeadId,
      zohoSynced: Boolean(zoho.zohoLeadId),
      alreadySynced: zoho.alreadySynced,
      emailSent: zoho.emailSent,
      emailAttempted: zoho.emailAttempted,
      emailError: zoho.emailError,
      emailTo: zoho.emailTo,
      emailExtracted: zoho.emailExtracted || email || null,
      whatsappSent: zoho.whatsappSent,
      whatsappAttempted: zoho.whatsappAttempted,
      whatsappError: zoho.whatsappError,
      whatsappTo: zoho.whatsappTo,
      whatsappMessageId: zoho.whatsappMessageId,
      whatsappDeliveryStatus: zoho.whatsappDeliveryStatus,
      whatsappSendMode: zoho.whatsappSendMode
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Zoho sync failed";
    const fallback = await saveOfflineToIndexedDbQueue(body, cardImageBase64, message);
    return { ...fallback, zohoError: message };
  }
}
async function syncQueueItemToZoho(item, options) {
  if (!navigator.onLine) {
    throw new Error("No internet. Connect to sync to Zoho CRM.");
  }
  const payload = queueContactToPayload(item.contact_data);
  const result = await syncPayloadToZoho(payload, {
    connectionMode: "online",
    skipWhatsApp: options?.skipWhatsApp,
    skipEmail: options?.skipEmail
  });
  if (payload.eventName?.trim()) {
    recordContactEventLink({
      eventName: payload.eventName.trim(),
      zohoLeadId: result.zohoLeadId,
      email: pickPrimaryEmail(payload),
      phone: payload.phone
    });
  }
  await removeQueueItem(item.id);
  await persistOutreachStatus(payload, result);
  const { recordQueueSyncedToZoho } = await import("./captureSourceAnalytics-C5QY0HWn.js");
  recordQueueSyncedToZoho();
  notifyContactsListChanged();
  return {
    zohoLeadId: result.zohoLeadId,
    emailSent: result.emailSent,
    emailError: result.emailError,
    emailTo: result.emailTo,
    emailExtracted: result.emailExtracted || pickPrimaryEmail(payload)
  };
}
async function syncAllQueueItemsToZoho(options) {
  const items2 = await getQueueItems();
  const pending = items2.filter((i) => i.status === "pending" || i.status === "retrying");
  let synced = 0;
  for (const item of pending) {
    try {
      await updateQueueItem({
        ...item,
        status: "retrying",
        last_attempt: (/* @__PURE__ */ new Date()).toISOString()
      });
      await syncQueueItemToZoho(item, options);
      synced += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Zoho sync failed";
      const nextRetry = item.retry_count + 1;
      await updateQueueItem({
        ...item,
        status: nextRetry >= 5 ? "failed" : "pending",
        retry_count: nextRetry,
        last_attempt: (/* @__PURE__ */ new Date()).toISOString(),
        error_message: message
      });
    }
  }
  return { synced, total: pending.length };
}
async function saveContact(payload, cardImageBase64, options) {
  await resolveStorageMode();
  const mode = options?.connectionMode ?? saveConnectionMode();
  if (isOfflineSave({ ...options, connectionMode: mode })) {
    return saveOfflineToIndexedDbQueue(payload, cardImageBase64);
  }
  return saveOnlineDirectToZoho(payload, cardImageBase64, options);
}
async function updateContact(contactId, payload) {
  const existing = await getStoredContactById(contactId);
  if (existing) {
    const email = pickPrimaryEmail(payload);
    await updateStoredContact(contactId, {
      ...payload,
      email,
      emailAddress: email
    });
  }
}
async function markContactSyncedZoho(contactId, zohoLeadId) {
  await patchStoredContactSyncStatus(contactId, "synced_zoho", zohoLeadId);
}
async function syncContactToZohoStorage(contactId, options, payloadOverride) {
  let payload = payloadOverride;
  let alreadyInZoho = false;
  const contact = await getStoredContactById(contactId);
  if (contact) {
    payload = payload ?? localContactToPayload(contact);
    alreadyInZoho = Boolean(
      contact.zohoLeadId || contact.syncStatus === "synced_zoho"
    );
  }
  if (!payload) {
    throw new Error("Contact not found for Zoho sync");
  }
  const email = pickPrimaryEmail(payload);
  const zohoLeadId = payload.zohoLeadId ?? (contact?.zohoLeadId ? String(contact.zohoLeadId) : void 0);
  const result = await syncPayloadToZoho(
    {
      ...payload,
      email,
      ...zohoLeadId ? { zohoLeadId } : {}
    },
    { connectionMode: "online", ...options }
  );
  if (payload.eventName?.trim()) {
    recordContactEventLink({
      eventName: payload.eventName.trim(),
      zohoLeadId: result.zohoLeadId,
      email,
      phone: payload.phone
    });
  }
  if (contact && result.zohoLeadId) {
    await markContactSyncedZoho(contactId, result.zohoLeadId);
  }
  await persistOutreachStatus(payload, result);
  notifyContactsListChanged();
  return {
    ...result,
    zohoLeadId: result.zohoLeadId || contactId,
    alreadySynced: alreadyInZoho || result.alreadySynced,
    emailExtracted: result.emailExtracted || email || null
  };
}
async function syncAllPendingToZohoStorage(options) {
  const contacts = await listStoredContacts();
  const pending = contacts.filter(
    (c) => c.syncStatus !== "synced_zoho" && !c.zohoLeadId
  );
  let synced = 0;
  for (const contact of pending) {
    const id = String(contact.id || "");
    if (!id) continue;
    try {
      const result = await syncContactToZohoStorage(id, options);
      if (result.zohoLeadId || result.alreadySynced) {
        synced += 1;
      }
    } catch {
    }
  }
  return { synced, total: pending.length };
}
let autoZohoSyncInFlight = null;
async function runAutoZohoSyncWhenOnline(options) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { queueSynced: 0, queueTotal: 0, contactsSynced: 0, contactsTotal: 0 };
  }
  if (autoZohoSyncInFlight) {
    return autoZohoSyncInFlight;
  }
  autoZohoSyncInFlight = (async () => {
    const queue = await syncAllQueueItemsToZoho(options);
    const contacts = await syncAllPendingToZohoStorage(options);
    return {
      queueSynced: queue.synced,
      queueTotal: queue.total,
      contactsSynced: contacts.synced,
      contactsTotal: contacts.total
    };
  })().finally(() => {
    autoZohoSyncInFlight = null;
  });
  return autoZohoSyncInFlight;
}
function isContactPendingZoho(contact) {
  return contact.syncStatus !== "synced_zoho" && !contact.zohoLeadId;
}
function buildQueueItemFromPayload(payload, imageBase64, errorMessage, appUser) {
  const email = pickPrimaryEmail(payload);
  const stamped = stampCapturedByFields(
    { ...payload, email, emailAddress: email },
    appUser ?? null
  );
  const queueId = crypto.randomUUID();
  return {
    id: queueId,
    contact_data: {
      ...stamped,
      captureSource: "offline_queue"
    },
    image_base64: imageBase64,
    status: "pending",
    retry_count: 0,
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    last_attempt: (/* @__PURE__ */ new Date()).toISOString(),
    error_message: errorMessage,
    capturedByEmail: String(stamped.capturedByEmail || ""),
    capturedByUserId: String(stamped.capturedByUserId || ""),
    capturedByPhone: String(stamped.capturedByPhone || "")
  };
}
const ACCENTS = [
  "from-indigo-500 to-violet-500",
  "from-sky-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-fuchsia-500 to-pink-500",
  "from-cyan-500 to-blue-500"
];
function attachOutreachStatus(contact) {
  const outreach = getOutreachStatusForContactSync(
    {
      zohoLeadId: contact.zohoLeadId,
      email: contact.email,
      phone: contact.phone,
      name: contact.name
    },
    getCurrentAppUserSync()
  );
  return {
    ...contact,
    emailDelivery: outreach.emailDelivery,
    whatsappDelivery: outreach.whatsappDelivery
  };
}
function isAppOnline() {
  return getConnectionMode() === "online" && typeof navigator !== "undefined" && navigator.onLine;
}
function contactRowKey(contact) {
  return `${contact.source}-${contact.id}`;
}
function contactSearchText(contact) {
  return `${contact.name} ${contact.company} ${contact.email} ${contact.phone} ${contact.title} ${contact.eventName || ""} ${contact.notes || ""}`.toLowerCase().trim();
}
function filterContactsByQuery(contacts, query) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return contacts.filter((c) => contactSearchText(c).includes(q));
}
const CACHE_TTL_MS = 6e4;
let cache = null;
let inFlight = null;
const listeners = /* @__PURE__ */ new Set();
function getContactsDirectorySnapshot() {
  return cache;
}
function subscribeContactsDirectory(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function invalidateContactsDirectory() {
  cache = null;
  inFlight = null;
}
function optimisticallyRemoveDirectoryContact(contact) {
  const key = contactRowKey(contact);
  if (!cache) return;
  const nextContacts = cache.contacts.filter((c) => contactRowKey(c) !== key);
  if (nextContacts.length === cache.contacts.length) return;
  cache = { ...cache, contacts: nextContacts };
  notifyContactsDirectorySubscribers();
}
function notifyContactsDirectorySubscribers() {
  listeners.forEach((listener) => listener());
}
async function fetchContactsDirectoryFromSources() {
  let localDbData = [];
  let zohoData = [];
  let fetchFailed = false;
  const onlineView = isAppOnline();
  const appUser = await getCurrentAppUser();
  try {
    const allLocal = await listContacts();
    localDbData = onlineView ? allLocal.filter(
      (c) => c.syncStatus !== "synced_zoho" && !c.zohoLeadId
    ) : allLocal;
    localDbData = localDbData.filter((c) => contactBelongsToAppUser(c, appUser));
  } catch (localErr) {
    console.warn("Failed to list contacts:", localErr);
  }
  const zohoResult = await Promise.allSettled([
    apiFetch(getZohoLeadsUrl()).then(async (response) => {
      if (!response.ok) throw new Error(response.statusText);
      return response.json();
    })
  ]);
  if (zohoResult[0].status === "fulfilled") {
    zohoData = Array.isArray(zohoResult[0].value) ? zohoResult[0].value : [];
  } else {
    console.error("Zoho fetch failed:", zohoResult[0].reason);
    fetchFailed = true;
  }
  const zohoLookup = buildZohoLeadLookup(zohoData);
  const formattedZoho = zohoData.map((c, i) => {
    const name = String(c.name || "");
    const initials = name ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "";
    return attachOutreachStatus({
      id: String(c.id || `zoho-${i}`),
      zohoLeadId: c.id ? String(c.id) : null,
      name,
      company: String(c.company || ""),
      title: String(c.title || c.designation || ""),
      email: String(c.email || ""),
      phone: String(c.phone || ""),
      eventName: resolveEventNameForContact({
        eventName: String(c.eventName || ""),
        zohoLeadId: c.id ? String(c.id) : null,
        email: String(c.email || ""),
        phone: String(c.phone || "")
      }),
      notes: String(c.notes || ""),
      source: "zoho",
      initials,
      accent: String(c.accent || ACCENTS[i % ACCENTS.length]),
      status: "synced",
      channels: c.channels || {
        whatsapp: !!c.phone,
        email: !!c.email
      },
      lastSync: String(c.lastSync || "Synced to Zoho")
    });
  });
  let formattedQueue = [];
  {
    try {
      const queueItems = await getQueueItems();
      formattedQueue = queueItems.filter((item) => contactBelongsToAppUser(item, appUser)).map((item) => {
        const c = item.contact_data;
        const name = c.name || "Unnamed Contact";
        const initials = name ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "?";
        return attachOutreachStatus({
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
          lastSync: item.status === "failed" ? "Sync failed" : "Queued · save on device",
          accent: "from-amber-500 to-orange-500"
        });
      });
    } catch (dbErr) {
      console.error("Failed to read IndexedDB queue in contacts list:", dbErr);
    }
  }
  const storageSource = "indexeddb";
  const formattedLocalDb = localDbData.filter(
    (c) => !isDuplicateOfZohoLead(
      {
        zohoLeadId: c.zohoLeadId,
        email: c.email,
        phone: c.phone,
        syncStatus: c.syncStatus,
        status: c.status
      },
      zohoLookup,
      { hideSyncedWhenOnline: onlineView }
    )
  ).map((c, i) => {
    const name = String(c.name || "");
    const initials = name ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "";
    const status = c.syncStatus === "synced_zoho" || c.syncStatus === "synced" ? "synced" : c.syncStatus === "failed" ? "failed" : "pending";
    return attachOutreachStatus({
      id: String(c.id || `local-${i}`),
      name,
      company: String(c.company || ""),
      title: String(c.title || c.designation || ""),
      email: String(c.email || ""),
      phone: String(c.phone || ""),
      eventName: resolveEventNameForContact({
        eventName: String(c.eventName || ""),
        zohoLeadId: c.zohoLeadId || null,
        email: String(c.email || ""),
        phone: String(c.phone || "")
      }),
      notes: String(c.notes || ""),
      source: storageSource,
      zohoLeadId: c.zohoLeadId || null,
      initials,
      accent: "from-violet-600 to-indigo-700",
      status,
      channels: c.channels || {
        whatsapp: !!c.phone,
        email: !!c.email
      },
      lastSync: c.syncStatus === "synced" || c.syncStatus === "synced_zoho" ? "Saved on device" : status === "pending" ? onlineView ? "Awaiting save" : `${storageLabel()} · pending` : String(c.lastSync || storageLabel({ online: onlineView }))
    });
  });
  return {
    contacts: [...formattedQueue, ...formattedLocalDb, ...formattedZoho],
    fetchFailed,
    fetchedAt: Date.now()
  };
}
async function loadContactsDirectory(options) {
  const force = options?.force ?? false;
  const now = Date.now();
  if (force) {
    inFlight = null;
  }
  if (!force && cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache;
  }
  if (inFlight) {
    return inFlight;
  }
  inFlight = (async () => {
    try {
      const snapshot = await fetchContactsDirectoryFromSources();
      cache = snapshot;
      notifyContactsDirectorySubscribers();
      return snapshot;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}
const contactsDirectory = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  contactRowKey,
  contactSearchText,
  filterContactsByQuery,
  getContactsDirectorySnapshot,
  invalidateContactsDirectory,
  loadContactsDirectory,
  optimisticallyRemoveDirectoryContact,
  subscribeContactsDirectory
}, Symbol.toStringTag, { value: "Module" }));
function useContactsDirectory(options) {
  const autoLoad = options?.autoLoad !== false;
  const cached = getContactsDirectorySnapshot();
  const hasCachedData = Boolean(cached?.contacts.length);
  const [contacts, setContacts] = useState(cached?.contacts ?? []);
  const [isLoading, setIsLoading] = useState(!hasCachedData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(cached?.fetchFailed ?? false);
  const hasLoadedOnceRef = useRef(hasCachedData);
  const applySnapshot = useCallback((snapshot) => {
    setContacts(snapshot.contacts);
    setFetchFailed(snapshot.fetchFailed);
    if (snapshot.contacts.length > 0) {
      hasLoadedOnceRef.current = true;
    }
  }, []);
  useEffect(
    () => subscribeContactsDirectory(() => {
      const snapshot = getContactsDirectorySnapshot();
      if (snapshot) applySnapshot(snapshot);
    }),
    [applySnapshot]
  );
  const removeContact = useCallback((contact) => {
    optimisticallyRemoveDirectoryContact(contact);
    setContacts((prev) => prev.filter((c) => contactRowKey(c) !== contactRowKey(contact)));
  }, []);
  const refresh = useCallback(
    async (opts) => {
      const silent = opts?.silent ?? hasLoadedOnceRef.current;
      const force = opts?.force ?? !getContactsDirectorySnapshot();
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      try {
        const snapshot = await loadContactsDirectory({ force });
        applySnapshot(snapshot);
        return snapshot;
      } finally {
        if (silent) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [applySnapshot]
  );
  useEffect(() => {
    void refresh({ silent: hasCachedData, force: false });
    const onDataChanged = () => {
      void refresh({ silent: true, force: true });
    };
    window.addEventListener("cs-contacts-updated", onDataChanged);
    window.addEventListener("cs-queue-updated", onDataChanged);
    return () => {
      window.removeEventListener("cs-contacts-updated", onDataChanged);
      window.removeEventListener("cs-queue-updated", onDataChanged);
    };
  }, [autoLoad, refresh, hasCachedData]);
  return { contacts, isLoading, isRefreshing, fetchFailed, refresh, removeContact };
}
const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 12;
function sourceBadge(source) {
  if (source === "zoho") return "Zoho";
  if (source === "queue") return "Queue";
  return "Device";
}
function HeaderSearch({
  className,
  placeholder = "Search directory, companies, or queue…",
  urlQuery = ""
}) {
  const navigate = useNavigate();
  const listboxId = useId();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const { contacts, isLoading } = useContactsDirectory();
  const [query, setQuery] = useState(urlQuery);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [modKeyLabel, setModKeyLabel] = useState("Ctrl");
  useEffect(() => {
    const isApple = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
    setModKeyLabel(isApple ? "⌘" : "Ctrl");
  }, []);
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);
  const trimmedQuery = query.trim();
  const hasMinQuery = trimmedQuery.length >= MIN_QUERY_LENGTH;
  const suggestions = useMemo(
    () => filterContactsByQuery(contacts, query).slice(0, MAX_RESULTS),
    [contacts, query]
  );
  useEffect(() => {
    if (hasMinQuery) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [hasMinQuery, urlQuery, contacts.length, isLoading]);
  const showPanel = open && hasMinQuery;
  useEffect(() => {
    setActiveIndex(0);
  }, [query, suggestions.length]);
  useEffect(() => {
    const onGlobalShortcut = (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "k") return;
      if (event.altKey || event.shiftKey) return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
      if (query.trim().length >= MIN_QUERY_LENGTH) {
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onGlobalShortcut);
    return () => window.removeEventListener("keydown", onGlobalShortcut);
  }, [query]);
  useEffect(() => {
    if (!showPanel) return;
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [showPanel]);
  const selectContact = (contact) => {
    const rowKey = contactRowKey(contact);
    const q = contact.name.trim() || contact.company.trim() || contact.email.trim();
    setQuery(q);
    setOpen(false);
    inputRef.current?.blur();
    void navigate({
      to: "/contacts",
      search: { q: q || void 0, highlight: rowKey }
    });
  };
  const handleKeyDown = (event) => {
    if (!showPanel || suggestions.length === 0) {
      if (event.key === "Escape") setOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const picked = suggestions[activeIndex];
      if (picked) selectContact(picked);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { ref: rootRef, className: cn("relative w-full", className), children: [
    /* @__PURE__ */ jsxs(
      "form",
      {
        className: "relative w-full",
        onSubmit: (e) => {
          e.preventDefault();
          if (suggestions[activeIndex]) {
            selectContact(suggestions[activeIndex]);
            return;
          }
          const q = query.trim();
          if (q.length >= MIN_QUERY_LENGTH) {
            void navigate({ to: "/contacts", search: { q } });
            setOpen(false);
          }
        },
        children: [
          /* @__PURE__ */ jsx(
            Search,
            {
              className: "pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground",
              "aria-hidden": true
            }
          ),
          /* @__PURE__ */ jsx(
            Input,
            {
              ref: inputRef,
              id: "header-search",
              name: "header-search",
              type: "search",
              role: "combobox",
              "aria-expanded": showPanel,
              "aria-controls": showPanel ? listboxId : void 0,
              "aria-autocomplete": "list",
              autoComplete: "off",
              placeholder,
              value: query,
              onChange: (e) => setQuery(e.target.value),
              onFocus: () => {
                if (hasMinQuery) setOpen(true);
              },
              onKeyDown: handleKeyDown,
              className: "h-9 w-full rounded-md border-border/60 bg-white pl-9 pr-14 text-sm text-foreground shadow-none focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-border/80 dark:bg-white dark:focus-visible:bg-white sm:pr-16",
              "aria-label": "Search contact directory, companies, and sync queue",
              "aria-keyshortcuts": "Control+K Meta+K"
            }
          ),
          /* @__PURE__ */ jsxs(
            "kbd",
            {
              className: "pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground sm:inline-flex",
              "aria-hidden": true,
              children: [
                /* @__PURE__ */ jsx("span", { children: modKeyLabel }),
                /* @__PURE__ */ jsx("span", { children: "K" })
              ]
            }
          )
        ]
      }
    ),
    showPanel ? /* @__PURE__ */ jsx(
      "div",
      {
        className: "absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg border border-border/70 bg-popover text-popover-foreground shadow-lg",
        role: "presentation",
        children: /* @__PURE__ */ jsx(
          "div",
          {
            id: listboxId,
            role: "listbox",
            "aria-label": "Contact search results",
            className: "max-h-56 overflow-y-auto overscroll-contain py-1",
            children: isLoading && contacts.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground", children: [
              /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 shrink-0 animate-spin" }),
              "Loading contacts…"
            ] }) : suggestions.length === 0 ? /* @__PURE__ */ jsx("p", { className: "px-3 py-3 text-sm text-muted-foreground", children: "No contacts match." }) : suggestions.map((contact, index) => {
              const isActive = index === activeIndex;
              return /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  role: "option",
                  "aria-selected": isActive,
                  className: cn(
                    "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                    isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted/60"
                  ),
                  onMouseEnter: () => setActiveIndex(index),
                  onMouseDown: (e) => e.preventDefault(),
                  onClick: () => selectContact(contact),
                  children: [
                    /* @__PURE__ */ jsx(
                      "div",
                      {
                        className: cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-xs font-semibold text-white",
                          contact.accent
                        ),
                        children: contact.initials
                      }
                    ),
                    /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                      /* @__PURE__ */ jsx("div", { className: "truncate font-medium", children: contact.name }),
                      /* @__PURE__ */ jsxs("div", { className: "truncate text-xs text-muted-foreground", children: [
                        contact.company || "No company",
                        contact.email ? ` · ${contact.email}` : ""
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground", children: sourceBadge(contact.source) })
                  ]
                },
                contactRowKey(contact)
              );
            })
          }
        )
      }
    ) : null
  ] });
}
function useUserSettings() {
  const [settings, setSettings] = useState(DEFAULT_USER_SETTINGS);
  const { data: authSession } = authClient.useSession();
  useEffect(() => {
    setSettings(loadUserSettings());
    const handleUpdate = (event) => {
      const detail = event.detail;
      setSettings(detail ? { ...DEFAULT_USER_SETTINGS, ...detail } : loadUserSettings());
    };
    window.addEventListener("cs-settings-updated", handleUpdate);
    return () => {
      window.removeEventListener("cs-settings-updated", handleUpdate);
    };
  }, []);
  const authEmail = authSession?.user?.email?.trim();
  const authName = authSession?.user?.name?.trim();
  const merged = {
    ...settings,
    ...authEmail ? { email: authEmail } : {},
    ...authName ? { fullName: authName } : {}
  };
  return {
    settings: merged,
    fullName: merged.fullName,
    email: merged.email,
    phone: merged.phone,
    company: merged.company,
    role: merged.role,
    initials: getUserInitials(merged.fullName || authEmail || "User"),
    firstName: getUserFirstName(merged.fullName || authName || "User")
  };
}
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuSubTrigger = React.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  DropdownMenuPrimitive.SubTrigger,
  {
    ref,
    className: cn(
      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx(ChevronRight, { className: "ml-auto" })
    ]
  }
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;
const DropdownMenuSubContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.SubContent,
  {
    ref,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)",
      className
    ),
    ...props
  }
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;
const DropdownMenuContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Content,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)",
      className
    ),
    ...props
  }
) }));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;
const DropdownMenuItem = React.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;
const DropdownMenuCheckboxItem = React.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ jsxs(
  DropdownMenuPrimitive.CheckboxItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    checked,
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) }) }),
      children
    ]
  }
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;
const DropdownMenuRadioItem = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  DropdownMenuPrimitive.RadioItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Circle, { className: "h-2 w-2 fill-current" }) }) }),
      children
    ]
  }
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;
const DropdownMenuLabel = React.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Label,
  {
    ref,
    className: cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
    ...props
  }
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;
const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;
function TopBar() {
  const [connectionMode, setConnectionModeState] = useState("online");
  const [pendingCount, setPendingCount] = useState(0);
  const { fullName: profileName, initials: profileInitials } = useUserSettings();
  const { data: authSession } = authClient.useSession();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const displayName = profileName || authSession?.user?.name?.trim() || authSession?.user?.email?.trim() || "Account";
  const avatarInitials = profileInitials || authSession?.user?.name?.trim()?.slice(0, 2).toUpperCase() || authSession?.user?.email?.trim()?.slice(0, 2).toUpperCase() || "??";
  const handleSignOut = async () => {
    clearAuthTokenCache();
    invalidateContactsDirectory();
    if (isAuthEnabled) {
      await authClient.signOut();
      navigate({ to: "/auth/$pathname", params: { pathname: "sign-in" } });
      return;
    }
    navigate({ to: "/scan" });
  };
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isContacts = pathname.startsWith("/contacts");
  const contactsQuery = useRouterState({
    select: (s) => {
      if (!s.location.pathname.startsWith("/contacts")) return "";
      return new URLSearchParams(s.location.search).get("q") ?? "";
    }
  });
  const isOnline = connectionMode === "online";
  const refreshConnectionMode = useCallback(() => {
    setConnectionModeState(getConnectionMode());
  }, []);
  const updatePendingCount = async () => {
    try {
      const items2 = await getQueueItems();
      const unsynced = items2.filter((item) => item.status !== "synced");
      setPendingCount(unsynced.length);
    } catch (e) {
      console.error("[TopBar] Failed to read queue count:", e);
    }
  };
  const ensureOfflineSample = async () => {
    return;
  };
  useEffect(() => {
    if (typeof window === "undefined") return;
    updatePendingCount();
    document.documentElement.classList.remove("dark");
    syncConnectionModeWithNetwork();
    refreshConnectionMode();
    if (getConnectionMode() === "offline") {
      void ensureOfflineSample();
    }
    const handleNetworkOnline = () => {
      syncConnectionModeWithNetwork();
      refreshConnectionMode();
    };
    const handleNetworkOffline = () => {
      syncConnectionModeWithNetwork();
      refreshConnectionMode();
      void ensureOfflineSample();
    };
    const handleModeChanged = () => refreshConnectionMode();
    window.addEventListener("online", handleNetworkOnline);
    window.addEventListener("offline", handleNetworkOffline);
    window.addEventListener(CONNECTION_MODE_CHANGED, handleModeChanged);
    window.addEventListener("cs-queue-updated", updatePendingCount);
    return () => {
      window.removeEventListener("online", handleNetworkOnline);
      window.removeEventListener("offline", handleNetworkOffline);
      window.removeEventListener(CONNECTION_MODE_CHANGED, handleModeChanged);
      window.removeEventListener("cs-queue-updated", updatePendingCount);
    };
  }, [refreshConnectionMode]);
  const headerSearch = (className, placeholder) => /* @__PURE__ */ jsx(
    HeaderSearch,
    {
      className,
      placeholder,
      urlQuery: isContacts ? contactsQuery : ""
    }
  );
  return /* @__PURE__ */ jsxs("header", { className: "grid h-14 shrink-0 grid-cols-[auto_1fr_auto] items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-4 md:px-6", children: [
    /* @__PURE__ */ jsx("div", { className: "flex min-w-0 items-center justify-start", children: /* @__PURE__ */ jsx(
      SidebarTrigger,
      {
        icon: "menu",
        className: "-ml-1 h-9 w-9 rounded-xl border border-border/60 bg-card/60 md:hidden",
        "aria-label": "Open menu",
        title: "Open menu"
      }
    ) }),
    /* @__PURE__ */ jsx("div", { className: "flex min-w-0 flex-1 px-1 sm:px-2 md:justify-start", children: headerSearch(
      cn(
        "w-full max-w-full",
        isContacts ? "md:max-w-md" : "md:max-w-sm lg:max-w-md"
      ),
      isMobile ? "Search contacts…" : void 0
    ) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
      pendingCount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2 py-1 text-xs font-medium text-warning-foreground shadow-soft", children: [
        /* @__PURE__ */ jsxs("span", { className: "relative flex h-1.5 w-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-warning/60" }),
          /* @__PURE__ */ jsx("span", { className: "relative inline-flex h-1.5 w-1.5 rounded-full bg-warning" })
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "hidden min-[380px]:inline", children: [
          pendingCount,
          " unsynced"
        ] }),
        /* @__PURE__ */ jsx("span", { className: "min-[380px]:hidden", children: pendingCount })
      ] }),
      /* @__PURE__ */ jsxs(DropdownMenu, { children: [
        /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-sm font-semibold text-primary-foreground shadow-glow",
            title: isOnline ? "Online" : "Offline",
            "aria-label": `Profile menu — ${isOnline ? "online" : "offline"}`,
            children: [
              avatarInitials,
              /* @__PURE__ */ jsx(
                "span",
                {
                  className: `absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${isOnline ? "bg-green-500" : "bg-red-500"}`,
                  "aria-hidden": true
                }
              )
            ]
          }
        ) }),
        /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", className: "w-48 rounded-xl", children: [
          /* @__PURE__ */ jsxs(DropdownMenuLabel, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(UserCircle2, { className: "h-4 w-4 shrink-0" }),
            /* @__PURE__ */ jsx("span", { className: "truncate", children: displayName })
          ] }),
          /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
          /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => navigate({ to: "/settings" }), children: [
            /* @__PURE__ */ jsx(Settings, { className: "mr-2 h-4 w-4" }),
            "Preferences"
          ] }),
          /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => void handleSignOut(), children: [
            /* @__PURE__ */ jsx(LogOut, { className: "mr-2 h-4 w-4" }),
            "Sign out"
          ] })
        ] })
      ] })
    ] })
  ] });
}
function NetworkOfflineBanner() {
  const [networkOnline, setNetworkOnline] = useState(true);
  useEffect(() => {
    const sync = () => setNetworkOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  if (networkOnline) return null;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      role: "alert",
      "aria-live": "assertive",
      className: "flex items-center gap-2 border-t border-destructive/25 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive sm:px-4 md:px-6",
      children: [
        /* @__PURE__ */ jsx(WifiOff, { className: "h-4 w-4 shrink-0", "aria-hidden": true }),
        /* @__PURE__ */ jsx("p", { className: "min-w-0 leading-snug", children: "No internet connection. You're working offline — captures stay on this device until you're back online." })
      ]
    }
  );
}
const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogPortal = AlertDialogPrimitive.Portal;
const AlertDialogOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AlertDialogPrimitive.Overlay,
  {
    className: cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props,
    ref
  }
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;
const AlertDialogContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxs(AlertDialogPortal, { children: [
  /* @__PURE__ */ jsx(AlertDialogOverlay, {}),
  /* @__PURE__ */ jsx(
    AlertDialogPrimitive.Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
        className
      ),
      ...props
    }
  )
] }));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;
const AlertDialogHeader = ({ className, ...props }) => /* @__PURE__ */ jsx("div", { className: cn("flex flex-col space-y-2 text-center sm:text-left", className), ...props });
AlertDialogHeader.displayName = "AlertDialogHeader";
const AlertDialogFooter = ({ className, ...props }) => /* @__PURE__ */ jsx(
  "div",
  {
    className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
    ...props
  }
);
AlertDialogFooter.displayName = "AlertDialogFooter";
const AlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AlertDialogPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold", className),
    ...props
  }
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;
const AlertDialogDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AlertDialogPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;
const AlertDialogAction = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(AlertDialogPrimitive.Action, { ref, className: cn(buttonVariants(), className), ...props }));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;
const AlertDialogCancel = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AlertDialogPrimitive.Cancel,
  {
    ref,
    className: cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className),
    ...props
  }
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;
function ConfirmModal({
  open,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel
}) {
  const lines = description.split("\n").filter((line) => line.length > 0);
  return /* @__PURE__ */ jsx(
    AlertDialog,
    {
      open,
      onOpenChange: (next) => {
        if (!next) onCancel();
      },
      children: /* @__PURE__ */ jsxs(AlertDialogContent, { className: "max-w-md rounded-2xl border-border/60 shadow-soft", children: [
        /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
          /* @__PURE__ */ jsx(AlertDialogTitle, { className: "font-display text-lg", children: title }),
          /* @__PURE__ */ jsx(AlertDialogDescription, { asChild: true, children: /* @__PURE__ */ jsx("div", { className: "space-y-2 text-sm text-muted-foreground", children: lines.map((line) => /* @__PURE__ */ jsx("p", { children: line }, line)) }) })
        ] }),
        /* @__PURE__ */ jsxs(AlertDialogFooter, { className: "gap-2 sm:gap-2", children: [
          /* @__PURE__ */ jsx(
            AlertDialogCancel,
            {
              className: "rounded-xl",
              onClick: (e) => {
                e.preventDefault();
                onCancel();
              },
              children: cancelLabel
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: destructive ? "destructive" : "default",
              className: cn(
                "rounded-xl",
                !destructive && "bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90"
              ),
              onClick: onConfirm,
              children: confirmLabel
            }
          )
        ] })
      ] })
    }
  );
}
const ConfirmModalContext = createContext(null);
function normalizeOptions(options) {
  return typeof options === "string" ? { description: options } : options;
}
function ConfirmModalProvider({ children }) {
  const [request, setRequest] = useState(null);
  const confirm = useCallback((options) => {
    const opts = normalizeOptions(options);
    return new Promise((resolve) => {
      setRequest({ ...opts, resolve });
    });
  }, []);
  const close = useCallback((confirmed) => {
    setRequest((current) => {
      current?.resolve(confirmed);
      return null;
    });
  }, []);
  const value = useMemo(() => ({ confirm }), [confirm]);
  return /* @__PURE__ */ jsxs(ConfirmModalContext.Provider, { value, children: [
    children,
    request ? /* @__PURE__ */ jsx(
      ConfirmModal,
      {
        open: true,
        title: request.title,
        description: request.description,
        confirmLabel: request.confirmLabel,
        cancelLabel: request.cancelLabel,
        destructive: request.destructive,
        onConfirm: () => close(true),
        onCancel: () => close(false)
      }
    ) : null
  ] });
}
function useConfirmModal() {
  const ctx = useContext(ConfirmModalContext);
  if (!ctx) {
    throw new Error("useConfirmModal must be used within ConfirmModalProvider");
  }
  return ctx;
}
const CONSENT_KEY = "cs-cookie-consent";
function loadCookieConsent() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function hasCookieConsent() {
  return loadCookieConsent() !== null;
}
function saveCookieConsent(consent) {
  const record = {
    essential: consent.essential,
    analytics: consent.analytics,
    acceptedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
    window.dispatchEvent(new CustomEvent("cs-cookie-consent-updated", { detail: record }));
  }
  return record;
}
function CookieConsentBanner() {
  const [needsConsent, setNeedsConsent] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const sync = () => {
      const pending = !hasCookieConsent();
      setNeedsConsent(pending);
      if (pending) setOpen(true);
    };
    sync();
    window.addEventListener("cs-cookie-consent-updated", sync);
    return () => window.removeEventListener("cs-cookie-consent-updated", sync);
  }, []);
  const accept = (analytics) => {
    saveCookieConsent({ essential: true, analytics });
    saveUserSettings({ cookiesAccepted: true, analyticsCookiesEnabled: analytics });
    setNeedsConsent(false);
    setOpen(false);
  };
  return /* @__PURE__ */ jsxs("div", { className: "cookie-fab fixed z-50 flex flex-col items-end gap-3", children: [
    open ? /* @__PURE__ */ jsxs(
      "div",
      {
        role: "dialog",
        "aria-label": "Cookie consent",
        className: cn(
          "w-[min(calc(100vw-2.5rem),20rem)] rounded-2xl border border-border/60",
          "bg-background/95 p-4 shadow-soft backdrop-blur-xl"
        ),
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-foreground", children: "Cookies & storage" }),
            !needsConsent ? /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setOpen(false),
                className: "rounded-lg p-1 text-muted-foreground hover:bg-muted",
                "aria-label": "Close",
                children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
              }
            ) : null
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "mt-2 text-xs leading-relaxed text-muted-foreground", children: [
            "Essential cookies keep navigation working. By continuing you agree to our Terms. Manage details in",
            " ",
            /* @__PURE__ */ jsx(Link, { to: "/settings", className: "text-primary underline-offset-2 hover:underline", children: "Preferences" }),
            "."
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-col gap-2", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                size: "sm",
                className: "w-full rounded-xl bg-gradient-primary shadow-glow",
                onClick: () => accept(true),
                children: "Accept all"
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "outline",
                size: "sm",
                className: "w-full rounded-xl",
                onClick: () => accept(false),
                children: "Essential only"
              }
            )
          ] })
        ]
      }
    ) : null,
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => setOpen((v) => !v),
        className: cn(
          "flex h-12 w-12 items-center justify-center rounded-2xl",
          "border border-border/60 bg-background/95 text-primary shadow-glow backdrop-blur-xl",
          "transition hover:scale-105 hover:bg-primary/10 active:scale-95",
          needsConsent && "ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
        ),
        "aria-label": open ? "Close cookie settings" : "Cookie settings",
        title: "Cookie settings",
        children: /* @__PURE__ */ jsx(Cookie, { className: "h-5 w-5" })
      }
    )
  ] });
}
async function countPendingZohoSync() {
  const queue = await getQueueItems();
  const queuePending = queue.filter(
    (item) => item.status === "pending" || item.status === "retrying"
  ).length;
  const contacts = await listStoredContacts();
  const contactsPending = contacts.filter(
    (c) => isContactPendingZoho(c)
  ).length;
  return { queue: queuePending, contacts: contactsPending };
}
async function maybeAutoSyncToZohoWhenOnline() {
  const empty = {
    ran: false,
    queueSynced: 0,
    queueTotal: 0,
    contactsSynced: 0,
    contactsTotal: 0
  };
  if (typeof navigator === "undefined" || !navigator.onLine) {
    return empty;
  }
  const prefs = loadUserSettings();
  if (!prefs.autoSyncToZohoWhenOnline) {
    return empty;
  }
  const queue = await getQueueItems();
  const queuePending = queue.filter(
    (item) => item.status === "pending" || item.status === "retrying"
  );
  const contacts = await listStoredContacts();
  const contactsPending = contacts.filter(
    (c) => isContactPendingZoho(c)
  );
  if (queuePending.length === 0 && contactsPending.length === 0) {
    return empty;
  }
  const result = await runAutoZohoSyncWhenOnline({
    skipWhatsApp: !prefs.whatsappNotificationsEnabled,
    skipEmail: !prefs.emailNotificationsEnabled
  });
  return { ran: true, ...result };
}
const autoZohoSync = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  countPendingZohoSync,
  maybeAutoSyncToZohoWhenOnline
}, Symbol.toStringTag, { value: "Module" }));
function useForceLightMode(active = true) {
  useEffect(() => {
    if (!active || typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("dark");
    root.style.colorScheme = "light";
    return () => {
      root.style.colorScheme = "";
    };
  }, [active]);
}
function AppShell() {
  const { queryClient } = useRouteContext({ from: "__root__" });
  const router2 = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isAuthRoute = pathname.startsWith("/auth");
  const authRequired = isAuthEnabled;
  useForceLightMode(isAuthRoute);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const routesToPreload = ["/scan", "/contacts", "/queue", "/settings"];
    routesToPreload.forEach((path) => {
      router2.preloadRoute({ to: path }).catch(() => void 0);
    });
    if ("serviceWorker" in navigator) {
      {
        navigator.serviceWorker.register("/sw.js").catch(() => void 0);
      }
    }
    const processAutoZohoSync = async () => {
      if (!navigator.onLine) return;
      const prefs = loadUserSettings();
      if (!prefs.autoSyncToZohoWhenOnline) return;
      try {
        const pending = await countPendingZohoSync();
        const totalPending = pending.queue + pending.contacts;
        if (totalPending === 0) return;
        const showToast = prefs.notificationsEnabled && prefs.queueNotificationsEnabled;
        if (showToast) {
          toast.info(`Syncing ${totalPending} contact(s) to Zoho CRM…`);
        }
        const summary = await maybeAutoSyncToZohoWhenOnline();
        if (!summary.ran) return;
        const synced = summary.queueSynced + summary.contactsSynced;
        const total = summary.queueTotal + summary.contactsTotal;
        if (synced > 0 && showToast) {
          toast.success(`Synced ${synced} of ${total} contact(s) to Zoho CRM.`);
        }
        window.dispatchEvent(new CustomEvent("cs-contacts-updated"));
        window.dispatchEvent(new CustomEvent("cs-queue-updated"));
      } catch {
      }
    };
    const handleOnline = () => {
      syncConnectionModeWithNetwork();
      void processAutoZohoSync();
    };
    const handleOffline = () => {
      syncConnectionModeWithNetwork();
    };
    if (!navigator.onLine) {
      syncConnectionModeWithNetwork();
    } else {
      void processAutoZohoSync();
    }
    const handleConnectionModeChange = (e) => {
      const mode = e.detail;
      if (mode === "online" && navigator.onLine) {
        void processAutoZohoSync();
      }
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("cs-connection-mode-changed", handleConnectionModeChange);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("cs-connection-mode-changed", handleConnectionModeChange);
    };
  }, [router2]);
  if (isAuthRoute) {
    return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsx(Outlet, {}) });
  }
  const appContent = /* @__PURE__ */ jsx(ConfirmModalProvider, { children: /* @__PURE__ */ jsxs(SidebarProvider, { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen w-full bg-background", children: [
      /* @__PURE__ */ jsx(AppSidebar, {}),
      /* @__PURE__ */ jsxs(SidebarInset, { className: "relative flex min-h-svh flex-1 flex-col bg-transparent", children: [
        /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-0 -z-10 bg-gradient-surface" }),
        /* @__PURE__ */ jsxs("div", { className: "sticky top-0 z-40 shrink-0 border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80", children: [
          /* @__PURE__ */ jsx(TopBar, {}),
          /* @__PURE__ */ jsx(NetworkOfflineBanner, {})
        ] }),
        /* @__PURE__ */ jsx("main", { className: "min-h-0 flex-1 w-full max-w-full overflow-x-hidden overflow-y-auto", children: /* @__PURE__ */ jsx(Outlet, {}) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(CookieConsentBanner, {})
  ] }) });
  return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: authRequired ? /* @__PURE__ */ jsx(AuthGate, { children: appContent }) : appContent });
}
function RootLayout() {
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxs(
    NeonAuthUIProvider,
    {
      authClient,
      defaultTheme: "light",
      navigate: (href) => {
        navigate({ to: href });
      },
      credentials: { forgotPassword: true },
      children: [
        /* @__PURE__ */ jsx(AppShell, {}),
        /* @__PURE__ */ jsx(Toaster, { position: "top-right" })
      ]
    }
  );
}
function NotFoundPage() {
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-10 sm:py-14", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-2xl text-center", children: [
    /* @__PURE__ */ jsxs("div", { className: "relative mx-auto mb-8 max-w-xl overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-violet-500/10 p-2 shadow-elevated", children: [
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/20 blur-3xl" }),
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-violet-500/15 blur-3xl" }),
      /* @__PURE__ */ jsx(
        "img",
        {
          src: "/images/404-highlight.png",
          alt: "Illustration of a business card being searched — page not found",
          className: "relative z-10 w-full rounded-2xl object-cover",
          width: 960,
          height: 540,
          loading: "eager"
        }
      )
    ] }),
    /* @__PURE__ */ jsx("p", { className: "font-display text-8xl font-bold tracking-tighter text-transparent bg-gradient-to-br from-primary via-violet-500 to-primary bg-clip-text sm:text-9xl", children: "404" }),
    /* @__PURE__ */ jsx("h1", { className: "mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl", children: "This page isn't here" }),
    /* @__PURE__ */ jsx("p", { className: "mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base", children: "The link may be broken, or the page was moved. Head back to scan cards and manage your contacts." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row", children: [
      /* @__PURE__ */ jsx(Button, { asChild: true, className: "w-full rounded-xl bg-gradient-primary shadow-glow sm:w-auto", children: /* @__PURE__ */ jsxs(Link, { to: "/scan", children: [
        /* @__PURE__ */ jsx(ScanLine, { className: "mr-2 h-4 w-4" }),
        "Go to Scan"
      ] }) }),
      /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", className: "w-full rounded-xl border-border/60 sm:w-auto", children: /* @__PURE__ */ jsxs(Link, { to: "/", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
        "Home"
      ] }) })
    ] })
  ] }) });
}
function RouteErrorPage({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold tracking-tight text-foreground", children: "This page didn't load" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Something went wrong. Try again or head home." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-xl bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const Route$a = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CardSync AI — AI Business Card Scanner" },
      {
        name: "description",
        content: "AI-powered offline-first business card scanner with intelligent queueing for enterprise networking."
      },
      { name: "author", content: "CardSync AI" },
      { property: "og:title", content: "CardSync AI" },
      {
        property: "og:description",
        content: "AI-powered offline-first lead capture for enterprise networking events."
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" }
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/logo.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Inter+Tight:wght@500;600;700&display=swap"
      }
    ]
  }),
  shellComponent: RootDocument,
  component: RootLayout,
  notFoundComponent: NotFoundPage,
  errorComponent: RouteErrorPage
});
const $$splitComponentImporter$8 = () => import("./status-ClxH8yKb.js");
const Route$9 = createFileRoute("/status")({
  head: () => ({
    meta: [{
      title: "API Status · CardSync AI"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./settings-CJ3pBful.js");
const Route$8 = createFileRoute("/settings")({
  head: () => ({
    meta: [{
      title: "Preferences · CardSync AI"
    }, {
      name: "description",
      content: "Profile, notifications, terms, privacy, cookies, and device data for your workspace."
    }, {
      property: "og:title",
      content: "Preferences · CardSync AI"
    }, {
      property: "og:description",
      content: "Configure your CardSync AI workspace."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./scan-Que_wRqQ.js");
function ScanRoutePending() {
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-7xl animate-pulse space-y-6 px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-10", children: [
    /* @__PURE__ */ jsx("div", { className: "h-28 rounded-2xl bg-muted/50" }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-5", children: [
      /* @__PURE__ */ jsx("div", { className: "h-96 rounded-2xl bg-muted/50 lg:col-span-3" }),
      /* @__PURE__ */ jsx("div", { className: "h-96 rounded-2xl bg-muted/50 lg:col-span-2" })
    ] })
  ] });
}
const Route$7 = createFileRoute("/scan")({
  pendingMs: 0,
  pendingComponent: ScanRoutePending,
  head: () => ({
    meta: [{
      title: "Capture a card · CardSync AI"
    }, {
      name: "description",
      content: "Photograph or upload a business card. On-device OCR extracts contact details in seconds."
    }, {
      property: "og:title",
      content: "Capture a card · CardSync AI"
    }, {
      property: "og:description",
      content: "Turn business cards into structured leads with intelligent on-device capture."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./review-BmJoiuvH.js");
const Route$6 = createFileRoute("/review")({
  head: () => ({
    meta: [{
      title: "Review extracted details · CardSync AI"
    }, {
      name: "description",
      content: "Review OCR extracted business card details before saving."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./queue-6fk-a-Z5.js");
const Route$5 = createFileRoute("/queue")({
  head: () => ({
    meta: [{
      title: "Sync queue · CardSync AI"
    }, {
      name: "description",
      content: "Review and save contacts captured offline or awaiting sync on this device."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./events-BGM7x9m7.js");
const eventsSearchSchema = z.object({
  event: z.string().optional().catch("")
});
const Route$4 = createFileRoute("/events")({
  validateSearch: eventsSearchSchema,
  head: () => ({
    meta: [{
      title: "Events · CardSync AI"
    }, {
      name: "description",
      content: "Browse event folders and view leads collected at each event."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./contacts-Bgazhhad.js");
const contactsSearchSchema = z.object({
  q: z.string().optional().catch(""),
  event: z.string().optional().catch(""),
  /** Row key from contactRowKey — highlights matching table/card row */
  highlight: z.string().optional().catch(void 0)
});
const Route$3 = createFileRoute("/contacts")({
  validateSearch: contactsSearchSchema,
  head: () => ({
    meta: [{
      title: "Contact List · CardSync AI"
    }, {
      name: "description",
      content: "Search, filter, and manage every lead saved on this device."
    }, {
      property: "og:title",
      content: "Contact directory · CardSync AI"
    }, {
      property: "og:description",
      content: "Your complete lead library, organised by status and channel."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./analytics-Bs77ePje.js");
const Route$2 = createFileRoute("/analytics")({
  head: () => ({
    meta: [{
      title: "Analytics · CardSync AI"
    }, {
      name: "description",
      content: "(Removed) Redirecting to Queue Center."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const Route$1 = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Scan Card · CardSync AI" },
      { name: "description", content: "Capture business cards with AI-powered OCR." },
      { property: "og:title", content: "Scan a card · CardSync AI" },
      { property: "og:description", content: "AI extracts contact details from any business card in seconds." }
    ]
  }),
  beforeLoad: () => {
    throw redirect({ to: "/scan", replace: true });
  }
});
const $$splitComponentImporter = () => import("./auth._pathname-C1HnT3OK.js");
const Route = createFileRoute("/auth/$pathname")({
  ssr: false,
  head: ({
    params
  }) => ({
    meta: [{
      title: params.pathname === "sign-up" ? "Create account · CardSync AI" : params.pathname === "forgot-password" ? "Reset password · CardSync AI" : "Sign in · CardSync AI"
    }]
  }),
  beforeLoad: async ({
    params
  }) => {
    if (params.pathname === "sign-out") {
      clearAuthTokenCache();
      await authClient.signOut();
      throw redirect({
        to: "/auth/$pathname",
        params: {
          pathname: "sign-in"
        },
        replace: true
      });
    }
    if (params.pathname === "reset-password") {
      throw redirect({
        to: "/auth/$pathname",
        params: {
          pathname: "forgot-password"
        },
        replace: true
      });
    }
  },
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const StatusRoute = Route$9.update({
  id: "/status",
  path: "/status",
  getParentRoute: () => Route$a
});
const SettingsRoute = Route$8.update({
  id: "/settings",
  path: "/settings",
  getParentRoute: () => Route$a
});
const ScanRoute = Route$7.update({
  id: "/scan",
  path: "/scan",
  getParentRoute: () => Route$a
});
const ReviewRoute = Route$6.update({
  id: "/review",
  path: "/review",
  getParentRoute: () => Route$a
});
const QueueRoute = Route$5.update({
  id: "/queue",
  path: "/queue",
  getParentRoute: () => Route$a
});
const EventsRoute = Route$4.update({
  id: "/events",
  path: "/events",
  getParentRoute: () => Route$a
});
const ContactsRoute = Route$3.update({
  id: "/contacts",
  path: "/contacts",
  getParentRoute: () => Route$a
});
const AnalyticsRoute = Route$2.update({
  id: "/analytics",
  path: "/analytics",
  getParentRoute: () => Route$a
});
const IndexRoute = Route$1.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$a
});
const AuthPathnameRoute = Route.update({
  id: "/auth/$pathname",
  path: "/auth/$pathname",
  getParentRoute: () => Route$a
});
const rootRouteChildren = {
  IndexRoute,
  AnalyticsRoute,
  ContactsRoute,
  EventsRoute,
  QueueRoute,
  ReviewRoute,
  ScanRoute,
  SettingsRoute,
  StatusRoute,
  AuthPathnameRoute
};
const routeTree = Route$a._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  deleteStoredContact as $,
  API_BASE_URL as A,
  Button as B,
  CONNECTION_MODE_CHANGED as C,
  DEFAULT_USER_SETTINGS as D,
  resolveEventForSave as E,
  loadEvents as F,
  checkStorageHealth as G,
  storageLabel as H,
  Input as I,
  updateContact as J,
  pickPrimaryEmail as K,
  syncContactToZohoStorage as L,
  saveContact as M,
  syncAllQueueItemsToZoho as N,
  removeQueueItem as O,
  PAGE as P,
  updateQueueItem as Q,
  syncQueueItemToZoho as R,
  Route$4 as S,
  TIMEZONE_OPTIONS as T,
  useContactsDirectory as U,
  purgeOrphanExampleEvent as V,
  rememberEvent as W,
  contactRowKey as X,
  removeOutreachStatusForContact as Y,
  deleteZohoLead as Z,
  getStoredContactById as _,
  getCurrentAppUser as a,
  contactBelongsToAppUser as a0,
  optimisticallyRemoveDirectoryContact as a1,
  resolveChannelIconStatus as a2,
  Route$3 as a3,
  syncAllPendingToZohoStorage as a4,
  resolvePostAuthPath as a5,
  AppLogo as a6,
  clearAuthTokenCache as a7,
  neonAuthConfigIssue as a8,
  neonAuthUrl as a9,
  useForceLightMode as aa,
  Route as ab,
  indexeddb as ac,
  autoZohoSync as ad,
  router as ae,
  apiFetch as b,
  clearUserBrowserData as c,
  clearOutreachStatusForUser as d,
  cn as e,
  authClient as f,
  getQueueItems as g,
  getUserInitials as h,
  invalidateContactsDirectory as i,
  loadUserSettings as j,
  hasCookieConsent as k,
  listContacts as l,
  applyWorkModePreference as m,
  saveUserSettings as n,
  saveCookieConsent as o,
  getConnectionMode as p,
  useUserSettings as q,
  getLastUsedEventName as r,
  syncProfileFromAuthUser as s,
  getCachedContacts as t,
  useConfirmModal as u,
  cacheContacts as v,
  listStoredContacts as w,
  listEventNames as x,
  getExampleEventName as y,
  isOfflineMode as z
};
