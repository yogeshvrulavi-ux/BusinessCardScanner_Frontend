import { CheckCircle2 } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

const HIDDEN_PREVIEW_FIELDS = new Set(["notes", "firstName", "lastName", "secondaryAddress"]);

export const OCRPreview = ({ values }: { values: Record<string, string> }) => {
  const entries = Object.entries(values).filter(
    ([key, value]) => Boolean(value) && !HIDDEN_PREVIEW_FIELDS.has(key),
  );

  if (entries.length === 0)
    return (
      <EmptyState
        title="No OCR data yet"
        description="Upload an image to preview extracted text fields."
      />
    );

  return (
    <div className="space-y-1.5">
      {entries.map(([key, value]) => (
        <p key={key} className="text-sm leading-relaxed">
          <span className="font-medium text-foreground">{key}</span>
          <span className="text-muted-foreground">: </span>
          <span className="text-foreground">{value}</span>
        </p>
      ))}
      <div className="mt-4 inline-flex items-center gap-2 text-sm text-success">
        <CheckCircle2 className="h-4 w-4" /> OCR extraction ready
      </div>
    </div>
  );
};
