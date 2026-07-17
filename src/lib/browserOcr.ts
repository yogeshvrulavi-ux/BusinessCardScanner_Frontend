import { PaddleOCR } from "@paddleocr/paddleocr-js";
import type { ScanContact } from "./scanResult";
import { parseOcrText } from "./scanParser";

/**
 * Browser-side offline OCR using PaddleOCR (ONNX Runtime Web).
 *
 * The PaddleOCR SDK manages model download + caching internally.
 * On first online use, PP-OCRv5 models are fetched and cached by
 * the service worker so subsequent offline scans work without
 * re-downloading.
 */

let ocrInstance: PaddleOCR | null = null;
let initPromise: Promise<PaddleOCR> | null = null;

async function getOcrInstance(): Promise<PaddleOCR> {
  if (ocrInstance) return ocrInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const ocr = await PaddleOCR.create({
      lang: "en",
      ocrVersion: "PP-OCRv5",
      ortOptions: {
        backend: "wasm",
      },
    });
    ocrInstance = ocr;
    return ocr;
  })();

  return initPromise;
}

export async function runBrowserOcr(
  file: File,
): Promise<{ contact: ScanContact; rawText: string; ocrWarning?: string }> {
  try {
    const ocr = await getOcrInstance();
    const results = await ocr.predict(file);
    const result = results[0];

    const lines = (result?.items || [])
      .map((item) => item.text || "")
      .filter((line) => line.trim().length > 0);

    const rawText = lines.join("\n");

    if (!rawText) {
      return {
        contact: parseOcrText(rawText),
        rawText,
        ocrWarning: "Browser OCR ran, but could not extract any text.",
      };
    }

    return {
      contact: parseOcrText(rawText),
      rawText,
    };
  } catch (error) {
    console.warn("Browser OCR (PaddleOCR) failed:", error);
    const detail =
      import.meta.env.DEV && error instanceof Error
        ? ` (${error.message})`
        : "";
    return {
      contact: parseOcrText(""),
      rawText: "",
      ocrWarning: `Offline scan failed.${detail} Enter details manually.`,
    };
  }
}
