import { useEffect, useState } from "react";
import {
  DEFAULT_USER_SETTINGS,
  getUserFirstName,
  getUserInitials,
  loadUserSettings,
  type UserSettings,
} from "@/lib/settingsStorage";

/** "SUPER_ADMIN" → "Super Admin" */
function formatRole(role: unknown): string {
  if (typeof role !== "string" || !role.trim()) return "";
  return role
    .trim()
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);

  useEffect(() => {
    setSettings(loadUserSettings());

    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<UserSettings>).detail;
      setSettings(detail ? { ...DEFAULT_USER_SETTINGS, ...detail } : loadUserSettings());
    };

    window.addEventListener("cs-settings-updated", handleUpdate as EventListener);
    return () => {
      window.removeEventListener("cs-settings-updated", handleUpdate as EventListener);
    };
  }, []);

  // Merge auth user info from localStorage if available
  let authEmail = "";
  let authName = "";
  let authRole = "";
  try {
    const stored = localStorage.getItem("cs_auth_user");
    if (stored) {
      const authUser = JSON.parse(stored);
      authEmail = authUser.email?.trim() || "";
      authName = `${authUser.first_name || ""} ${authUser.last_name || ""}`.trim();
      authRole = formatRole(authUser.role);
    }
  } catch { /* storage unavailable */ }

  const merged = {
    ...settings,
    ...(authEmail ? { email: authEmail } : {}),
    ...(authName ? { fullName: authName } : {}),
    // The account's real role wins over anything typed in the profile form.
    role: settings.role.trim() || authRole,
  };

  return {
    settings: merged,
    fullName: merged.fullName,
    email: merged.email,
    phone: merged.phone,
    company: merged.company,
    role: merged.role,
    initials: getUserInitials(merged.fullName || authEmail || "User"),
    firstName: getUserFirstName(merged.fullName || authName || "User"),
  };
}
