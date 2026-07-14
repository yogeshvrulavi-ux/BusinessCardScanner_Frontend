/**
 * E2E: scan uses browser OCR only — never POST /scan-card.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundlePath = join(root, "dist", "client", "assets");
const { readdirSync } = await import("node:fs");
const scanFiles = readdirSync(bundlePath).filter(
  (f) => f.startsWith("scanPipeline-") && f.endsWith(".js"),
);

let failed = 0;
function record(label, ok, detail = "") {
  console.log(`${ok ? "OK" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failed += 1;
}

if (!scanFiles.length) {
  console.error("FAIL  run npm run build first");
  process.exit(1);
}

const bundle = readFileSync(join(bundlePath, scanFiles[0]), "utf8");
record("Browser OCR bundled", bundle.includes("Extracting contact details on device"));
record("No /scan-card in bundle", !bundle.includes("scan-card"));

process.exit(failed ? 1 : 0);
