export const PRESET_EVENT_DAYS = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"] as const;

export const DEFAULT_EVENT_DAY = "Day 1";

export const CUSTOM_EVENT_DAY_VALUE = "__custom__";

export function isPresetEventDay(value: string): boolean {
  return (PRESET_EVENT_DAYS as readonly string[]).includes(value);
}

export function normalizeEventDay(value: string | null | undefined): string {
  const trimmed = (value || "").trim();
  return trimmed || DEFAULT_EVENT_DAY;
}
