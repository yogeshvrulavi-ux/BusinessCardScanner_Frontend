import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export type ResendChannelSelection = {
  whatsapp: boolean;
  email: boolean;
};

type ContactResendDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** Post-edit: primary action is "Send Selected"; cancel/skip is "Skip". */
  mode?: "resend" | "after-edit";
  hasPhone: boolean;
  hasEmail: boolean;
  busy?: boolean;
  onSend: (selection: ResendChannelSelection) => void;
  onSkip?: () => void;
};

export function ContactResendDialog({
  open,
  onOpenChange,
  title,
  description,
  mode = "resend",
  hasPhone,
  hasEmail,
  busy = false,
  onSend,
  onSkip,
}: ContactResendDialogProps) {
  const [whatsapp, setWhatsapp] = useState(false);
  const [email, setEmail] = useState(false);

  useEffect(() => {
    if (!open) return;
    setWhatsapp(Boolean(hasPhone));
    setEmail(Boolean(hasEmail));
  }, [open, hasPhone, hasEmail]);

  const canSend = (whatsapp && hasPhone) || (email && hasEmail);

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <div className="mt-4 space-y-4">
        <div className="space-y-3 rounded-md border border-border/60 p-3">
          <label className="flex items-center gap-3 text-sm">
            <Checkbox
              checked={whatsapp}
              disabled={busy || !hasPhone}
              onCheckedChange={(value) => setWhatsapp(value === true)}
              aria-label="WhatsApp"
            />
            <span className={!hasPhone ? "text-muted-foreground" : undefined}>
              WhatsApp{!hasPhone ? " (no phone)" : ""}
            </span>
          </label>
          <label className="flex items-center gap-3 text-sm">
            <Checkbox
              checked={email}
              disabled={busy || !hasEmail}
              onCheckedChange={(value) => setEmail(value === true)}
              aria-label="Email"
            />
            <span className={!hasEmail ? "text-muted-foreground" : undefined}>
              Email{!hasEmail ? " (no email)" : ""}
            </span>
          </label>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 rounded-md"
            disabled={busy}
            onClick={() => {
              if (mode === "after-edit") {
                onSkip?.();
              } else {
                onOpenChange(false);
              }
            }}
          >
            {mode === "after-edit" ? "Skip" : "Cancel"}
          </Button>
          <Button
            className="flex-1 rounded-md"
            disabled={busy || !canSend}
            onClick={() =>
              onSend({
                whatsapp: whatsapp && hasPhone,
                email: email && hasEmail,
              })
            }
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {mode === "after-edit" ? "Send Selected" : "Send"}
          </Button>
        </div>
        {mode === "after-edit" ? (
          <p className="text-[11px] text-muted-foreground">
            Only the channels you select will be sent using existing templates.
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

/** @deprecated Prefer ContactResendDialog checkboxes. Kept for type imports during migration. */
export type ResendChannelChoice = "whatsapp" | "email" | "both" | "none";
