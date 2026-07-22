import { Loader2, RefreshCw, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/layout/StatusPill";
import type { QueueItem } from "@/lib/indexeddb";
import type { ContactStatus } from "@/lib/contactStatus";
import { cn } from "@/lib/utils";

function queueItemName(item: QueueItem): string {
  const d = item.contact_data;
  return String(d?.fullName || d?.name || "Unnamed Contact");
}

function queueStatusForPill(status: QueueItem["status"]): ContactStatus {
  if (status === "failed") return "failed";
  return "pending";
}

function formatQueuedAt(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

/** Who queued this card — from registry attribution fields. */
function capturedByLabel(item: QueueItem): string {
  const d = item.contact_data ?? {};
  const name = String(d.capturedByName || "").trim();
  const username = String(d.capturedByUsername || "").trim();
  if (name && username) return `${name} (@${username})`;
  if (name) return name;
  if (username) return `@${username}`;
  return "—";
}

function organisationLabel(item: QueueItem): string {
  return String(item.contact_data?.ownerCompanyName || "").trim() || "—";
}

function isRemoteRegistryItem(item: QueueItem): boolean {
  return item.id.startsWith("platform:");
}

type QueueItemsTableProps = {
  items: QueueItem[];
  syncingQueueId: string | null;
  isBusy: boolean;
  /** Hide Save/Remove for every row (e.g. Super Admin platform view). */
  readOnly?: boolean;
  /** Show Captured by + Organisation columns (Admin/Super Admin scoped views). */
  showOwner?: boolean;
  onSave: (item: QueueItem) => void;
  onRemove: (item: QueueItem) => void;
};

export function QueueItemsTable({
  items,
  syncingQueueId,
  isBusy,
  readOnly = false,
  showOwner = false,
  onSave,
  onRemove,
}: QueueItemsTableProps) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm italic text-muted-foreground">
        No items in the queue — captures waiting to save will appear here.
      </p>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border/60 lg:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Contact</th>
              {showOwner ? (
                <>
                  <th className="px-4 py-3 font-medium">Captured by</th>
                  <th className="px-4 py-3 font-medium">Organisation</th>
                </>
              ) : null}
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Retries</th>
              <th className="px-4 py-3 font-medium">Queued</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {items.map((item) => {
              const isFailed = item.status === "failed";
              const isRetrying = item.status === "retrying";
              const rowLocked = readOnly || isRemoteRegistryItem(item);
              return (
                <tr key={item.id} className="transition hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{queueItemName(item)}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {item.contact_data.company || "No company"}
                    </div>
                    {isFailed && item.error_message ? (
                      <div className="mt-1 text-[11px] text-destructive">{item.error_message}</div>
                    ) : null}
                  </td>
                  {showOwner ? (
                    <>
                      <td className="max-w-[12rem] px-4 py-3 text-xs text-muted-foreground">
                        <div className="truncate font-medium text-foreground">
                          {capturedByLabel(item)}
                        </div>
                      </td>
                      <td className="max-w-[10rem] truncate px-4 py-3 text-xs text-muted-foreground">
                        {organisationLabel(item)}
                      </td>
                    </>
                  ) : null}
                  <td className="max-w-[10rem] truncate px-4 py-3 text-muted-foreground">
                    {item.contact_data.email || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {item.contact_data.phone || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <StatusPill status={queueStatusForPill(item.status)} />
                      {isRetrying ? (
                        <span className="text-[10px] font-medium text-primary">Retrying</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.retry_count}/5
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    {formatQueuedAt(item.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSave(item)}
                        disabled={rowLocked || syncingQueueId === item.id || isBusy}
                        className="h-8 rounded-lg text-xs"
                      >
                        {syncingQueueId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : isFailed ? (
                          <>
                            <RefreshCw className="mr-1.5 h-3 w-3" />
                            Retry
                          </>
                        ) : (
                          <>
                            <Save className="mr-1.5 h-3 w-3" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(item)}
                        disabled={rowLocked}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 lg:hidden">
        {items.map((item) => {
          const isFailed = item.status === "failed";
          const rowLocked = readOnly || isRemoteRegistryItem(item);
          return (
            <div
              key={item.id}
              className={cn(
                "rounded-xl border border-border/60 bg-card/40 p-3",
                isFailed && "border-destructive/20 bg-destructive/5",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-sm">{queueItemName(item)}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {item.contact_data.company || "No company"}
                  </div>
                  {showOwner ? (
                    <div className="mt-1 truncate text-[11px] text-muted-foreground">
                      By {capturedByLabel(item)}
                      {organisationLabel(item) !== "—"
                        ? ` · ${organisationLabel(item)}`
                        : ""}
                    </div>
                  ) : null}
                </div>
                <StatusPill status={queueStatusForPill(item.status)} />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                <span>{item.contact_data.email || "No email"}</span>
                <span>{item.contact_data.phone || "No phone"}</span>
                <span>Retries: {item.retry_count}/5</span>
                <span>{formatQueuedAt(item.created_at)}</span>
              </div>
              {isFailed && item.error_message ? (
                <p className="mt-2 text-[11px] text-destructive">{item.error_message}</p>
              ) : null}
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant={isFailed ? "outline" : "default"}
                  onClick={() => onSave(item)}
                  disabled={rowLocked || syncingQueueId === item.id || isBusy}
                  className="h-9 flex-1 rounded-lg text-xs"
                >
                  {syncingQueueId === item.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isFailed ? (
                    "Retry"
                  ) : (
                    "Save"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(item)}
                  disabled={rowLocked}
                  className="h-9 rounded-lg text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
