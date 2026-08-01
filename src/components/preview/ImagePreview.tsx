import { Button } from "@/components/common/Button";
import {
  computeStorageSaved,
  formatStorageBytes,
} from "@/lib/optimizeCardImage";

export const ImagePreview = ({
  src,
  onClear,
  captureSource,
  originalBytes,
  optimizedBytes,
}: {
  src: string;
  fileName?: string;
  onClear: () => void;
  captureSource?: string | null;
  originalBytes?: number | null;
  optimizedBytes?: number | null;
}) => {
  const title = /^camera$/i.test(String(captureSource || ""))
    ? "Captured Image"
    : "Business Card";

  const hasSizes =
    typeof originalBytes === "number" &&
    originalBytes > 0 &&
    typeof optimizedBytes === "number" &&
    optimizedBytes >= 0;

  const saved = hasSizes
    ? computeStorageSaved(originalBytes, optimizedBytes)
    : null;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-sm border border-border/50 bg-muted/10">
        <img src={src} alt="Business card preview" className="h-auto max-h-64 w-full object-contain" />
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-sm font-medium text-foreground">{title}</p>
          {hasSizes && saved ? (
            <dl className="max-w-xs space-y-0.5 text-[11px] leading-relaxed text-muted-foreground">
              <div className="flex items-center justify-between gap-4">
                <dt>Original Size</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {formatStorageBytes(originalBytes)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Optimized Size</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {formatStorageBytes(optimizedBytes)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Storage Saved</dt>
                <dd className="font-medium tabular-nums text-emerald-700 dark:text-emerald-400">
                  {formatStorageBytes(saved.savedBytes)}
                  {saved.savedPercent > 0 ? ` (${saved.savedPercent}%)` : ""}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Scanned card</p>
          )}
        </div>
        <Button variantType="danger" className="h-8 shrink-0 rounded-md px-3 text-xs" onClick={onClear}>
          Remove
        </Button>
      </div>
    </div>
  );
};
