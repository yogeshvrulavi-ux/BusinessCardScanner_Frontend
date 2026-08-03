/** Subscription plan catalog (UI). Freemium limit matches backend default. */

export type PlanId = "FREEMIUM" | "STARTER" | "BUILDER" | "GROWTH" | "RENEWER" | "ENTERPRISE";
export type BillingCycle = "monthly" | "annual";

export type SubscriptionPlan = {
  id: PlanId;
  name: string;
  storageLabel: string;
  storageBytes: number;
  /** Monthly USD; null = contact sales (Enterprise). */
  monthlyPrice: number | null;
  annualPrice: number | null;
  /** Extra free months advertised on paid tiers (display-only). */
  freeMonths?: number;
  features: string[];
  /** Features shown with an unavailable (X) mark on pricing cards. */
  unavailableFeatures?: string[];
  recommended?: boolean;
  contactSales?: boolean;
  /** Short purpose line under the plan name (optional). */
  tagline?: string;
};

export const BYTES_PER_MB = 1024 * 1024;
export const BYTES_PER_GB = 1024 * 1024 * 1024;
/** Assumed average scanned card size for capacity estimates in the UI. */
export const AVG_CARD_BYTES = 100 * 1024;

export const ENTERPRISE_SALES_EMAIL = "support@ulavitech.com";

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "FREEMIUM",
    name: "Freemium",
    storageLabel: "1 MB",
    storageBytes: 1 * BYTES_PER_MB,
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      "Scan Card",
      "WhatsApp",
      "Email",
      "Contact Management",
      "Onboarding Support",
      "Manage Team",
      "Dashboard",
      "No Priority Support",
    ],
  },
  {
    id: "STARTER",
    name: "Starter",
    storageLabel: "1 GB",
    storageBytes: 1 * BYTES_PER_GB,
    monthlyPrice: 15,
    annualPrice: 150,
    freeMonths: 2,
    features: [
      "Everything in Freemium",
      "1 GB Storage (~10,000 Cards)",
      "Onboarding Support",
      "Manage Team",
      "Priority Support (Standard)",
    ],
  },
  {
    id: "BUILDER",
    name: "Builder",
    storageLabel: "5 GB",
    storageBytes: 5 * BYTES_PER_GB,
    monthlyPrice: 20,
    annualPrice: 200,
    freeMonths: 2,
    features: [
      "Everything in Starter",
      "5 GB Storage (~50,000 Cards)",
      "Onboarding Support",
      "Manage Team",
      "Priority Support (Extended)",
    ],
    recommended: true,
  },
  {
    id: "GROWTH",
    name: "Growth",
    storageLabel: "10 GB",
    storageBytes: 10 * BYTES_PER_GB,
    monthlyPrice: 25,
    annualPrice: 250,
    freeMonths: 2,
    features: [
      "Everything in Builder",
      "10 GB Storage (~100,000 Cards)",
      "Onboarding Support",
      "Manage Team",
      "Priority Support (Premium)",
    ],
  },
  {
    id: "RENEWER",
    name: "Renewer Pack",
    storageLabel: "Retained",
    storageBytes: 0,
    monthlyPrice: 1,
    annualPrice: 12,
    tagline: "Retain existing data until you renew — no new scans.",
    features: [
      "Retains all contacts",
      "Retains organisation data",
      "Storage retained",
    ],
    unavailableFeatures: [
      "Scan Card",
      "OCR Processing",
      "Google Sheets Sync",
      "WhatsApp",
      "Email",
      "New Contact Creation",
    ],
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
      "Dedicated Support",
      "Custom storage",
      "Manage Team",
    ],
  },
];

/** Renewer Pack — shown after Freemium / subscription storage expiry. */
export const RENEWER_PACK = {
  name: "Renewer Pack",
  description: "Retains all customer data.",
  monthlyPriceLabel: "$1/month",
  monthlyPrice: 1,
} as const;

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
  opts?: { contactSales?: boolean; freeMonths?: number },
): string {
  if (opts?.contactSales || amount == null) return "Talk to Us";
  if (amount <= 0) return "USD 0/month";
  const freeMonths = opts?.freeMonths ?? 0;
  if (cycle === "monthly" && freeMonths > 0) {
    return `$${amount} + ${freeMonths} Months Free`;
  }
  if (cycle === "monthly") return `$${amount}/month`;
  return `$${amount}/year`;
}

/** Freemium is treated as expired when storage upload is blocked. */
export function isFreemiumExpired(quota: {
  plan?: string | null;
  canUpload?: boolean;
  warningLevel?: string;
}): boolean {
  const plan = String(quota.plan || "").trim().toUpperCase();
  if (plan !== "FREEMIUM") return false;
  return quota.canUpload === false || quota.warningLevel === "BLOCKED";
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
  if (mb >= 0.01) return `${mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)} MB`.replace(/\.0 MB$/, " MB");
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/** Approximate number of cards that fit in `bytes` (~100 KB each). */
export function approximateCardCapacity(bytes: number | null | undefined): number {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return 0;
  return Math.max(0, Math.floor(bytes / AVG_CARD_BYTES));
}

/** Display card capacity (round large values to thousands: ~10,000 Cards). */
export function formatCardCount(cards: number): string {
  if (cards >= 1000) {
    return (Math.round(cards / 1000) * 1000).toLocaleString("en-US");
  }
  return String(cards);
}

/** Exact card count with thousands separators (e.g. 2,450). */
export function formatCardCountExact(cards: number): string {
  return Math.max(0, Math.floor(cards)).toLocaleString("en-US");
}

/** e.g. "1 MB (~10 Cards)" or "1 GB (~10,000 Cards)" */
export function formatStorageWithCardEstimate(
  bytes: number | null | undefined,
  label?: string,
): string {
  const storage = label || formatStorageBytes(bytes);
  if (!storage || storage === "—" || storage === "Custom") return storage;
  const cards = approximateCardCapacity(bytes);
  if (cards <= 0 && (bytes == null || bytes <= 0)) return storage;
  return `${storage} (~${formatCardCount(cards)} Cards)`;
}
