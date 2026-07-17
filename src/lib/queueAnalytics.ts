import type { QueueItem } from "@/lib/indexeddb";
import type { StoredContact } from "@/lib/contactStorage";
import { resolveQueuePieColors } from "@/lib/queueChartColors";

export type QueueBarPoint = { label: string; count: number };

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

function isSavedContact(contact: StoredContact): boolean {
  return contact.syncStatus === "synced";
}

function collectSaveDates(
  contacts: StoredContact[],
  queueItems: QueueItem[],
): Date[] {
  const dates: Date[] = [];

  const push = (iso: string | undefined) => {
    if (!iso) return;
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) dates.push(d);
  };

  for (const c of contacts) {
    if (isSavedContact(c)) push(c.created_at);
  }
  for (const item of queueItems) {
    if (item.status === "synced") push(item.created_at);
  }

  return dates;
}

/** Monday 00:00:00 of the week containing `date`. */
export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return "12a";
  if (hour < 12) return `${hour}a`;
  if (hour === 12) return "12p";
  return `${hour - 12}p`;
}

/** Saves today, bucketed by hour (12a–11p). */
export function buildDailySaveActivity(
  contacts: StoredContact[],
  queueItems: QueueItem[],
): QueueBarPoint[] {
  const today = new Date();
  const counts = Array.from({ length: 24 }, () => 0);

  for (const d of collectSaveDates(contacts, queueItems)) {
    if (!isSameLocalDay(d, today)) continue;
    counts[d.getHours()] += 1;
  }

  return counts.map((count, hour) => ({
    label: formatHourLabel(hour),
    count,
  }));
}

/** Saves in the current calendar week (Mon–Sun). */
export function buildWeeklySaveActivity(
  contacts: StoredContact[],
  queueItems: QueueItem[],
): QueueBarPoint[] {
  const weekStart = startOfWeekMonday(new Date());
  const counts = [0, 0, 0, 0, 0, 0, 0];

  for (const d of collectSaveDates(contacts, queueItems)) {
    const day = new Date(d);
    day.setHours(0, 0, 0, 0);
    const diffDays = Math.round((day.getTime() - weekStart.getTime()) / 86_400_000);
    if (diffDays < 0 || diffDays > 6) continue;
    counts[diffDays] += 1;
  }

  return WEEK_DAYS.map((label, i) => ({ label, count: counts[i] }));
}

/** Saves in the current calendar year, by month. */
export function buildMonthlySaveActivity(
  contacts: StoredContact[],
  queueItems: QueueItem[],
): QueueBarPoint[] {
  const year = new Date().getFullYear();
  const counts = Array.from({ length: 12 }, () => 0);

  for (const d of collectSaveDates(contacts, queueItems)) {
    if (d.getFullYear() !== year) continue;
    counts[d.getMonth()] += 1;
  }

  return MONTHS.map((label, i) => ({ label, count: counts[i] }));
}

export type QueuePipelineSlice = {
  name: string;
  value: number;
  fill: string;
};

export type QueuePipelineSnapshot = {
  slices: QueuePipelineSlice[];
  savesToday: number;
  savesThisWeek: number;
  conversionPct: number;
  totalActivity: number;
};

/** Snapshot for donut + insight tiles (queue vs saved vs failed). */
export function buildQueuePipelineSnapshot(
  contacts: StoredContact[],
  queueItems: QueueItem[],
): QueuePipelineSnapshot {
  const inQueue = queueItems.filter(
    (i) => i.status === "pending" || i.status === "retrying",
  ).length;
  const failed = queueItems.filter((i) => i.status === "failed").length;
  const saved = contacts.filter(isSavedContact).length;

  const today = new Date();
  const weekStart = startOfWeekMonday(today);
  let savesToday = 0;
  let savesThisWeek = 0;

  for (const d of collectSaveDates(contacts, queueItems)) {
    if (isSameLocalDay(d, today)) savesToday += 1;
    const day = new Date(d);
    day.setHours(0, 0, 0, 0);
    const diffDays = Math.round((day.getTime() - weekStart.getTime()) / 86_400_000);
    if (diffDays >= 0 && diffDays <= 6) savesThisWeek += 1;
  }

  const totalActivity = inQueue + failed + saved;
  const conversionPct =
    totalActivity > 0 ? Math.round((saved / totalActivity) * 100) : 0;

  const colors = resolveQueuePieColors();

  const slices: QueuePipelineSlice[] = [
    { name: "In queue", value: inQueue, fill: colors.inQueue },
    { name: "Saved", value: saved, fill: colors.saved },
    { name: "Failed", value: failed, fill: colors.failed },
  ].filter((s) => s.value > 0);

  if (slices.length === 0) {
    slices.push({ name: "No activity", value: 1, fill: colors.empty });
  }

  return {
    slices,
    savesToday,
    savesThisWeek,
    conversionPct,
    totalActivity,
  };
}
