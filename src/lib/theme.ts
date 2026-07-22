export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "cs-theme";

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "dark" || raw === "light") return raw;
  } catch {
    /* storage unavailable */
  }
  return "light";
}

export function applyTheme(mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.style.colorScheme = mode;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent("cs-theme-changed", { detail: mode }));
}

export function toggleTheme(): ThemeMode {
  const next: ThemeMode = getStoredTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}

/** Restore the user's saved theme (e.g. after leaving an auth light-forced screen). */
export function restoreStoredTheme(): void {
  applyTheme(getStoredTheme());
}
