/**
 * Static verification that zero-internet PaddleOCR assets are present and
 * browserOcr is wired to same-origin URLs (no Baidu CDN).
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "public/paddleocr/models/PP-OCRv5_mobile_det_onnx_infer.tar",
  "public/paddleocr/models/PP-OCRv5_mobile_rec_onnx_infer.tar",
  "public/paddleocr/wasm/ort-wasm-simd-threaded.wasm",
  "public/paddleocr/wasm/ort-wasm-simd-threaded.mjs",
];

let failed = 0;
for (const rel of required) {
  const full = join(root, rel);
  if (!existsSync(full)) {
    console.error(`MISSING ${rel}`);
    failed += 1;
    continue;
  }
  const mb = (statSync(full).size / (1024 * 1024)).toFixed(2);
  console.log(`OK ${rel} (${mb} MB)`);
}

const browserOcr = readFileSync(join(root, "src/lib/browserOcr.ts"), "utf8");
for (const needle of [
  "/paddleocr/models/PP-OCRv5_mobile_det_onnx_infer.tar",
  "/paddleocr/models/PP-OCRv5_mobile_rec_onnx_infer.tar",
  "/paddleocr/wasm/",
]) {
  if (!browserOcr.includes(needle)) {
    console.error(`browserOcr.ts missing local path: ${needle}`);
    failed += 1;
  } else {
    console.log(`OK browserOcr uses ${needle}`);
  }
}

if (browserOcr.includes("paddle-model-ecology.bj.bcebos.com")) {
  console.error("browserOcr.ts still references Baidu CDN");
  failed += 1;
} else {
  console.log("OK browserOcr has no Baidu CDN URL");
}

const scanPipeline = readFileSync(join(root, "src/lib/scanPipeline.ts"), "utf8");
if (!scanPipeline.includes("isOfflineMode") || !scanPipeline.includes("enhanceOfflineCameraCapture")) {
  console.error("scanPipeline missing offline/OpenCV routing");
  failed += 1;
} else {
  console.log("OK scanPipeline routes Prefer Offline + OpenCV camera enhance");
}

const sw = readFileSync(join(root, "public/sw.js"), "utf8");
if (!sw.includes("/paddleocr/models/") || !sw.includes("cardsync-cache-v7")) {
  console.error("sw.js not caching paddleocr assets");
  failed += 1;
} else {
  console.log("OK service worker caches paddleocr assets");
}

if (failed > 0) {
  console.error(`FAILED with ${failed} issue(s)`);
  process.exit(1);
}
console.log("All zero-internet PaddleOCR checks passed.");
