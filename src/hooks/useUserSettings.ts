import { useEffect, useState } from "react";
import {
  DEFAULT_USER_SETTINGS,
  getUserFirstName,
  getUserInitials,
  loadUserSettings,
  type UserSettings,
} from "@/lib/settingsStorage";

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
  try {
    const stored = localStorage.getItem("cs_auth_user");
    if (stored) {
      const authUser = JSON.parse(stored);
      authEmail = authUser.email?.trim() || "";
      authName = `${authUser.first_name || ""} ${authUser.last_name || ""}`.trim();
    }
  } catch { /* storage unavailable */ }

  const merged = {
    ...settings,
    ...(authEmail ? { email: authEmail } : {}),
    ...(authName ? { fullName: authName } : {}),
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
