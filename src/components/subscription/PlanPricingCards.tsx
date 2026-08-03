import { Check, Crown, Mail, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  annualSavingsPercent,
  ENTERPRISE_SALES_EMAIL,
  formatPlanPrice,
  formatStorageWithCardEstimate,
  SUBSCRIPTION_PLANS,
  type BillingCycle,
  type PlanId,
  type SubscriptionPlan,
} from "@/lib/subscriptionPlans";
import { cn } from "@/lib/utils";

type PlanPricingCardsProps = {
  cycle: BillingCycle;
  currentPlanId: PlanId | string;
};

export function PlanPricingCards({ cycle, currentPlanId }: PlanPricingCardsProps) {
  const current = String(currentPlanId || "FREEMIUM").toUpperCase();

  const onSelect = (plan: SubscriptionPlan) => {
    if (plan.contactSales) {
      window.location.href = `mailto:${ENTERPRISE_SALES_EMAIL}?subject=${encodeURIComponent("Enterprise plan inquiry")}`;
      return;
    }
    if (plan.id === current) {
      toast.info(`You are already on the ${plan.name} plan.`);
      return;
    }
    if (plan.id === "FREEMIUM") {
      toast.info("Freemium is your starting plan. Choose a paid tier to upgrade.");
      return;
    }
    if (plan.id === "RENEWER") {
      toast.success("Renewer Pack selected", {
        description:
          "This pack retains your existing contacts and organisation data until you renew a full plan.",
      });
      return;
    }
    toast.success(`${plan.name} selected`, {
      description:
        "Upgrade requests are recorded. Your administrator will confirm billing to activate the new storage limit.",
    });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6">
      {SUBSCRIPTION_PLANS.map((plan) => {
        const isCurrent = plan.id === current || (current === "PROFESSIONAL" && plan.id === "GROWTH");
        const price = formatPlanPrice(
          cycle === "monthly" ? plan.monthlyPrice : plan.annualPrice,
          cycle,
          { contactSales: plan.contactSales, freeMonths: plan.freeMonths },
        );
        const savings = cycle === "annual" ? annualSavingsPercent(plan) : null;
        const showStorage =
          plan.id !== "RENEWER" && plan.storageLabel !== "Retained" && plan.storageBytes > 0;

        return (
          <Card
            key={plan.id}
            className={cn(
              "relative flex h-full flex-col rounded-2xl border-border/60 p-5 shadow-soft",
              plan.recommended && "border-primary/50 ring-1 ring-primary/30",
              isCurrent && "bg-primary/[0.03]",
            )}
          >
            <div className="mb-3 flex min-h-[22px] flex-wrap items-center gap-2">
              {isCurrent ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  Current Plan
                </span>
              ) : null}
              {plan.recommended ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-200">
                  <Crown className="h-3 w-3" />
                  Recommended
                </span>
              ) : null}
              {savings != null && savings > 0 ? (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  Save {savings}%
                </span>
              ) : null}
            </div>

            <h3 className="text-lg font-semibold tracking-tight">{plan.name}</h3>
            {plan.tagline ? (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{plan.tagline}</p>
            ) : showStorage ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Storage · {formatStorageWithCardEstimate(plan.storageBytes, plan.storageLabel)}
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">Data retention</p>
            )}
            <div className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
              {plan.id === "RENEWER" ? "$1/month" : price}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {plan.contactSales
                ? ENTERPRISE_SALES_EMAIL
                : plan.id === "RENEWER"
                  ? "Billed monthly"
                  : cycle === "monthly" && (plan.freeMonths ?? 0) > 0
                    ? `$${plan.monthlyPrice}/month + ${plan.freeMonths} Months FREE`
                    : cycle === "monthly"
                      ? "Billed monthly"
                      : "Billed annually"}
            </p>

            <ul className="mt-5 flex-1 space-y-2 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
              {(plan.unavailableFeatures || []).map((feature) => (
                <li key={`no-${feature}`} className="flex items-start gap-2">
                  <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  <span className="text-muted-foreground/80">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5">
              <Button
                type="button"
                className={cn(
                  "w-full rounded-lg",
                  !isCurrent && !plan.contactSales && "bg-gradient-primary shadow-glow",
                )}
                variant={isCurrent ? "outline" : plan.contactSales ? "outline" : "default"}
                disabled={isCurrent}
                onClick={() => onSelect(plan)}
              >
                {isCurrent ? (
                  "Current plan"
                ) : plan.contactSales ? (
                  <>
                    <Mail className="mr-1.5 h-3.5 w-3.5" />
                    Contact Sales
                  </>
                ) : plan.id === "RENEWER" ? (
                  <>
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Select Renewer
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    {(plan.monthlyPrice ?? 0) <= 0 ? "Stay on Freemium" : "Upgrade"}
                  </>
                )}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
