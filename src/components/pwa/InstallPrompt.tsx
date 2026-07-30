import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  INSTALL_EVENT,
  INSTALL_GONE_EVENT,
  canPromptInstall,
  dismissInstallBanner,
  isStandaloneDisplay,
  promptInstallNameCardScan,
  wasInstallBannerDismissed,
} from "@/lib/pwa";

/**
 * Lightweight install banner — shown when the browser fires beforeinstallprompt.
 * Dismiss is session-only; Install App remains available from the profile menu.
 */
export function InstallPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandaloneDisplay() || wasInstallBannerDismissed()) return;

    const show = () => {
      if (canPromptInstall() && !wasInstallBannerDismissed()) setVisible(true);
    };
    const hide = () => setVisible(false);
    window.addEventListener(INSTALL_EVENT, show);
    window.addEventListener(INSTALL_GONE_EVENT, hide);
    window.addEventListener("appinstalled", hide);
    show();
    const timer = window.setTimeout(show, 0);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(INSTALL_EVENT, show);
      window.removeEventListener(INSTALL_GONE_EVENT, hide);
      window.removeEventListener("appinstalled", hide);
    };
  }, []);

  if (!visible || isStandaloneDisplay()) return null;

  return (
    <div
      role="dialog"
      aria-label="Install NameCardScan"
      className="flex items-center gap-3 border-b border-border/60 bg-card/90 px-3 py-2 text-sm shadow-soft sm:px-4 md:px-6"
    >
      <img
        src="/icons/icon-192.png"
        alt=""
        className="h-8 w-8 shrink-0 rounded-md object-contain"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">Install NameCardScan</p>
        <p className="truncate text-xs text-muted-foreground">
          Add to your home screen for offline capture and faster launch.
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        className="h-8 shrink-0 rounded-md bg-gradient-primary px-3 text-xs"
        onClick={() => {
          void promptInstallNameCardScan().then((outcome) => {
            if (outcome !== "unavailable") setVisible(false);
          });
        }}
      >
        <Download className="mr-1.5 h-3.5 w-3.5" />
        Install
      </Button>
      <button
        type="button"
        aria-label="Dismiss install prompt"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        onClick={() => {
          dismissInstallBanner();
          setVisible(false);
        }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
