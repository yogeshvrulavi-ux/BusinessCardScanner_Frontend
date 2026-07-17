/**
 * Quick check: scanPipeline uses browser OCR only (no /scan-card).
 * Run after: npm run build
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assetsDir = join(root, "dist", "client", "assets");
const files = readdirSync(assetsDir).filter((f) => f.startsWith("scanPipeline-") && f.endsWith(".js"));
if (!files.length) {
  console.error("FAIL: no dist/client/assets/scanPipeline-*.js — run npm run build");
  process.exit(1);
}

const bundle = readFileSync(join(assetsDir, files[0]), "utf8");
const checks = [
  ["Browser OCR message", "Extracting contact details on device"],
  ["No server scan-card call", "scan-card"],
  ["Uses browserOcr", "browserOcr"],
];

let failed = 0;
for (const [label, needle] of checks) {
  const isNegative = label.startsWith("No ");
  const ok = isNegative ? !bundle.includes(needle) : bundle.includes(needle);
  console.log(`${ok ? "OK" : "FAIL"}  ${label}`);
  if (!ok) failed += 1;
}

const paddlePath = join(root, "node_modules", "@paddleocr", "paddleocr-js");
try {
  readFileSync(join(paddlePath, "package.json"));
  console.log("OK  PaddleOCR package installed");
} catch {
  console.log("FAIL  @paddleocr/paddleocr-js not installed — run npm install");
  failed += 1;
}

process.exit(failed ? 1 : 0);
