import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { hasCookieConsent, saveCookieConsent } from "@/lib/cookieConsent";
import { saveUserSettings } from "@/lib/settingsStorage";

export function CookieConsentBanner() {
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

  const accept = (analytics: boolean) => {
    saveCookieConsent({ essential: true, analytics });
    saveUserSettings({ cookiesAccepted: true, analyticsCookiesEnabled: analytics });
    setNeedsConsent(false);
    setOpen(false);
  };

  return (
    <div className="cookie-fab fixed z-50 flex flex-col items-end gap-3">
      {open ? (
        <div
          role="dialog"
          aria-label="Cookie consent"
          className={cn(
            "w-[min(calc(100vw-2.5rem),20rem)] rounded-2xl border border-border/60",
            "bg-background/95 p-4 shadow-soft backdrop-blur-xl",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-foreground">Cookies & storage</p>
            {!needsConsent ? (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Essential cookies keep navigation working. By continuing you agree to our Terms.
            Manage details in{" "}
            <Link to="/settings" className="text-primary underline-offset-2 hover:underline">
              Preferences
            </Link>
            .
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              size="sm"
              className="w-full h-9 rounded-md bg-gradient-primary shadow-glow"
              onClick={() => accept(true)}
            >
              Accept all
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-full rounded-md"
              onClick={() => accept(false)}
            >
              Essential only
            </Button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-2xl",
          "border border-border/60 bg-background/95 text-primary shadow-glow backdrop-blur-xl",
          "transition hover:scale-105 hover:bg-primary/10 active:scale-95",
          needsConsent && "ring-2 ring-primary/40 ring-offset-2 ring-offset-background",
        )}
        aria-label={open ? "Close cookie settings" : "Cookie settings"}
        title="Cookie settings"
      >
        <Cookie className="h-5 w-5" />
      </button>
    </div>
  );
}
