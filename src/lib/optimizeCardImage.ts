/**
 * Shared OCR-friendly card image optimizer for Gallery Upload and Camera Capture.
 * Adaptive JPEG compression toward a target byte range — single implementation for both paths.
 */

export type CardImageSource = "Upload" | "Camera" | "Gallery";

export type OptimizedCardImage = {
  file: File;
  dataUrl: string;
  originalBytes: number;
  optimizedBytes: number;
  /** True when the input was already within (or under) the target and left unchanged. */
  skipped: boolean;
};

const KB = 1024;

/** Gallery / Upload: 75–100 KB. Camera: 50–100 KB. */
function targetRange(source: CardImageSource): { min: number; max: number } {
  if (source === "Camera") {
    return { min: 50 * KB, max: 100 * KB };
  }
  return { min: 75 * KB, max: 100 * KB };
}

function normalizeSource(source?: string | null): CardImageSource {
  const s = String(source || "Upload").trim();
  if (/^camera$/i.test(s)) return "Camera";
  if (/^gallery$/i.test(s)) return "Gallery";
  return "Upload";
}

function estimateDataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return dataUrl.length;
  const b64 = dataUrl.slice(comma + 1);
  // Approx decoded size from base64 length.
  return Math.max(0, Math.floor((b64.length * 3) / 4));
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image for optimization."));
    img.src = dataUrl;
  });
}

function canvasToJpegDataUrl(
  img: HTMLImageElement,
  maxEdge: number,
  quality: number,
): string {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) return "";

  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const tw = Math.max(1, Math.round(w * scale));
  const th = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  // White fill avoids black letterboxing when converting transparent PNG → JPEG.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, tw, th);
  ctx.drawImage(img, 0, 0, tw, th);

  try {
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return "";
  }
}

async function dataUrlToJpegFile(dataUrl: string, fileName: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const base = fileName.replace(/\.[^.]+$/, "") || "card";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

/**
 * Optimize a card image to the source-specific target size.
 * - Preserves aspect ratio (no crop / stretch).
 * - Skips work when already ≤ max target.
 * - Progressive quality + resolution reduction until size ≤ max (OCR-friendly floor).
 */
export async function optimizeCardImage(
  input: File,
  source?: string | null,
  existingDataUrl?: string,
): Promise<OptimizedCardImage> {
  const cardSource = normalizeSource(source);
  const { max } = targetRange(cardSource);
  const originalBytes = input.size;

  const dataUrl =
    existingDataUrl && existingDataUrl.startsWith("data:")
      ? existingDataUrl
      : await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(reader.error || new Error("Failed to read image."));
          reader.readAsDataURL(input);
        });

  // Already small enough — keep as-is (do not re-compress).
  if (originalBytes > 0 && originalBytes <= max) {
    return {
      file: input,
      dataUrl,
      originalBytes,
      optimizedBytes: originalBytes,
      skipped: true,
    };
  }

  let img: HTMLImageElement;
  try {
    img = await loadImage(dataUrl);
  } catch {
    return {
      file: input,
      dataUrl,
      originalBytes,
      optimizedBytes: originalBytes || estimateDataUrlBytes(dataUrl),
      skipped: true,
    };
  }

  // Prefer keeping resolution high for OCR; reduce quality first, then edge length.
  const edgeSteps = [2000, 1800, 1600, 1400, 1200, 1000];
  const qualitySteps = [0.92, 0.88, 0.84, 0.8, 0.76, 0.72, 0.68, 0.64, 0.6, 0.55];

  let bestDataUrl = dataUrl;
  let bestBytes = originalBytes || estimateDataUrlBytes(dataUrl);

  for (const maxEdge of edgeSteps) {
    for (const quality of qualitySteps) {
      const next = canvasToJpegDataUrl(img, maxEdge, quality);
      if (!next) continue;
      const bytes = estimateDataUrlBytes(next);
      if (bytes <= 0) continue;

      if (bytes < bestBytes) {
        bestDataUrl = next;
        bestBytes = bytes;
      }

      // First fit under max at this resolution = highest remaining quality (steps descend).
      if (bytes <= max) {
        const file = await dataUrlToJpegFile(next, input.name || "card.jpg");
        return {
          file,
          dataUrl: next,
          originalBytes,
          optimizedBytes: file.size || bytes,
          skipped: false,
        };
      }
    }
  }

  const file =
    bestDataUrl !== dataUrl
      ? await dataUrlToJpegFile(bestDataUrl, input.name || "card.jpg")
      : input;

  return {
    file,
    dataUrl: bestDataUrl,
    originalBytes,
    optimizedBytes: file.size || bestBytes,
    skipped: bestDataUrl === dataUrl,
  };
}

export function formatStorageBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < KB) return `${Math.round(bytes)} B`;
  if (bytes < KB * KB) {
    const kb = bytes / KB;
    return kb >= 100 ? `${Math.round(kb)} KB` : `${kb.toFixed(kb >= 10 ? 0 : 1)} KB`;
  }
  const mb = bytes / (KB * KB);
  return mb >= 10 ? `${mb.toFixed(1)} MB` : `${mb.toFixed(2)} MB`;
}

export function computeStorageSaved(
  originalBytes: number,
  optimizedBytes: number,
): { savedBytes: number; savedPercent: number } {
  const savedBytes = Math.max(0, originalBytes - optimizedBytes);
  const savedPercent =
    originalBytes > 0 ? Math.round((savedBytes / originalBytes) * 1000) / 10 : 0;
  return { savedBytes, savedPercent };
}
