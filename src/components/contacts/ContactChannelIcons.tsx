import { cn } from "@/lib/utils";
import type { OutreachDeliveryRecord } from "@/lib/outreachStatusStorage";
import { resolveChannelIconStatus } from "@/lib/outreachStatusStorage";

type ChannelIconStatus = "success" | "failure" | "not_sent" | "pending" | "disabled";

type ChannelIconProps = {
  status: ChannelIconStatus;
  type: "whatsapp" | "email";
  error?: string | null;
  className?: string;
};

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M3.5 8.5L6.5 11.5L12.5 4.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M4.5 4.5L11.5 11.5M11.5 4.5L4.5 11.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PendingIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="2" fill="currentColor" />
    </svg>
  );
}

function DisabledIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function channelTitle(
  type: "whatsapp" | "email",
  status: ChannelIconStatus,
  error?: string | null,
): string {
  const label = type === "whatsapp" ? "WhatsApp" : "Email";
  if (status === "disabled") return `${label}: Disabled in Settings`;
  if (status === "success") return `${label}: Sent`;
  if (status === "pending") return `${label}: Pending — waiting for sync`;
  if (error) return `${label}: Not Sent — ${error}`;
  return `${label}: Not Sent`;
}

/** Clear labels: Sent | Not Sent | Pending | Disabled */
function statusLabel(status: ChannelIconStatus): string {
  if (status === "disabled") return "Disabled";
  if (status === "success") return "Sent";
  if (status === "pending") return "Pending";
  return "Not Sent";
}

function ChannelBadge({ status, type, error, className }: ChannelIconProps) {
  const title = channelTitle(type, status, error);

  return (
    <span
      title={title}
      aria-label={title}
      className={cn(
        "inline-flex h-6 w-6 items-center justify-center rounded-md",
        status === "success"
          ? "bg-success/10 text-success"
          : status === "pending"
            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            : status === "disabled"
              ? "bg-muted text-muted-foreground/70"
              : "bg-destructive/10 text-destructive",
        className,
      )}
    >
      {status === "success" ? (
        <CheckIcon className="h-3.5 w-3.5" />
      ) : status === "pending" ? (
        <PendingIcon className="h-3.5 w-3.5" />
      ) : status === "disabled" ? (
        <DisabledIcon className="h-3.5 w-3.5" />
      ) : (
        <CrossIcon className="h-3.5 w-3.5" />
      )}
      <span className="sr-only">{title}</span>
    </span>
  );
}

function resolveDisplayStatus(input: {
  enabled: boolean;
  queued: boolean;
  hasChannel: boolean;
  delivery?: OutreachDeliveryRecord;
}): ChannelIconStatus {
  if (!input.enabled) return "disabled";
  if (input.queued) return "pending";
  if (!input.hasChannel) return "not_sent";
  return resolveChannelIconStatus(input.delivery);
}

type ContactChannelIconsProps = {
  phone?: string | null;
  email?: string | null;
  emailDelivery?: OutreachDeliveryRecord;
  whatsappDelivery?: OutreachDeliveryRecord;
  className?: string;
  compact?: boolean;
  /** @deprecated Prefer whatsappEnabled — kept for callers that hide the channel entirely. */
  showWhatsApp?: boolean;
  /** @deprecated Prefer emailEnabled */
  showEmail?: boolean;
  /** Settings: WhatsApp follow-ups enabled (false → Disabled). */
  whatsappEnabled?: boolean;
  /** Settings: Email follow-ups enabled (false → Disabled). */
  emailEnabled?: boolean;
  /** Offline / IndexedDB queue — always Pending until sync completes. */
  queued?: boolean;
};

/** WhatsApp + Email: Sent · Pending · Not Sent · Disabled (from Settings). */
export function ContactChannelIcons({
  phone,
  email,
  emailDelivery,
  whatsappDelivery,
  className,
  compact = false,
  showWhatsApp = true,
  showEmail = true,
  whatsappEnabled = true,
  emailEnabled = true,
  queued = false,
}: ContactChannelIconsProps) {
  // Always render both channels when the parent asks to show the column.
  // Enabled flags control Sent/Pending/Not Sent vs Disabled — not visibility.
  const renderWhatsApp = showWhatsApp;
  const renderEmail = showEmail;
  if (!renderWhatsApp && !renderEmail) return null;

  const whatsappStatus = resolveDisplayStatus({
    enabled: whatsappEnabled,
    queued,
    hasChannel: Boolean(phone),
    delivery: whatsappDelivery,
  });
  const emailStatus = resolveDisplayStatus({
    enabled: emailEnabled,
    queued,
    hasChannel: Boolean(email),
    delivery: emailDelivery,
  });

  if (compact) {
    return (
      <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
        {renderWhatsApp ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-1.5 py-0.5 text-[10px]">
            <ChannelBadge
              status={whatsappStatus}
              type="whatsapp"
              error={whatsappDelivery?.error}
              className="h-4 w-4"
            />
            <span className="text-muted-foreground">WhatsApp: {statusLabel(whatsappStatus)}</span>
          </span>
        ) : null}
        {renderEmail ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-1.5 py-0.5 text-[10px]">
            <ChannelBadge
              status={emailStatus}
              type="email"
              error={emailDelivery?.error}
              className="h-4 w-4"
            />
            <span className="text-muted-foreground">Email: {statusLabel(emailStatus)}</span>
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {renderWhatsApp ? (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ChannelBadge
            status={whatsappStatus}
            type="whatsapp"
            error={whatsappDelivery?.error}
          />
          WhatsApp: {statusLabel(whatsappStatus)}
        </span>
      ) : null}
      {renderEmail ? (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ChannelBadge
            status={emailStatus}
            type="email"
            error={emailDelivery?.error}
          />
          Email: {statusLabel(emailStatus)}
        </span>
      ) : null}
    </div>
  );
}
