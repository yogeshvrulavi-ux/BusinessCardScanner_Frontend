import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/lib/AuthContext";
import {
  emptySnapshot,
  fetchStorageConfig,
  fetchStorageUsage,
  type StorageQuotaSnapshot,
} from "@/lib/storageQuotaApi";

type StorageQuotaContextValue = {
  quota: StorageQuotaSnapshot;
  loading: boolean;
  error: string | null;
  isBlocked: boolean;
  refresh: () => Promise<void>;
};

const StorageQuotaContext = createContext<StorageQuotaContextValue | null>(null);

export function StorageQuotaProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [quota, setQuota] = useState<StorageQuotaSnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setQuota(emptySnapshot());
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Prefer /usage; fall back to /config.quota so Super Admin without company still works.
      try {
        const snapshot = await fetchStorageUsage();
        setQuota(snapshot);
      } catch {
        const { quota: fromConfig } = await fetchStorageConfig();
        setQuota(fromConfig);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load storage quota.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onData = () => {
      void refresh();
    };
    window.addEventListener("cs-contacts-updated", onData);
    window.addEventListener("cs-queue-updated", onData);
    window.addEventListener("cs-last-sync-updated", onData);
    window.addEventListener("cs-sync-end", onData);
    return () => {
      window.removeEventListener("cs-contacts-updated", onData);
      window.removeEventListener("cs-queue-updated", onData);
      window.removeEventListener("cs-last-sync-updated", onData);
      window.removeEventListener("cs-sync-end", onData);
    };
  }, [refresh]);

  const value = useMemo<StorageQuotaContextValue>(
    () => ({
      quota,
      loading,
      error,
      isBlocked: !quota.canUpload || quota.warningLevel === "BLOCKED",
      refresh,
    }),
    [quota, loading, error, refresh],
  );

  return (
    <StorageQuotaContext.Provider value={value}>{children}</StorageQuotaContext.Provider>
  );
}

export function useStorageQuota(): StorageQuotaContextValue {
  const ctx = useContext(StorageQuotaContext);
  if (!ctx) {
    return {
      quota: emptySnapshot(),
      loading: false,
      error: null,
      isBlocked: false,
      refresh: async () => undefined,
    };
  }
  return ctx;
}
