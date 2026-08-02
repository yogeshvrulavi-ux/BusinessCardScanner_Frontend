import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStorageQuota } from "@/contexts/StorageQuotaContext";
import {
  markEightyPercentReminderShown,
  markFreemiumWelcomeSeenThisSession,
  setSuppressFreemiumWelcome,
  shouldShowEightyPercentReminder,
  shouldSuppressFreemiumWelcome,
  wasFreemiumWelcomeSeenThisSession,
} from "@/lib/freemiumWelcome";

const INCLUDED = ["20 MB Storage", "OCR", "WhatsApp", "Email"] as const;
const UPGRADES = ["1 GB", "5 GB", "10 GB"] as const;

/**
 * Freemium / storage reminder — first login, 80%+ day reminder, Capture when almost full.
 * Respects "Don't show again today" and a per-session dismiss so it is not spammy.
 */
export function FreemiumWelcomeModal() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { quota, loading } = useStorageQuota();
  const [open, setOpen] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);
  const [mode, setMode] = useState<"welcome" | "storage">("welcome");

  useEffect(() => {
    if (loading) return;
    if (shouldSuppressFreemiumWelcome()) return;
    if (wasFreemiumWelcomeSeenThisSession()) return;

    const almostFull = quota.usedPercentage >= 80 || !quota.canUpload;
    const onCapture = pathname === "/scan";
    const isFreemium = quota.plan === "FREEMIUM";

    let shouldOpen = false;
    let nextMode: "welcome" | "storage" = "welcome";

    if (almostFull && shouldShowEightyPercentReminder()) {
      shouldOpen = true;
      nextMode = "storage";
      markEightyPercentReminderShown();
    } else if (onCapture && almostFull) {
      shouldOpen = true;
      nextMode = "storage";
    } else if (isFreemium && !almostFull) {
      shouldOpen = true;
      nextMode = "welcome";
    }

    if (!shouldOpen) return;
    setMode(nextMode);
    setOpen(true);
    markFreemiumWelcomeSeenThisSession();
  }, [
    loading,
    quota.plan,
    quota.usedPercentage,
    quota.canUpload,
    pathname,
  ]);

  const dismiss = () => {
    if (dontShowToday) setSuppressFreemiumWelcome(true);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
        else setOpen(true);
      }}
    >
      <DialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-lg">
        <div className="bg-gradient-to-br from-primary/12 via-background to-background px-6 pb-4 pt-6">
          <DialogHeader className="space-y-3 text-left">
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-3 w-3" />
              {mode === "storage" ? "Storage" : "Freemium"}
            </div>
            <DialogTitle className="text-xl font-semibold tracking-tight">
              {mode === "storage" ? "Storage almost full" : "Welcome to NameCardScan"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {mode === "storage"
                ? `You've used ${quota.usedPercentage}% of your ${quota.planName} plan (${quota.usedLabel} / ${quota.limitLabel}).`
                : "You are currently using the Freemium Plan."}
            </p>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Included
            </p>
            <ul className="mt-2 grid grid-cols-2 gap-2">
              {INCLUDED.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-2.5 py-2 text-sm"
                >
                  <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Upgrade anytime to unlock
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {UPGRADES.map((tier) => (
                <span
                  key={tier}
                  className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
                >
                  {tier}
                </span>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <Checkbox
              checked={dontShowToday}
              onCheckedChange={(v) => setDontShowToday(v === true)}
            />
            Don&apos;t show again today
          </label>
        </div>

        <DialogFooter className="gap-2 border-t border-border/50 bg-muted/20 px-6 py-4 sm:justify-between">
          <Button type="button" variant="outline" className="rounded-lg" onClick={dismiss}>
            Continue
          </Button>
          <Button asChild className="rounded-lg bg-gradient-primary shadow-glow" onClick={dismiss}>
            <Link to="/subscription">Upgrade Now</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
