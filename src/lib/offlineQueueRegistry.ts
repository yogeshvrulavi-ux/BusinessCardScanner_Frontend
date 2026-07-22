import { API_BASE_URL } from "@/lib/api";
import { apiFetch } from "@/lib/apiFetch";
import { getQueueItems, type QueueItem } from "@/lib/indexeddb";

type PlatformQueueRecord = {
  queue_id: string;
  status: QueueItem["status"];
  retry_count: number;
  contact_data: QueueItem["contact_data"];
  error_message?: string | null;
  queued_at: string;
  last_attempt?: string | null;
  created_by_user_id: string;
  created_by_username?: string;
  created_by_name?: string;
  owner_company_name?: string;
};

function snapshotBody(items: QueueItem[]) {
  let currentUserId = "";
  try {
    const stored = localStorage.getItem("cs_auth_user");
    currentUserId = stored ? String(JSON.parse(stored).id || "").trim() : "";
  } catch {
    /* Missing identity makes reporting a no-op below. */
  }

  return {
    items: items
      .filter((item) => {
        if (!currentUserId || item.status === "synced") return false;
        const capturedBy = String(
          item.capturedByUserId || item.contact_data?.capturedByUserId || "",
        ).trim();
        // Legacy records without an owner belong to the current browser user;
        // explicitly-owned records must never be reassigned on shared devices.
        return !capturedBy || capturedBy === currentUserId;
      })
      .map((item) => ({
        id: item.id,
        contact_data: item.contact_data ?? {},
        status: item.status,
        retry_count: item.retry_count,
        created_at: item.created_at,
        last_attempt: item.last_attempt || null,
        error_message: item.error_message || null,
      })),
  };
}

/** Best-effort mirror only; IndexedDB remains the synchronization source. */
export async function publishOfflineQueueSnapshot(items?: QueueItem[]): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  const currentItems = items ?? (await getQueueItems());
  const response = await apiFetch(`${API_BASE_URL}/api/offline-queue/snapshot`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(snapshotBody(currentItems)),
  });
  if (!response.ok) throw new Error(`Queue snapshot failed (${response.status})`);
}

/** Platform records are read-only on this device and use collision-safe IDs. */
export async function listPlatformOfflineQueue(options?: {
  page?: number;
  limit?: number;
}): Promise<{ items: QueueItem[]; total: number; page: number; limit: number }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;
  const response = await apiFetch(
    `${API_BASE_URL}/api/offline-queue?page=${page}&limit=${limit}`,
  );
  if (!response.ok) throw new Error(`Platform queue failed (${response.status})`);
  const data = (await response.json()) as {
    items?: PlatformQueueRecord[];
    total?: number;
    page?: number;
    limit?: number;
  };
  const items = (data.items ?? []).map((record) => ({
    id: `platform:${record.created_by_user_id}:${record.queue_id}`,
    contact_data: {
      ...(record.contact_data ?? {}),
      capturedByUserId: record.created_by_user_id,
      capturedByName: record.created_by_name ?? "",
      capturedByUsername: record.created_by_username ?? "",
      ownerCompanyName: record.owner_company_name ?? "",
    },
    status: record.status,
    retry_count: record.retry_count,
    created_at: record.queued_at,
    last_attempt: record.last_attempt ?? "",
    error_message: record.error_message ?? undefined,
    capturedByUserId: record.created_by_user_id,
  }));
  return {
    items,
    total: typeof data.total === "number" ? data.total : items.length,
    page: typeof data.page === "number" ? data.page : page,
    limit: typeof data.limit === "number" ? data.limit : limit,
  };
}
