import { API_BASE_URL } from "@/lib/api";
import { apiFetch } from "@/lib/apiFetch";
import {
  formatStorageWithCardEstimate,
  getPlanById,
  resolveUiWarningLevel,
  type UiWarningLevel,
} from "@/lib/subscriptionPlans";

export type CompanyQuotaPayload = {
  company_id?: string;
  plan?: string;
  plan_name?: string;
  storage_limit_bytes?: number;
  used_storage_bytes?: number;
  remaining_storage_bytes?: number;
  used_percentage?: number;
  used_mb?: number;
  limit_mb?: number;
  remaining_mb?: number;
  can_upload?: boolean;
  warning_level?: string;
};

export type StorageConfigResponse = {
  storage?: string;
  database?: { ok?: boolean; storage?: string };
  usage?: {
    cards_scanned?: number;
    contacts?: number;
    images_stored?: number;
    image_bytes?: number;
    database_bytes?: number | null;
  };
  quota?: CompanyQuotaPayload;
};

export type StorageQuotaSnapshot = {
  plan: string;
  planName: string;
  storageLimitBytes: number;
  usedStorageBytes: number;
  remainingStorageBytes: number;
  usedPercentage: number;
  usedMb: number;
  limitMb: number;
  remainingMb: number;
  canUpload: boolean;
  warningLevel: UiWarningLevel;
  usedLabel: string;
  limitLabel: string;
  remainingLabel: string;
};

function emptySnapshot(): StorageQuotaSnapshot {
  const plan = getPlanById("FREEMIUM");
  return {
    plan: plan.id,
    planName: plan.name,
    storageLimitBytes: plan.storageBytes,
    usedStorageBytes: 0,
    remainingStorageBytes: plan.storageBytes,
    usedPercentage: 0,
    usedMb: 0,
    limitMb: plan.storageBytes / (1024 * 1024),
    remainingMb: plan.storageBytes / (1024 * 1024),
    canUpload: true,
    warningLevel: "NORMAL",
    usedLabel: formatStorageWithCardEstimate(0),
    limitLabel: formatStorageWithCardEstimate(plan.storageBytes, plan.storageLabel),
    remainingLabel: formatStorageWithCardEstimate(plan.storageBytes, plan.storageLabel),
  };
}

export function normalizeQuota(raw: CompanyQuotaPayload | null | undefined): StorageQuotaSnapshot {
  if (!raw) return emptySnapshot();

  const planMeta = getPlanById(raw.plan || raw.plan_name);
  const limit = Math.max(0, Number(raw.storage_limit_bytes ?? planMeta.storageBytes) || 0);
  const used = Math.max(0, Number(raw.used_storage_bytes) || 0);
  const remaining = Math.max(
    0,
    Number(raw.remaining_storage_bytes ?? limit - used) || 0,
  );
  const usedPercentage =
    typeof raw.used_percentage === "number" && Number.isFinite(raw.used_percentage)
      ? raw.used_percentage
      : limit > 0
        ? Math.round((used / limit) * 1000) / 10
        : 0;
  const canUpload =
    typeof raw.can_upload === "boolean" ? raw.can_upload : remaining > 0 && used < limit;
  const warningLevel = resolveUiWarningLevel(usedPercentage, canUpload);

  return {
    plan: planMeta.id,
    planName: planMeta.name,
    storageLimitBytes: limit,
    usedStorageBytes: used,
    remainingStorageBytes: remaining,
    usedPercentage,
    usedMb: Number(raw.used_mb ?? used / (1024 * 1024)) || 0,
    limitMb: Number(raw.limit_mb ?? limit / (1024 * 1024)) || 0,
    remainingMb: Number(raw.remaining_mb ?? remaining / (1024 * 1024)) || 0,
    canUpload,
    warningLevel,
    usedLabel: formatStorageWithCardEstimate(used),
    limitLabel: formatStorageWithCardEstimate(limit),
    remainingLabel: formatStorageWithCardEstimate(remaining),
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await apiFetch(`${API_BASE_URL}${url}`, {
    headers: { "Content-Type": "application/json" },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = body?.detail?.message ?? body?.detail ?? `Request failed (${res.status})`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return body as T;
}

export async function fetchStorageUsage(): Promise<StorageQuotaSnapshot> {
  const data = await fetchJson<CompanyQuotaPayload>("/api/storage/usage");
  return normalizeQuota(data);
}

export async function fetchStorageConfig(): Promise<{
  config: StorageConfigResponse;
  quota: StorageQuotaSnapshot;
}> {
  const config = await fetchJson<StorageConfigResponse>("/api/storage/config");
  const quota = config.quota
    ? normalizeQuota(config.quota)
    : await fetchStorageUsage().catch(() => emptySnapshot());
  return { config, quota };
}

export { emptySnapshot };
