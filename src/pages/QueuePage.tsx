import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Activity,
  CheckCircle2,
  Inbox,
  ArrowRight,
  Loader2,
  HardDrive,
  Save,
  CalendarDays,
  TrendingUp,
  Cloud,
  Layers,
} from "lucide-react";
import { buildQueuePipelineSnapshot } from "@/lib/queueAnalytics";
import {
  loadCaptureSourceStats,
  type CaptureSourceStats,
} from "@/lib/captureSourceAnalytics";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/PageShell";
import { PAGE } from "@/constants/navigation";
import { useConfirmModal } from "@/components/ui/confirm-modal";
import { QueueAnalyticsSection } from "@/components/queue/QueueAnalyticsSection";
import { QueueItemsTable } from "@/components/queue/QueueItemsTable";
import {
  getQueueItems,
  updateQueueItem,
  removeQueueItem,
  type QueueItem,
} from "@/lib/indexeddb";
import {
  listContacts,
  syncAllQueueItems,
  syncQueueItem,
  type StoredContact,
} from "@/lib/contactStorage";
import { toast } from "sonner";
import { useAuth, type AuthUser } from "@/lib/AuthContext";
import {
  listPlatformOfflineQueue,
  publishOfflineQueueSnapshot,
} from "@/lib/offlineQueueRegistry";

function queueItemName(item: QueueItem): string {
  const d = item.contact_data;
  return String(d?.fullName || d?.name || "Unnamed Contact");
}

function isSavedOnDevice(contact: StoredContact): boolean {
  return contact.syncStatus === "synced";
}

function stampLocalOwner(items: QueueItem[], authUser: AuthUser | null): QueueItem[] {
  if (!authUser) return items;
  const fullName = `${authUser.first_name || ""} ${authUser.last_name || ""}`.trim();
  return items.map((item) => ({
    ...item,
    contact_data: {
      ...item.contact_data,
      capturedByUserId: item.capturedByUserId || authUser.id,
      capturedByName: item.contact_data?.capturedByName || fullName,
      capturedByUsername: item.contact_data?.capturedByUsername || "",
    },
  }));
}

export function QueuePage() {
  const { confirm } = useConfirmModal();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isAdmin = user?.role === "ADMIN";
  /** Show Captured by / Organisation ? Super Admin (all) and Admin (company). */
  const showOwner = isSuperAdmin || isAdmin;
  const [contacts, setContacts] = useState<StoredContact[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [syncingQueueId, setSyncingQueueId] = useState<string | null>(null);
  const [captureStats, setCaptureStats] = useState<CaptureSourceStats>(() =>
    loadCaptureSourceStats(),
  );

  const loadData = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    try {
      if (!silent) setIsLoading(true);
      const [storedContacts, localQueue] = await Promise.all([
        listContacts(),
        getQueueItems(),
      ]);
      setContacts(storedContacts);

      // Reporting is best-effort and never blocks the existing local queue.
      try {
        await publishOfflineQueueSnapshot(localQueue);
      } catch {
        /* The device queue remains fully functional if reporting is unavailable. */
      }

      if (isSuperAdmin) {
        // Platform-wide registry (read-only in the table).
        setQueueItems(await listPlatformOfflineQueue());
      } else if (isAdmin) {
        // Company registry + this device's actionable local items.
        let companyQueue: QueueItem[] = [];
        try {
          companyQueue = await listPlatformOfflineQueue();
        } catch {
          /* Fall back to local-only if registry is unreachable. */
        }
        const localIds = new Set(localQueue.map((item) => item.id));
        const remoteOthers = companyQueue.filter((item) => {
          const queueId = item.id.replace(/^platform:[^:]+:/, "");
          return !localIds.has(queueId);
        });
        setQueueItems([...stampLocalOwner(localQueue, user), ...remoteOthers]);
      } else {
        setQueueItems(localQueue);
      }
    } catch (e) {
      console.error("Failed to load queue data:", e);
      if (!silent) toast.error("Failed to refresh queue.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [isSuperAdmin, isAdmin, user]);

  useEffect(() => {
    void loadData();

    const refresh = () => void loadData({ silent: true });

    window.addEventListener("cs-queue-updated", refresh);
    window.addEventListener("cs-contacts-updated", refresh);
    window.addEventListener("focus", refresh);

    const refreshCaptureStats = () => setCaptureStats(loadCaptureSourceStats());
    window.addEventListener("cs-capture-stats-updated", refreshCaptureStats);

    const intervalId = window.setInterval(refresh, 15000);

    return () => {
      window.removeEventListener("cs-queue-updated", refresh);
      window.removeEventListener("cs-contacts-updated", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("cs-capture-stats-updated", refreshCaptureStats);
      window.clearInterval(intervalId);
    };
  }, [loadData]);

  const notifyUpdated = () => {
    window.dispatchEvent(new CustomEvent("cs-contacts-updated"));
    window.dispatchEvent(new CustomEvent("cs-queue-updated"));
  };

  const syncOneQueueItem = async (item: QueueItem): Promise<boolean> => {
    await updateQueueItem({
      ...item,
      status: "retrying",
      last_attempt: new Date().toISOString(),
    });

    try {
      await syncQueueItem(item);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Save failed";
      const nextRetryCount = item.retry_count + 1;
      await updateQueueItem({
        ...item,
        status: nextRetryCount >= 5 ? "failed" : "pending",
        retry_count: nextRetryCount,
        last_attempt: new Date().toISOString(),
        error_message: message,
      });
      throw err;
    }
  };

  const saveAllFromQueue = async () => {
    if (isSuperAdmin) {
      toast.info("The platform-wide queue is read-only.");
      return;
    }
    if (isSavingAll) return;

    const unsynced = queueItems.filter(
      (i) => i.status === "pending" || i.status === "retrying",
    );
    if (unsynced.length === 0) {
      toast.info("Queue is empty ? nothing waiting to save.");
      return;
    }

    setIsSavingAll(true);
    toast.info(`Saving ${unsynced.length} contact(s) on this device...`);
    try {
      const { synced, total } = await syncAllQueueItems();
      if (synced > 0) {
        toast.success(`Saved ${synced} of ${total} to this device.`);
      } else {
        toast.error("Could not save any contacts. Check the failed section.");
      }
    } finally {
      await loadData({ silent: true });
      notifyUpdated();
      setIsSavingAll(false);
    }
  };

  const handleSaveQueueItem = async (item: QueueItem) => {
    if (isSuperAdmin || item.id.startsWith("platform:")) {
      toast.info("Platform queue records are read-only.");
      return;
    }
    setSyncingQueueId(item.id);
    try {
      await syncOneQueueItem(item);
      toast.success(`Saved on device: ${queueItemName(item)}`);
      await loadData({ silent: true });
      notifyUpdated();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Save failed";
      toast.error(message);
      await loadData({ silent: true });
    } finally {
      setSyncingQueueId(null);
    }
  };

  const handleRemoveQueueItem = async (item: QueueItem) => {
    if (isSuperAdmin || item.id.startsWith("platform:")) {
      toast.info("Platform queue records are read-only.");
      return;
    }
    const ok = await confirm({
      title: "Remove from queue?",
      description: `Remove "${queueItemName(item)}" from the queue?`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    try {
      await removeQueueItem(item.id);
      toast.success("Removed from queue.");
      await loadData({ silent: true });
      notifyUpdated();
    } catch {
      toast.error("Failed to remove queue item.");
    }
  };

  const stats = useMemo(() => {
    const actionable = queueItems.filter((i) => !i.id.startsWith("platform:"));
    const waiting = actionable.filter(
      (i) => i.status === "pending" || i.status === "retrying",
    ).length;
    const failed = queueItems.filter((i) => i.status === "failed").length;
    const totalInQueueDb = queueItems.filter((i) => i.status !== "synced").length;
    const savedOnDevice = contacts.filter(isSavedOnDevice).length;
    const snapshot = buildQueuePipelineSnapshot(contacts, queueItems);

    return {
      waiting,
      failed,
      totalInQueueDb,
      savedOnDevice,
      savesToday: snapshot.savesToday,
      savesThisWeek: snapshot.savesThisWeek,
      queuedOffline: captureStats.queuedOffline,
      syncedFromQueue: captureStats.syncedFromQueue,
      directToDatabase: captureStats.directToDatabase,
    };
  }, [queueItems, contacts, captureStats]);

  const statWidgets = useMemo(
    () => [
      {
        label: "Waiting now",
        value: stats.waiting,
        icon: Inbox,
        tone: "text-warning",
      },
      {
        label: "In IndexedDB queue",
        value: stats.totalInQueueDb,
        icon: Layers,
        tone: "text-warning",
      },
      {
        label: "Synced from queue",
        value: stats.syncedFromQueue,
        icon: HardDrive,
        tone: "text-primary",
      },
      {
        label: "Direct to database",
        value: stats.directToDatabase,
        icon: Cloud,
        tone: "text-success",
      },
      {
        label: "Offline captures",
        value: stats.queuedOffline,
        icon: TrendingUp,
        tone: "text-primary",
      },
      {
        label: "Saves today",
        value: stats.savesToday,
        icon: CalendarDays,
        tone: "text-muted-foreground",
      },
    ],
    [stats],
  );

  const stages = [
    {
      label: "Waiting in queue",
      count: stats.waiting,
      icon: Inbox,
      tone: "warning" as const,
    },
    {
      label: "Saved on device",
      count: stats.savedOnDevice,
      icon: CheckCircle2,
      tone: "success" as const,
    },
  ];

  const pendingList = useMemo(
    () => queueItems.filter((i) => i.status === "pending" || i.status === "retrying"),
    [queueItems],
  );

  const failedList = useMemo(
    () => queueItems.filter((i) => i.status === "failed"),
    [queueItems],
  );

  const queueTableItems = useMemo(
    () =>
      [...queueItems]
        .filter((i) => i.status !== "synced")
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
    [queueItems],
  );

  const isBusy = isSavingAll;

  return (
    <div className="page-bottom-safe lg:pb-0">
      <PageShell title={PAGE.syncQueue.title} description={PAGE.syncQueue.description}>
        <Card className="sticky top-0 z-10 rounded-2xl border-border/60 bg-card/95 p-3 shadow-soft backdrop-blur-md sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground sm:text-sm">
              Move offline captures from the queue into your contact directory on this device.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => void saveAllFromQueue()}
                disabled={isSuperAdmin || isBusy || isLoading || stats.waiting === 0}
                className="h-9 min-w-0 flex-1 rounded-md bg-gradient-primary shadow-glow disabled:opacity-50 sm:flex-none"
              >
                {isSavingAll ? (
                  <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4 shrink-0" />
                )}
                Save all from queue
                {stats.waiting > 0 && (
                  <span className="ml-1.5 rounded-full bg-primary-foreground/20 px-1.5 text-[10px]">
                    {stats.waiting}
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => void loadData()}
                disabled={isLoading}
                className="h-9 min-w-0 flex-1 rounded-md sm:flex-none"
              >
                <RefreshCw className={`mr-2 h-4 w-4 shrink-0 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </Card>

    
        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-5 sm:space-y-6">
            <p className="text-xs text-muted-foreground">
              Offline saves are stored in IndexedDB (<span className="font-medium">source: queue</span> in
              Contacts). Online saves go straight to the database (<span className="font-medium">source: online</span>) and
              never enter the queue. Counters below track how each path was used on this device.
            </p>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6 lg:gap-4">
              {statWidgets.map((s) => (
                <Card key={s.label} className="rounded-2xl border-border/60 p-4 shadow-soft sm:p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                    <s.icon className={`h-4 w-4 ${s.tone}`} />
                  </div>
                  <div className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                    {s.value}
                  </div>
                </Card>
              ))}
            </div>

            <Card className="overflow-hidden rounded-2xl border-border/60 p-4 shadow-soft sm:p-6">
              <div className="mb-3 flex flex-col gap-1 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-medium">Offline ? online (this device)</div>
                  <div className="text-xs text-muted-foreground">
                    Captures held offline move into your saved contacts when you save them here.
                  </div>
                </div>
                <Activity className="hidden h-4 w-4 text-primary sm:block" />
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
                {stages.map((s, i) => (
                  <div key={s.label} className="flex flex-1 items-center gap-2">
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="relative flex flex-1 items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-soft sm:p-4"
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${
                          s.tone === "success"
                            ? "bg-success/10 text-success"
                            : "bg-warning/15 text-warning-foreground"
                        }`}
                      >
                        <s.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                          {s.label}
                        </div>
                        <div className="font-display text-lg font-semibold tracking-tight sm:text-xl">
                          {s.count}
                        </div>
                      </div>
                    </motion.div>
                    {i < stages.length - 1 && (
                      <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground md:block" />
                    )}
                  </div>
                ))}
              </div>

              <QueueAnalyticsSection contacts={contacts} queueItems={queueItems} />
            </Card>

            <Card className="rounded-2xl border-border/60 p-4 shadow-soft sm:p-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-medium">Queue items</div>
                  <div className="text-xs text-muted-foreground">
                    All captures waiting to save on this device
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full bg-warning/10 px-2 py-0.5 font-medium text-warning">
                    Pending {pendingList.length}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                    Total in DB {stats.totalInQueueDb}
                  </span>
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 font-medium text-destructive">
                    Failed {failedList.length}
                  </span>
                </div>
              </div>
              <QueueItemsTable
                items={queueTableItems}
                syncingQueueId={syncingQueueId}
                isBusy={isBusy}
                readOnly={isSuperAdmin}
                showOwner={showOwner}
                onSave={(item) => void handleSaveQueueItem(item)}
                onRemove={(item) => void handleRemoveQueueItem(item)}
              />
            </Card>
          </div>
        )}
      </PageShell>
    </div>
  );
}
