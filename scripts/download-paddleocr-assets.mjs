import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";
import { copyFile } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const modelsDir = join(root, "public", "paddleocr", "models");
const wasmDir = join(root, "public", "paddleocr", "wasm");

const MODELS = [
  {
    name: "PP-OCRv5_mobile_det_onnx_infer.tar",
    url: "https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/PP-OCRv5_mobile_det_onnx_infer.tar",
  },
  {
    name: "PP-OCRv5_mobile_rec_onnx_infer.tar",
    url: "https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/PP-OCRv5_mobile_rec_onnx_infer.tar",
  },
];

const WASM_FILES = [
  "ort-wasm-simd-threaded.wasm",
  "ort-wasm-simd-threaded.mjs",
  "ort-wasm-simd-threaded.jsep.wasm",
  "ort-wasm-simd-threaded.jsep.mjs",
];

async function download(url, dest) {
  if (existsSync(dest)) {
    console.log(`skip (exists): ${dest}`);
    return;
  }
  console.log(`download: ${url}`);
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Failed ${url}: ${res.status}`);
  }
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
  console.log(`saved: ${dest}`);
}

mkdirSync(modelsDir, { recursive: true });
mkdirSync(wasmDir, { recursive: true });

for (const model of MODELS) {
  await download(model.url, join(modelsDir, model.name));
}

const ortDist = join(root, "node_modules", "onnxruntime-web", "dist");
for (const file of WASM_FILES) {
  const src = join(ortDist, file);
  const dest = join(wasmDir, file);
  if (!existsSync(src)) {
    console.warn(`missing ORT file: ${src}`);
    continue;
  }
  await copyFile(src, dest);
  console.log(`copied: ${file}`);
}

console.log("PaddleOCR local assets ready.");
