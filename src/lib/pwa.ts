/**
 * Progressive Web App helpers — service worker registration + install prompt.
 *
 * Root cause of “install only once”: `beforeinstallprompt` often fires before React
 * mounts. Listening only from AppShell (and skipping auth routes) misses the event
 * for the whole document lifetime. Capture must start as early as possible and the
 * deferred event must be kept until prompt() is used or the app is installed.
 */

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const INSTALL_EVENT = "cs-pwa-install-available";
const INSTALL_GONE_EVENT = "cs-pwa-install-gone";
/** Session-only: hides the top banner. Does not clear the deferred install prompt. */
const BANNER_DISMISSED_SESSION_KEY = "cs-pwa-install-banner-dismissed";
const EARLY_PROMPT_KEY = "__ncsDeferredInstallPrompt";

type EarlyPromptWindow = Window & {
  [EARLY_PROMPT_KEY]?: BeforeInstallPromptEvent | null;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let listenersAttached = false;
let serviceWorkerWired = false;

function getEarlyWindow(): EarlyPromptWindow | null {
  if (typeof window === "undefined") return null;
  return window as EarlyPromptWindow;
}

function notifyInstallAvailable(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(INSTALL_EVENT));
}

function notifyInstallGone(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(INSTALL_GONE_EVENT));
}

function storeDeferredPrompt(event: BeforeInstallPromptEvent): void {
  // Keep the same event instance until prompt() or appinstalled.
  deferredPrompt = event;
  const win = getEarlyWindow();
  if (win) win[EARLY_PROMPT_KEY] = event;
  notifyInstallAvailable();
}

function clearDeferredPrompt(): void {
  deferredPrompt = null;
  const win = getEarlyWindow();
  if (win) win[EARLY_PROMPT_KEY] = null;
  notifyInstallGone();
}

/** Pull any event captured by the head bootstrap script before this module ran. */
function adoptEarlyDeferredPrompt(): void {
  const win = getEarlyWindow();
  if (!win) return;
  const early = win[EARLY_PROMPT_KEY];
  if (early) {
    deferredPrompt = early;
  }
}

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  if (deferredPrompt) return deferredPrompt;
  adoptEarlyDeferredPrompt();
  return deferredPrompt;
}

export function clearDeferredInstallPrompt(): void {
  clearDeferredPrompt();
}

/** True when a deferred install prompt is available and the app is not already installed. */
export function canPromptInstall(): boolean {
  if (isStandaloneDisplay()) return false;
  return Boolean(getDeferredInstallPrompt());
}

export function wasInstallBannerDismissed(): boolean {
  try {
    return sessionStorage.getItem(BANNER_DISMISSED_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissInstallBanner(): void {
  try {
    sessionStorage.setItem(BANNER_DISMISSED_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || iosStandalone;
}

/**
 * Idempotent PWA bootstrap: early install-prompt capture + production SW registration.
 * Safe to call from RootLayout and AppShell.
 */
export function registerNameCardScanPwa(): void {
  if (typeof window === "undefined") return;

  adoptEarlyDeferredPrompt();

  if (!listenersAttached) {
    listenersAttached = true;

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      storeDeferredPrompt(event as BeforeInstallPromptEvent);
    });

    window.addEventListener("appinstalled", () => {
      clearDeferredPrompt();
    });
  }

  // If the head script already captured a prompt, surface it to React listeners.
  if (deferredPrompt && !isStandaloneDisplay()) {
    notifyInstallAvailable();
  }

  if (!("serviceWorker" in navigator) || serviceWorkerWired) return;
  serviceWorkerWired = true;

  if (import.meta.env.DEV) {
    // Dev: avoid stale SW/cache fighting Vite HMR. Installability is verified on prod builds.
    void navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((reg) => reg.unregister())))
      .then(() => caches.keys())
      .then((names) => Promise.all(names.map((name) => caches.delete(name))))
      .catch(() => undefined);
    return;
  }

  void navigator.serviceWorker
    .register("/sw.js")
    .then((registration) => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            worker.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    })
    .catch(() => undefined);

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

/**
 * Show the browser install dialog using the saved beforeinstallprompt event.
 * Clears the deferred prompt only after the browser resolves userChoice (accepted or dismissed),
 * because a single BeforeInstallPromptEvent can only call prompt() once.
 */
export async function promptInstallNameCardScan(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const promptEvent = getDeferredInstallPrompt();
  if (!promptEvent || isStandaloneDisplay()) return "unavailable";
  try {
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    clearDeferredPrompt();
    return choice.outcome;
  } catch {
    return "unavailable";
  }
}

export { INSTALL_EVENT, INSTALL_GONE_EVENT };
