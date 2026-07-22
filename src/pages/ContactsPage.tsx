import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Filter, RefreshCw, Plus, Trash2, Send, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageShell } from "@/components/layout/PageShell";
import { PAGE } from "@/constants/navigation";
import { StatusPill } from "@/components/layout/StatusPill";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useConfirmModal } from "@/components/ui/confirm-modal";
import {
  syncAllQueueItems,
  syncQueueItem,
} from "@/lib/contactStorage";
import { useContactsDirectory } from "@/hooks/useContactsDirectory";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useAuth } from "@/lib/AuthContext";
import { deleteDirectoryContact } from "@/lib/deleteDirectoryContact";
import { contactRowKey, type DirectoryContact } from "@/lib/contactsDirectory";
import { getQueueItems } from "@/lib/indexeddb";
import { loadEvents } from "@/lib/eventStorage";
import type { ContactStatus } from "@/lib/contactStatus";
import { Route as ContactsRoute } from "@/routes/contacts";
import { cn } from "@/lib/utils";
import { ContactChannelIcons } from "@/components/contacts/ContactChannelIcons";
import { CardImageCell } from "@/components/contacts/CardImageCell";

export type Contact = DirectoryContact;

const InitialsAvatar = ({
  initials,
  accent = "from-cyan-500 to-teal-500",
  className,
}: {
  initials?: string;
  accent?: string;
  className?: string;
}) => (
  <div
    className={cn(
      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-[11px] font-semibold text-white",
      accent,
      className,
    )}
  >
    {initials || "?"}
  </div>
);

const statusTabs: { key: "all" | ContactStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "synced", label: "Synced" },
  { key: "pending", label: "Pending" },
  { key: "failed", label: "Failed" },
];

export function ContactsPage() {
  const { confirm } = useConfirmModal();
  const navigate = useNavigate({ from: ContactsRoute.fullPath });
  const { q = "", highlight, event: eventFilter = "" } = ContactsRoute.useSearch();
  const { user: authUser } = useAuth();
  const isSuperAdmin = authUser?.role === "SUPER_ADMIN";
  const isAdmin = authUser?.role === "ADMIN";
  const canDelete = authUser?.role === "SUPER_ADMIN" || authUser?.role === "ADMIN";
  const setQ = (next: string) => {
    void navigate({ search: (prev) => ({ ...prev, q: next.trim() || undefined }), replace: true });
  };
  const setEventFilter = (next: string) => {
    void navigate({
      search: (prev) => ({ ...prev, event: next === "all" ? undefined : next }),
      replace: true,
    });
  };
  const clearFilters = () => {
    setTab("all");
    void navigate({
      search: (prev) => ({ ...prev, q: undefined, event: undefined }),
      replace: true,
    });
  };
  const { contacts: contactsList, isLoading, isRefreshing, refresh, removeContact } =
    useContactsDirectory();
  const { settings: userSettings } = useUserSettings();
  const showWhatsAppTemplateStatus = userSettings.whatsappNotificationsEnabled;
  const showEmailTemplateStatus = userSettings.emailNotificationsEnabled;
  const showTemplateStatusColumn = showWhatsAppTemplateStatus || showEmailTemplateStatus;
  const templateColumnLabel = [
    showWhatsAppTemplateStatus ? "WhatsApp" : null,
    showEmailTemplateStatus ? "Email" : null,
  ]
    .filter(Boolean)
    .join(" / ");
  const showInitialLoading = isLoading && contactsList.length === 0;
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | ContactStatus>("all");
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount =
    (q ? 1 : 0) + (eventFilter ? 1 : 0) + (tab !== "all" ? 1 : 0);

  const reloadContacts = async ({
    silent = false,
    force = true,
  }: { silent?: boolean; force?: boolean } = {}) => {
    try {
      setError(null);
      const result = await refresh({ silent, force });
      if (result?.fetchFailed && !silent) {
        toast.info("Some contacts could not be loaded. Showing available data.");
      }
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load contacts.");
    }
  };

  const handleSyncQueueItem = async (queueId: string) => {
    setSyncingId(queueId);
    try {
      const items = await getQueueItems();
      const item = items.find((qi) => qi.id === queueId);
      if (!item) {
        toast.error("Queued contact not found.");
        return;
      }
      await syncQueueItem(item, {
        skipWhatsApp: !userSettings.whatsappNotificationsEnabled,
        skipEmail: !userSettings.emailNotificationsEnabled,
      });
      toast.success(`Synced: ${item.contact_data.name || "contact"}`);
      window.dispatchEvent(new CustomEvent("cs-contacts-updated"));
      window.dispatchEvent(new CustomEvent("cs-queue-updated"));
    } catch (err: any) {
      toast.error(err.message || "Failed to sync contact.");
    } finally {
      setSyncingId(null);
    }
  };

  const handleSyncAllQueue = async () => {
    const queuePending = contactsList.filter((c) => c.source === "queue");
    if (queuePending.length === 0) {
      toast.info("No queued contacts waiting to sync.");
      return;
    }
    setIsSyncingAll(true);
    try {
      const result = await syncAllQueueItems({
        skipWhatsApp: !userSettings.whatsappNotificationsEnabled,
        skipEmail: !userSettings.emailNotificationsEnabled,
      });
      if (result.synced > 0) {
        toast.success(`Synced ${result.synced} of ${result.total} contact(s).`);
      } else {
        toast.error("Could not sync any queued contacts.");
      }
      window.dispatchEvent(new CustomEvent("cs-contacts-updated"));
      window.dispatchEvent(new CustomEvent("cs-queue-updated"));
    } catch (err: any) {
      toast.error(err.message || "Failed to sync queue.");
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleDelete = async (contact: Contact) => {
    const ok = await confirm({
      title: "Delete contact?",
      description: "This contact will be soft-deleted for audit and recovery.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteDirectoryContact(contact);
      removeContact(contact);
      toast.success(contact.source === "queue" ? "Queued contact removed." : "Contact deleted.");
      void reloadContacts({ force: true, silent: true });
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to delete contact.");
    }
  };

  const filtered = useMemo(() => {
    return contactsList.filter((c) => {
      if (tab !== "all" && c.status !== tab) return false;
      if (eventFilter && (c.eventName || "").trim().toLowerCase() !== eventFilter.trim().toLowerCase()) return false;
      const searchStr = `${c.name || ""} ${c.company || ""} ${c.email || ""} ${c.eventName || ""}`.toLowerCase();
      if (q && !searchStr.includes(q.toLowerCase())) return false;
      return true;
    });
  }, [contactsList, tab, q, eventFilter]);

  const eventFilterOptions = useMemo(() => {
    const names = new Set<string>();
    for (const contact of contactsList) {
      const name = (contact.eventName || "").trim();
      if (name) names.add(name);
    }
    for (const event of loadEvents()) {
      names.add(event.name);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [contactsList]);

  const highlightInView = useMemo(() => {
    if (!highlight) return false;
    return filtered.some((c) => contactRowKey(c) === highlight);
  }, [highlight, filtered]);

  useEffect(() => {
    if (!highlight || showInitialLoading) return;
    if (tab !== "all") { setTab("all"); return; }
    if (!highlightInView) return;
    const scrollToRow = () => {
      document.getElementById(`contact-row-${highlight}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    scrollToRow();
    const retry = window.setTimeout(scrollToRow, 200);
    return () => window.clearTimeout(retry);
  }, [highlight, showInitialLoading, q, tab, highlightInView, contactsList.length]);

  const pendingQueueCount = useMemo(() => contactsList.filter((c) => c.source === "queue").length, [contactsList]);

  const counts = useMemo(() => ({
    all: contactsList.length,
    synced: contactsList.filter((c) => c.status === "synced").length,
    pending: contactsList.filter((c) => c.status === "pending").length,
    failed: contactsList.filter((c) => c.status === "failed").length,
  }), [contactsList]);

  const formatDate = (iso: string | undefined) => {
    if (!iso) return "\u2014";
    try {
      return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch { return iso; }
  };

  return (
    <div className="page-bottom-safe lg:pb-0">
    <PageShell
      title={PAGE.contacts.title}
      description={contactsList.length > 0
        ? `${PAGE.contacts.description} \u00b7 ${contactsList.length} record${contactsList.length === 1 ? "" : "s"}`
        : PAGE.contacts.description
      }
      actions={
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
          <Button variant="outline" onClick={() => void reloadContacts({ force: true })} disabled={isRefreshing} className="h-9 w-full rounded-md sm:w-auto">
            <RefreshCw className={`mr-2 h-4 w-4 shrink-0 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters((prev) => !prev)}
            aria-expanded={showFilters}
            className={cn("h-10 w-full rounded-xl sm:w-auto", showFilters && "border-primary/50 bg-primary/5 text-primary")}
          >
            <Filter className="mr-2 h-4 w-4 shrink-0" /> Filters
            {activeFilterCount > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button
            onClick={() => void navigate({ to: "/scan" })}
            className="h-9 w-full rounded-md bg-gradient-primary shadow-glow sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4 shrink-0" /> New contact
          </Button>
        </div>
      }
    >
      <Card className="rounded-2xl border-border/60 p-3 shadow-soft sm:p-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, company, email, or event" className="h-10 w-full rounded-md border-border/60 bg-background pl-9" />
            </div>
            {showFilters && (
              <>
                <Select value={eventFilter || "all"} onValueChange={setEventFilter}>
                  <SelectTrigger className="h-10 w-full shrink-0 rounded-md border-border/60 bg-background sm:w-[240px]">
                    <SelectValue placeholder="Filter by event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All events</SelectItem>
                    {eventFilterOptions.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-10 shrink-0 rounded-md text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear filters
                  </Button>
                )}
              </>
            )}
          </div>
          {showFilters && (
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
              <TabsList className="grid h-auto w-full grid-cols-4 gap-1 rounded-xl bg-muted/60 p-1">
                {statusTabs.map((t) => (
                  <TabsTrigger key={t.key} value={t.key} className="flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-[10px] leading-tight data-[state=active]:bg-card data-[state=active]:shadow-soft sm:flex-row sm:gap-1.5 sm:text-xs">
                    <span>{t.label}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground">{counts[t.key]}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>

        {showInitialLoading ? (
          <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
              <RefreshCw className="h-6 w-6 text-primary animate-spin" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">Loading contacts</h3>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">Connecting to database...</p>
          </div>
        ) : error ? (
          <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
              <span className="text-xl text-destructive">!</span>
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-destructive">Failed to load contacts</h3>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">{error}</p>
          </div>
        ) : (
          <>
            {isRefreshing && contactsList.length > 0 ? (
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Updating list...
              </p>
            ) : null}

            {/* Desktop table */}
            <div className="mt-5 hidden overflow-x-auto rounded-xl border border-border/60 lg:block">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Contact Name</th>
                    <th className="px-4 py-3 font-medium">Card</th>
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Designation</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    {isSuperAdmin && (
                      <>
                        <th className="px-4 py-3 font-medium">Admin Name</th>
                        <th className="px-4 py-3 font-medium">Captured By</th>
                      </>
                    )}
                    {isAdmin && <th className="px-4 py-3 font-medium">Captured By</th>}
                    <th className="px-4 py-3 font-medium">Event</th>
                    {showTemplateStatusColumn && <th className="px-4 py-3 font-medium">{templateColumnLabel}</th>}
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((c) => {
                    const rowKey = contactRowKey(c);
                    const isHighlighted = highlight === rowKey;
                    return (
                    <tr key={rowKey} id={`contact-row-${rowKey}`} className={cn("transition", isHighlighted ? "bg-primary/10 ring-2 ring-inset ring-primary/35" : "hover:bg-muted/30")}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <InitialsAvatar initials={c.initials} accent={c.accent} />
                          <div>
                            <div className="font-medium">{c.name || "\u2014"}</div>
                            {c.notes && <div className="max-w-[200px] truncate text-[11px] text-muted-foreground">{c.notes}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <CardImageCell
                          contactId={c.id}
                          hasCardImage={c.hasCardImage}
                          queueImageDataUrl={c.queueImageDataUrl}
                          contactName={c.name}
                          capturedBy={c.user_name}
                        />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{c.company || "\u2014"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.title || "\u2014"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.email || "\u2014"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.phone || "\u2014"}</td>
                      {isSuperAdmin && (
                        <>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{c.admin_name || "\u2014"}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{c.user_name || "\u2014"}</td>
                        </>
                      )}
                      {isAdmin && (
                        <td className="px-4 py-3 text-xs text-muted-foreground">{c.user_name || "\u2014"}</td>
                      )}
                      <td className="px-4 py-3 text-muted-foreground">{c.eventName || "\u2014"}</td>
                      {showTemplateStatusColumn && (
                        <td className="px-4 py-3">
                          <ContactChannelIcons phone={c.phone} email={c.email} whatsappDelivery={c.whatsappDelivery} emailDelivery={c.emailDelivery} showWhatsApp={showWhatsAppTemplateStatus} showEmail={showEmailTemplateStatus} />
                        </td>
                      )}
                      <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(c.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {c.source === "queue" && (
                            <Button variant="outline" size="sm" onClick={() => handleSyncQueueItem(c.id)} disabled={syncingId === c.id || isSyncingAll} className="h-8 rounded-lg text-xs">
                              {syncingId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Send className="mr-1.5 h-3 w-3" />Sync</>}
                            </Button>
                          )}
                          {canDelete && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(c)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile & tablet cards */}
            <div className="mt-5 space-y-3 lg:hidden">
              {filtered.map((c) => {
                const rowKey = contactRowKey(c);
                const isHighlighted = highlight === rowKey;
                return (
                <div key={rowKey} id={`contact-row-${rowKey}`} className={cn("rounded-xl border p-3 sm:p-4 transition", isHighlighted ? "border-primary/50 bg-primary/10 ring-2 ring-primary/30" : "border-border/60 bg-card/40")}>
                  <div className="flex items-start gap-3">
                    <InitialsAvatar
                      initials={c.initials}
                      accent={c.accent}
                      className="h-12 w-12 rounded-xl text-xs"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{c.name || "\u2014"}</div>
                      <div className="truncate text-xs text-muted-foreground">{c.title || "\u2014"} / {c.company || "No company"}</div>
                      {c.email && <div className="truncate text-[11px] text-muted-foreground">{c.email}</div>}
                      {c.phone && <div className="truncate text-[11px] text-muted-foreground">{c.phone}</div>}
                      {(isSuperAdmin || isAdmin) && c.user_name && (
                        <div className="mt-0.5 text-[11px] text-primary/80">
                          {isSuperAdmin && c.admin_name && `Admin: ${c.admin_name} | `}
                          Captured by: {c.user_name}
                        </div>
                      )}
                      {c.eventName && <div className="mt-0.5 truncate text-[11px] text-primary/90">Event: {c.eventName}</div>}
                      <div className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(c.createdAt)}</div>
                    </div>
                    <CardImageCell
                      contactId={c.id}
                      hasCardImage={c.hasCardImage}
                      queueImageDataUrl={c.queueImageDataUrl}
                      contactName={c.name}
                      capturedBy={c.user_name}
                      className="self-start"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/40 pt-3">
                    <StatusPill status={c.status} />
                    {showTemplateStatusColumn && (
                      <ContactChannelIcons phone={c.phone} email={c.email} whatsappDelivery={c.whatsappDelivery} emailDelivery={c.emailDelivery} compact showWhatsApp={showWhatsAppTemplateStatus} showEmail={showEmailTemplateStatus} />
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {c.source === "queue" && (
                      <Button variant="outline" size="sm" onClick={() => handleSyncQueueItem(c.id)} disabled={syncingId === c.id || isSyncingAll} className="h-9 flex-1 min-w-[120px] rounded-lg text-xs sm:flex-none">
                        {syncingId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Sync to database"}
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(c)} className="h-9 rounded-lg text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                      </Button>
                    )}
                  </div>
                </div>
              );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
                  <Search className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">No contacts match</h3>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">Try a different search or change the active filter.</p>
              </div>
            )}
            <div className="mt-5 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <div>Showing {filtered.length} of {contactsList.length}</div>
            </div>
          </>
        )}
      </Card>

      {pendingQueueCount > 0 && (
        <div className="fab-bottom fab-above-cookie fixed z-40 flex flex-col items-end gap-2">
          <Button
            onClick={() => void handleSyncAllQueue()}
            disabled={isSyncingAll || isRefreshing}
            title="Sync queued contacts to database"
            className="h-9 shrink-0 rounded-md bg-gradient-primary px-3 shadow-glow"
          >
            {isSyncingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            <span className="text-sm font-medium">Sync queue ({pendingQueueCount})</span>
          </Button>
        </div>
      )}
    </PageShell>
    </div>
  );
}
