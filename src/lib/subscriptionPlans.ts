/** Subscription plan catalog (UI). Freemium limit matches backend default. */

export type PlanId = "FREEMIUM" | "STARTER" | "BUILDER" | "GROWTH" | "ENTERPRISE";
export type BillingCycle = "monthly" | "annual";

export type SubscriptionPlan = {
  id: PlanId;
  name: string;
  storageLabel: string;
  storageBytes: number;
  /** Monthly USD; null = contact sales (Enterprise). */
  monthlyPrice: number | null;
  annualPrice: number | null;
  features: string[];
  recommended?: boolean;
  contactSales?: boolean;
};

export const BYTES_PER_MB = 1024 * 1024;
export const BYTES_PER_GB = 1024 * 1024 * 1024;

export const ENTERPRISE_SALES_EMAIL = "support@ulavitech.com";

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "FREEMIUM",
    name: "Freemium",
    storageLabel: "20 MB",
    storageBytes: 20 * BYTES_PER_MB,
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      "OCR",
      "WhatsApp",
      "Email",
      "Contact Management",
      "Dashboard",
      "Basic Support",
    ],
  },
  {
    id: "STARTER",
    name: "Starter",
    storageLabel: "1 GB",
    storageBytes: 1 * BYTES_PER_GB,
    monthlyPrice: 15,
    annualPrice: 150,
    features: ["Everything in Freemium", "1 GB Storage", "Priority Support"],
  },
  {
    id: "BUILDER",
    name: "Builder",
    storageLabel: "3 GB",
    storageBytes: 3 * BYTES_PER_GB,
    monthlyPrice: 20,
    annualPrice: 200,
    features: ["Everything in Starter", "3 GB Storage", "Better Performance"],
    recommended: true,
  },
  {
    id: "GROWTH",
    name: "Growth",
    storageLabel: "5 GB",
    storageBytes: 5 * BYTES_PER_GB,
    monthlyPrice: 25,
    annualPrice: 250,
    features: ["Everything in Builder", "5 GB Storage", "Team Ready"],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    storageLabel: "Custom",
    storageBytes: 10 * BYTES_PER_GB,
    monthlyPrice: null,
    annualPrice: null,
    contactSales: true,
    features: [
      "Volume discounts",
      "Enterprise onboarding",
      "Dedicated support",
      "Custom storage",
    ],
  },
];

/** Map legacy / backend plan names onto the UI catalog. */
export function getPlanById(planId: string | null | undefined): SubscriptionPlan {
  const normalized = String(planId || "FREEMIUM").trim().toUpperCase();
  if (normalized === "PROFESSIONAL") {
    return SUBSCRIPTION_PLANS.find((p) => p.id === "GROWTH") || SUBSCRIPTION_PLANS[0];
  }
  return (
    SUBSCRIPTION_PLANS.find((p) => p.id === normalized) ||
    SUBSCRIPTION_PLANS[0]
  );
}

export function formatPlanPrice(
  amount: number | null,
  cycle: BillingCycle,
  opts?: { contactSales?: boolean },
): string {
  if (opts?.contactSales || amount == null) return "Talk to Us";
  if (amount <= 0) return "USD 0/month";
  if (cycle === "monthly") return `USD ${amount}/month`;
  return `USD ${amount}/year`;
}

export function annualSavingsPercent(plan: SubscriptionPlan): number | null {
  if (plan.monthlyPrice == null || plan.annualPrice == null) return null;
  if (plan.monthlyPrice <= 0) return null;
  const fullYear = plan.monthlyPrice * 12;
  if (fullYear <= plan.annualPrice) return null;
  return Math.round(((fullYear - plan.annualPrice) / fullYear) * 100);
}

export type UiWarningLevel = "NORMAL" | "WARNING" | "CRITICAL" | "BLOCKED";

/** UI thresholds: 80% warning, 90% critical, 100% blocked. */
export function resolveUiWarningLevel(usedPercentage: number, canUpload: boolean): UiWarningLevel {
  if (!canUpload || usedPercentage >= 100) return "BLOCKED";
  if (usedPercentage >= 90) return "CRITICAL";
  if (usedPercentage >= 80) return "WARNING";
  return "NORMAL";
}

export function formatStorageBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes === 0) return "0 MB";
  const gb = bytes / BYTES_PER_GB;
  if (gb >= 1) return `${gb >= 10 ? gb.toFixed(0) : gb.toFixed(2)} GB`;
  const mb = bytes / BYTES_PER_MB;
  if (mb >= 0.01) return `${mb.toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}
