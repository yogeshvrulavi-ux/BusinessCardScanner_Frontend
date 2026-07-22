import { useEffect } from "react";
import { restoreStoredTheme } from "@/lib/theme";

/** Keep auth screens in light mode only; restore user theme on leave. */
export function useForceLightMode(active = true) {
  useEffect(() => {
    if (!active || typeof document === "undefined") return;

    const root = document.documentElement;
    root.classList.remove("dark");
    root.style.colorScheme = "light";

    return () => {
      restoreStoredTheme();
    };
  }, [active]);
}
