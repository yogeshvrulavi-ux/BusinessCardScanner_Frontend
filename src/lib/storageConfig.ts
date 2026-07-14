export type ContactStorageMode = "indexeddb";

let resolvedStorageMode: ContactStorageMode | null = null;

export function setResolvedStorageMode(mode: ContactStorageMode): void {
  resolvedStorageMode = mode;
}

export function getResolvedStorageMode(): ContactStorageMode | null {
  return resolvedStorageMode;
}

export function resolveOfflineStorageMode(): ContactStorageMode {
  return "indexeddb";
}

export function getEffectiveStorageMode(): ContactStorageMode {
  return resolvedStorageMode ?? "indexeddb";
}

export function isIndexedDbStorage(): boolean {
  return true;
}

export function storageLabel(options?: { online?: boolean }): string {
  const online = options?.online ?? false;
  return online ? "Zoho CRM" : "Offline queue (device)";
}
