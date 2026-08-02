import { CalendarDays, Mail, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ENTERPRISE_SALES_EMAIL } from "@/lib/subscriptionPlans";
import { cn } from "@/lib/utils";

const EVENTS = ["TTF, Kolkata 2026", "IITM, Chennai 2026", "Future Partner Events"];

export function EventSpecialOffers() {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
            <CalendarDays className="h-3 w-3" />
            Event special
          </div>
          <h2 className="mt-2 text-lg font-semibold tracking-tight">Special Event Offers</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Exclusive pricing for exhibitions and trade shows.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {EVENTS.map((label) => (
            <span
              key={label}
              className="rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-[11px] font-medium text-muted-foreground"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <OfferCard
          badge="Limited offer"
          badgeTone="amber"
          title="USD 10"
          subtitle="per user / month"
          storage="500 MB Storage"
          inr="~ INR 950/month"
          cta="Choose monthly event plan"
        />
        <OfferCard
          badge="Best value"
          badgeTone="emerald"
          title="USD 100"
          subtitle="per user / year"
          storage="Annual Subscription"
          inr="~ INR 2,000 · SAVE 2 Months FREE (Worth USD 20)"
          cta="Choose annual event plan"
          highlight
        />
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Questions about event pricing?{" "}
        <a
          href={`mailto:${ENTERPRISE_SALES_EMAIL}`}
          className="font-medium text-primary hover:underline"
        >
          {ENTERPRISE_SALES_EMAIL}
        </a>
      </p>
    </section>
  );
}

function OfferCard({
  badge,
  badgeTone,
  title,
  subtitle,
  storage,
  inr,
  cta,
  highlight,
}: {
  badge: string;
  badgeTone: "amber" | "emerald";
  title: string;
  subtitle: string;
  storage: string;
  inr: string;
  cta: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border-border/60 p-5 shadow-soft",
        highlight && "border-primary/40 ring-1 ring-primary/25",
      )}
    >
      <span
        className={cn(
          "absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
          badgeTone === "amber"
            ? "bg-amber-500/15 text-amber-800 dark:text-amber-200"
            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        )}
      >
        {badge}
      </span>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Event special
      </p>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{title}</div>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
      <p className="mt-4 text-sm font-medium">{storage}</p>
      <p className="mt-1 text-xs text-muted-foreground">{inr}</p>
      <Button
        type="button"
        className={cn("mt-5 w-full rounded-lg", highlight && "bg-gradient-primary shadow-glow")}
        variant={highlight ? "default" : "outline"}
        onClick={() => {
          window.location.href = `mailto:${ENTERPRISE_SALES_EMAIL}?subject=${encodeURIComponent(cta)}`;
        }}
      >
        <Mail className="mr-1.5 h-3.5 w-3.5" />
        {cta}
      </Button>
      {highlight ? (
        <p className="mt-2 flex items-center justify-center gap-1 text-[11px] font-medium text-primary">
          <Sparkles className="h-3 w-3" />
          Save 2 months free
        </p>
      ) : null}
    </Card>
  );
}
