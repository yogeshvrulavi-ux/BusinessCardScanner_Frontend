const SUPPRESS_UNTIL_KEY = "cs-freemium-reminder-suppress-until";
const SESSION_DISMISS_KEY = "cs-freemium-reminder-dismissed-session";
const BILLING_CYCLE_KEY = "cs-billing-cycle";
const WARNED_80_DAY_KEY = "cs-freemium-warned-80-day";

function endOfTodayMs(): number {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end.getTime();
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** True when user chose "Don't show again today". */
export function shouldSuppressFreemiumWelcome(): boolean {
  if (typeof window === "undefined") return true;
  const until = Number(localStorage.getItem(SUPPRESS_UNTIL_KEY) || 0);
  return Number.isFinite(until) && until > Date.now();
}

export function setSuppressFreemiumWelcome(value: boolean): void {
  if (typeof window === "undefined") return;
  if (value) localStorage.setItem(SUPPRESS_UNTIL_KEY, String(endOfTodayMs()));
  else localStorage.removeItem(SUPPRESS_UNTIL_KEY);
}

/** Soft dismiss for this browser tab/session (avoids repeat popups every navigation). */
export function markFreemiumWelcomeSeenThisSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
}

export function wasFreemiumWelcomeSeenThisSession(): boolean {
  if (typeof window === "undefined") return true;
  return sessionStorage.getItem(SESSION_DISMISS_KEY) === "1";
}

/** Once per calendar day when crossing into 80%+ usage. */
export function shouldShowEightyPercentReminder(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(WARNED_80_DAY_KEY) !== todayKey();
}

export function markEightyPercentReminderShown(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WARNED_80_DAY_KEY, todayKey());
}

export function loadBillingCycle(): "monthly" | "annual" {
  if (typeof window === "undefined") return "monthly";
  return localStorage.getItem(BILLING_CYCLE_KEY) === "annual" ? "annual" : "monthly";
}

export function saveBillingCycle(cycle: "monthly" | "annual"): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BILLING_CYCLE_KEY, cycle);
}
