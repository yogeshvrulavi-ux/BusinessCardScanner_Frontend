import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme, getStoredTheme, toggleTheme, type ThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** Compact header control — calm surface, soft border, no loud chrome. */
export function ThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const current = getStoredTheme();
    setMode(current);
    applyTheme(current);

    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<ThemeMode>).detail;
      if (detail === "light" || detail === "dark") setMode(detail);
    };
    window.addEventListener("cs-theme-changed", onChange as EventListener);
    return () => window.removeEventListener("cs-theme-changed", onChange as EventListener);
  }, []);

  const isDark = mode === "dark";

  return (
    <button
      type="button"
      onClick={() => setMode(toggleTheme())}
      className={cn(
        "group relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-md",
        "border border-border/70 bg-card/80 text-muted-foreground shadow-soft",
        "transition-all duration-300 hover:border-primary/35 hover:text-foreground hover:shadow-glow",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        className,
      )}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-cyan-500/10 opacity-0 transition-opacity duration-300",
          "group-hover:opacity-100",
        )}
        aria-hidden
      />
      <Sun
        className={cn(
          "absolute h-4 w-4 transition-all duration-300",
          isDark ? "scale-75 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
        )}
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 transition-all duration-300",
          isDark ? "scale-100 rotate-0 opacity-100" : "scale-75 -rotate-90 opacity-0",
        )}
      />
    </button>
  );
}
