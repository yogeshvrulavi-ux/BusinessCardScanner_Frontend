import { Link } from "@tanstack/react-router";
import { HardDrive, Loader2, RefreshCw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useStorageQuota } from "@/contexts/StorageQuotaContext";
import { cn } from "@/lib/utils";

export function StorageQuotaCard({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { quota, loading, error, refresh, isBlocked } = useStorageQuota();

  const barClass =
    quota.warningLevel === "BLOCKED"
      ? "[&>div]:bg-destructive"
      : quota.warningLevel === "CRITICAL"
        ? "[&>div]:bg-amber-500"
        : quota.warningLevel === "WARNING"
          ? "[&>div]:bg-primary"
          : "";

  return (
    <Card
      className={cn(
        "flex h-full flex-col rounded-2xl border-border/60 p-6 shadow-soft",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <HardDrive className="h-4 w-4 text-primary" />
          Storage Usage
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => void refresh()}
          disabled={loading}
          aria-label="Refresh storage quota"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </Button>
      </div>

      {!compact ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Live company quota from your subscription plan.
        </p>
      ) : null}

      {loading && quota.usedStorageBytes === 0 && !error ? (
        <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading plan usage…
        </div>
      ) : error ? (
        <p className="mt-5 text-sm text-destructive">{error}</p>
      ) : (
        <div className="mt-4 flex flex-1 flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Current Plan
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-lg font-semibold tracking-tight">{quota.planName}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  {quota.plan}
                </span>
              </div>
            </div>
            {isBlocked ? (
              <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                Full
              </span>
            ) : null}
          </div>

          <div>
            <div className="mb-2 flex items-end justify-between gap-2">
              <div className="text-sm font-medium tabular-nums">
                {quota.usedLabel}{" "}
                <span className="text-muted-foreground">/ {quota.limitLabel}</span>
              </div>
              <div className="text-sm font-semibold tabular-nums text-primary">
                {quota.usedPercentage}%
              </div>
            </div>
            <Progress
              value={Math.min(100, Math.max(0, quota.usedPercentage))}
              className={cn("h-2.5", barClass)}
            />
            <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
              <span>Remaining {quota.remainingLabel}</span>
              <span>{quota.warningLevel === "NORMAL" ? "Healthy" : quota.warningLevel}</span>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            <Button asChild className="rounded-md bg-gradient-primary shadow-glow">
              <Link to="/subscription">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Upgrade Plan
              </Link>
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
