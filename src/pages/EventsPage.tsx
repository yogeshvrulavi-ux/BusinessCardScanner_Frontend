import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Folder,
  FolderOpen,
  RefreshCw,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  Plus,
  CalendarDays,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/layout/PageShell";
import { PAGE } from "@/constants/navigation";
import { StatusPill } from "@/components/layout/StatusPill";
import { useContactsDirectory } from "@/hooks/useContactsDirectory";
import {
  buildEventFolderStats,
  filterContactsByEventName,
  summarizeEventFolders,
  type EventFolderStats,
} from "@/lib/eventStats";
import {
  getExampleEventName,
  loadEvents,
  purgeOrphanExampleEvent,
  rememberEvent,
} from "@/lib/eventStorage";
import { contactRowKey, type DirectoryContact, invalidateContactsDirectory } from "@/lib/contactsDirectory";
import { CardThumbnail } from "@/components/contacts/CardThumbnail";
import { Route as EventsRoute } from "@/routes/events";
import { cn } from "@/lib/utils";

function formatEventDate(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: typeof Users;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : tone === "danger"
          ? "text-destructive"
          : "text-primary";

  return (
    <Card className="rounded-2xl border-border/60 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        <div className={cn("rounded-xl bg-muted/50 p-2.5", toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function EventContactsTable({ contacts }: { contacts: DirectoryContact[] }) {
  if (contacts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 px-6 py-12 text-center text-sm text-muted-foreground">
        No leads tagged with this event yet. Scan a card and enter this event name on Review.
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border/60 lg:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Notes</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {contacts.map((contact) => (
              <tr key={contactRowKey(contact)} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CardThumbnail
                      contactId={contact.id}
                      hasCardImage={contact.hasCardImage}
                      queueImageDataUrl={contact.queueImageDataUrl}
                      initials={contact.initials}
                      accent={contact.accent}
                    />
                    <div>
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-[11px] text-muted-foreground">{contact.title || "—"}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{contact.company || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{contact.email || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{contact.phone || "—"}</td>
                <td className="max-w-xs px-4 py-3 text-muted-foreground">
                  <span className="line-clamp-2" title={contact.notes || undefined}>
                    {contact.notes || "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={contact.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 lg:hidden">
        {contacts.map((contact) => (
          <Card key={contactRowKey(contact)} className="rounded-xl border-border/60 p-4">
            <div className="flex items-start gap-3">
              <CardThumbnail
                contactId={contact.id}
                hasCardImage={contact.hasCardImage}
                queueImageDataUrl={contact.queueImageDataUrl}
                initials={contact.initials}
                accent={contact.accent}
                size="md"
                className="rounded-xl"
              />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{contact.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {contact.company || "No company"} · {contact.email || "No email"}
                </div>
                {contact.notes ? (
                  <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{contact.notes}</p>
                ) : null}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <StatusPill status={contact.status} />
                  <span className="text-xs text-muted-foreground">{contact.phone || "—"}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

export function EventsPage() {
  const navigate = useNavigate({ from: EventsRoute.fullPath });
  const { event: selectedEventName = "" } = EventsRoute.useSearch();
  const { contacts, isLoading, isRefreshing, fetchFailed, refresh } = useContactsDirectory();
  const [eventsVersion, setEventsVersion] = useState(0);
  const [newEventName, setNewEventName] = useState("");
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  useEffect(() => {
    invalidateContactsDirectory();
    void refresh({ force: true, silent: false });
  }, [refresh]);

  useEffect(() => {
    purgeOrphanExampleEvent(contacts);
  }, [contacts]);

  useEffect(() => {
    const bump = () => setEventsVersion((n) => n + 1);
    window.addEventListener("cs-events-updated", bump);
    return () => window.removeEventListener("cs-events-updated", bump);
  }, []);

  const folders = useMemo(() => {
    void eventsVersion;
    return buildEventFolderStats(contacts, loadEvents());
  }, [contacts, eventsVersion]);

  const summary = useMemo(() => summarizeEventFolders(folders), [folders]);

  const selectedFolder = useMemo(() => {
    if (!selectedEventName) return null;
    const key = selectedEventName.trim().toLowerCase();
    return folders.find((f) => f.name.trim().toLowerCase() === key) ?? null;
  }, [folders, selectedEventName]);

  const filteredContacts = useMemo(() => {
    if (!selectedEventName) return [];
    return filterContactsByEventName(contacts, selectedEventName);
  }, [contacts, selectedEventName]);

  const handleCreateEvent = () => {
    const trimmed = newEventName.trim();
    if (!trimmed) {
      setCreateError("Enter an event name.");
      setCreateSuccess("");
      return;
    }
    setCreateError("");
    rememberEvent(trimmed);
    setNewEventName("");
    setEventsVersion((n) => n + 1);
    setCreateSuccess(
      `${trimmed} saved for Review. After you save a card, refresh Events to see the folder from the database.`,
    );
  };

  const selectFolder = (folder: EventFolderStats) => {
    void navigate({ search: { event: folder.name }, replace: true });
  };

  const clearSelection = () => {
    void navigate({ search: { event: undefined }, replace: true });
  };

  const showInitialLoading = isLoading && contacts.length === 0 && folders.length === 0;

  return (
    <PageShell
      title={PAGE.events.title}
      description={PAGE.events.description}
      actions={
        <Button
          variant="outline"
          onClick={() => {
            invalidateContactsDirectory();
            void refresh({ force: true });
          }}
          disabled={isRefreshing}
          className="h-10 rounded-xl"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Events" value={summary.totalEvents} icon={Folder} />
        <StatCard label="Total leads" value={summary.totalLeads} icon={Users} />
        <StatCard label="Synced" value={summary.synced} icon={CheckCircle2} tone="success" />
        <StatCard label="Pending" value={summary.pending} icon={Clock} tone="warning" />
      </div>

      {fetchFailed ? (
        <Card className="flex items-center gap-3 rounded-2xl border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            Could not load leads from the database. Wait a minute, then click <strong>Refresh</strong>.
          </span>
        </Card>
      ) : null}

      {summary.failed > 0 ? (
        <Card className="flex items-center gap-3 rounded-2xl border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <span>
            <strong>{summary.failed}</strong> lead{summary.failed === 1 ? "" : "s"} failed to sync across all events.
          </span>
        </Card>
      ) : null}

      <Card className="rounded-2xl border-border/60 p-4 shadow-soft sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Event folders</h2>
            <p className="text-xs text-muted-foreground">
              Folders come from event tags and pending saves. Refresh to pull latest contacts.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="flex gap-2">
              <Input
                value={newEventName}
                onChange={(e) => {
                  setNewEventName(e.target.value);
                  if (createError) setCreateError("");
                  if (createSuccess) setCreateSuccess("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateEvent();
                }}
                placeholder={`New event (e.g. ${getExampleEventName()})`}
                className="h-10 rounded-lg sm:w-56"
              />
              <Button type="button" size="sm" onClick={handleCreateEvent} className="shrink-0 rounded-lg">
                <Plus className="mr-1.5 h-4 w-4" />
                Create
              </Button>
            </div>
            {selectedEventName ? (
              <Button variant="ghost" size="sm" onClick={clearSelection} className="rounded-lg">
                <ArrowLeft className="mr-2 h-4 w-4" />
                All folders
              </Button>
            ) : null}
          </div>
        </div>
        {createError ? <p className="mb-3 text-xs text-destructive">{createError}</p> : null}
        {createSuccess ? (
          <p className="mb-3 text-xs text-emerald-600 dark:text-emerald-400">{createSuccess}</p>
        ) : null}

        {showInitialLoading ? (
          <div className="flex flex-col items-center py-16 text-center text-sm text-muted-foreground">
            <RefreshCw className="mb-3 h-6 w-6 animate-spin text-primary" />
            Loading events…
          </div>
        ) : folders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 px-6 py-14 text-center">
            <Folder className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />
            <p className="font-medium">No event folders yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {fetchFailed
                ? "The database could not be reached. Click Refresh after a minute."
                : contacts.length > 0
                  ? "Leads loaded but no event name found. The contact's event field should show Event: YourEventName (e.g. Event: Mall Opening)."
                  : "Save a card with an event name on Review, then click Refresh."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {folders.map((folder) => {
              const isSelected =
                selectedEventName.trim().toLowerCase() === folder.name.trim().toLowerCase();
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => selectFolder(folder)}
                  className={cn(
                    "group flex flex-col rounded-2xl border p-4 text-left transition-all",
                    "hover:-translate-y-0.5 hover:shadow-md",
                    isSelected
                      ? "border-primary/50 bg-primary/5 shadow-soft ring-2 ring-primary/20"
                      : "border-border/60 bg-card/40 hover:border-primary/30",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    {isSelected ? (
                      <FolderOpen className="h-9 w-9 text-primary" />
                    ) : (
                      <Folder className="h-9 w-9 text-amber-500 group-hover:text-primary" />
                    )}
                    <span className="rounded-lg bg-muted/60 px-2 py-0.5 text-[10px] font-semibold tabular-nums">
                      {folder.totalLeads} lead{folder.totalLeads === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 font-semibold leading-snug">{folder.name}</p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="text-emerald-600 dark:text-emerald-400">{folder.synced} synced</span>
                    <span className="text-amber-600 dark:text-amber-400">{folder.pending} pending</span>
                    {folder.failed > 0 ? (
                      <span className="text-destructive">{folder.failed} failed</span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    Last used {formatEventDate(folder.lastUsedAt || folder.createdAt)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {selectedEventName && selectedFolder ? (
        <Card className="rounded-2xl border-border/60 p-4 shadow-soft sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <FolderOpen className="h-5 w-5 text-primary" />
                {selectedFolder.name}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {filteredContacts.length} lead{filteredContacts.length === 1 ? "" : "s"} ·{" "}
                {selectedFolder.synced} synced · {selectedFolder.pending} pending
              </p>
            </div>
          </div>
          <EventContactsTable contacts={filteredContacts} />
        </Card>
      ) : null}
    </PageShell>
  );
}
