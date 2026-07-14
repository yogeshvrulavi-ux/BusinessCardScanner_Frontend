import { CheckCircle2, Loader2, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Label } from "@/components/ui/label";
import { BaseInput } from "@/components/form/inputs/BaseInput";
import { ValidationMessage } from "@/components/form/ValidationMessage";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  error?: string;
  confidence?: number;
  verified: boolean;
  verifying: boolean;
  onChange: (value: string) => void;
  onVerify: () => void;
};

export function PhoneVerifyField({
  value,
  error,
  confidence,
  verified,
  verifying,
  onChange,
  onVerify,
}: Props) {
  const isLow = confidence !== undefined && confidence > 0 && confidence < 70;
  const showConfidence = confidence !== undefined && confidence > 0;
  const canVerify = Boolean(value.trim()) && !verified && !verifying;

  return (
    <div
      className={cn(
        "space-y-1.5 rounded-xl p-2 transition-colors",
        isLow && "border border-amber-500/40 bg-amber-500/5",
        verified && "border border-emerald-500/40 bg-emerald-500/5",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs text-muted-foreground">Primary Phone</Label>
        <div className="flex items-center gap-2">
          {showConfidence && (
            <span
              className={cn(
                "text-[10px] font-semibold tabular-nums",
                isLow ? "text-amber-600 dark:text-amber-400" : "text-success",
              )}
            >
              {Math.round(confidence)}% {isLow ? "· verify" : ""}
            </span>
          )}
          {verified ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              WhatsApp verified
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <BaseInput
            value={value}
            type="tel"
            placeholder="Mobile or phone"
            onChange={onChange}
          />
        </div>
        <Button
          type="button"
          variantType={verified ? "secondary" : "primary"}
          className="shrink-0 gap-1.5 px-3"
          disabled={!canVerify}
          onClick={onVerify}
        >
          {verifying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : verified ? (
            <ShieldCheck className="h-4 w-4" />
          ) : (
            <MessageCircle className="h-4 w-4" />
          )}
          {verifying ? "Waiting…" : verified ? "Verified" : "Verify"}
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Tap Verify → contact scans QR on their phone → sends message → thread opens in Chats → Save
        Lead unlocks.
      </p>
      <ValidationMessage message={error} />
    </div>
  );
}
