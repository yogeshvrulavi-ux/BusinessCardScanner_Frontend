import { MessageCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

type Props = {
  checked: boolean;
  disabled?: boolean;
  contactPhone?: string;
  onCheckedChange: (checked: boolean) => void;
};

export function WhatsAppOptInPanel({
  checked,
  disabled,
  contactPhone,
  onCheckedChange,
}: Props) {
  return (
    <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
      <div className="flex items-start gap-3">
        <Checkbox
          id="whatsapp-opt-in"
          checked={checked}
          disabled={disabled}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          className="mt-0.5"
        />
        <div className="space-y-1">
          <label
            htmlFor="whatsapp-opt-in"
            className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-100"
          >
            <MessageCircle className="h-4 w-4" />
            Contact agrees to WhatsApp confirmation
          </label>
          <p className="text-xs text-muted-foreground">
            After save, show a QR code for the contact to scan on their phone. They start the chat
            (appears in <strong>Chats</strong>), and CardSync auto-replies with their card details.
            {!contactPhone ? " Add a phone number to enable." : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
