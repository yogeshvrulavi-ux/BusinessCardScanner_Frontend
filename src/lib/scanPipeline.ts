import { emptyScanContact, type ScanContact } from "@/lib/scanResult";
import { runBrowserOcr } from "@/lib/browserOcr";
import { storeScanSession } from "@/lib/scanSession";

export type ScanProgress = {
  progress: number;
  message: string;
};

export type ScanExtractionResult = {
  contact: ScanContact;
  rawText?: string;
  ocrWarning?: string;
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
  };
}

/** OCR runs in the browser only — works offline. Backend receives fields on save/sync. */
export async function extractContactFromImage(
  file: File,
  onProgress?: (update: ScanProgress) => void,
): Promise<ScanExtractionResult> {
  try {
    return await runBrowserExtraction(file, onProgress);
  } catch (err) {
    console.error("Browser OCR failed:", err);
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
): Promise<ScanExtractionResult> {
  const result = await extractContactFromImage(file, onProgress);
  storeScanSession(result.contact, imageDataUrl, {
    rawText: result.rawText,
    ocrWarning: result.ocrWarning,
  });
  return result;
}
