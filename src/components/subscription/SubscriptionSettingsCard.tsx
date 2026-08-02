import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CreditCard, Loader2, RefreshCw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useStorageQuota } from "@/contexts/StorageQuotaContext";
import { loadBillingCycle, saveBillingCycle } from "@/lib/freemiumWelcome";
import type { BillingCycle } from "@/lib/subscriptionPlans";
import { cn } from "@/lib/utils";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/40 py-2.5 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums text-foreground">{value}</span>
    </div>
  );
}

export function SubscriptionSettingsCard() {
  const { quota, loading, error, refresh } = useStorageQuota();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  useEffect(() => {
    setCycle(loadBillingCycle());
  }, []);

  const onCycle = (next: BillingCycle) => {
    setCycle(next);
    saveBillingCycle(next);
  };

  return (
    <Card className="rounded-2xl border-border/60 p-6 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CreditCard className="h-4 w-4 text-primary" />
          Subscription
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => void refresh()}
          disabled={loading}
          aria-label="Refresh subscription"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Plan limits, storage usage, and renewal preference for your company.
      </p>

      {loading && !quota.storageLimitBytes ? (
        <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading subscription…
        </div>
      ) : error ? (
        <p className="mt-5 text-sm text-destructive">{error}</p>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-1">
            <Row label="Current Plan" value={quota.planName} />
            <Row label="Storage Limit" value={quota.limitLabel} />
            <Row label="Used Storage" value={quota.usedLabel} />
            <Row label="Remaining Storage" value={quota.remainingLabel} />
            <Row label="Usage Percentage" value={`${quota.usedPercentage}%`} />
            <Row label="Renewal Type" value={cycle === "monthly" ? "Monthly" : "Annual"} />
          </div>

          <div>
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>Usage</span>
              <span className="font-medium text-foreground">{quota.usedPercentage}%</span>
            </div>
            <Progress value={Math.min(100, Math.max(0, quota.usedPercentage))} className="h-2.5" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Renewal</span>
            <div className="inline-flex rounded-lg border border-border/60 bg-background p-0.5">
              <button
                type="button"
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  cycle === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
                onClick={() => onCycle("monthly")}
              >
                Monthly
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  cycle === "annual" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
                onClick={() => onCycle("annual")}
              >
                Annual
              </button>
            </div>
          </div>

          <Button asChild className="w-full rounded-md bg-gradient-primary shadow-glow sm:w-auto">
            <Link to="/subscription">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Upgrade
            </Link>
          </Button>
        </div>
      )}
    </Card>
  );
}
