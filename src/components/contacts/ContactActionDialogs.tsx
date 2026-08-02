import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountryCodeSelect } from "@/components/review/CountryCodeSelect";
import { validationRules } from "@/constants/validationRules";
import { findCountryByDialCode } from "@/constants/countries";
import { splitPhoneNumber } from "@/lib/phoneCountry";

export type ResendChannelChoice = "whatsapp" | "email" | "both" | "none";

type ContactResendDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** When true, show "Don't Send" (post-edit confirmation). */
  allowSkip?: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  busy?: boolean;
  onChoose: (choice: Exclude<ResendChannelChoice, "none"> | "none") => void;
};

export function ContactResendDialog({
  open,
  onOpenChange,
  title,
  description,
  allowSkip = false,
  hasPhone,
  hasEmail,
  busy = false,
  onChoose,
}: ContactResendDialogProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <div className="mt-4 flex flex-col gap-2">
        <Button
          className="w-full rounded-md"
          disabled={busy || !hasPhone}
          onClick={() => onChoose("whatsapp")}
        >
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Send WhatsApp
        </Button>
        <Button
          className="w-full rounded-md"
          variant="outline"
          disabled={busy || !hasEmail}
          onClick={() => onChoose("email")}
        >
          Send Email
        </Button>
        <Button
          className="w-full rounded-md"
          variant="outline"
          disabled={busy || !hasPhone || !hasEmail}
          onClick={() => onChoose("both")}
        >
          Send Both
        </Button>
        {allowSkip ? (
          <Button
            className="w-full rounded-md"
            variant="ghost"
            disabled={busy}
            onClick={() => onChoose("none")}
          >
            Don&apos;t Send
          </Button>
        ) : (
          <Button
            className="w-full rounded-md"
            variant="ghost"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        )}
      </div>
    </Modal>
  );
}

export type ContactEditValues = {
  phone: string;
  email: string;
  countryCode: string;
  countryName: string;
};

type ContactEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPhone: string;
  initialEmail: string;
  initialCountryCode?: string;
  initialCountryName?: string;
  contactName?: string;
  busy?: boolean;
  onSave: (values: ContactEditValues) => void;
};

function resolveEditPhoneFields(
  rawPhone: string,
  savedCountryCode?: string,
  savedCountryName?: string,
): { countryCode: string; countryName: string; phone: string } {
  const savedCode = (savedCountryCode || "").trim();
  const savedName = (savedCountryName || "").trim();
  const phoneRaw = (rawPhone || "").trim();

  if (savedCode) {
    const ccDigits = savedCode.replace(/\D/g, "");
    const phoneDigits = phoneRaw.replace(/\D/g, "");
    let local = phoneDigits;
    if (ccDigits && phoneDigits.startsWith(ccDigits) && phoneDigits.length > ccDigits.length + 3) {
      local = phoneDigits.slice(ccDigits.length);
    } else if (phoneRaw.startsWith("+")) {
      const split = splitPhoneNumber(phoneRaw);
      local = split.countryCode === savedCode ? split.localNumber : phoneDigits;
    }
    return {
      countryCode: savedCode,
      countryName: savedName || findCountryByDialCode(savedCode)?.name || "",
      phone: local,
    };
  }

  const split = splitPhoneNumber(phoneRaw);
  return {
    countryCode: split.countryCode,
    countryName: split.countryName || findCountryByDialCode(split.countryCode)?.name || "",
    phone: split.localNumber || phoneRaw.replace(/\D/g, ""),
  };
}

export function ContactEditDialog({
  open,
  onOpenChange,
  initialPhone,
  initialEmail,
  initialCountryCode = "",
  initialCountryName = "",
  contactName,
  busy = false,
  onSave,
}: ContactEditDialogProps) {
  const [countryCode, setCountryCode] = useState("");
  const [countryName, setCountryName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const resolved = resolveEditPhoneFields(initialPhone, initialCountryCode, initialCountryName);
    setCountryCode(resolved.countryCode);
    setCountryName(resolved.countryName);
    setPhone(resolved.phone);
    setEmail(initialEmail);
    setPhoneError(null);
    setEmailError(null);
  }, [open, initialPhone, initialEmail, initialCountryCode, initialCountryName]);

  const validate = () => {
    let ok = true;
    const phoneValue = phone.trim();
    const emailValue = email.trim();

    if (!validationRules.required(phoneValue)) {
      setPhoneError("Phone number is required.");
      ok = false;
    } else if (!validationRules.phone(phoneValue)) {
      setPhoneError("Enter a valid phone number (7–20 digits).");
      ok = false;
    } else {
      setPhoneError(null);
    }

    if (!validationRules.required(emailValue)) {
      setEmailError("Email address is required.");
      ok = false;
    } else if (!validationRules.email(emailValue)) {
      setEmailError("Enter a valid email address.");
      ok = false;
    } else {
      setEmailError(null);
    }

    return ok;
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit contact"
      description={
        contactName
          ? `Update phone or email for ${contactName}. Other fields stay unchanged.`
          : "Update phone number and email address only."
      }
    >
      <div className="mt-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)]">
          <CountryCodeSelect
            label="Country Code"
            value={countryCode}
            disabled={busy}
            onChange={(code, name) => {
              setCountryCode(code);
              setCountryName(name);
            }}
          />
          <div className="space-y-1.5">
            <Label htmlFor="edit-contact-phone">Phone Number</Label>
            <Input
              id="edit-contact-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={busy}
              placeholder="Phone number without country code"
              className="h-11 rounded-md"
              autoComplete="tel-national"
            />
            {phoneError ? <p className="text-xs text-destructive">{phoneError}</p> : null}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-contact-email">Email Address</Label>
          <Input
            id="edit-contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            className="rounded-md"
            autoComplete="email"
          />
          {emailError ? <p className="text-xs text-destructive">{emailError}</p> : null}
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            className="flex-1 rounded-md"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 rounded-md"
            disabled={busy}
            onClick={() => {
              if (!validate()) return;
              onSave({
                phone: phone.trim(),
                email: email.trim(),
                countryCode: countryCode.trim(),
                countryName:
                  countryName.trim() ||
                  findCountryByDialCode(countryCode)?.name ||
                  "",
              });
            }}
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
