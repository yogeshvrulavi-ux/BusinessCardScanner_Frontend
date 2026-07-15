import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { updateUser, type UpdateUserData, type User } from "@/lib/adminApi";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
};

const ROLES = [
  { value: "USER", label: "User" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

export function EditUserModal({ open, onOpenChange, user, onSuccess }: Props) {
  const { user: authUser } = useAuth();
  const isSuperAdmin = authUser?.role === "SUPER_ADMIN";

  const [form, setForm] = useState<UpdateUserData>({
    first_name: "",
    last_name: "",
    phone: "",
    role: "USER",
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = <K extends keyof UpdateUserData>(key: K, value: UpdateUserData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Populate form when user changes
  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name ?? "",
        last_name: user.last_name ?? "",
        phone: user.phone ?? "",
        role: user.role,
        is_active: user.is_active,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      await updateUser(user.id, form);
      toast.success(`User "${form.first_name} ${form.last_name}" updated.`);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            {user ? `${user.email}` : "Update user details"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit_first_name">First Name</Label>
              <Input
                id="edit_first_name"
                value={form.first_name ?? ""}
                onChange={(e) => set("first_name", e.target.value)}
                placeholder="Jane"
              />
            </div>
            <div>
              <Label htmlFor="edit_last_name">Last Name</Label>
              <Input
                id="edit_last_name"
                value={form.last_name ?? ""}
                onChange={(e) => set("last_name", e.target.value)}
                placeholder="Smith"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit_phone">Phone</Label>
              <Input
                id="edit_phone"
                value={form.phone ?? ""}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+1 555-0123"
              />
            </div>
            <div className="col-span-2">
              <Label>Role</Label>
              {isSuperAdmin ? (
                <Select value={form.role ?? "USER"} onValueChange={(v) => set("role", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex h-9 items-center rounded-md border border-input bg-muted/30 px-3 text-sm capitalize text-muted-foreground">
                  {user?.role?.toLowerCase().replace("_", " ") ?? "user"}
                </div>
              )}
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-4">
              <div>
                <div className="text-sm font-medium">Active</div>
                <div className="text-[11px] text-muted-foreground">
                  Deactivated users cannot log in
                </div>
              </div>
              <Switch
                checked={form.is_active ?? true}
                onCheckedChange={(v) => set("is_active", v)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-primary">
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
