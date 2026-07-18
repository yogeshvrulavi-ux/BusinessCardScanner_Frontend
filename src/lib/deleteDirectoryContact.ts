import { deleteContactFromBackend } from "@/lib/contactApi";
import type { DirectoryContact } from "@/lib/contactsDirectory";
import {
  invalidateContactsDirectory,
  optimisticallyRemoveDirectoryContact,
} from "@/lib/contactsDirectory";
import { contactBelongsToAppUser, getCurrentAppUser } from "@/lib/currentAppUser";
import {
  getQueueItems,
  getStoredContactById,
  removeQueueItem,
} from "@/lib/indexeddb";
import { removeOutreachStatusForContact } from "@/lib/outreachStatusStorage";

function notifyContactsListChanged(
  removed?: Pick<DirectoryContact, "id" | "source">,
): void {
  if (removed) {
    optimisticallyRemoveDirectoryContact(removed);
  } else {
    invalidateContactsDirectory();
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cs-contacts-updated"));
    window.dispatchEvent(new CustomEvent("cs-queue-updated"));
  }
}

async function assertContactOwnedByCurrentUser(
  contact: DirectoryContact,
): Promise<void> {
  // PostgreSQL deletes are authorized by backend RBAC (Admin can remove
  // teammates' contacts). Client ownership stamps only apply to offline queue.
  if (contact.source === "localdb") {
    return;
  }

  const appUser = await getCurrentAppUser();
  if (contact.source === "queue") {
    const items = await getQueueItems();
    const item = items.find((entry) => entry.id === contact.id);
    if (item && !contactBelongsToAppUser(item, appUser)) {
      throw new Error("You do not have permission to delete this contact.");
    }
    return;
  }

  if (contact.source === "indexeddb") {
    const stored = await getStoredContactById(contact.id);
    if (stored && !contactBelongsToAppUser(stored, appUser)) {
      throw new Error("You do not have permission to delete this contact.");
    }
  }
}

/** Delete a contact — removes from queue or soft-deletes via PostgreSQL backend. */
export async function deleteDirectoryContact(contact: DirectoryContact): Promise<void> {
  await assertContactOwnedByCurrentUser(contact);
  const appUser = await getCurrentAppUser();

  if (contact.source === "queue") {
    await removeQueueItem(contact.id);
    removeOutreachStatusForContact(contact, appUser);
    notifyContactsListChanged(contact);
    return;
  }

  if (contact.source === "localdb" || contact.source === "indexeddb") {
    // Soft-delete via PostgreSQL backend
    await deleteContactFromBackend(contact.id);
    removeOutreachStatusForContact(contact, appUser);
    notifyContactsListChanged(contact);
    return;
  }

  throw new Error("Unknown contact source — cannot delete.");
}
