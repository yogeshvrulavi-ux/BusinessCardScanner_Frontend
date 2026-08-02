import { Link } from "@tanstack/react-router";
import { Contact, ScanLine, Sparkles } from "lucide-react";

import { PageShell } from "@/components/layout/PageShell";
import { DashboardStorageSummary } from "@/components/subscription/DashboardStorageSummary";
import { StorageWarningBanner } from "@/components/subscription/StorageWarningBanner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useStorageQuota } from "@/contexts/StorageQuotaContext";
import { useUserSettings } from "@/hooks/useUserSettings";

export function DashboardPage() {
  const { firstName } = useUserSettings();
  const { quota, isBlocked } = useStorageQuota();

  return (
    <PageShell title="Dashboard" description="Overview and quick actions for your workspace.">
      <StorageWarningBanner />

      <div className="grid gap-4 lg:grid-cols-12 lg:items-stretch">
        <Card className="rounded-2xl border-border/60 p-5 shadow-soft lg:col-span-7">
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
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Capture cards, manage contacts, and keep your team in sync — all under your current plan.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild className="rounded-lg" disabled={isBlocked}>
              <Link to="/scan">
                <ScanLine className="mr-1.5 h-4 w-4" />
                {isBlocked ? "Storage full" : "Capture card"}
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-lg">
              <Link to="/contacts">
                <Contact className="mr-1.5 h-4 w-4" />
                Contacts
              </Link>
            </Button>
            <Button asChild variant="ghost" className="rounded-lg text-primary">
              <Link to="/subscription">
                <Sparkles className="mr-1.5 h-4 w-4" />
                Plans
              </Link>
            </Button>
          </div>
        </Card>

        <div className="lg:col-span-5">
          <DashboardStorageSummary className="h-full" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickCard
          title="Capture"
          body={
            isBlocked
              ? "Storage is full. Upgrade to resume scanning."
              : "Upload or photograph business cards."
          }
          to="/scan"
          cta={isBlocked ? "Upgrade required" : "Open Capture"}
          disabled={isBlocked}
        />
        <QuickCard
          title="Contacts"
          body="Search and manage every lead in your workspace."
          to="/contacts"
          cta="View contacts"
        />
        <QuickCard
          title="Subscription"
          body="Compare Freemium through Enterprise storage tiers."
          to="/subscription"
          cta="Manage plan"
          accent
        />
      </div>
    </PageShell>
  );
}

function QuickCard({
  title,
  body,
  to,
  cta,
  disabled,
  accent,
}: {
  title: string;
  body: string;
  to: "/scan" | "/contacts" | "/subscription";
  cta: string;
  disabled?: boolean;
  accent?: boolean;
}) {
  return (
    <Card className="flex flex-col rounded-2xl border-border/60 p-4 shadow-soft sm:p-5">
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
      <Button
        asChild
        variant={accent ? "default" : "outline"}
        size="sm"
        className={`mt-4 w-fit rounded-lg ${accent ? "bg-gradient-primary shadow-glow" : ""}`}
        disabled={disabled}
      >
        <Link to={to}>{cta}</Link>
      </Button>
    </Card>
  );
}
