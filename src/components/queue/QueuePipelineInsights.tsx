import { useMemo } from "react";
import { CalendarDays, Percent, TrendingUp, Layers } from "lucide-react";

import { QueuePipelineEChartsPie } from "@/components/queue/QueuePipelineEChartsPie";
import type { QueueItem } from "@/lib/indexeddb";
import type { StoredContact } from "@/lib/contactStorage";
import { buildQueuePipelineSnapshot } from "@/lib/queueAnalytics";

export function QueuePipelineInsights({
  contacts,
  queueItems,
}: {
  contacts: StoredContact[];
  queueItems: QueueItem[];
}) {
  const snapshot = useMemo(
    () => buildQueuePipelineSnapshot(contacts, queueItems),
    [contacts, queueItems],
  );

  const insights = [
    {
      label: "Saves today",
      value: snapshot.savesToday,
      icon: CalendarDays,
      tone: "text-primary",
    },
    {
      label: "Saves this week",
      value: snapshot.savesThisWeek,
      icon: TrendingUp,
      tone: "text-success",
    },
    {
      label: "Save rate",
      value: `${snapshot.conversionPct}%`,
      icon: Percent,
      tone: "text-foreground",
    },
    {
      label: "Total activity",
      value: snapshot.totalActivity,
      icon: Layers,
      tone: "text-muted-foreground",
    },
  ];

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border/60 bg-card/50 p-4 shadow-soft sm:p-5">
      <div className="mb-3">
        <div className="text-sm font-medium">Pipeline snapshot</div>
        <div className="text-xs text-muted-foreground">
          How captures split between queue, saved, and failed
        </div>
      </div>

      <div className="mx-auto w-full max-w-[220px]">
        <QueuePipelineEChartsPie slices={snapshot.slices} />
      </div>

      <ul className="mb-4 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {snapshot.slices.map((s) => (
          <li key={s.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: s.fill }}
            />
            {s.name}
            <span className="font-medium text-foreground">{s.value}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto grid grid-cols-2 gap-2">
        {insights.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-border/60 bg-background/40 px-3 py-2.5"
          >
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <item.icon className={`h-3 w-3 ${item.tone}`} />
              {item.label}
            </div>
            <div className="mt-1 font-display text-lg font-semibold tracking-tight">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
