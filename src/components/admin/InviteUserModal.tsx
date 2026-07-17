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
import { useAuth } from "@/lib/AuthContext";
import { sendInvitation } from "@/lib/adminApi";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

/**
 * Invitation-only onboarding.
 * SuperAdmin → Admin email only.
 * Admin → User email only.
 * Inviter never sets password or personal profile fields.
 */
export function InviteUserModal({ open, onOpenChange, onSuccess }: Props) {
  const { user: authUser } = useAuth();
  const isSuperAdmin = authUser?.role === "SUPER_ADMIN";
  const inviteRole = isSuperAdmin ? "ADMIN" : "USER";

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => setEmail("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Email address is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await sendInvitation({
        email: email.trim(),
        role: inviteRole,
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
          <DialogTitle>Invite {isSuperAdmin ? "Admin" : "User"}</DialogTitle>
          <DialogDescription>
            Enter their email only. They will receive a secure link to create their own password
            and complete their profile. You never set their password or personal details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="invite_email">
              {isSuperAdmin ? "Admin email *" : "User email *"}
            </Label>
            <Input
              id="invite_email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isSuperAdmin ? "admin@company.com" : "user@company.com"}
              required
              autoFocus
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Account is created only after they open the invite and submit registration.
              Login is not possible until then.
            </p>
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
              Send invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
