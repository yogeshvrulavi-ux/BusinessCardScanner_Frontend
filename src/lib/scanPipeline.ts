import { emptyScanContact, type ScanContact } from "@/lib/scanResult";
import { runBrowserOcr } from "@/lib/browserOcr";
import { storeScanSession } from "@/lib/scanSession";
import { isNetworkOnline } from "@/lib/connectionMode";
import { apiFetch } from "@/lib/apiFetch";
import { API_BASE_URL } from "@/lib/api";

export type ScanProgress = {
  progress: number;
  message: string;
};

export type ScanExtractionResult = {
  contact: ScanContact;
  rawText?: string;
  ocrWarning?: string;
  /** Engine that produced the extraction (Textract or PaddleOCR). */
  ocrEngine?: string;
  /** Average field confidence 0–100 when the engine reports it. */
  ocrConfidence?: number;
};

async function runBrowserExtraction(
  file: File,
  onProgress?: (update: ScanProgress) => void,
): Promise<ScanExtractionResult> {
  const message =
    typeof navigator !== "undefined" && !navigator.onLine
      ? "No internet — extracting on device…"
      : "Extracting contact details on device…";

  onProgress?.({ progress: 25, message });
  const result = await runBrowserOcr(file);
  onProgress?.({ progress: 100, message: "Extraction complete" });

  return {
    contact: result.contact,
    rawText: result.rawText,
    ocrWarning: result.ocrWarning,
    ocrEngine: "PaddleOCR",
  };
}

function averageConfidence(confidence: unknown): number | undefined {
  if (!confidence || typeof confidence !== "object") return undefined;
  const values = Object.values(confidence as Record<string, unknown>)
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v) && v > 0);
  if (values.length === 0) return undefined;
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  // Engines report 0–1 or 0–100; normalize to a 0–100 percentage.
  return Math.round((avg <= 1 ? avg * 100 : avg) * 10) / 10;
}

/**
 * Online OCR via the backend Textract endpoint (POST /api/ocr).
 * Falls back to browser PaddleOCR on any failure (network, auth, 503, etc.).
 */
async function runOnlineExtraction(
  file: File,
  onProgress?: (update: ScanProgress) => void,
): Promise<ScanExtractionResult> {
  onProgress?.({ progress: 20, message: "Extracting via AWS Textract…" });

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiFetch(`${API_BASE_URL}/api/ocr`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Backend OCR returned ${response.status}`);
    }

    const data = await response.json();
    const rawText: string = data.rawText || "";
    const contact: ScanContact = data.contact || emptyScanContact();

    onProgress?.({ progress: 100, message: "Extraction complete" });

    return {
      contact,
      rawText,
      ocrEngine: "Textract",
      ocrConfidence: averageConfidence(data.confidence ?? data.contact?.confidence),
    };
  } catch (error) {
    console.warn("Online OCR (Textract) failed, falling back to browser OCR:", error);
    return runBrowserExtraction(file, onProgress);
  }
}

/**
 * Auto-selects OCR engine based on connectivity:
 * - Online  → backend Textract (POST /api/ocr) with browser fallback.
 * - Offline → browser PaddleOCR.
 */
export async function extractContactFromImage(
  file: File,
  onProgress?: (update: ScanProgress) => void,
): Promise<ScanExtractionResult> {
  try {
    if (isNetworkOnline()) {
      return await runOnlineExtraction(file, onProgress);
    }
    return await runBrowserExtraction(file, onProgress);
  } catch (err) {
    console.error("OCR pipeline failed:", err);
    onProgress?.({ progress: 100, message: "Extraction failed — enter details manually" });
    return {
      contact: emptyScanContact(),
      ocrWarning:
        "Could not read this card. Try better lighting, hold the card flat, or enter details manually.",
    };
  }
}

export async function scanFileAndStore(
  file: File,
  imageDataUrl: string,
  onProgress?: (update: ScanProgress) => void,
  captureSource?: string,
): Promise<ScanExtractionResult> {
  const result = await extractContactFromImage(file, onProgress);
  storeScanSession(result.contact, imageDataUrl, {
    rawText: result.rawText,
    ocrWarning: result.ocrWarning,
    ocrEngine: result.ocrEngine,
    ocrConfidence: result.ocrConfidence,
    captureSource,
  });
  return result;
}
