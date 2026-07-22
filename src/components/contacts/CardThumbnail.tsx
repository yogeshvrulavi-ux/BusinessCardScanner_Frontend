import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { apiFetch } from "@/lib/apiFetch";
import { cn } from "@/lib/utils";

type CardImageSource = {
  contactId: string;
  hasCardImage?: boolean;
  queueImageDataUrl?: string;
};

type CardThumbnailProps = CardImageSource & {
  initials?: string;
  accent?: string;
  className?: string;
  size?: "sm" | "md";
};

/**
 * Auth-aware card image loader. Uses the dedicated /card-image endpoint
 * (or a queued data URL) so list payloads do not need full base64 blobs.
 */
export function useCardImage({ contactId, hasCardImage, queueImageDataUrl }: CardImageSource) {
  const [src, setSrc] = useState<string | null>(
    queueImageDataUrl?.startsWith("data:image/") ? queueImageDataUrl : null,
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (queueImageDataUrl?.startsWith("data:image/")) {
      setSrc(queueImageDataUrl);
      setFailed(false);
      return;
    }
    if (!hasCardImage || !contactId || contactId.startsWith("db-")) {
      setSrc(null);
      return;
    }

    let revoked: string | null = null;
    let cancelled = false;

    void (async () => {
      try {
        const response = await apiFetch(`${API_BASE_URL}/api/contacts/${contactId}/card-image`);
        if (!response.ok) throw new Error(`card-image ${response.status}`);
        const blob = await response.blob();
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(blob);
        revoked = objectUrl;
        setSrc(objectUrl);
        setFailed(false);
      } catch {
        if (!cancelled) {
          setSrc(null);
          setFailed(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [contactId, hasCardImage, queueImageDataUrl]);

  return { src: failed ? null : src, markFailed: () => setFailed(true) };
}

export function CardThumbnail({
  contactId,
  hasCardImage,
  queueImageDataUrl,
  initials = "?",
  accent = "from-cyan-500 to-teal-500",
  className,
  size = "sm",
}: CardThumbnailProps) {
  const { src, markFailed } = useCardImage({ contactId, hasCardImage, queueImageDataUrl });

  const sizeClass = size === "md" ? "h-12 w-12" : "h-9 w-9";

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn(
          sizeClass,
          "shrink-0 rounded-lg object-cover ring-1 ring-border/60",
          className,
        )}
        onError={markFailed}
      />
    );
  }

  return (
    <div
      className={cn(
        sizeClass,
        "flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-[11px] font-semibold text-white",
        accent,
        className,
      )}
    >
      {initials || "?"}
    </div>
  );
}
