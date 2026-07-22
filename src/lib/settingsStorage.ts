import { setConnectionMode } from "@/lib/connectionMode";

export type UserSettings = {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  timezone: string;
  notificationsEnabled: boolean;
  queueNotificationsEnabled: boolean;
  captureNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  whatsappNotificationsEnabled: boolean;
  /** Sync queued + unsynced IndexedDB contacts to PostgreSQL when internet returns. */
  autoSyncQueueWhenOnline: boolean;
  showCaptureTips: boolean;
  confirmBeforeDelete: boolean;
  preferOfflineCapture: boolean;
  cookiesAccepted: boolean;
  analyticsCookiesEnabled: boolean;
  /** @deprecated legacy fields — merged on load */
  whatsappPhone?: string;
  integrationEmail?: string;
};

const STORAGE_KEY = "cs-user-settings";
/** One-time reset so existing browsers adopt the new outreach-off defaults. */
const OUTREACH_DEFAULTS_OFF_MIGRATION_KEY = "cs-outreach-defaults-off-v1";
/** One-time cleanup of old placeholder profile values ("Workspace owner" etc.). */
const PROFILE_PLACEHOLDERS_MIGRATION_KEY = "cs-profile-placeholders-cleared-v1";
/** Old defaults that were silently saved as if the user had typed them. */
const LEGACY_ROLE_PLACEHOLDERS = new Set(["Workspace owner"]);
const LEGACY_COMPANY_PLACEHOLDERS = new Set(["NameCardScan", "CardSync AI"]);

export const TIMEZONE_OPTIONS = [
  "Pacific Time (US)",
  "Mountain Time (US)", 
  "Central Time (US)",
  "Eastern Time (US)",
  "GMT / UTC",
  "Central European Time",
  "India Standard Time",
  "Singapore Time",
  "Japan Standard Time",
] as const;

export const DEFAULT_USER_SETTINGS: UserSettings = {
  fullName: "",
  email: "",
  phone: "",
  company: "",
  role: "",
  timezone: "India Standard Time",
  notificationsEnabled: true,
  queueNotificationsEnabled: true,
  captureNotificationsEnabled: true,
  emailNotificationsEnabled: false,
  whatsappNotificationsEnabled: false,
  cookiesAccepted: false,
  analyticsCookiesEnabled: false,
  autoSyncQueueWhenOnline: true,
  showCaptureTips: true,
  confirmBeforeDelete: true,
  preferOfflineCapture: false,
};

export function loadUserSettings(): UserSettings {
  if (typeof window === "undefined") {
    return { ...DEFAULT_USER_SETTINGS };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(OUTREACH_DEFAULTS_OFF_MIGRATION_KEY, "1");
      localStorage.setItem(PROFILE_PLACEHOLDERS_MIGRATION_KEY, "1");
      return { ...DEFAULT_USER_SETTINGS };
    }
    const parsed = JSON.parse(raw) as Partial<UserSettings>;

    // Older versions saved "Workspace owner" / app name as if the user typed
    // them. Clear those once so the profile shows real (or empty) values.
    if (!localStorage.getItem(PROFILE_PLACEHOLDERS_MIGRATION_KEY)) {
      if (parsed.role && LEGACY_ROLE_PLACEHOLDERS.has(parsed.role)) parsed.role = "";
      if (parsed.company && LEGACY_COMPANY_PLACEHOLDERS.has(parsed.company)) parsed.company = "";
      localStorage.setItem(PROFILE_PLACEHOLDERS_MIGRATION_KEY, "1");
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed }));
    }

    const autoSyncQueueWhenOnline =
      parsed.autoSyncQueueWhenOnline ??
      DEFAULT_USER_SETTINGS.autoSyncQueueWhenOnline;
    const needsOutreachDefaultsMigration =
      !localStorage.getItem(OUTREACH_DEFAULTS_OFF_MIGRATION_KEY);

    const merged = {
      ...DEFAULT_USER_SETTINGS,
      ...parsed,
      autoSyncQueueWhenOnline,
      ...(needsOutreachDefaultsMigration
        ? {
            emailNotificationsEnabled: false,
            whatsappNotificationsEnabled: false,
          }
        : {}),
    };
    if (needsOutreachDefaultsMigration) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      localStorage.setItem(OUTREACH_DEFAULTS_OFF_MIGRATION_KEY, "1");
    }
    return merged;
  } catch {
    return { ...DEFAULT_USER_SETTINGS };
  }
}

export function saveUserSettings(settings: Partial<UserSettings>): UserSettings {
  const next = { ...loadUserSettings(), ...settings };
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("cs-settings-updated", { detail: next }));
  }
  return next;
}

export function applyWorkModePreference(preferOffline: boolean): void {
  if (typeof window === "undefined" || !navigator.onLine) return;
  setConnectionMode(preferOffline ? "offline" : "online");
}

export function getUserInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export function getUserFirstName(fullName: string): string {
  const first = fullName.trim().split(/\s+/).filter(Boolean)[0];
  return first || "User";
}
