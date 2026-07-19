import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  FileDigit,
  Globe,
  Mail,
  MapPin,
  Phone,
  Share2,
} from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

type PreviewRow = {
  name: string;
  label: string;
  icon: LucideIcon;
  /** Span both columns (for long values like addresses). */
  wide?: boolean;
};

/** All detail rows in display order; related pairs sit side by side in the 2-column grid. */
const PREVIEW_ROWS: PreviewRow[] = [
  { name: "designation", label: "Designation", icon: Briefcase },
  { name: "companyName", label: "Company", icon: Building2 },
  { name: "phoneNumber", label: "Phone", icon: Phone },
  { name: "secondaryPhoneNumber", label: "Alt phone", icon: Phone },
  { name: "emailAddress", label: "Email", icon: Mail },
  { name: "secondaryEmailAddress", label: "Alt email", icon: Mail },
  { name: "website", label: "Website", icon: Globe },
  { name: "secondaryWebsite", label: "Alt website", icon: Globe },
  { name: "address", label: "Address", icon: MapPin },
  { name: "socialLinks", label: "Social", icon: Share2, wide: true },
  { name: "gstNumber", label: "GST / Tax", icon: FileDigit },
];

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export const OCRPreview = ({ values }: { values: Record<string, string> }) => {
  const fullName = (values.fullName ?? "").trim();
  const companyName = (values.companyName ?? "").trim();

  const rows = PREVIEW_ROWS.map((row) => ({
    ...row,
    value: (values[row.name] ?? "").trim(),
  })).filter((row) => row.value);

  if (!fullName && rows.length === 0)
    return (
      <EmptyState
        title="No OCR data yet"
        description="Upload an image to preview extracted text fields."
      />
    );

  return (
    <div>
      {fullName && (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-muted text-sm font-semibold text-muted-foreground">
            {initialsOf(fullName || companyName) || "—"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{fullName}</p>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Full name
            </p>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <dl
          className={
            (fullName ? "mt-4 " : "") + "grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2"
          }
        >
          {rows.map(({ name, label, icon: Icon, value, wide }) => (
            <div
              key={name}
              className={
                "flex items-start gap-2.5" + (wide ? " sm:col-span-2" : "")
              }
            >
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
              <div className="min-w-0 flex-1">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {label}
                </dt>
                <dd className="whitespace-pre-line break-words text-sm leading-snug text-foreground">
                  {value}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-4 flex items-center gap-1.5 border-t border-border/60 pt-3 text-xs text-success">
        <CheckCircle2 className="h-3.5 w-3.5" />
        OCR extraction ready — verify fields before saving
      </div>
    </div>
  );
};
