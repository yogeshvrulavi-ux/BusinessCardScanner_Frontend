import { useCallback, useEffect, useRef, useState } from "react";
import {
  contactRowKey,
  getContactsDirectorySnapshot,
  loadContactsDirectory,
  optimisticallyRemoveDirectoryContact,
  subscribeContactsDirectory,
  type ContactsDirectorySnapshot,
  type DirectoryContact,
} from "@/lib/contactsDirectory";

export function useContactsDirectory(options?: { autoLoad?: boolean }) {
  const autoLoad = options?.autoLoad !== false;
  const cached = getContactsDirectorySnapshot();
  const hasCachedData = Boolean(cached?.contacts.length);

  const [contacts, setContacts] = useState<DirectoryContact[]>(cached?.contacts ?? []);
  const [isLoading, setIsLoading] = useState(autoLoad && !hasCachedData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(cached?.fetchFailed ?? false);
  const hasLoadedOnceRef = useRef(hasCachedData);

  const applySnapshot = useCallback((snapshot: ContactsDirectorySnapshot) => {
    setContacts(snapshot.contacts);
    setFetchFailed(snapshot.fetchFailed);
    if (snapshot.contacts.length > 0) {
      hasLoadedOnceRef.current = true;
    }
  }, []);

  useEffect(
    () =>
      subscribeContactsDirectory(() => {
        const snapshot = getContactsDirectorySnapshot();
        if (snapshot) applySnapshot(snapshot);
      }),
    [applySnapshot],
  );

  const removeContact = useCallback((contact: Pick<DirectoryContact, "id" | "source">) => {
    optimisticallyRemoveDirectoryContact(contact);
    setContacts((prev) => prev.filter((c) => contactRowKey(c) !== contactRowKey(contact)));
  }, []);

  const refresh = useCallback(
    async (opts?: { silent?: boolean; force?: boolean }) => {
      const silent = opts?.silent ?? hasLoadedOnceRef.current;
      const force = opts?.force ?? !getContactsDirectorySnapshot();

      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const snapshot = await loadContactsDirectory({ force });
        applySnapshot(snapshot);
        return snapshot;
      } finally {
        if (silent) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [applySnapshot],
  );

  useEffect(() => {
    if (!autoLoad) return;

    void refresh({ silent: hasCachedData, force: false });

    const onDataChanged = () => {
      void refresh({ silent: true, force: true });
    };

    window.addEventListener("cs-contacts-updated", onDataChanged);
    window.addEventListener("cs-queue-updated", onDataChanged);

    return () => {
      window.removeEventListener("cs-contacts-updated", onDataChanged);
      window.removeEventListener("cs-queue-updated", onDataChanged);
    };
  }, [autoLoad, refresh, hasCachedData]);

  return { contacts, isLoading, isRefreshing, fetchFailed, refresh, removeContact };
}
