import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useStorageQuota } from "@/contexts/StorageQuotaContext";
import { cn } from "@/lib/utils";

/** Current plan + storage usage panel for the Subscription homepage. */
export function CurrentPlanPanel({ className }: { className?: string }) {
  const { quota, loading, isBlocked } = useStorageQuota();

  const barTone =
    quota.warningLevel === "BLOCKED"
      ? "[&>div]:bg-destructive"
      : quota.warningLevel === "CRITICAL"
        ? "[&>div]:bg-orange-500"
        : quota.warningLevel === "WARNING"
          ? "[&>div]:bg-amber-400"
          : "";

  const banner =
    quota.warningLevel === "BLOCKED"
      ? {
          className: "border-destructive/40 bg-destructive/10 text-destructive",
          title: "Storage limit reached",
          body: "Capture is disabled until you free space or upgrade.",
        }
      : quota.warningLevel === "CRITICAL"
        ? {
            className: "border-orange-500/40 bg-orange-500/10 text-orange-900 dark:text-orange-100",
            title: "Storage critically low (90%+)",
            body: "Upgrade soon to avoid interrupting scans.",
          }
        : quota.warningLevel === "WARNING"
          ? {
              className: "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100",
              title: "Storage almost full (80%+)",
              body: "Consider upgrading before you hit the limit.",
            }
          : null;

  return (
    <Card className={cn("rounded-2xl border-border/60 p-5 shadow-soft sm:p-6", className)}>
      {banner ? (
        <div className={cn("mb-4 rounded-xl border px-3.5 py-2.5 text-sm", banner.className)}>
          <p className="font-semibold">{banner.title}</p>
          <p className="mt-0.5 text-xs opacity-90">{banner.body}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Current plan
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">{quota.planName}</h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              {quota.plan}
            </span>
            {isBlocked ? (
              <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-destructive">
                Limit reached
              </span>
            ) : null}
          </div>
        </div>
        <Button asChild className="rounded-lg bg-gradient-primary shadow-glow">
          <a href="#plans">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Upgrade
          </a>
        </Button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Metric label="Storage used" value={loading ? "…" : quota.usedLabel} />
        <Metric label="Remaining" value={loading ? "…" : quota.remainingLabel} />
        <Metric label="Usage" value={`${quota.usedPercentage}%`} />
      </div>

      <div className="mt-5">
        <Progress
          value={Math.min(100, Math.max(0, quota.usedPercentage))}
          className={cn("h-2.5", barTone)}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          {quota.usedLabel} of {quota.limitLabel} used
        </p>
      </div>

      {isBlocked ? (
        <p className="mt-3 text-xs text-destructive">
          Capture is disabled.{" "}
          <Link to="/subscription" hash="plans" className="font-semibold underline">
            Upgrade your plan
          </Link>{" "}
          to continue scanning.
        </p>
      ) : null}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/25 px-3.5 py-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-base font-semibold tabular-nums tracking-tight">{value}</div>
    </div>
  );
}
