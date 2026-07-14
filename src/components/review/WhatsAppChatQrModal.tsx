import { Copy, MessageCircle, QrCode } from "lucide-react";
import { Button } from "@/components/common/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { qrCodeImageUrl } from "@/lib/whatsappChatLink";
import type { WhatsAppChatReplyRegistration } from "@/lib/whatsappChatLink";

type Props = {
  open: boolean;
  registration: WhatsAppChatReplyRegistration | null;
  contactName?: string;
  mode?: "verify" | "post-save";
  verified?: boolean;
  onClose: () => void;
  onCopyLink?: (url: string) => void;
};

export function WhatsAppChatQrModal({
  open,
  registration,
  contactName,
  mode = "post-save",
  verified = false,
  onClose,
  onCopyLink,
}: Props) {
  const waUrl = registration?.wa_me_url ?? "";
  const displayName = registration?.verified_name || "BusinessCardScanner";
  const displayPhone =
    registration?.display_phone_number || registration?.business_phone || "";

  const copyLink = async () => {
    if (!waUrl) return;
    try {
      await navigator.clipboard.writeText(waUrl);
      onCopyLink?.(waUrl);
    } catch {
      onCopyLink?.("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-emerald-600" />
            {mode === "verify" ? "Verify WhatsApp number" : "WhatsApp confirmation (Chats)"}
          </DialogTitle>
          <DialogDescription>
            {mode === "verify" ? (
              <>
                Ask {contactName ? contactName : "the contact"} to scan this QR on{" "}
                <strong>their phone</strong>. When they tap Send in WhatsApp, their number is
                verified and <strong>Save Lead</strong> unlocks.
              </>
            ) : (
              <>
                Ask {contactName ? contactName : "the contact"} to scan this QR on{" "}
                <strong>their phone</strong>. They tap Send in WhatsApp — the thread opens in{" "}
                <strong>Chats</strong>, and CardSync replies with their card details.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {registration ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center rounded-2xl border border-border/60 bg-muted/30 p-4">
              {waUrl ? (
                <img
                  src={qrCodeImageUrl(waUrl, 220)}
                  alt="WhatsApp chat QR code"
                  width={220}
                  height={220}
                  className="rounded-lg bg-white p-2"
                />
              ) : (
                <div className="flex h-[220px] w-[220px] items-center justify-center rounded-lg bg-muted">
                  <QrCode className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <p className="mt-3 text-center text-sm font-medium">{displayName}</p>
              {displayPhone ? (
                <p className="text-center text-xs text-muted-foreground">{displayPhone}</p>
              ) : null}
            </div>

            {verified ? (
              <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-800 dark:text-emerald-100">
                WhatsApp verified — you can save the lead now.
              </p>
            ) : (
              <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                <li>Contact scans QR (or opens the link) on their phone.</li>
                <li>
                  WhatsApp opens with “{registration.prefill_text}” ready — they must tap{" "}
                  <strong>Send</strong> (not just open the chat).
                </li>
                <li>
                  {mode === "verify"
                    ? "CardSync confirms verification — Save Lead unlocks on this screen."
                    : "CardSync sends their saved card details in the same chat."}
                </li>
              </ol>
            )}

            {waUrl ? (
              <div className="rounded-xl border border-border/60 bg-background p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">wa.me link</p>
                <p className="break-all text-xs">{waUrl}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          {waUrl ? (
            <Button variantType="secondary" onClick={copyLink}>
              <Copy className="mr-2 h-4 w-4" />
              Copy link
            </Button>
          ) : null}
          <Button variantType="primary" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
