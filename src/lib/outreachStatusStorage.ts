import type { SyncResult } from "@/lib/contactApi";
import {
  getCurrentAppUser,
  getUserScopeKeys,
  type AppUserIdentity,
} from "@/lib/currentAppUser";

export type ChannelDeliveryState =
  | "success"
  | "failure"
  | "skipped"
  | "unavailable"
  | "unknown";

export type OutreachDeliveryRecord = {
  state: ChannelDeliveryState;
  error?: string | null;
  attempted?: boolean;
  updatedAt: string;
};

export type OutreachStatusEntry = {
  email?: string;
  phone?: string;
  name?: string;
  emailDelivery?: OutreachDeliveryRecord;
  whatsappDelivery?: OutreachDeliveryRecord;
};

const STORAGE_KEY = "cs-outreach-status-v2";

type OutreachStore = Record<string, OutreachStatusEntry>;
type ScopedOutreachStorage = Record<string, OutreachStore>;

export type OutreachContactRef = {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
};

function normalizePart(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase();
}

export function outreachContactKey(input: OutreachContactRef): string {
  const email = normalizePart(input.email);
  const phone = normalizePart(input.phone);
  const name = normalizePart(input.name);
  return `contact:${email}|${phone}|${name}`;
}

function migrateLegacyStore(): ScopedOutreachStorage {
  if (typeof window === "undefined") return {};
  try {
    const legacyRaw = window.localStorage.getItem("cs-outreach-status-v1");
    if (!legacyRaw) return {};
    const legacy = JSON.parse(legacyRaw) as OutreachStore;
    const scoped: ScopedOutreachStorage = { anonymous: legacy };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scoped));
    window.localStorage.removeItem("cs-outreach-status-v1");
    return scoped;
  } catch {
    return {};
  }
}

function readAllScopedStores(): ScopedOutreachStorage {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return migrateLegacyStore();
    const parsed = JSON.parse(raw) as ScopedOutreachStorage;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAllScopedStores(stores: ScopedOutreachStorage): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stores));
  } catch (err) {
    console.warn("Failed to persist outreach status:", err);
  }
}

function readStore(scope: string): OutreachStore {
  const all = readAllScopedStores();
  return all[scope] || {};
}

function writeStore(scope: string, store: OutreachStore): void {
  const all = readAllScopedStores();
  all[scope] = store;
  writeAllScopedStores(all);
}

function lookupEntry(
  store: OutreachStore,
  contact: OutreachContactRef,
): OutreachStatusEntry | undefined {
  const key = outreachContactKey(contact);
  return store[key];
}

function findEntryForUser(
  contact: OutreachContactRef,
  appUser: AppUserIdentity | null,
): OutreachStatusEntry | undefined {
  for (const scope of getUserScopeKeys(appUser)) {
    const entry = lookupEntry(readStore(scope), contact);
    if (entry) return entry;
  }
  return undefined;
}

export function clearOutreachStatusForUser(appUser: AppUserIdentity | null): void {
  const all = readAllScopedStores();
  for (const scope of getUserScopeKeys(appUser)) {
    delete all[scope];
  }
  writeAllScopedStores(all);
}

function resolveChannelState(input: {
  hasChannel: boolean;
  attempted?: boolean;
  sent?: boolean;
  skipped?: boolean;
  error?: string | null;
}): ChannelDeliveryState {
  if (!input.hasChannel) return "unavailable";
  if (input.sent === true) return "success";
  if (input.skipped) return "skipped";
  if (input.attempted === true && input.sent === false) return "failure";
  if (input.error) {
    const message = String(input.error).toLowerCase();
    if (
      message.includes("skipped") ||
      message.includes("disabled") ||
      message.includes("offline mode") ||
      message.includes("will send when")
    ) {
      return "skipped";
    }
    if (input.attempted === true) return "failure";
  }
  return "unknown";
}

function buildDeliveryRecord(input: {
  hasChannel: boolean;
  attempted?: boolean;
  sent?: boolean;
  skipped?: boolean;
  error?: string | null;
}): OutreachDeliveryRecord | undefined {
  const state = resolveChannelState(input);
  if (state === "unknown" && !input.attempted && !input.error && input.sent !== true) {
    return undefined;
  }
  return {
    state,
    error: input.error ?? null,
    attempted: input.attempted,
    updatedAt: new Date().toISOString(),
  };
}

export async function recordOutreachFromSyncResult(
  contact: OutreachContactRef,
  result: Pick<
    SyncResult,
    | "emailSent"
    | "emailAttempted"
    | "emailError"
    | "emailSkipped"
    | "whatsappSent"
    | "whatsappAttempted"
    | "whatsappError"
  >,
): Promise<void> {
  const appUser = await getCurrentAppUser();
  const emailAttempted =
    result.emailAttempted === true || result.emailSent === true;
  const whatsappAttempted =
    result.whatsappAttempted === true || result.whatsappSent === true;

  const hasEmail = Boolean(normalizePart(contact.email));
  const hasPhone = Boolean(normalizePart(contact.phone));

  const emailDelivery = buildDeliveryRecord({
    hasChannel: hasEmail,
    attempted: emailAttempted,
    sent: result.emailSent === true,
    skipped: result.emailSkipped,
    error: result.emailError,
  });
  const whatsappDelivery = buildDeliveryRecord({
    hasChannel: hasPhone,
    attempted: whatsappAttempted,
    sent: result.whatsappSent === true,
    error: result.whatsappError,
  });

  const entry: OutreachStatusEntry = {
    email: contact.email || undefined,
    phone: contact.phone || undefined,
    name: contact.name || undefined,
    ...(emailDelivery ? { emailDelivery } : {}),
    ...(whatsappDelivery ? { whatsappDelivery } : {}),
  };

  const contactKey = outreachContactKey(contact);

  for (const scope of getUserScopeKeys(appUser)) {
    const store = readStore(scope);
    store[contactKey] = { ...(store[contactKey] || {}), ...entry };
    writeStore(scope, store);
  }
}

export function getOutreachStatusForContactSync(
  contact: OutreachContactRef,
  appUser: AppUserIdentity | null,
): Pick<OutreachStatusEntry, "emailDelivery" | "whatsappDelivery"> {
  const entry = findEntryForUser(contact, appUser);
  if (!entry) return {};
  return {
    emailDelivery: entry.emailDelivery,
    whatsappDelivery: entry.whatsappDelivery,
  };
}

export function removeOutreachStatusForContact(
  contact: OutreachContactRef,
  appUser: AppUserIdentity | null,
): void {
  const key = outreachContactKey(contact);

  for (const scope of getUserScopeKeys(appUser)) {
    const store = readStore(scope);
    if (store[key]) {
      delete store[key];
      writeStore(scope, store);
    }
  }
}

/** Icon mapping helper: success | failure | pending (no send result yet). */
export function resolveChannelIconStatus(
  record: OutreachDeliveryRecord | undefined,
): "success" | "failure" | "not_sent" | "pending" {
  if (!record) return "pending";
  if (record.state === "success") return "success";
  if (record.state === "failure") return "failure";
  if (record.state === "skipped" || record.state === "unavailable") return "not_sent";
  return "pending";
}
