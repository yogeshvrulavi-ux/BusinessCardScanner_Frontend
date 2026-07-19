import { PaddleOCR } from "@paddleocr/paddleocr-js";
import type { ScanContact } from "./scanResult";
import { parseOcrText } from "./scanParser";

/**
 * Browser-side offline OCR using PaddleOCR (ONNX Runtime Web).
 *
 * Models and WASM are served from same-origin `/paddleocr/` so OCR works
 * with zero internet after the app assets are installed/cached.
 */

const LOCAL_DET_URL = "/paddleocr/models/PP-OCRv5_mobile_det_onnx_infer.tar";
const LOCAL_REC_URL = "/paddleocr/models/PP-OCRv5_mobile_rec_onnx_infer.tar";

/**
 * ORT WASM location.
 * - Production: bundled copies under /paddleocr/wasm/ (pre-cached by the service worker).
 * - Dev: Vite refuses to serve public/ files as ES modules (its `?import` transform
 *   returns 500), so load the same files straight from node_modules instead.
 */
const LOCAL_WASM_PATHS = import.meta.env.DEV
  ? "/node_modules/onnxruntime-web/dist/"
  : "/paddleocr/wasm/";

type BrowserOcrEngine = {
  predict: (input: File) => Promise<Array<{ items?: Array<{ text?: string; score?: number }> }>>;
};

let ocrInstance: BrowserOcrEngine | null = null;
let initPromise: Promise<BrowserOcrEngine> | null = null;

async function getOcrInstance(): Promise<BrowserOcrEngine> {
  if (ocrInstance) return ocrInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const ocr = (await PaddleOCR.create({
        lang: "en",
        ocrVersion: "PP-OCRv5",
        textDetectionModelName: "PP-OCRv5_mobile_det",
        textDetectionModelAsset: { url: LOCAL_DET_URL },
        textRecognitionModelName: "PP-OCRv5_mobile_rec",
        textRecognitionModelAsset: { url: LOCAL_REC_URL },
        ortOptions: {
          backend: "wasm",
          wasmPaths: LOCAL_WASM_PATHS,
        },
      })) as BrowserOcrEngine;
      ocrInstance = ocr;
      return ocr;
    } catch (error) {
      // Allow a later scan to retry initialization after a failed load.
      initPromise = null;
      ocrInstance = null;
      throw error;
    }
  })();

  return initPromise;
}

function averageItemConfidence(items: Array<{ score?: number }> | undefined): number | undefined {
  if (!items?.length) return undefined;
  const scores = items
    .map((item) => Number(item.score))
    .filter((score) => Number.isFinite(score) && score > 0);
  if (scores.length === 0) return undefined;
  const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Math.round((avg <= 1 ? avg * 100 : avg) * 10) / 10;
}

export async function runBrowserOcr(
  file: File,
): Promise<{
  contact: ScanContact;
  rawText: string;
  ocrWarning?: string;
  ocrConfidence?: number;
}> {
  try {
    const ocr = await getOcrInstance();
    const results = await ocr.predict(file);
    const result = results[0];

    const lines = (result?.items || [])
      .map((item) => item.text || "")
      .filter((line) => line.trim().length > 0);

    const rawText = lines.join("\n");
    const ocrConfidence = averageItemConfidence(result?.items);

    if (!rawText) {
      return {
        contact: parseOcrText(rawText),
        rawText,
        ocrWarning: "Browser OCR ran, but could not extract any text.",
        ocrConfidence,
      };
    }

    return {
      contact: parseOcrText(rawText),
      rawText,
      ocrConfidence,
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
