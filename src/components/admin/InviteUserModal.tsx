import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { fetchCompanies, sendInvitation, type Company } from "@/lib/adminApi";

type InviteRole = "ADMIN" | "USER";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /**
   * Role to invite. Defaults from auth:
   * SUPER_ADMIN → ADMIN, ADMIN → USER.
   * Pass "USER" from User Management for SuperAdmin user invites.
   */
  role?: InviteRole;
};

/**
 * Invitation-only onboarding.
 * SuperAdmin → Admin (Admin Management) or User (User Management, with company).
 * Admin → User email only.
 * Inviter never sets password or personal profile fields.
 */
export function InviteUserModal({ open, onOpenChange, onSuccess, role }: Props) {
  const { user: authUser } = useAuth();
  const isSuperAdmin = authUser?.role === "SUPER_ADMIN";
  const inviteRole: InviteRole = role ?? (isSuperAdmin ? "ADMIN" : "USER");
  const needsCompanyPicker = isSuperAdmin && inviteRole === "USER";

  const [email, setEmail] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !needsCompanyPicker) return;
    let cancelled = false;
    setIsLoadingCompanies(true);
    void fetchCompanies(1, 200)
      .then((res) => {
        if (!cancelled) setCompanies(res.items);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load companies.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCompanies(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, needsCompanyPicker]);

  const reset = () => {
    setEmail("");
    setCompanyId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Email address is required.");
      return;
    }
    if (needsCompanyPicker && !companyId) {
      toast.error("Select a company for this user.");
      return;
    }

    setIsSubmitting(true);
    try {
      await sendInvitation({
        email: email.trim(),
        role: inviteRole,
        ...(needsCompanyPicker ? { company_id: companyId } : {}),
      });
      toast.success(`Invitation sent to ${email.trim()}. They must register before they can log in.`);
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invitation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleLabel = inviteRole === "ADMIN" ? "Admin" : "User";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Invite {roleLabel}</DialogTitle>
          <DialogDescription>
            Enter their email only. They will receive a secure link to create their own password
            and complete their profile. You never set their password or personal details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="invite_email">{roleLabel} email *</Label>
            <Input
              id="invite_email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={inviteRole === "ADMIN" ? "admin@company.com" : "user@company.com"}
              required
              autoFocus
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Account is created only after they open the invite and submit registration.
              Login is not possible until then.
            </p>
          </div>

          {needsCompanyPicker ? (
            <div>
              <Label htmlFor="invite_company">Company *</Label>
              <Select
                value={companyId}
                onValueChange={setCompanyId}
                disabled={isLoadingCompanies}
              >
                <SelectTrigger id="invite_company" className="mt-1.5 h-10">
                  <SelectValue
                    placeholder={isLoadingCompanies ? "Loading companies…" : "Select company"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.company_name}
                      {c.admin_name || c.admin_email
                        ? ` · ${c.admin_name || c.admin_email}`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1.5 text-xs text-muted-foreground">
                The invited user will belong to this company under its Admin.
              </p>
            </div>
          ) : null}

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
              Send invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
