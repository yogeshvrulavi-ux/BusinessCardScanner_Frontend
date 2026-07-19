import { jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { c as apiFetch, d as API_BASE_URL, h as cn } from "./router-B3QH6PKy.js";
function useCardImage({ contactId, hasCardImage, queueImageDataUrl }) {
  const [src, setSrc] = useState(
    queueImageDataUrl?.startsWith("data:image/") ? queueImageDataUrl : null
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
    let revoked = null;
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
function CardThumbnail({
  contactId,
  hasCardImage,
  queueImageDataUrl,
  initials = "?",
  accent = "from-indigo-500 to-violet-500",
  className,
  size = "sm"
}) {
  const { src, markFailed } = useCardImage({ contactId, hasCardImage, queueImageDataUrl });
  const sizeClass = size === "md" ? "h-12 w-12" : "h-9 w-9";
  if (src) {
    return /* @__PURE__ */ jsx(
      "img",
      {
        src,
        alt: "",
        className: cn(
          sizeClass,
          "shrink-0 rounded-lg object-cover ring-1 ring-border/60",
          className
        ),
        onError: markFailed
      }
    );
  }
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        sizeClass,
        "flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-[11px] font-semibold text-white",
        accent,
        className
      ),
      children: initials || "?"
    }
  );
}
export {
  CardThumbnail as C,
  useCardImage as u
};
