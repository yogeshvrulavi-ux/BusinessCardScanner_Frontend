import { Link } from "@tanstack/react-router";
import { AlertTriangle, Ban, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useStorageQuota } from "@/contexts/StorageQuotaContext";
import { cn } from "@/lib/utils";

export function StorageWarningBanner({ className }: { className?: string }) {
  const { quota, isBlocked } = useStorageQuota();
  const level = quota.warningLevel;

  if (level === "NORMAL") return null;

  const copy =
    level === "BLOCKED" || isBlocked
      ? {
          title: "Storage Limit Reached (100%)",
          body: "Capture is disabled. Upgrade your subscription to continue scanning.",
          icon: Ban,
          tone: "border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-200",
        }
      : level === "CRITICAL"
        ? {
            title: "Storage Critically Low (90%+)",
            body: `You've used ${quota.usedPercentage}% of your ${quota.planName} plan (${quota.usedLabel} / ${quota.limitLabel}).`,
            icon: AlertTriangle,
            tone: "border-orange-500/40 bg-orange-500/10 text-orange-900 dark:text-orange-100",
          }
        : {
            title: "Storage Almost Full (80%+)",
            body: `You've used ${quota.usedPercentage}% of your plan storage (${quota.usedLabel} / ${quota.limitLabel}).`,
            icon: Sparkles,
            tone: "border-amber-400/50 bg-amber-400/15 text-amber-950 dark:text-amber-100",
          };

  const Icon = copy.icon;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        copy.tone,
        className,
      )}
      role="status"
    >
      <div className="flex min-w-0 items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-semibold">{copy.title}</div>
          <p className="text-xs opacity-90">{copy.body}</p>
        </div>
      </div>
      <Button asChild size="sm" className="shrink-0 rounded-lg bg-gradient-primary shadow-glow">
        <Link to="/subscription">Upgrade Now</Link>
      </Button>
    </div>
  );
}
