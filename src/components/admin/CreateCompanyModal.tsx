import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createCompany, type CreateCompanyData } from "@/lib/adminApi";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const EMPTY: CreateCompanyData = {
  company_name: "",
  company_code: "",
  admin_first_name: "",
  admin_last_name: "",
  admin_email: "",
  admin_username: "",
  admin_password: "",
  address: "",
  phone: "",
  email: "",
  website: "",
};

export function CreateCompanyModal({ open, onOpenChange, onSuccess }: Props) {
  const [form, setForm] = useState<CreateCompanyData>({ ...EMPTY });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = <K extends keyof CreateCompanyData>(key: K, value: CreateCompanyData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim() || !form.company_code.trim()) {
      toast.error("Company name and code are required.");
      return;
    }
    if (!form.admin_email.trim() || !form.admin_username.trim() || !form.admin_password) {
      toast.error("Admin email, username, and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createCompany(form);
      toast.success(`Company "${form.company_name}" and admin user created.`);
      setForm({ ...EMPTY });
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create company.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setForm({ ...EMPTY }); onOpenChange(v); }}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Create Company</DialogTitle>
          <DialogDescription>
            Create a new company and its admin user in a single step.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company details */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={form.company_name}
                  onChange={(e) => set("company_name", e.target.value)}
                  placeholder="Acme Corp"
                  required
                />
              </div>
              <div>
                <Label htmlFor="company_code">Company Code *</Label>
                <Input
                  id="company_code"
                  value={form.company_code}
                  onChange={(e) => set("company_code", e.target.value.toUpperCase())}
                  placeholder="ACME"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone ?? ""}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+1 555-0100"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="info@acme.com"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={form.website ?? ""}
                  onChange={(e) => set("website", e.target.value)}
                  placeholder="https://acme.com"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={form.address ?? ""}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="123 Main St, City"
                />
              </div>
            </div>
          </div>

          {/* Admin user details */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin User</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="admin_first_name">First Name</Label>
                <Input
                  id="admin_first_name"
                  value={form.admin_first_name ?? ""}
                  onChange={(e) => set("admin_first_name", e.target.value)}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="admin_last_name">Last Name</Label>
                <Input
                  id="admin_last_name"
                  value={form.admin_last_name ?? ""}
                  onChange={(e) => set("admin_last_name", e.target.value)}
                  placeholder="Doe"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="admin_email">Admin Email *</Label>
                <Input
                  id="admin_email"
                  type="email"
                  value={form.admin_email}
                  onChange={(e) => set("admin_email", e.target.value)}
                  placeholder="admin@acme.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="admin_username">Username *</Label>
                <Input
                  id="admin_username"
                  value={form.admin_username}
                  onChange={(e) => set("admin_username", e.target.value)}
                  placeholder="admin_acme"
                  required
                />
              </div>
              <div>
                <Label htmlFor="admin_password">Password *</Label>
                <Input
                  id="admin_password"
                  type="password"
                  value={form.admin_password}
                  onChange={(e) => set("admin_password", e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                />
              </div>
            </div>
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
              Create Company
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
