import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Check,
  Contact,
  HelpCircle,
  Minus,
  ScanLine,
  Settings,
  Sparkles,
} from "lucide-react";

import { PageShell } from "@/components/layout/PageShell";
import { CurrentPlanPanel } from "@/components/subscription/CurrentPlanPanel";
import { EventSpecialOffers } from "@/components/subscription/EventSpecialOffers";
import { PlanPricingCards } from "@/components/subscription/PlanPricingCards";
import { StorageWarningBanner } from "@/components/subscription/StorageWarningBanner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useStorageQuota } from "@/contexts/StorageQuotaContext";
import { useUserSettings } from "@/hooks/useUserSettings";
import { loadBillingCycle, saveBillingCycle } from "@/lib/freemiumWelcome";
import type { BillingCycle } from "@/lib/subscriptionPlans";
import { cn } from "@/lib/utils";

const FEATURE_ROWS: {
  feature: string;
  freemium: string | boolean;
  starter: string | boolean;
  builder: string | boolean;
  growth: string | boolean;
  enterprise: string | boolean;
}[] = [
  {
    feature: "Storage",
    freemium: "20 MB",
    starter: "1 GB",
    builder: "3 GB",
    growth: "5 GB",
    enterprise: "Custom",
  },
  { feature: "OCR", freemium: true, starter: true, builder: true, growth: true, enterprise: true },
  {
    feature: "WhatsApp",
    freemium: true,
    starter: true,
    builder: true,
    growth: true,
    enterprise: true,
  },
  { feature: "Email", freemium: true, starter: true, builder: true, growth: true, enterprise: true },
  {
    feature: "Contact Management",
    freemium: true,
    starter: true,
    builder: true,
    growth: true,
    enterprise: true,
  },
  {
    feature: "Priority Support",
    freemium: false,
    starter: true,
    builder: true,
    growth: true,
    enterprise: true,
  },
  {
    feature: "Team Ready",
    freemium: false,
    starter: false,
    builder: false,
    growth: true,
    enterprise: true,
  },
];

const FAQS = [
  {
    q: "What happens when I reach my storage limit?",
    a: "Camera, gallery, and offline capture pause until you free space or upgrade. Existing contacts stay available.",
  },
  {
    q: "Can I switch between monthly and annual billing?",
    a: "Yes — use the billing toggle on this page. Annual plans show savings where applicable.",
  },
  {
    q: "How do event specials work?",
    a: "Event offers are available for exhibitions such as TTF and IITM. Contact sales to activate per-user event pricing.",
  },
];

export function SubscriptionPage() {
  const { firstName } = useUserSettings();
  const { quota, isBlocked } = useStorageQuota();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  useEffect(() => {
    setCycle(loadBillingCycle());
  }, []);

  const onCycle = (next: BillingCycle) => {
    setCycle(next);
    saveBillingCycle(next);
  };

  return (
    <PageShell
      title="Subscription"
      description="Your workspace home — plan, storage, and upgrades."
    >
      <StorageWarningBanner />

      {/* Welcome */}
      <Card className="rounded-2xl border-border/60 p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Welcome back
            {firstName ? (
              <>
                ,{" "}
                <span className="bg-gradient-to-r from-primary to-teal-500 bg-clip-text text-transparent">
                  {firstName}
                </span>
              </>
            ) : null}
          </h2>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            {quota.plan}
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Manage your plan and storage here, then jump into capture or contacts when you are ready.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm" className="rounded-lg" disabled={isBlocked}>
            <Link to="/scan">
              <ScanLine className="mr-1.5 h-3.5 w-3.5" />
              {isBlocked ? "Capture disabled" : "Capture Card"}
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-lg">
            <Link to="/contacts">
              <Contact className="mr-1.5 h-3.5 w-3.5" />
              View Contacts
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost" className="rounded-lg">
            <Link to="/settings">
              <Settings className="mr-1.5 h-3.5 w-3.5" />
              Settings
            </Link>
          </Button>
        </div>
      </Card>

      <CurrentPlanPanel />

      <Card className="rounded-2xl border-border/60 p-4 shadow-soft sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Billing cycle</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Prices are display-only until billing is confirmed for your workspace.
            </p>
          </div>
          <div className="inline-flex rounded-xl border border-border/60 bg-muted/30 p-1">
            <CycleBtn active={cycle === "monthly"} onClick={() => onCycle("monthly")}>
              Monthly
            </CycleBtn>
            <CycleBtn active={cycle === "annual"} onClick={() => onCycle("annual")}>
              Annual
            </CycleBtn>
          </div>
        </div>
      </Card>

      <section id="plans" className="scroll-mt-24 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold tracking-tight">Available plans</h2>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Freemium through Enterprise
          </span>
        </div>
        <PlanPricingCards cycle={cycle} currentPlanId={quota.plan} />
      </section>

      <EventSpecialOffers />

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">Feature comparison</h2>
        <Card className="overflow-hidden rounded-2xl border-border/60 shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Feature</th>
                  <th className="px-4 py-3 font-medium">Freemium</th>
                  <th className="px-4 py-3 font-medium">Starter</th>
                  <th className="px-4 py-3 font-medium">Builder</th>
                  <th className="px-4 py-3 font-medium">Growth</th>
                  <th className="px-4 py-3 font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_ROWS.map((row) => (
                  <tr key={row.feature} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-3 font-medium">{row.feature}</td>
                    <Cell value={row.freemium} />
                    <Cell value={row.starter} />
                    <Cell value={row.builder} />
                    <Cell value={row.growth} />
                    <Cell value={row.enterprise} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <HelpCircle className="h-4 w-4 text-primary" />
          FAQ
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {FAQS.map((item) => (
            <Card key={item.q} className="rounded-2xl border-border/60 p-4 shadow-soft">
              <h3 className="text-sm font-semibold">{item.q}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.a}</p>
            </Card>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function CycleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-soft"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Cell({ value }: { value: string | boolean }) {
  return (
    <td className="px-4 py-3 text-muted-foreground">
      {typeof value === "boolean" ? (
        value ? (
          <Check className="h-4 w-4 text-emerald-600" />
        ) : (
          <Minus className="h-4 w-4 text-muted-foreground/50" />
        )
      ) : (
        <span className="text-foreground">{value}</span>
      )}
    </td>
  );
}
