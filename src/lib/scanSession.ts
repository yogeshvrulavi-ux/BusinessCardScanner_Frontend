import type { ScanContact } from "@/lib/scanResult";

const SCAN_RESULT_KEY = "latestScanResult";
const SCAN_IMAGE_KEY = "latestScanImage";
const SCAN_META_KEY = "latestScanMeta";

export type ScanSessionMeta = {
  rawText?: string;
  ocrWarning?: string;
  ocrEngine?: string;
  ocrConfidence?: number;
  captureSource?: string;
  /** Original file size in bytes before optimization. */
  originalImageBytes?: number;
  /** Optimized file size in bytes (what is stored / uploaded). */
  optimizedImageBytes?: number;
  whatsappQueued?: boolean;
  whatsappError?: string | null;
  whatsappTo?: string | null;
  whatsappRecipientName?: string | null;
  emailQueued?: boolean;
  emailError?: string | null;
  emailTo?: string | null;
  emailExtracted?: string | null;
  /** When set, Review saves via update (existing contact) instead of create. */
  editContactId?: string;
  editSource?: "localdb" | "indexeddb" | "queue";
  /** Baseline for post-edit resend prompt (email / phone change detection). */
  originalEmail?: string;
  originalPhone?: string;
};

export function storeScanSession(
  contact: ScanContact,
  imageDataUrl?: string,
  meta?: ScanSessionMeta,
) {
  sessionStorage.setItem(SCAN_RESULT_KEY, JSON.stringify(contact));
  if (imageDataUrl) {
    sessionStorage.setItem(SCAN_IMAGE_KEY, imageDataUrl);
  }
  if (meta) {
    sessionStorage.setItem(SCAN_META_KEY, JSON.stringify(meta));
  }
  window.dispatchEvent(new CustomEvent("cs-scan-updated"));
}

export function loadScanSession(): {
  contact: ScanContact | null;
  imageDataUrl: string | null;
  meta: ScanSessionMeta | null;
} {
  const raw = sessionStorage.getItem(SCAN_RESULT_KEY);
  const imageDataUrl = sessionStorage.getItem(SCAN_IMAGE_KEY);
  const metaRaw = sessionStorage.getItem(SCAN_META_KEY);
  if (!raw) return { contact: null, imageDataUrl, meta: null };

  try {
    const meta = metaRaw ? (JSON.parse(metaRaw) as ScanSessionMeta) : null;
    return { contact: JSON.parse(raw) as ScanContact, imageDataUrl, meta };
  } catch {
    return { contact: null, imageDataUrl, meta: null };
  }
}

export function clearScanSession() {
  sessionStorage.removeItem(SCAN_RESULT_KEY);
  sessionStorage.removeItem(SCAN_IMAGE_KEY);
  sessionStorage.removeItem(SCAN_META_KEY);
  window.dispatchEvent(new CustomEvent("cs-scan-updated"));
}

/** Prefill Review for editing an existing saved/queued contact (no OCR re-run). */
export function storeContactEditSession(input: {
  contact: ScanContact;
  imageDataUrl?: string | null;
  contactId: string;
  source: "localdb" | "indexeddb" | "queue";
  originalEmail: string;
  originalPhone: string;
}) {
  storeScanSession(input.contact, input.imageDataUrl || undefined, {
    captureSource: "edit",
    editContactId: input.contactId,
    editSource: input.source,
    originalEmail: input.originalEmail,
    originalPhone: input.originalPhone,
  });
}

export function isValidCardImage(file: File): boolean {
  const type = (file.type || "").toLowerCase();
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/pjpeg", "image/x-png"];
  if (validTypes.includes(type)) return true;
  return /\.(jpe?g|png)$/i.test(file.name);
}

export async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Compress a capture for session/DB storage.
 * Prefer optimizeCardImage() for adaptive target-size compression (Gallery + Camera).
 * Kept for backward compatibility with any direct callers.
 */
export async function compressDataUrlForStorage(
  dataUrl: string,
  maxEdge = 1600,
  quality = 0.82,
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith("data:")) return dataUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (!w || !h) {
        resolve(dataUrl);
        return;
      }

      const scale = Math.min(1, maxEdge / Math.max(w, h));
      const tw = Math.max(1, Math.round(w * scale));
      const th = Math.max(1, Math.round(h * scale));
      const canvas = document.createElement("canvas");
      canvas.width = tw;
      canvas.height = th;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, tw, th);
      ctx.drawImage(img, 0, 0, tw, th);
      try {
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function dataUrlToFile(dataUrl: string, fileName = "scan.jpg"): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const type = blob.type || "image/jpeg";
  return new File([blob], fileName, { type });
}

function isGarbageExtractedValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (/^\|[\s@|]/.test(trimmed) || /@\s*remo/i.test(trimmed)) return true;
  if (trimmed.length <= 6 && !/\s/.test(trimmed) && /[a-z][A-Z]/.test(trimmed)) return true;
  return false;
}

export function isEmptyScanContact(contact: ScanContact | null): boolean {
  if (!contact) return true;
  return ![
    contact.fullName,
    contact.firstName,
    contact.lastName,
    contact.phone,
    contact.email,
    contact.company,
  ].some((v) => {
    const text = String(v || "").trim();
    return text.length > 0 && !isGarbageExtractedValue(text);
  });
}
