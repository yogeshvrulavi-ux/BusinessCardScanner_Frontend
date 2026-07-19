import { useEffect, useState } from "react";
import { ImageOff, RotateCw, UserRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCardImage } from "@/components/contacts/CardThumbnail";
import { cn } from "@/lib/utils";

type CardImageCellProps = {
  contactId: string;
  hasCardImage?: boolean;
  queueImageDataUrl?: string;
  contactName?: string;
  /** Full name of the person who captured/scanned this card. */
  capturedBy?: string;
  className?: string;
};

/**
 * Renders the source image rotated by the given angle (degrees, clockwise)
 * onto a canvas and returns it as a data URL. 0° returns the source as-is.
 */
function rotateImage(img: HTMLImageElement, degrees: number): string | null {
  const canvas = document.createElement("canvas");
  const swapSides = degrees % 180 !== 0;
  canvas.width = swapSides ? img.naturalHeight : img.naturalWidth;
  canvas.height = swapSides ? img.naturalWidth : img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  return canvas.toDataURL("image/jpeg", 0.92);
}

/**
 * Card image column cell: small thumbnail of the scanned card that opens
 * a modal with the full-size image. Portrait captures (card photographed
 * sideways) are auto-rotated to landscape; a rotate button allows manual
 * correction.
 */
export function CardImageCell({
  contactId,
  hasCardImage,
  queueImageDataUrl,
  contactName,
  capturedBy,
  className,
}: CardImageCellProps) {
  const { src, markFailed } = useCardImage({ contactId, hasCardImage, queueImageDataUrl });
  const [open, setOpen] = useState(false);
  // null = rotation not decided yet (auto-detect on load)
  const [rotation, setRotation] = useState<number | null>(null);
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);

  useEffect(() => {
    if (!src) {
      setDisplaySrc(null);
      setRotation(null);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      // Business cards are landscape; a portrait capture means the photo is sideways.
      const angle = rotation ?? (img.naturalHeight > img.naturalWidth ? 270 : 0);
      if (rotation === null) {
        setRotation(angle);
        return; // effect re-runs with the resolved angle
      }
      if (angle === 0) {
        setDisplaySrc(src);
        return;
      }
      setDisplaySrc(rotateImage(img, angle) ?? src);
    };
    img.onerror = () => {
      if (!cancelled) setDisplaySrc(src);
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src, rotation]);

  const shownSrc = displaySrc ?? src;

  if (!src) {
    return (
      <span
        className={cn(
          "inline-flex h-9 w-14 items-center justify-center rounded-md border border-dashed border-border/60 text-muted-foreground/50",
          className,
        )}
        title="No card image"
      >
        <ImageOff className="h-3.5 w-3.5" />
      </span>
    );
  }

  return (
    <>
      <div className={cn("inline-flex w-14 flex-col items-stretch gap-0.5", className)}>
        {contactName && (
          <span
            className="truncate text-center text-[10px] font-medium leading-tight text-muted-foreground"
            title={contactName}
          >
            {contactName}
          </span>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="View card image"
          className="group relative block shrink-0 cursor-zoom-in overflow-hidden rounded-md ring-1 ring-border/60 transition hover:ring-2 hover:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <img
            src={shownSrc ?? undefined}
            alt={contactName ? `${contactName} business card` : "Business card"}
            className="h-9 w-14 object-cover transition group-hover:scale-105"
            onError={markFailed}
          />
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
              <DialogTitle>{contactName || "Business card"}</DialogTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRotation((r) => ((r ?? 0) + 90) % 360)}
                className="h-7 rounded-md px-2.5 text-xs"
              >
                <RotateCw className="mr-1.5 h-3.5 w-3.5" /> Rotate
              </Button>
            </div>
            <DialogDescription>Scanned business card image</DialogDescription>
          </DialogHeader>
          <div className="overflow-hidden rounded-lg bg-muted/40">
            {(contactName || capturedBy) && (
              <div className="flex items-center justify-center gap-3 border-b border-border/60 bg-muted/80 px-3 py-1.5 text-xs text-muted-foreground">
                {contactName && (
                  <span className="truncate font-semibold text-foreground">{contactName}</span>
                )}
                {contactName && capturedBy && (
                  <span className="text-border">|</span>
                )}
                {capturedBy && (
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <UserRound className="h-3.5 w-3.5" />
                    Captured by <span className="text-foreground">{capturedBy}</span>
                  </span>
                )}
              </div>
            )}
            <div className="flex max-h-[70vh] items-center justify-center overflow-auto p-2">
              <img
                src={shownSrc ?? undefined}
                alt={contactName ? `${contactName} business card` : "Business card"}
                className="max-h-[62vh] w-auto max-w-full rounded-md object-contain"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
