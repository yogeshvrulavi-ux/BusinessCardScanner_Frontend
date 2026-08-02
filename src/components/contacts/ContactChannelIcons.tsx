import { cn } from "@/lib/utils";
import type { OutreachDeliveryRecord } from "@/lib/outreachStatusStorage";
import { resolveChannelIconStatus } from "@/lib/outreachStatusStorage";

type ChannelIconStatus =
  | "delivered"
  | "sent"
  | "failure"
  | "not_sent"
  | "pending"
  | "disabled";

type ChannelBadgeProps = {
  status: ChannelIconStatus;
  type: "whatsapp" | "email";
  error?: string | null;
  timestamp?: string | null;
  className?: string;
};

function statusLabel(status: ChannelIconStatus): string {
  switch (status) {
    case "delivered":
      return "Delivered";
    case "sent":
      return "Sent";
    case "pending":
      return "Pending";
    case "failure":
      return "Failed";
    case "disabled":
      return "Disabled";
    default:
      return "Not Sent";
  }
}

function statusGlyph(status: ChannelIconStatus): string {
  switch (status) {
    case "delivered":
    case "sent":
      return "✓";
    case "pending":
      return "⏳";
    case "failure":
      return "✗";
    case "disabled":
      return "⚪";
    default:
      return "○";
  }
}

function formatTimestamp(iso?: string | null): string | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  const d = new Date(ms);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `Today ${time}`;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function channelTitle(
  type: "whatsapp" | "email",
  status: ChannelIconStatus,
  error?: string | null,
  timestamp?: string | null,
): string {
  const label = type === "whatsapp" ? "WhatsApp" : "Email";
  const parts = [`${label}: ${statusLabel(status)}`];
  const ts = formatTimestamp(timestamp);
  if (ts) parts.push(ts);
  if (status === "failure" && error) parts.push(error);
  if (status === "disabled") parts.push("Turned off in Settings");
  return parts.join(" · ");
}

function ChannelBadge({ status, type, error, timestamp, className }: ChannelBadgeProps) {
  const title = channelTitle(type, status, error, timestamp);
  const channel = type === "whatsapp" ? "WhatsApp" : "Email";
  const ts = formatTimestamp(timestamp);
  const sub =
    status === "failure"
      ? error
        ? "Retry available"
        : "Retry available"
      : ts;

  return (
    <span
      title={title}
      aria-label={title}
      className={cn(
        "inline-flex max-w-[11.5rem] flex-col gap-0.5 rounded-xl border px-2.5 py-1.5 text-left shadow-sm",
        status === "delivered" &&
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
        status === "sent" &&
          "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200",
        status === "pending" &&
          "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100",
        status === "failure" &&
          "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200",
        (status === "disabled" || status === "not_sent") &&
          "border-border/70 bg-muted/40 text-muted-foreground",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold leading-none">
        <span aria-hidden className="text-[12px]">
          {statusGlyph(status)}
        </span>
        <span className="truncate">
          {channel} · {statusLabel(status)}
        </span>
      </span>
      {sub ? (
        <span className="truncate pl-5 text-[10px] font-normal opacity-80">{sub}</span>
      ) : null}
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
  const raw = resolveChannelIconStatus(input.delivery);
  if (raw === "success") {
    // Prefer Delivered when we have a completed timestamp; otherwise Sent.
    return input.delivery?.updatedAt ? "delivered" : "sent";
  }
  if (raw === "failure") return "failure";
  if (raw === "pending") return "pending";
  return "not_sent";
}

type ContactChannelIconsProps = {
  phone?: string | null;
  email?: string | null;
  emailDelivery?: OutreachDeliveryRecord;
  whatsappDelivery?: OutreachDeliveryRecord;
  className?: string;
  compact?: boolean;
  showWhatsApp?: boolean;
  showEmail?: boolean;
  whatsappEnabled?: boolean;
  emailEnabled?: boolean;
  queued?: boolean;
};

/** CRM-style WhatsApp / Email status badges with icon, color, tooltip, timestamp. */
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
  if (!showWhatsApp && !showEmail) return null;

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

  return (
    <div
      className={cn(
        "flex gap-1.5",
        compact ? "flex-wrap items-center" : "flex-col items-start",
        className,
      )}
    >
      {showWhatsApp ? (
        <ChannelBadge
          status={whatsappStatus}
          type="whatsapp"
          error={whatsappDelivery?.error}
          timestamp={whatsappDelivery?.updatedAt}
        />
      ) : null}
      {showEmail ? (
        <ChannelBadge
          status={emailStatus}
          type="email"
          error={emailDelivery?.error}
          timestamp={emailDelivery?.updatedAt}
        />
      ) : null}
    </div>
  );
}
