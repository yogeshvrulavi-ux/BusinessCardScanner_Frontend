import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
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
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { createUser, fetchCompanies, type Company, type CreateUserData } from "@/lib/adminApi";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const ROLES = [
  { value: "USER", label: "User" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

const EMPTY: CreateUserData = {
  first_name: "",
  last_name: "",
  email: "",
  username: "",
  password: "",
  role: "USER",
  company_id: null,
  phone: "",
};

export function CreateUserModal({ open, onOpenChange, onSuccess }: Props) {
  const { user: authUser } = useAuth();
  const isSuperAdmin = authUser?.role === "SUPER_ADMIN";

  const [form, setForm] = useState<CreateUserData>({ ...EMPTY });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = <K extends keyof CreateUserData>(key: K, value: CreateUserData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Load companies for SuperAdmin dropdown
  useEffect(() => {
    if (!open || !isSuperAdmin) return;
    setIsLoadingCompanies(true);
    fetchCompanies(1, 200)
      .then((res) => setCompanies(res.items))
      .catch(() => toast.error("Failed to load companies."))
      .finally(() => setIsLoadingCompanies(false));
  }, [open, isSuperAdmin]);

  // Admin: lock role to USER and company to their own
  useEffect(() => {
    if (!isSuperAdmin && authUser) {
      setForm((prev) => ({
        ...prev,
        role: "USER",
        company_id: authUser.company_id,
      }));
    }
  }, [isSuperAdmin, authUser, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error("First and last name are required.");
      return;
    }
    if (!form.email.trim() || !form.username.trim() || !form.password) {
      toast.error("Email, username, and password are required.");
      return;
    }
    if (isSuperAdmin && !form.company_id) {
      toast.error("Please select a company for this user.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createUser({
        ...form,
        company_id: isSuperAdmin ? form.company_id : authUser?.company_id,
      });
      toast.success(`User "${form.first_name} ${form.last_name}" created.`);
      setForm({ ...EMPTY });
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setForm({ ...EMPTY }); onOpenChange(v); }}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
          <DialogDescription>
            {isSuperAdmin
              ? "Create a new user and assign them to a company."
              : "Create a new user in your company."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
                placeholder="Jane"
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
                placeholder="Smith"
                required
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="jane@company.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => set("username", e.target.value)}
                placeholder="jane_smith"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Min 8 characters"
                required
                minLength={8}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone ?? ""}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+1 555-0123"
              />
            </div>
            <div>
              <Label>Role</Label>
              {isSuperAdmin ? (
                <Select value={form.role} onValueChange={(v) => set("role", v)}>
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
                <div className="flex h-9 items-center rounded-md border border-input bg-muted/30 px-3 text-sm text-muted-foreground">
                  User
                </div>
              )}
            </div>
            {isSuperAdmin && (
              <div>
                <Label>Company *</Label>
                {isLoadingCompanies ? (
                  <div className="flex h-9 items-center gap-2 rounded-md border border-input px-3 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                  </div>
                ) : (
                  <Select
                    value={form.company_id ?? ""}
                    onValueChange={(v) => set("company_id", v || null)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setForm({ ...EMPTY }); onOpenChange(false); }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-primary">
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
