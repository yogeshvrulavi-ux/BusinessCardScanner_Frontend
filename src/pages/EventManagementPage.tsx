import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageShell } from "@/components/layout/PageShell";
import { AuthGate } from "@/components/auth/AuthGate";
import { useConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "sonner";
import {
  createManagedEvent,
  deleteManagedEvent,
  fetchManagedEvents,
  updateManagedEvent,
  type CreateManagedEventData,
  type ManagedEvent,
} from "@/lib/adminApi";
import {
  TABLE_PAGE_SIZE,
  TablePagination,
  clampPageAfterDelete,
} from "@/components/ui/table-pagination";

const EMPTY_FORM: CreateManagedEventData = {
  name: "",
  description: "",
  location: "",
  start_date: "",
  end_date: "",
  status: "active",
};

export function EventManagementPage() {
  return (
    <AuthGate allowedRoles={["SUPER_ADMIN"]}>
      <EventManagementPageInner />
    </AuthGate>
  );
}

function statusBadge(status: string) {
  const value = status.toLowerCase();
  if (value === "active") return <Badge className="bg-emerald-600 hover:bg-emerald-600">Active</Badge>;
  if (value === "completed") return <Badge variant="secondary">Completed</Badge>;
  return <Badge variant="outline">Inactive</Badge>;
}

function EventManagementPageInner() {
  const { confirm } = useConfirmModal();
  const [items, setItems] = useState<ManagedEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedEvent | null>(null);
  const [form, setForm] = useState<CreateManagedEventData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [viewing, setViewing] = useState<ManagedEvent | null>(null);

  const load = useCallback(
    async (silent = false, pageOverride?: number) => {
      const targetPage = pageOverride ?? page;
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);
      try {
        const res = await fetchManagedEvents(targetPage, TABLE_PAGE_SIZE, query);
        const nextPage = clampPageAfterDelete(targetPage, res.total, TABLE_PAGE_SIZE);
        if (nextPage !== targetPage) {
          setPage(nextPage);
          const again = await fetchManagedEvents(nextPage, TABLE_PAGE_SIZE, query);
          setItems(again.items);
          setTotal(again.total);
        } else {
          setItems(res.items);
          setTotal(res.total);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load events.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, query],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (event: ManagedEvent) => {
    setEditing(event);
    setForm({
      name: event.name,
      description: event.description || "",
      location: event.location || "",
      start_date: event.start_date || "",
      end_date: event.end_date || "",
      status: (event.status as CreateManagedEventData["status"]) || "active",
    });
    setDialogOpen(true);
  };

  const validateForm = (): string | null => {
    if (!form.name.trim()) return "Event name is required.";
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      return "End date cannot be before start date.";
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setIsSaving(true);
    try {
      const payload: CreateManagedEventData = {
        name: form.name.trim(),
        description: form.description?.trim() || "",
        location: form.location?.trim() || "",
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        status: form.status || "active",
      };
      if (editing) {
        await updateManagedEvent(editing.id, payload);
        toast.success("Event updated.");
      } else {
        await createManagedEvent(payload);
        toast.success("Event created.");
      }
      setDialogOpen(false);
      await load(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save event.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (event: ManagedEvent) => {
    const ok = await confirm({
      title: "Delete event?",
      description: `“${event.name}” will be removed from Event Management. Existing contacts keep their event tags.`,
      confirmLabel: "Delete event",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteManagedEvent(event.id);
      toast.success("Event deleted.");
      await load(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete event.");
    }
  };

  return (
    <PageShell
      title="Event Management"
      description={total ? `${total} managed event${total === 1 ? "" : "s"}` : "Create and manage platform events"}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void load(true)}
            disabled={isRefreshing}
            className="rounded-md"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={openCreate} className="rounded-md">
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </div>
      }
    >
      <Card className="mb-4 rounded-2xl border-border/60 p-4 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="event-search">Search</Label>
            <Input
              id="event-search"
              value={query}
              onChange={(e) => {
                setPage(1);
                setQuery(e.target.value);
              }}
              placeholder="Search by name, location, or description"
              className="h-11 rounded-md"
            />
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl border-border/60 p-4 shadow-soft sm:p-6">
        {isLoading ? (
          <div className="flex flex-col items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground/60" />
            <div className="text-sm font-medium">No events yet</div>
            <p className="max-w-sm text-xs text-muted-foreground">
              Create your first managed event for Super Admin oversight.
            </p>
            <Button onClick={openCreate} className="rounded-md">
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-3 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => setViewing(event)}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium text-foreground">{event.name}</div>
                    {statusBadge(event.status)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {[event.location, event.start_date, event.end_date]
                      .filter(Boolean)
                      .join(" · ") || "No schedule set"}
                  </div>
                  {event.description ? (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {event.description}
                    </p>
                  ) : null}
                </button>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-md"
                    onClick={() => openEdit(event)}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="rounded-md"
                    onClick={() => void handleDelete(event)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
            <TablePagination
              page={page}
              total={total}
              limit={TABLE_PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit event" : "Create event"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="evt-name">Name *</Label>
              <Input
                id="evt-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="h-11 rounded-md"
                maxLength={255}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="evt-location">Location</Label>
              <Input
                id="evt-location"
                value={form.location}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                className="h-11 rounded-md"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="evt-start">Start date</Label>
                <Input
                  id="evt-start"
                  type="date"
                  value={form.start_date || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
                  className="h-11 rounded-md"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="evt-end">End date</Label>
                <Input
                  id="evt-end"
                  type="date"
                  value={form.end_date || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
                  className="h-11 rounded-md"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status || "active"}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    status: value as CreateManagedEventData["status"],
                  }))
                }
              >
                <SelectTrigger className="h-11 rounded-md">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="evt-desc">Description</Label>
              <Textarea
                id="evt-desc"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="min-h-24 rounded-md"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-md">
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} disabled={isSaving} className="rounded-md">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editing ? "Save changes" : "Create event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{viewing?.name}</DialogTitle>
          </DialogHeader>
          {viewing ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">{statusBadge(viewing.status)}</div>
              <div>
                <div className="text-xs text-muted-foreground">Location</div>
                <div>{viewing.location || "—"}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Start</div>
                  <div>{viewing.start_date || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">End</div>
                  <div>{viewing.end_date || "—"}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Description</div>
                <p className="whitespace-pre-wrap">{viewing.description || "—"}</p>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)} className="rounded-md">
              Close
            </Button>
            {viewing ? (
              <Button
                className="rounded-md"
                onClick={() => {
                  openEdit(viewing);
                  setViewing(null);
                }}
              >
                Edit
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
