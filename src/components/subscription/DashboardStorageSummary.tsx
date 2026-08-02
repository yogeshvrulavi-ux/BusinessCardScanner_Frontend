import { Link } from "@tanstack/react-router";
import { ArrowUpRight, HardDrive } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useStorageQuota } from "@/contexts/StorageQuotaContext";
import { cn } from "@/lib/utils";

/** Compact premium storage summary for the Dashboard only. */
export function DashboardStorageSummary({ className }: { className?: string }) {
  const { quota, loading, isBlocked } = useStorageQuota();

  const barTone =
    quota.warningLevel === "BLOCKED"
      ? "[&>div]:bg-destructive"
      : quota.warningLevel === "CRITICAL"
        ? "[&>div]:bg-amber-500"
        : "";

  return (
    <Card
      className={cn(
        "rounded-2xl border-border/60 bg-card p-4 shadow-soft sm:p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HardDrive className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Storage
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold tracking-tight">Summary</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                {quota.planName}
              </span>
              {isBlocked ? (
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                  Full
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <Button asChild size="sm" className="h-8 shrink-0 rounded-lg bg-gradient-primary px-3 text-xs shadow-glow">
          <Link to="/subscription">
            Upgrade
            <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold tabular-nums">
            {loading ? "…" : quota.usedLabel}
            <span className="font-normal text-muted-foreground"> / {quota.limitLabel}</span>
          </span>
          <span className="text-xs font-semibold tabular-nums text-primary">
            {quota.usedPercentage}%
          </span>
        </div>
        <Progress
          value={Math.min(100, Math.max(0, quota.usedPercentage))}
          className={cn("h-2", barTone)}
        />
        <p className="mt-2 text-[11px] text-muted-foreground">
          Remaining <span className="font-medium text-foreground">{quota.remainingLabel}</span>
        </p>
      </div>
    </Card>
  );
}
