/** Canvas-safe fallbacks (ECharts does not paint oklch() reliably). */
export const QUEUE_PIE_FALLBACK = {
  inQueue: "#F59E0B",
  saved: "#22C55E",
  failed: "#EF4444",
  empty: "#94A3B8",
} as const;

export type QueuePieColorKey = keyof typeof QUEUE_PIE_FALLBACK;

/** Resolve theme CSS variables to rgb/hex strings for canvas charts. */
export function resolveQueuePieColors(): Record<QueuePieColorKey, string> {
  if (typeof document === "undefined") {
    return { ...QUEUE_PIE_FALLBACK };
  }

  const probe = document.createElement("span");
  probe.hidden = true;
  document.documentElement.appendChild(probe);

  const read = (cssVar: string, fallback: string): string => {
    probe.style.color = `var(${cssVar})`;
    const value = getComputedStyle(probe).color;
    return value && value !== "rgba(0, 0, 0, 0)" ? value : fallback;
  };

  const colors = {
    inQueue: read("--warning", QUEUE_PIE_FALLBACK.inQueue),
    saved: read("--success", QUEUE_PIE_FALLBACK.saved),
    failed: read("--destructive", QUEUE_PIE_FALLBACK.failed),
    empty: read("--muted-foreground", QUEUE_PIE_FALLBACK.empty),
  };

  probe.remove();
  return colors;
}
