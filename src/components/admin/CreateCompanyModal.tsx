import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
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
  admin_email: "",
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
    if (!form.admin_email.trim()) {
      toast.error("Admin email is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createCompany(form);
      toast.success(
        `Invitation sent to ${form.admin_email}. They must register before login. Company is created when they submit.`,
      );
      setForm({ ...EMPTY });
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invitation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setForm({ ...EMPTY }); onOpenChange(v); }}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Invite company Admin</DialogTitle>
          <DialogDescription>
            Assign organization details and the Admin&apos;s email only. Do not set a password —
            they complete registration from the invitation link before they can log in.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="company_code">Company Code *</Label>
                <Input
                  id="company_code"
                  value={form.company_code}
                  onChange={(e) => set("company_code", e.target.value.toUpperCase())}
                  placeholder="ACME"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin invitation</p>
            <div>
              <Label htmlFor="admin_email">Admin Email *</Label>
              <Input
                id="admin_email"
                type="email"
                value={form.admin_email}
                onChange={(e) => set("admin_email", e.target.value)}
                placeholder="admin@acme.com"
                required
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                No password is set here — the Admin creates their own account from the invite email.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-primary">
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Send Admin invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
